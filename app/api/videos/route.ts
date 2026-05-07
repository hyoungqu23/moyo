import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { dishes, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";
import { videoInputSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const input = videoInputSchema.parse(await request.json());
    const [dish] = await db
      .select()
      .from(dishes)
      .where(and(eq(dishes.id, input.dishId), eq(dishes.userId, userId)))
      .limit(1);
    if (!dish) throw new HttpError(404, "Dish not found");
    // UNIQUE(youtube_video_id, dish_id) 제약으로 충돌 시 메타데이터 갱신 (L46).
    // thumbs, isHidden, isUnavailableOnYoutube는 갱신 제외 — 사용자 설정값 보존.
    const [video] = await db
      .insert(videos)
      .values({
        ...input,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        userId,
      })
      .onConflictDoUpdate({
        target: [videos.youtubeVideoId, videos.dishId],
        set: {
          title: sql`EXCLUDED.title`,
          channel: sql`EXCLUDED.channel`,
          thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
          publishedAt: sql`EXCLUDED.published_at`,
        },
      })
      .returning();
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
