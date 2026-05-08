import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, steps, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

// GET /api/videos/[id]/attempts
// 단일 Video(UUID) 기준 활성 Attempt 이력 + Steps. user 소유 검증 필수.
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(_request);
    const { id: videoId } = await params;

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .limit(1);
    if (!video) throw new HttpError(404, "Video not found");

    const attemptRows = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.videoId, videoId),
          eq(attempts.userId, userId),
          isNull(attempts.deletedAt),
        ),
      )
      .orderBy(desc(attempts.triedAt), desc(attempts.createdAt));

    const attemptIds = attemptRows.map((row) => row.id);
    const stepRows =
      attemptIds.length > 0
        ? await db
            .select()
            .from(steps)
            .where(and(eq(steps.userId, userId), isNull(steps.deletedAt)))
        : [];

    const stepsByAttemptId = new Map<string, typeof stepRows>();
    for (const step of stepRows) {
      if (!attemptIds.includes(step.attemptId)) continue;
      const list = stepsByAttemptId.get(step.attemptId) ?? [];
      list.push(step);
      stepsByAttemptId.set(step.attemptId, list);
    }

    const result = attemptRows.map((attempt) => ({
      attempt,
      steps: (stepsByAttemptId.get(attempt.id) ?? []).sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
      ),
    }));

    return NextResponse.json({ attempts: result });
  } catch (error) {
    return jsonError(error);
  }
}
