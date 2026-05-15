/**
 * PATCH / DELETE /api/recipes/{id}/steps/{sid}
 */

import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeSteps } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { NotFoundError, requireRecipeOwnership } from "@/lib/recipes/ownership";
import { stepPatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string; sid: string }>;
}

async function ensureStep(sid: string, recipeId: string) {
  const [row] = await db
    .select()
    .from(recipeSteps)
    .where(and(eq(recipeSteps.id, sid), eq(recipeSteps.recipeId, recipeId)))
    .limit(1);
  if (!row) throw new NotFoundError("Step");
  return row;
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, sid } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(sid);

    await requireRecipeOwnership(recipeId, userId);
    await ensureStep(sid, recipeId);
    const input = stepPatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = {};
    if (input.instruction !== undefined) patch.instruction = input.instruction;
    if ("timerSeconds" in input) patch.timerSeconds = input.timerSeconds ?? null;
    if ("note" in input) patch.note = input.note ?? null;
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;

    const [updated] = await db
      .update(recipeSteps)
      .set(patch)
      .where(and(eq(recipeSteps.id, sid), eq(recipeSteps.recipeId, recipeId)))
      .returning();

    return Response.json({ step: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, sid } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(sid);

    await requireRecipeOwnership(recipeId, userId);
    await db
      .delete(recipeSteps)
      .where(and(eq(recipeSteps.id, sid), eq(recipeSteps.recipeId, recipeId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
