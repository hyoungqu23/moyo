/**
 * GET /api/dishes/autocomplete?q={query}
 *
 * 사용자 Dish 이름 LIKE 매칭. 한국어 형태소 분석 X (PRD §4.1 — MVP).
 * Recipe.title도 검색 결과에 합쳐서 반환.
 */

import { and, eq, ilike, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { dishes, recipes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { autocompleteQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { q } = autocompleteQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    // ILIKE %q% — 한국어 형태소 분석 미적용. SQL injection 방어: drizzle param.
    const pattern = `%${q}%`;
    const [dishRows, recipeRows] = await Promise.all([
      db
        .select({ id: dishes.id, name: dishes.name })
        .from(dishes)
        .where(and(eq(dishes.userId, userId), ilike(dishes.name, pattern)))
        .limit(8),
      db
        .select({
          id: recipes.id,
          title: recipes.title,
          dishId: recipes.dishId,
        })
        .from(recipes)
        .where(
          and(
            eq(recipes.userId, userId),
            sql`${recipes.archivedAt} IS NULL`,
            ilike(recipes.title, pattern),
          ),
        )
        .limit(8),
    ]);

    return Response.json({
      dishes: dishRows,
      recipes: recipeRows,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
