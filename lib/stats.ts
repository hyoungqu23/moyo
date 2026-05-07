import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, dishes, videos } from "@/db/schema";

export type VideoStats = {
  videoId: string;
  averageRating: number | null;
  attemptCount: number;
  lastTriedAt: string | null;
};

export async function getVideoStats(userId: string): Promise<VideoStats[]> {
  const rows = await db
    .select({
      videoId: attempts.videoId,
      averageRating: sql<string | null>`ROUND(AVG(${attempts.rating}), 1)`,
      attemptCount: sql<number>`COUNT(*)`,
      lastTriedAt: sql<string | null>`MAX(${attempts.triedAt})`,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), isNull(attempts.deletedAt)))
    .groupBy(attempts.videoId);

  return rows.map((row) => ({
    videoId: row.videoId,
    averageRating:
      row.averageRating === null ? null : Number(row.averageRating),
    attemptCount: Number(row.attemptCount),
    lastTriedAt: row.lastTriedAt,
  }));
}

export async function getHomeData(userId: string) {
  const recentAttemptsQuery = db
    .select({ video: videos, attempt: attempts })
    .from(attempts)
    .innerJoin(videos, eq(attempts.videoId, videos.id))
    .where(
      and(
        eq(attempts.userId, userId),
        isNull(attempts.deletedAt),
        eq(videos.userId, userId),
        eq(videos.isHidden, false),
      ),
    )
    .orderBy(desc(attempts.triedAt))
    .limit(5);

  const topDishesQuery = db
    .select({
      dish: dishes,
      attemptCount: sql<number>`COUNT(${attempts.id})`,
    })
    .from(dishes)
    .innerJoin(videos, eq(videos.dishId, dishes.id))
    .innerJoin(attempts, eq(attempts.videoId, videos.id))
    .where(
      and(
        eq(dishes.userId, userId),
        eq(videos.userId, userId),
        eq(attempts.userId, userId),
        isNull(attempts.deletedAt),
      ),
    )
    .groupBy(dishes.id)
    .orderBy(desc(sql`COUNT(${attempts.id})`))
    .limit(3);

  const [recentAttempts, topDishes] = await Promise.all([
    recentAttemptsQuery,
    topDishesQuery,
  ]);
  return {
    recentAttempts,
    topDishes,
    empty: recentAttempts.length === 0,
  };
}
