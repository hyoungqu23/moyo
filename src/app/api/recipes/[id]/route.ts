/**
 * GET / PATCH / DELETE /api/recipes/{id}
 *
 * GET: Recipe + ingredients[] + steps[] + sources[] + 최근 attempts list
 * PATCH: title / servings / description / archived_at
 * DELETE:
 *   - Attempt 0건 → hard delete (모든 하위 CASCADE)
 *   - Attempt ≥ 1건 → 422 + archived_at 권고
 *   - archived 영구 삭제 2단계 다이얼로그는 v0.5 OOS-5d (?force=true 미구현)
 */

import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import {
  attempts,
  recipeIngredients,
  recipeSources,
  recipeSteps,
  recipes,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse, jsonError } from "@/lib/http";
import { requireRecipeOwnership } from "@/lib/recipes/ownership";
import { recipePatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    const recipe = await requireRecipeOwnership(id, userId);

    const [ingredients, steps, sources, recentAttempts] = await Promise.all([
      db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipe.id))
        .orderBy(asc(recipeIngredients.displayOrder)),
      db
        .select()
        .from(recipeSteps)
        .where(eq(recipeSteps.recipeId, recipe.id))
        .orderBy(asc(recipeSteps.displayOrder)),
      db
        .select()
        .from(recipeSources)
        .where(and(eq(recipeSources.recipeId, recipe.id), isNull(recipeSources.deletedAt))),
      db
        .select()
        .from(attempts)
        .where(and(eq(attempts.recipeId, recipe.id), isNull(attempts.deletedAt)))
        .orderBy(desc(attempts.triedAt))
        .limit(20),
    ]);

    return Response.json({
      recipe,
      ingredients,
      steps,
      sources,
      attempts: recentAttempts,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    await requireRecipeOwnership(id, userId);
    const input = recipePatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) patch.title = input.title;
    if ("servings" in input) patch.servings = input.servings ?? null;
    if ("description" in input) patch.description = input.description ?? null;
    if ("archivedAt" in input) patch.archivedAt = input.archivedAt ?? null;

    const [updated] = await db
      .update(recipes)
      .set(patch)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();

    return Response.json({ recipe: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    await requireRecipeOwnership(id, userId);

    // 휴지통 포함 전체 카운트 (tech §10.1, L42)
    const [{ value: attemptCount }] = await db
      .select({ value: count() })
      .from(attempts)
      .where(and(eq(attempts.recipeId, id), eq(attempts.userId, userId)));

    if (attemptCount > 0) {
      return jsonError(
        "시도 기록이 있어 삭제할 수 없어요. (보관 기능은 다음 사이클에서 제공 예정)",
        "HAS_ATTEMPTS",
        422,
      );
    }

    await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
