/**
 * GET /api/dishes/{id}/recipes — 메뉴 페이지 (Dish 단위 통합 뷰)
 *
 * 응답: { dish, recipes: RecipeWithDerived[], sources: RecipeSource[] }
 * archived Recipe는 기본 미노출 (?includeArchived=true 시 포함 — v0.5 OOS-5d 화면 OOS이지만 API는 노출).
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeSources } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireDishOwnership } from "@/lib/recipes/ownership";
import { listRecipesByDish } from "@/lib/recipes/queries";
import { uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    const dish = await requireDishOwnership(id, userId);
    const includeArchived =
      new URL(request.url).searchParams.get("includeArchived") === "true";

    const allRecipes = await listRecipesByDish(id, userId);
    const visibleRecipes = includeArchived
      ? allRecipes
      : allRecipes.filter((r) => r.archivedAt === null);

    const recipeIds = visibleRecipes.map((r) => r.id);
    const sources = recipeIds.length
      ? await db
          .select()
          .from(recipeSources)
          .where(
            and(
              inArray(recipeSources.recipeId, recipeIds),
              isNull(recipeSources.deletedAt),
            ),
          )
      : [];

    return Response.json({
      dish,
      recipes: visibleRecipes,
      sources,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
