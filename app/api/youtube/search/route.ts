import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { searchYoutubeVideos } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const dishId = request.nextUrl.searchParams.get("dish_id");
    const youtubeResults = query ? await searchYoutubeVideos(query) : [];
    const saved = dishId
      ? await db
          .select({
            id: videos.id, // Video UUID — URL 파라미터 전달로 thumbs 실호출 활성화 (L47)
            dishId: videos.dishId, // Dish UUID — URL 파라미터 전달로 기록하기 기능 활성화 (L47)
            youtubeVideoId: videos.youtubeVideoId,
            thumbs: videos.thumbs,
            averageRating: sql<
              string | null
            >`ROUND(AVG(${attempts.rating}), 1)`,
            attemptCount: sql<number>`COUNT(${attempts.id})`,
            lastTriedAt: sql<string | null>`MAX(${attempts.triedAt})`,
            isHidden: videos.isHidden,
            isUnavailableOnYoutube: videos.isUnavailableOnYoutube,
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
              eq(videos.dishId, dishId),
              eq(videos.userId, userId),
              eq(videos.isHidden, false),
              eq(videos.isUnavailableOnYoutube, false),
            ),
          )
          .groupBy(videos.id)
      : [];
    const byYoutubeId = new Map(saved.map((row) => [row.youtubeVideoId, row]));
    return NextResponse.json({
      videos: youtubeResults.map((video) => ({
        ...video,
        ...(byYoutubeId.get(video.youtubeVideoId) ?? {}),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
