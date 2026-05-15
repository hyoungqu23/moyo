/**
 * YouTube Data API v3 — videos.list 단일 호출 경로.
 *
 * tech-decision §5:
 *   - server-side only (API Key 노출 금지)
 *   - youtube_cache 24h TTL, cache_key = "video:" + youtube_video_id
 *   - items[] 빈 응답 → 사용자에게 "영상을 찾을 수 없어요" 안내
 *
 * v0.5는 search.list 사용 안 함 (Ingestion 단일 흐름).
 */

import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { youtubeCache } from "@/db/schema";

const YT_VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const CACHE_TTL_HOURS = 24;

export interface YouTubeVideoMeta {
  youtubeVideoId: string;
  title: string;
  channel: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

export class YouTubeNotFoundError extends Error {
  constructor(youtubeVideoId: string) {
    super(`YouTube video not found: ${youtubeVideoId}`);
    this.name = "YouTubeNotFoundError";
  }
}

export class YouTubeApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

/**
 * YouTube URL에서 video_id 추출.
 * 지원: youtu.be/{id}, youtube.com/watch?v={id}, /embed/{id}, /shorts/{id}
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const segIdx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
      if (segIdx >= 0 && parts[segIdx + 1] && /^[\w-]{11}$/.test(parts[segIdx + 1])) {
        return parts[segIdx + 1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

interface YouTubeVideosResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

async function fetchVideoMeta(youtubeVideoId: string): Promise<YouTubeVideoMeta> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new YouTubeApiError("YOUTUBE_API_KEY 환경 변수가 설정되어 있지 않습니다.", 500);
  }

  const url = new URL(YT_VIDEOS_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", youtubeVideoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new YouTubeApiError(`YouTube API error: ${res.status} ${res.statusText}`, res.status);
  }
  const data = (await res.json()) as YouTubeVideosResponse;
  const item = data.items?.[0];
  if (!item) {
    throw new YouTubeNotFoundError(youtubeVideoId);
  }

  const sn = item.snippet ?? {};
  const thumbnailUrl =
    sn.thumbnails?.high?.url ??
    sn.thumbnails?.medium?.url ??
    sn.thumbnails?.default?.url ??
    null;

  return {
    youtubeVideoId,
    title: sn.title ?? "",
    channel: sn.channelTitle ?? "",
    description: sn.description ?? "",
    thumbnailUrl,
    publishedAt: sn.publishedAt ? new Date(sn.publishedAt) : null,
  };
}

/**
 * 캐시 통과 + 신규 호출 + 캐시 저장.
 */
export async function getYouTubeVideoMeta(
  youtubeVideoId: string,
): Promise<YouTubeVideoMeta> {
  const cacheKey = `video:${youtubeVideoId}`;
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000);

  const [cached] = await db
    .select()
    .from(youtubeCache)
    .where(eq(youtubeCache.cacheKey, cacheKey))
    .limit(1);

  if (cached && cached.fetchedAt > cutoff) {
    // JSONB 저장 시 Date는 ISO string으로 직렬화되므로 cache HIT 경로에서 Date로 복원.
    // (H4) cache MISS는 Date 객체 반환, HIT는 string 반환되던 타입 불일치 해소.
    const raw = cached.payload as Omit<YouTubeVideoMeta, "publishedAt"> & {
      publishedAt: string | null;
    };
    return {
      ...raw,
      publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
    };
  }

  const meta = await fetchVideoMeta(youtubeVideoId);
  // upsert
  await db
    .insert(youtubeCache)
    .values({
      cacheKey,
      payload: meta as unknown as object,
    })
    .onConflictDoUpdate({
      target: youtubeCache.cacheKey,
      set: { payload: meta as unknown as object, fetchedAt: sql`now()` },
    });

  return meta;
}
