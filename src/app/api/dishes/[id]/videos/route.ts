import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const rows = await db
      .select({
        id: videos.id,
        dishId: videos.dishId,
        youtubeVideoId: videos.youtubeVideoId,
        title: videos.title,
        channel: videos.channel,
        thumbnailUrl: videos.thumbnailUrl,
        publishedAt: videos.publishedAt,
        thumbs: videos.thumbs,
        isHidden: videos.isHidden,
        isUnavailableOnYoutube: videos.isUnavailableOnYoutube,
        averageRating: sql<string | null>`ROUND(AVG(${attempts.rating}), 1)`,
        attemptCount: sql<number>`COUNT(${attempts.id})`,
        lastTriedAt: sql<string | null>`MAX(${attempts.triedAt})`,
      })
      .from(videos)
      .leftJoin(
        attempts,
        and(
          eq(attempts.videoId, videos.id),
          eq(attempts.userId, userId),
          isNull(attempts.deletedAt),
        ),
      )
      .where(
        and(
          eq(videos.dishId, id),
          eq(videos.userId, userId),
          eq(videos.isHidden, false),
        ),
      )
      .groupBy(videos.id)
      .orderBy(desc(videos.publishedAt));
    return NextResponse.json({ videos: rows });
  } catch (error) {
    return jsonError(error);
  }
}
