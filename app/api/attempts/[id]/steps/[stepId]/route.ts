import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, steps } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";
import { stepInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string; stepId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id, stepId } = await params;
    const input = stepInputSchema.partial().parse(await request.json());
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .limit(1);
    if (!attempt) throw new HttpError(404, "Attempt not found");
    const [step] = await db
      .update(steps)
      .set({
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.videoTimestamp !== undefined
          ? { videoTimestamp: input.videoTimestamp }
          : {}),
      })
      .where(
        and(
          eq(steps.id, stepId),
          eq(steps.attemptId, id),
          eq(steps.userId, userId),
        ),
      )
      .returning();
    return NextResponse.json({ step });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id, stepId } = await params;
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .limit(1);
    if (!attempt) throw new HttpError(404, "Attempt not found");
    const [step] = await db
      .update(steps)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(steps.id, stepId),
          eq(steps.attemptId, id),
          eq(steps.userId, userId),
        ),
      )
      .returning();
    return NextResponse.json({ step });
  } catch (error) {
    return jsonError(error);
  }
}
