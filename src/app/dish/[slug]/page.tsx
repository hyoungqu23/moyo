"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import type { Attempt, Dish, Step, Video } from "@/db/schema";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { VideoCard } from "@/components/video/VideoCard";
import { apiFetch } from "@/lib/api";
import type { ThumbState, VideoWithStats } from "@/lib/sort-videos";

type AttemptRow = { video: Video; attempt: Attempt; steps: Step[] };

type DishVideoRow = {
  id: string;
  dishId: string;
  youtubeVideoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  publishedAt: string | null;
  thumbs: ThumbState;
  isHidden: boolean;
  isUnavailableOnYoutube: boolean;
  averageRating: string | number | null;
  attemptCount: number | string;
  lastTriedAt: string | null;
};

function toCard(row: DishVideoRow): VideoWithStats {
  return {
    id: row.id,
    youtubeVideoId: row.youtubeVideoId,
    title: row.title,
    channel: row.channel,
    thumbnailUrl: row.thumbnailUrl,
    publishedAt: row.publishedAt,
    thumbs: row.thumbs,
    averageRating: row.averageRating === null ? null : Number(row.averageRating),
    attemptCount: Number(row.attemptCount ?? 0),
    lastTriedAt: row.lastTriedAt ?? null,
    isHidden: row.isHidden,
    isUnavailableOnYoutube: row.isUnavailableOnYoutube
  };
}

export default function DishPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const dishesQuery = useQuery({
    queryKey: ["dishes", "all"],
    queryFn: () => apiFetch<{ dishes: Dish[] }>("/api/dishes")
  });
  const dish = dishesQuery.data?.dishes.find((entry) => entry.slug === slug);

  const videosQuery = useQuery({
    queryKey: ["dishes", dish?.id, "videos"],
    queryFn: () => apiFetch<{ videos: DishVideoRow[] }>(`/api/dishes/${dish!.id}/videos`),
    enabled: !!dish
  });

  const attemptsQuery = useQuery({
    queryKey: ["dishes", dish?.id, "attempts"],
    queryFn: () => apiFetch<{ attempts: AttemptRow[] }>(`/api/dishes/${dish!.id}/attempts`),
    enabled: !!dish
  });

  return (
    <main className="bg-white">
      <header className="mx-auto max-w-content px-8 py-20">
        <h1 className="text-[40px] font-semibold leading-[1.1]">{dish?.name ?? decodeURIComponent(slug)}</h1>
      </header>
      <section className="bg-parchment px-8 py-20" aria-labelledby="attempts-heading">
        <div className="mx-auto max-w-content">
          <h2 id="attempts-heading" className="mb-6 text-[21px] font-semibold">
            내 시도 이력
          </h2>
          {attemptsQuery.isLoading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : attemptsQuery.data && attemptsQuery.data.attempts.length > 0 ? (
            <div role="list" className="grid gap-4">
              {attemptsQuery.data.attempts.map(({ video, attempt, steps }) => (
                <div key={attempt.id} role="listitem" className="rounded-lg border border-hairline bg-white p-4">
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnailUrl} alt="" className="h-16 w-28 flex-shrink-0 rounded-sm object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-tight">{video.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-ink-muted">
                        <span>별점 {attempt.rating}</span>
                        <span>{attempt.triedAt}</span>
                      </div>
                      {attempt.changes ? (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{attempt.changes}</p>
                      ) : null}
                      {steps.length > 0 ? (
                        <p className="mt-1 text-xs text-ink-muted">단계 메모 {steps.length}개</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="이 메뉴는 아직 시도 이력이 없어요" />
          )}
        </div>
      </section>
      <section className="mx-auto max-w-content px-8 py-20" aria-labelledby="videos-heading">
        <h2 id="videos-heading" className="mb-6 text-[21px] font-semibold">
          이 메뉴의 영상
        </h2>
        {videosQuery.isLoading || dishesQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="aspect-video" />
            ))}
          </div>
        ) : !dish ? (
          <EmptyState title="해당 메뉴를 찾을 수 없어요" action={{ href: "/", label: "홈으로" }} />
        ) : videosQuery.data && videosQuery.data.videos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videosQuery.data.videos.map((row) => (
              <VideoCard key={row.id} video={toCard(row)} dishId={row.dishId} videoId={row.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="이 메뉴에 저장된 영상이 없어요"
            action={{ href: `/search?q=${encodeURIComponent(dish.name)}&dish_id=${dish.id}`, label: "이 메뉴의 영상 보기" }}
          />
        )}
      </section>
    </main>
  );
}
