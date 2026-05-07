import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, dishes, steps, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

// GET /api/dishes/[id]/attempts
// Dish 단위 활성 Attempt 이력 + Video + Steps 통합 조회 (L45 — ALIGN 6차 rewind).
// - Dish 소유 검증 필수.
// - isHidden=false Video만 포함.
// - deletedAt IS NULL (활성 Attempt만).
// - 응답: { attempts: Array<{ video, attempt, steps }> }
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id: dishId } = await params;

    // Dish 소유 검증
    const [dish] = await db
      .select()
      .from(dishes)
      .where(and(eq(dishes.id, dishId), eq(dishes.userId, userId)))
      .limit(1);
    if (!dish) throw new HttpError(404, "Dish not found");

    // 활성 Attempt + Video JOIN (isHidden=false, deletedAt IS NULL)
    const rows = await db
      .select({ video: videos, attempt: attempts })
      .from(attempts)
      .innerJoin(
        videos,
        and(
          eq(attempts.videoId, videos.id),
          eq(videos.dishId, dishId),
          eq(videos.isHidden, false),
        ),
      )
      .where(and(eq(attempts.userId, userId), isNull(attempts.deletedAt)))
      .orderBy(desc(attempts.triedAt));

    // Attempt별 Steps 조회 및 그룹화
    const attemptIds = rows.map((r) => r.attempt.id);
    const stepsRows =
      attemptIds.length > 0
        ? await db
            .select()
            .from(steps)
            .where(and(eq(steps.userId, userId), isNull(steps.deletedAt)))
        : [];

    const stepsByAttemptId = new Map<string, typeof stepsRows>();
    for (const step of stepsRows) {
      if (!attemptIds.includes(step.attemptId)) continue;
      const list = stepsByAttemptId.get(step.attemptId) ?? [];
      list.push(step);
      stepsByAttemptId.set(step.attemptId, list);
    }

    const result = rows.map((r) => ({
      video: r.video,
      attempt: r.attempt,
      steps: stepsByAttemptId.get(r.attempt.id) ?? [],
    }));

    return NextResponse.json({ attempts: result });
  } catch (error) {
    return jsonError(error);
  }
}
