/**
 * DELETE /api/dishes/{id}
 *
 * Recipe 0건일 때만 hard delete. ≥ 1건이면 422 HAS_RECIPES.
 */

import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { dishes, recipes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse, jsonError } from "@/lib/http";
import { requireDishOwnership } from "@/lib/recipes/ownership";
import { uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    await requireDishOwnership(id, userId);

    const [{ value: recipeCount }] = await db
      .select({ value: count() })
      .from(recipes)
      .where(and(eq(recipes.dishId, id), eq(recipes.userId, userId)));

    if (recipeCount > 0) {
      return jsonError(
        "이 메뉴에 레시피가 있어 삭제할 수 없어요. 먼저 레시피를 정리해주세요.",
        "HAS_RECIPES",
        422,
      );
    }

    await db.delete(dishes).where(and(eq(dishes.id, id), eq(dishes.userId, userId)));
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
