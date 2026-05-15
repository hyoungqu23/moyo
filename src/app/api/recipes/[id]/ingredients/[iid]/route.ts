/**
 * PATCH / DELETE /api/recipes/{id}/ingredients/{iid}
 */

import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeIngredients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { NotFoundError, requireRecipeOwnership } from "@/lib/recipes/ownership";
import { ingredientPatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string; iid: string }>;
}

async function ensureIngredient(iid: string, recipeId: string) {
  const [row] = await db
    .select()
    .from(recipeIngredients)
    .where(and(eq(recipeIngredients.id, iid), eq(recipeIngredients.recipeId, recipeId)))
    .limit(1);
  if (!row) throw new NotFoundError("Ingredient");
  return row;
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, iid } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(iid);

    await requireRecipeOwnership(recipeId, userId);
    await ensureIngredient(iid, recipeId);
    const input = ingredientPatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.amount !== undefined) patch.amount = input.amount;
    if ("unit" in input) patch.unit = input.unit ?? null;
    if (input.optional !== undefined) patch.optional = input.optional;
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;

    const [updated] = await db
      .update(recipeIngredients)
      .set(patch)
      .where(and(eq(recipeIngredients.id, iid), eq(recipeIngredients.recipeId, recipeId)))
      .returning();

    return Response.json({ ingredient: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, iid } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(iid);

    await requireRecipeOwnership(recipeId, userId);
    await db
      .delete(recipeIngredients)
      .where(and(eq(recipeIngredients.id, iid), eq(recipeIngredients.recipeId, recipeId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
