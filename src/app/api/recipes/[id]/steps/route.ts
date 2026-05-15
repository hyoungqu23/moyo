/**
 * POST /api/recipes/{id}/steps — 단계 추가.
 */

import { count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeSteps } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireRecipeOwnership } from "@/lib/recipes/ownership";
import { stepCreateSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId } = await ctx.params;
    uuidSchema.parse(recipeId);

    await requireRecipeOwnership(recipeId, userId);
    const input = stepCreateSchema.parse(await request.json());

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(recipeSteps)
        .where(eq(recipeSteps.recipeId, recipeId));
      displayOrder = value;
    }

    const [created] = await db
      .insert(recipeSteps)
      .values({
        recipeId,
        displayOrder,
        instruction: input.instruction,
        timerSeconds: input.timerSeconds ?? null,
        note: input.note ?? null,
      })
      .returning();

    return Response.json({ step: created }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
