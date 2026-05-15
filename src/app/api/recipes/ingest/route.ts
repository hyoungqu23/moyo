/**
 * POST /api/recipes/ingest — v0.5 사이클 핵심 (H5 검증).
 *
 * 입력: { dishId | dishName, sourceType, payload }
 * 처리:
 *   1. dishId 있으면 소유권 검증 / 없으면 dishName으로 같은 사용자 Dish upsert
 *   2. sourceType=youtube → videos.list 호출 → description 추출
 *   3. sourceType=text → payload.text 그대로
 *   4. 규칙 기반 파싱 (lib/ingestion/parse-rules)
 *   5. confidence=low → LLM stub 시도(throw) → catch → 사용자 폴백 안내
 *   6. ingestion_cache + usage_counters 갱신
 *   7. Draft 응답 (클라이언트가 검수 후 POST /api/recipes로 확정 저장)
 *
 * 보안:
 *   - v0.5 외부 fetch = YouTube videos.list만 (SSRF 위험 0).
 *   - blog URL은 *저장만* 하고 fetch 안 함 (사용자가 본문 직접 붙여넣음).
 */

import { createHash } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { dishes, ingestionCache, usageCounters } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse, jsonError } from "@/lib/http";
import { parseRecipeText } from "@/lib/ingestion/parse-rules";
import type { RecipeDraft } from "@/lib/ingestion/types";
import { requireDishOwnership } from "@/lib/recipes/ownership";
import { ingestSchema } from "@/lib/validators";
import {
  YouTubeApiError,
  YouTubeNotFoundError,
  extractYouTubeVideoId,
  getYouTubeVideoMeta,
} from "@/lib/youtube";

function monthKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function cacheKeyFor(sourceType: string, urlOrText: string): string {
  const hash = createHash("sha256").update(`${sourceType}:${urlOrText}`).digest("hex");
  return `${sourceType}:${hash.slice(0, 32)}`;
}

type CounterField =
  | "ingestAttemptCount"
  | "ingestDraftCount"
  | "ingestSaveCount"
  | "ingestExternalErrorCount"
  | "llmCallCount"
  | "confidenceHighCount"
  | "confidenceMedCount"
  | "confidenceLowCount";

const COUNTER_COLUMN: Record<CounterField, string> = {
  ingestAttemptCount: "ingest_attempt_count",
  ingestDraftCount: "ingest_draft_count",
  ingestSaveCount: "ingest_save_count",
  ingestExternalErrorCount: "ingest_external_error_count",
  llmCallCount: "llm_call_count",
  confidenceHighCount: "confidence_high_count",
  confidenceMedCount: "confidence_med_count",
  confidenceLowCount: "confidence_low_count",
};

async function bumpCounter(userId: string, field: CounterField) {
  const month = monthKey();
  const column = COUNTER_COLUMN[field];

  await db
    .insert(usageCounters)
    .values({
      userId,
      month,
      [field]: 1,
    } as never)
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.month],
      set: {
        [column]: sql.raw(`"${column}" + 1`),
        updatedAt: sql`now()`,
      } as never,
    });
}

