"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import type { Attempt, Dish, Step, Video } from "@/db/schema";
import { Button } from "@/components/ui/Button";
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
    averageRating:
      row.averageRating === null ? null : Number(row.averageRating),
    attemptCount: Number(row.attemptCount ?? 0),
    lastTriedAt: row.lastTriedAt ?? null,
    isHidden: row.isHidden,
    isUnavailableOnYoutube: row.isUnavailableOnYoutube,
  };
}

function formatYmd(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일`;
}

function SectionLabel({
  glyph,
  glyphColor,
  title,
  count,
}: {
  glyph: string;
  glyphColor: string;
  title: string;
  count?: number | null;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div className="flex items-baseline gap-2">
        <span className={`font-display text-[16px] font-medium ${glyphColor}`}>
          {glyph}
        </span>
        <h2 className="font-display text-[20px] font-medium leading-none text-ink">
          {title}
        </h2>
      </div>
      {count != null ? (
        <span className="text-[12px] font-medium text-ink-muted">
          <span className="font-tnum">{count}</span>개
        </span>
      ) : null}
    </div>
  );
}

export default function DishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const dishesQuery = useQuery({
    queryKey: ["dishes", "all"],
    queryFn: () => apiFetch<{ dishes: Dish[] }>("/api/dishes"),
  });
  const dish = dishesQuery.data?.dishes.find((entry) => entry.slug === slug);

  const videosQuery = useQuery({
    queryKey: ["dishes", dish?.id, "videos"],
    queryFn: () =>
      apiFetch<{ videos: DishVideoRow[] }>(`/api/dishes/${dish!.id}/videos`),
    enabled: !!dish,
  });

  const attemptsQuery = useQuery({
    queryKey: ["dishes", dish?.id, "attempts"],
    queryFn: () =>
      apiFetch<{ attempts: AttemptRow[] }>(`/api/dishes/${dish!.id}/attempts`),
    enabled: !!dish,
  });

  const totalAttempts = attemptsQuery.data?.attempts.length ?? 0;
  const videoCount = videosQuery.data?.videos.length ?? 0;

  return (
    <div className="px-5 pt-5">
      {/* Dish header */}
      <header className="mb-7">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-pink-deep">
          <span aria-hidden>✿</span>
          메뉴
        </p>
        <h1 className="font-display mt-1 text-[28px] font-medium leading-tight text-ink">
          {dish?.name ?? decodeURIComponent(slug)}
        </h1>
        {dish ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-0.5 text-[12px] text-mint-ink">
              <span aria-hidden>✓</span>
              <span className="font-tnum">{totalAttempts}</span>번 시도
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-0.5 text-[12px] text-lavender-ink">
              <span aria-hidden>♥</span>
              영상 <span className="font-tnum">{videoCount}</span>개
            </span>
          </div>
        ) : null}
      </header>

      {/* Attempts */}
      <section className="mb-8" aria-labelledby="attempts-heading">
        <SectionLabel
          glyph="♥"
          glyphColor="text-pink-deep"
          title="내 시도 이력"
          count={attemptsQuery.data?.attempts.length}
        />
        {attemptsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : attemptsQuery.data && attemptsQuery.data.attempts.length > 0 ? (
          <ul className="stagger space-y-3" role="list">
            {attemptsQuery.data.attempts.map(({ video, attempt, steps }) => {
              const tried = formatYmd(attempt.triedAt);
              const ratingNum = Number(attempt.rating ?? 0);
              const filled = Math.max(0, Math.min(5, Math.round(ratingNum)));
              return (
                <li
                  key={attempt.id}
                  className="rounded-md border border-hairline bg-ivory-soft p-3 shadow-soft"
                  role="listitem"
                >
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="h-16 w-24 flex-shrink-0 rounded-sm border border-hairline object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium leading-tight text-ink">
                        {video.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          aria-label={`별점 ${ratingNum.toFixed(1)}점`}
                          className="text-[13px] tracking-tight"
                        >
                          <span className="text-pink-deep">
                            {"♥".repeat(filled)}
                          </span>
                          <span className="text-pink/60">
                            {"♡".repeat(5 - filled)}
                          </span>
                        </span>
                        <span className="font-tnum text-[12px] text-pink-ink">
                          {ratingNum.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                        {tried ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-mint-ink">
                            <span aria-hidden>✓</span>
                            <span className="font-tnum">{tried}</span>
                          </span>
                        ) : null}
                        {steps.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2 py-0.5 text-lavender-ink">
                            <span aria-hidden>✎</span>
                            단계 <span className="font-tnum">
                              {steps.length}
                            </span>
                          </span>
                        ) : null}
                      </div>
                      {attempt.changes ? (
                        <p className="mt-2 line-clamp-2 text-[13px] text-ink-soft">
                          {attempt.changes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="이 메뉴는 아직 시도 이력이 없어요"
            description="영상을 골라 만들어 보고 기록을 남겨보세요."
          />
        )}
      </section>

      {/* Videos for this dish */}
      <section className="mb-8" aria-labelledby="videos-heading">
        <SectionLabel
          glyph="❀"
          glyphColor="text-mint-deep"
          title="이 메뉴의 영상"
          count={videosQuery.data?.videos.length}
        />
        {videosQuery.isLoading || dishesQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : !dish ? (
          <EmptyState
            title="해당 메뉴를 찾을 수 없어요"
            action={{ href: "/", label: "홈으로" }}
          />
        ) : videosQuery.data && videosQuery.data.videos.length > 0 ? (
          <div className="stagger space-y-3">
            {videosQuery.data.videos.map((row) => (
              <VideoCard
                key={row.id}
                video={toCard(row)}
                dishId={row.dishId}
                videoId={row.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="이 메뉴에 저장된 영상이 없어요"
            description="새 영상을 검색해서 한 편 골라 시작해보세요."
            action={{
              href: `/search?q=${encodeURIComponent(dish.name)}&dish_id=${dish.id}`,
              label: "이 메뉴의 영상 찾기",
            }}
          />
        )}

        {/* Add-more chip — always handy at the bottom of the section */}
        {dish && videosQuery.data && videosQuery.data.videos.length > 0 ? (
          <div className="mt-4 flex justify-center">
            <Link
              href={`/search?q=${encodeURIComponent(dish.name)}&dish_id=${dish.id}`}
            >
              <Button variant="secondary-pill">+ 영상 더 찾기</Button>
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
