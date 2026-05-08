import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, steps, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";
import { attemptInputSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const input = attemptInputSchema.parse(await request.json());
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)))
      .limit(1);
    if (!video) throw new HttpError(404, "Video not found");
    const [attempt] = await db
      .insert(attempts)
      .values({
        videoId: input.videoId,
        rating: input.rating.toFixed(1),
        changes: input.changes ?? null,
        improvementNote: input.improvementNote ?? null,
        triedAt: input.triedAt,
        userId,
      })
      .returning();
    if (input.steps?.length) {
      await db.insert(steps).values(
        input.steps.map((step) => ({
          attemptId: attempt.id,
          note: step.note,
          videoTimestamp: step.videoTimestamp ?? null,
          userId,
        })),
      );
    }
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