async function resolveDishId(
  userId: string,
  dishId: string | undefined,
  dishName: string | undefined,
): Promise<string> {
  if (dishId) {
    const dish = await requireDishOwnership(dishId, userId);
    return dish.id;
  }
  // ingestSchema refine으로 dishId | dishName 중 하나는 보장됨 (H3).
  // 여기 도달 시 dishName이 반드시 trim 가능한 문자열.
  const trimmed = (dishName ?? "").trim();
  // 같은 사용자 Dish 동일 이름 있으면 재사용 (L40 메인 화면 Dish Top3 정합 — 동명 Dish 중복 방지)
  const [existing] = await db
    .select()
    .from(dishes)
    .where(and(eq(dishes.userId, userId), eq(dishes.name, trimmed)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(dishes)
    .values({ userId, name: trimmed })
    .returning();
  return created.id;
}

export async function POST(request: NextRequest) {
  let userIdForFailureCounter: string | null = null;
  try {
    const { userId } = await requireAuth();
    const input = ingestSchema.parse(await request.json());
    userIdForFailureCounter = userId;

    const dishId = await resolveDishId(userId, input.dishId, input.dishName);

    let rawContent = "";
    let title: string | null = null;
    let sourceMeta: RecipeDraft["sources"][number];

    if (input.sourceType === "youtube") {
      const videoId = extractYouTubeVideoId(input.payload.url);
      if (!videoId) {
        return jsonError("YouTube URL을 인식할 수 없어요.", "VALIDATION_ERROR", 400);
      }

      try {
        const meta = await getYouTubeVideoMeta(videoId);
        rawContent = meta.description;
        title = meta.title || null;
        sourceMeta = {
          type: "youtube",
          url: input.payload.url,
          rawContent: meta.description,
          youtubeVideoId: meta.youtubeVideoId,
          title: meta.title || null,
          channel: meta.channel || null,
          thumbnailUrl: meta.thumbnailUrl,
          publishedAt: meta.publishedAt,
        };
      } catch (err) {
        // 외부 API 오류는 별도 카운터 — M5 분모에서 제외 (H2 정합성).
        await bumpCounter(userId, "ingestExternalErrorCount");
        if (err instanceof YouTubeNotFoundError) {
          return jsonError("영상을 찾을 수 없어요.", "NOT_FOUND", 404);
        }
        if (err instanceof YouTubeApiError) {
          if (err.status === 403) {
            return jsonError(
              "YouTube API 한도를 초과했어요. 잠시 후 다시 시도해주세요.",
              "RATE_LIMIT",
              429,
            );
          }
          return jsonError(
            "YouTube에서 영상 정보를 가져오지 못했어요.",
            "EXTERNAL_API_ERROR",
            502,
          );
        }
        throw err;
      }
    } else {
      // sourceType === "text"
      rawContent = input.payload.text;
      title = null;
      sourceMeta = {
        type: input.payload.url ? "blog" : "text",
        url: input.payload.url ?? null,
        rawContent,
        youtubeVideoId: null,
        title: null,
        channel: null,
        thumbnailUrl: null,
        publishedAt: null,
      };
    }

    // 규칙 기반 파싱.
    const parseResult = parseRecipeText(rawContent);

    // confidence 카운터 증가.
    if (parseResult.overallConfidence === "high") {
      await bumpCounter(userId, "confidenceHighCount");
    } else if (parseResult.overallConfidence === "med") {
      await bumpCounter(userId, "confidenceMedCount");
    } else {
      await bumpCounter(userId, "confidenceLowCount");
      // confidence=low → LLM stub 시도 (v0.5는 throw).
      try {
        await bumpCounter(userId, "llmCallCount");
        const { callLLMForIngestion } = await import("@/lib/ingestion/llm-stub");
        await callLLMForIngestion(rawContent);
      } catch {
        // 폴백: 사용자에게 텍스트 직접 정리 안내. ParseResult 그대로 전달.
      }
    }

    const draft: RecipeDraft = {
      dishId,
      title:
        title ??
        (parseResult.ingredients[0]?.name
          ? `${parseResult.ingredients[0]?.name} 레시피`
          : "새 레시피"),
      servings: null,
      description: null,
      ingredients: parseResult.ingredients,
      steps: parseResult.steps,
      sources: [sourceMeta],
      parseResult,
    };

    // ingestion_cache 저장 (동일 입력 재처리 회피).
    const sourceUrl =
      input.sourceType === "youtube" ? input.payload.url : (input.payload.url ?? input.payload.text);
    const cacheKey = cacheKeyFor(input.sourceType, sourceUrl);
    await db
      .insert(ingestionCache)
      .values({
        cacheKey,
        userId,
        sourceType: input.sourceType,
        draft: draft as unknown as object,
      })
      .onConflictDoUpdate({
        target: ingestionCache.cacheKey,
        set: {
          draft: draft as unknown as object,
          createdAt: sql`now()`,
        },
      });

    // 두 카운터 묶어서 갱신 — Draft가 실제 사용자에게 전달된 시점에만 attempt 누적.
    // 이 위에서 throw / return하면 attempt도 increment 안 됨 → M5 분모 정확.
    await bumpCounter(userId, "ingestAttemptCount");
    await bumpCounter(userId, "ingestDraftCount");

    return Response.json({ draft });
  } catch (error) {
    // 마지막 단계까지 오기 전 throw (Drizzle / 캐시 / 파싱) — 사용자 책임 아닌 내부 실패.
    // 외부 API 오류는 위 try 안에서 이미 카운팅. 여기서 한 번 더 잡으면 중복이라 호출하지 않음.
    void userIdForFailureCounter;
    return errorToResponse(error);
  }
}
