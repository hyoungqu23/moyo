/**
 * PATCH / DELETE /api/attempts/{id}/step-notes/{snId}
 */

import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { attemptStepNotes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { NotFoundError, requireAttemptOwnership } from "@/lib/recipes/ownership";
import { stepNotePatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string; snId: string }>;
}

async function ensureStepNote(snId: string, attemptId: string) {
  const [row] = await db
    .select()
    .from(attemptStepNotes)
    .where(
      and(eq(attemptStepNotes.id, snId), eq(attemptStepNotes.attemptId, attemptId)),
    )
    .limit(1);
  if (!row) throw new NotFoundError("StepNote");
  return row;
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: attemptId, snId } = await ctx.params;
    uuidSchema.parse(attemptId);
    uuidSchema.parse(snId);

    await requireAttemptOwnership(attemptId, userId);
    await ensureStepNote(snId, attemptId);
    const input = stepNotePatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = {};
    if (input.note !== undefined) patch.note = input.note;
    if ("recipeStepId" in input) patch.recipeStepId = input.recipeStepId ?? null;

    const [updated] = await db
      .update(attemptStepNotes)
      .set(patch)
      .where(
        and(eq(attemptStepNotes.id, snId), eq(attemptStepNotes.attemptId, attemptId)),
      )
      .returning();

    return Response.json({ stepNote: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: attemptId, snId } = await ctx.params;
    uuidSchema.parse(attemptId);
    uuidSchema.parse(snId);

    await requireAttemptOwnership(attemptId, userId);
    await db
      .delete(attemptStepNotes)
      .where(
        and(eq(attemptStepNotes.id, snId), eq(attemptStepNotes.attemptId, attemptId)),
      );

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
