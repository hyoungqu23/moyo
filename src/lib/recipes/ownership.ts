/**
 * 소유권 체인 검증 — 보안 경계 (tech-decision §4.2 / L27).
 *
 * Drizzle direct connection 경로에서 RLS 미작동.
 * 모든 하위 리소스 접근 전에 상위 user_id 선검증으로 격리한다.
 */

import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { attempts, dishes, recipes } from "@/db/schema";

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(reason = "Forbidden") {
    super(reason);
    this.name = "ForbiddenError";
  }
}

/** Dish가 user 소유인지 확인. 없으면 404, 다른 user 소유면 404(존재 노출 방지). */
export async function requireDishOwnership(dishId: string, userId: string) {
  const [dish] = await db
    .select()
    .from(dishes)
    .where(and(eq(dishes.id, dishId), eq(dishes.userId, userId)))
    .limit(1);
  if (!dish) throw new NotFoundError("Dish");
  return dish;
}

/** Recipe가 user 소유인지 확인. */
export async function requireRecipeOwnership(recipeId: string, userId: string) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .limit(1);
  if (!recipe) throw new NotFoundError("Recipe");
  return recipe;
}

/** Attempt가 user 소유인지 확인. Recipe → Attempt 체인 검증 포함. */
export async function requireAttemptOwnership(attemptId: string, userId: string) {
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new NotFoundError("Attempt");
  return attempt;
}
