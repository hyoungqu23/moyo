/**
 * POST /api/recipes/{id}/ingredients — 재료 추가.
 */

import { count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeIngredients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireRecipeOwnership } from "@/lib/recipes/ownership";
import { ingredientCreateSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId } = await ctx.params;
    uuidSchema.parse(recipeId);

    await requireRecipeOwnership(recipeId, userId);
    const input = ingredientCreateSchema.parse(await request.json());

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));
      displayOrder = value;
    }

    const [created] = await db
      .insert(recipeIngredients)
      .values({
        recipeId,
        name: input.name,
        amount: input.amount,
        unit: input.unit ?? null,
        optional: input.optional ?? false,
        displayOrder,
      })
      .returning();

    return Response.json({ ingredient: created }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
