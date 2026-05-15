/**
 * GET /api/home — 단순 홈 (L69 v0.5 좁힌 스코프).
 *
 * 응답: 최근 만든 Recipe 5개 (Attempt 기준 tried_at DESC).
 * 신규 사용자(Attempt 0건): emptyState=true.
 *
 * v0.5 OOS:
 *   - 쿨타임 "안 먹은 지 N일" 영역 (L69 / OOS-5b)
 *   - 자주 만든 메뉴 Top 3
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { attempts, recipes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const recent = await db
      .select({
        id: recipes.id,
        dishId: recipes.dishId,
        title: recipes.title,
        servings: recipes.servings,
        archivedAt: recipes.archivedAt,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        averageRating: sql<string | null>`AVG(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.rating} END)`,
        attemptCount: sql<number>`COUNT(CASE WHEN ${attempts.deletedAt} IS NULL THEN 1 END)::int`,
        lastTriedAt: sql<string | null>`MAX(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.triedAt} END)`,
      })
      .from(recipes)
      .leftJoin(attempts, eq(attempts.recipeId, recipes.id))
      .where(and(eq(recipes.userId, userId), isNull(recipes.archivedAt)))
      .groupBy(recipes.id)
      .orderBy(sql`MAX(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.triedAt} END) DESC NULLS LAST`, desc(recipes.createdAt))
      .limit(5);

    const recipesWithMeta = recent.map((r) => ({
      ...r,
      averageRating:
        r.averageRating === null ? null : Number.parseFloat(r.averageRating as unknown as string),
    }));

    const emptyState = recipesWithMeta.length === 0;

    return Response.json({
      emptyState,
      recentRecipes: recipesWithMeta,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
