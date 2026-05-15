/**
 * Recipe 목록 + 파생 필드 (average_rating / attempt_count / last_tried_at)
 * 공용 SQL 헬퍼.
 *
 * tech-decision §3.6: 파생 필드는 *저장하지 않고* 런타임 집계.
 * soft-deleted attempt는 집계에서 제외.
 */

import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { attempts, recipes } from "@/db/schema";

export interface RecipeWithDerived {
  id: string;
  dishId: string;
  title: string;
  servings: string | null;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  averageRating: number | null;
  attemptCount: number;
  lastTriedAt: string | null; // YYYY-MM-DD (date)
}

/**
 * 특정 Dish의 Recipe 목록 + 파생 필드.
 */
export async function listRecipesByDish(
  dishId: string,
  userId: string,
): Promise<RecipeWithDerived[]> {
  const rows = await db
    .select({
      id: recipes.id,
      dishId: recipes.dishId,
      title: recipes.title,
      servings: recipes.servings,
      description: recipes.description,
      archivedAt: recipes.archivedAt,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
      averageRating: sql<string | null>`AVG(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.rating} END)`,
      attemptCount: sql<number>`COUNT(CASE WHEN ${attempts.deletedAt} IS NULL THEN 1 END)::int`,
      lastTriedAt: sql<string | null>`MAX(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.triedAt} END)`,
    })
    .from(recipes)
    .leftJoin(attempts, eq(attempts.recipeId, recipes.id))
    .where(and(eq(recipes.dishId, dishId), eq(recipes.userId, userId)))
    .groupBy(recipes.id)
    .orderBy(desc(recipes.createdAt));

  return rows.map((r) => ({
    ...r,
    averageRating:
      r.averageRating === null ? null : Number.parseFloat(r.averageRating as unknown as string),
    attemptCount: r.attemptCount ?? 0,
  }));
}

/**
 * 사용자 전체 Recipe 목록 + 파생 필드 (검색·홈에서 활용).
 */
export async function listUserRecipes(
  userId: string,
  options: { archivedOnly?: boolean; activeOnly?: boolean } = {},
): Promise<RecipeWithDerived[]> {
  const where = options.archivedOnly
    ? and(eq(recipes.userId, userId), sql`${recipes.archivedAt} IS NOT NULL`)
    : options.activeOnly
      ? and(eq(recipes.userId, userId), isNull(recipes.archivedAt))
      : eq(recipes.userId, userId);

  const rows = await db
    .select({
      id: recipes.id,
      dishId: recipes.dishId,
      title: recipes.title,
      servings: recipes.servings,
      description: recipes.description,
      archivedAt: recipes.archivedAt,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
      averageRating: sql<string | null>`AVG(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.rating} END)`,
      attemptCount: sql<number>`COUNT(CASE WHEN ${attempts.deletedAt} IS NULL THEN 1 END)::int`,
      lastTriedAt: sql<string | null>`MAX(CASE WHEN ${attempts.deletedAt} IS NULL THEN ${attempts.triedAt} END)`,
    })
    .from(recipes)
    .leftJoin(attempts, eq(attempts.recipeId, recipes.id))
    .where(where)
    .groupBy(recipes.id);

  return rows.map((r) => ({
    ...r,
    averageRating:
      r.averageRating === null ? null : Number.parseFloat(r.averageRating as unknown as string),
    attemptCount: r.attemptCount ?? 0,
  }));
}
