/**
 * GET /api/attempts/trash — soft-deleted Attempt 목록.
 *
 * 30일 휴지통 (Cron 자동 hard delete는 v0.5 코드 미구현, OOS 운영 정책).
 */

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { attempts, recipes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const rows = await db
      .select({
        id: attempts.id,
        recipeId: attempts.recipeId,
        recipeTitle: recipes.title,
        rating: attempts.rating,
        triedAt: attempts.triedAt,
        deletedAt: attempts.deletedAt,
      })
      .from(attempts)
      .leftJoin(recipes, eq(recipes.id, attempts.recipeId))
      .where(and(eq(attempts.userId, userId), isNotNull(attempts.deletedAt)))
      .orderBy(desc(attempts.deletedAt));

    return Response.json({ trashedAttempts: rows });
  } catch (error) {
    return errorToResponse(error);
  }
}
