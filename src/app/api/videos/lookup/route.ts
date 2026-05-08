import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, dishes, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";

// GET /api/videos/lookup?yt_id=Y&dish_id=X
// GET /api/videos/lookup?yt_id=Y&dish_name=Z
//
// Resolves whatever the user already knows about this YouTube video:
// the local Video record (thumbs / hidden flags), the owning Dish, and
// aggregates over active attempts. Returns null payloads when the
// dish or video record hasn't been created yet (lazy-create flow).
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const url = new URL(request.url);
    const ytId = url.searchParams.get("yt_id");
    const dishIdParam = url.searchParams.get("dish_id");
    const dishNameParam = url.searchParams.get("dish_name");

    if (!ytId) throw new HttpError(400, "yt_id is required");
    if (!dishIdParam && !dishNameParam) {
      throw new HttpError(400, "dish_id or dish_name is required");
    }

    let dish: typeof dishes.$inferSelect | undefined;
    if (dishIdParam) {
      [dish] = await db
        .select()
        .from(dishes)
        .where(and(eq(dishes.id, dishIdParam), eq(dishes.userId, userId)))
        .limit(1);
    } else if (dishNameParam) {
      const trimmed = dishNameParam.trim();
      [dish] = await db
        .select()
        .from(dishes)
        .where(
          and(eq(dishes.name, trimmed), eq(dishes.userId, userId)),
        )
        .limit(1);
    }

    if (!dish) {
      return NextResponse.json({
        dish: null,
        video: null,
        averageRating: null,
        attemptCount: 0,
      });
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.youtubeVideoId, ytId),
          eq(videos.dishId, dish.id),
          eq(videos.userId, userId),
        ),
      )
      .limit(1);

    if (!video) {
      return NextResponse.json({
        dish,
        video: null,
        averageRating: null,
        attemptCount: 0,
      });
    }

    const [agg] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        avg: sql<string | null>`ROUND(AVG(${attempts.rating}), 1)`,
      })
      .from(attempts)
      .where(
        and(
          eq(attempts.videoId, video.id),
          eq(attempts.userId, userId),
          isNull(attempts.deletedAt),
        ),
      );

    return NextResponse.json({
      dish,
      video,
      averageRating: agg?.avg == null ? null : Number(agg.avg),
      attemptCount: Number(agg?.count ?? 0),
    });
  } catch (error) {
    return jsonError(error);
  }
}
