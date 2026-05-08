import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { videos, youtubeCache } from "@/db/schema";
import { HttpError } from "@/lib/errors";

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export async function getCached<T>(cacheKey: string): Promise<T | null> {
  const [hit] = await db
    .select()
    .from(youtubeCache)
    .where(
      and(
        eq(youtubeCache.cacheKey, cacheKey),
        gt(youtubeCache.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return hit ? (hit.results as T) : null;
}

export async function setCached(cacheKey: string, results: unknown) {
  const now = new Date();
  await db
    .insert(youtubeCache)
    .values({
      cacheKey,
      results,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + DAY_MS),
    })
    .onConflictDoUpdate({
      target: youtubeCache.cacheKey,
      set: {
        results,
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + DAY_MS),
      },
    });
}

async function youtubeFetch<T>(url: URL): Promise<T> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new HttpError(503, "YOUTUBE_API_KEY is not configured");
  }
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { errors?: Array<{ reason?: string }>; message?: string };
    } | null;
    const reason = body?.error?.errors?.[0]?.reason;
    if (response.status === 403 && reason === "commentsDisabled") {
      throw new HttpError(403, "commentsDisabled");
    }
    if (response.status === 403 || response.status === 429) {
      throw new HttpError(429, "잠시 후 다시 시도해주세요");
    }
    throw new HttpError(
      response.status,
      body?.error?.message ?? "YouTube API request failed",
    );
  }
  return (await response.json()) as T;
}

export type YouTubeSearchItem = {
  youtubeVideoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export async function searchYoutubeVideos(query: string) {
  const cacheKey = `search:${normalizeQuery(query)}`;
  const cached = await getCached<YouTubeSearchItem[]>(cacheKey);
  if (cached) return cached;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("order", "date");
  url.searchParams.set("q", `${query} 레시피`);
  const data = await youtubeFetch<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
          default?: { url: string };
        };
      };
    }>;
  }>(url);
  const items = data.items.map((item) => ({
    youtubeVideoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      "",
    publishedAt: item.snippet.publishedAt,
  }));
  if (items.length > 0) await setCached(cacheKey, items);
  return items;
}

export async function getYoutubeVideo(youtubeVideoId: string, userId: string) {
  const cacheKey = `video:${youtubeVideoId}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoUrl.searchParams.set("part", "snippet,status,contentDetails");
  videoUrl.searchParams.set("id", youtubeVideoId);
  const videoData = await youtubeFetch<{
    items: Array<{
      snippet: {
        description?: string;
        title: string;
        channelTitle: string;
        publishedAt: string;
      };
      status?: { embeddable?: boolean };
      contentDetails?: { duration?: string };
    }>;
  }>(videoUrl);

  if (videoData.items.length === 0) {
    await db
      .update(videos)
      .set({ isUnavailableOnYoutube: true })
      .where(
        and(
          eq(videos.youtubeVideoId, youtubeVideoId),
          eq(videos.userId, userId),
        ),
      );
    const unavailable = {
      unavailable: true,
      description: "",
      topComment: null,
      embeddable: false,
    };
    await setCached(cacheKey, unavailable);
    return unavailable;
  }

  let topComment: string | null = null;
  const commentsUrl = new URL(
    "https://www.googleapis.com/youtube/v3/commentThreads",
  );
  commentsUrl.searchParams.set("part", "snippet");
  commentsUrl.searchParams.set("videoId", youtubeVideoId);
  commentsUrl.searchParams.set("order", "relevance");
  commentsUrl.searchParams.set("maxResults", "1");
  try {
    const commentData = await youtubeFetch<{
      items?: Array<{
        snippet: { topLevelComment: { snippet: { textDisplay: string } } };
      }>;
    }>(commentsUrl);
    topComment =
      commentData.items?.[0]?.snippet.topLevelComment.snippet.textDisplay ??
      null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 403) {
      topComment = null;
    } else {
      throw error;
    }
  }

  const item = videoData.items[0];
  const result = {
    unavailable: false,
    description: item.snippet.description ?? "",
    topComment,
    embeddable: item.status?.embeddable !== false,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails?.duration ?? null,
  };
  await setCached(cacheKey, result);
  return result;
}
