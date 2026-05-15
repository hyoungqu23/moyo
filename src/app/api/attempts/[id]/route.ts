/**
 * GET / PATCH / DELETE /api/attempts/{id}
 *
 * GET: Attempt + step-notes 목록 (P1 시나리오 — 이전 Attempt 단계 메모 참조).
 * PATCH: rating / changes / improvementNote / triedAt.
 * DELETE: soft delete (deleted_at). 30일 휴지통 Cron 자동 hard delete (v0.5 코드 미작성).
 */

import { and, asc, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { attemptStepNotes, attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireAttemptOwnership } from "@/lib/recipes/ownership";
import { attemptPatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    const attempt = await requireAttemptOwnership(id, userId);
    const stepNotes = await db
      .select()
      .from(attemptStepNotes)
      .where(
        and(eq(attemptStepNotes.attemptId, attempt.id), isNull(attemptStepNotes.deletedAt)),
      )
      .orderBy(asc(attemptStepNotes.createdAt));

    return Response.json({ attempt, stepNotes });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    await requireAttemptOwnership(id, userId);
    const input = attemptPatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if ("rating" in input)
      patch.rating =
        input.rating === undefined || input.rating === null ? null : input.rating.toFixed(1);
    if ("changes" in input) patch.changes = input.changes ?? null;
    if ("improvementNote" in input) patch.improvementNote = input.improvementNote ?? null;
    if (input.triedAt !== undefined) patch.triedAt = input.triedAt;

    const [updated] = await db
      .update(attempts)
      .set(patch)
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .returning();

    return Response.json({ attempt: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    await requireAttemptOwnership(id, userId);

    await db
      .update(attempts)
      .set({ deletedAt: new Date() })
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
