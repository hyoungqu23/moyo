/**
 * POST /api/recipes/{id}/sources — 출처 추가.
 *
 * 보안: v0.5는 사용자 입력 URL을 *저장만* 한다. 외부 fetch는 별도 Ingestion 흐름에서만 (SSRF 위험 0).
 * UNIQUE INDEX recipe_sources_url_unique (recipe_id, url) WHERE url IS NOT NULL.
 */

import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeSources } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse, jsonError } from "@/lib/http";
import { requireRecipeOwnership } from "@/lib/recipes/ownership";
import { sourceCreateSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId } = await ctx.params;
    uuidSchema.parse(recipeId);

    await requireRecipeOwnership(recipeId, userId);
    const input = sourceCreateSchema.parse(await request.json());

    try {
      const [created] = await db
        .insert(recipeSources)
        .values({
          recipeId,
          type: input.type,
          url: input.url ?? null,
          rawContent: input.rawContent ?? null,
          youtubeVideoId: input.youtubeVideoId ?? null,
          title: input.title ?? null,
          channel: input.channel ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          publishedAt: input.publishedAt ?? null,
          fetchedAt:
            input.type === "youtube" || input.type === "blog" ? sql`now()` : null,
        })
        .returning();
      return Response.json({ source: created }, { status: 201 });
    } catch (err) {
      // PARTIAL UNIQUE 위반 (동일 Recipe 동일 URL).
      if (err instanceof Error && /unique/i.test(err.message)) {
        return jsonError("이미 등록된 출처입니다.", "CONFLICT", 409);
      }
      throw err;
    }
  } catch (error) {
    return errorToResponse(error);
  }
}
