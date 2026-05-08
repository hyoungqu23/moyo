"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Attempt, Dish, Video } from "@/db/schema";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { VideoCard } from "@/components/video/VideoCard";
import { apiFetch } from "@/lib/api";
import type { VideoWithStats } from "@/lib/sort-videos";

type HomeResponse = {
  recentAttempts: Array<{ video: Video; attempt: Attempt }>;
  topDishes: Array<{ dish: Dish; attemptCount: number }>;
  empty: boolean;
};

function recentToCard(row: { video: Video; attempt: Attempt }): VideoWithStats {
  return {
    id: row.video.id,
    youtubeVideoId: row.video.youtubeVideoId,
    title: row.video.title,
    channel: row.video.channel,
    thumbnailUrl: row.video.thumbnailUrl,
    publishedAt: row.video.publishedAt ?? null,
    thumbs: (row.video.thumbs as VideoWithStats["thumbs"]) ?? null,
    averageRating: null,
    attemptCount: 1,
    lastTriedAt: row.attempt.triedAt,
    isHidden: row.video.isHidden,
    isUnavailableOnYoutube: row.video.isUnavailableOnYoutube,
  };
}

const ACCENTS: Array<{
  bg: string;
  border: string;
  text: string;
  ordinal: string;
}> = [
  {
    bg: "bg-pink-soft",
    border: "border-pink-deep/30",
    text: "text-pink-ink",
    ordinal: "text-pink-deep",
  },
  {
    bg: "bg-mint-soft",
    border: "border-mint-deep/30",
    text: "text-mint-ink",
    ordinal: "text-mint-deep",
  },
  {
    bg: "bg-lavender-soft",
    border: "border-lavender-deep/30",
    text: "text-lavender-ink",
    ordinal: "text-lavender-deep",
  },
];

function SectionLabel({
  index,
  title,
  count,
  ordinalColor = "text-pink-deep",
}: {
  index: string;
  title: string;
  count?: number | null;
  ordinalColor?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div className="flex items-baseline gap-2">
        <span
          className={`font-display text-[16px] font-medium ${ordinalColor}`}
        >
          {index}
        </span>
        <h2 className="font-display text-[22px] font-medium leading-none text-ink">
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

export default function HomePage() {
  const router = useRouter();
  const home = useQuery({
    queryKey: ["home"],
    queryFn: () => apiFetch<HomeResponse>("/api/home"),
  });
  const dishesQuery = useQuery({
    queryKey: ["dishes", "all"],
    queryFn: () => apiFetch<{ dishes: Dish[] }>("/api/dishes"),
  });
  const dishOptions = (dishesQuery.data?.dishes ?? []).map((dish) => ({
    id: dish.id,
    label: dish.name,
  }));

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="px-5 pt-5">
      {/* Date strap — dotted line */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[12px] font-medium text-pink-deep">
          오늘
        </span>
        <span className="text-[13px] text-ink-soft">{today}</span>
        <span className="rule-dotted flex-1" />
      </div>

      {/* Search */}
      <div className="mb-8">
        <SearchInput
          options={dishOptions}
          onSelect={(option) => {
            router.push(
              `/search?q=${encodeURIComponent(option.label)}&dish_id=${option.id}`,
            );
          }}
        />
      </div>

      {home.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : home.isError ? (
        <EmptyState
          title="홈을 불러오지 못했어요"
          action={{ href: "/", label: "다시 시도" }}
        />
      ) : home.data?.empty ? (
        <EmptyState
          title="첫 페이지를 펼쳐 볼까요"
          description="만들어 보고 싶은 메뉴부터 검색해 보세요."
          action={{ href: "/search", label: "메뉴 검색하기" }}
        />
      ) : (
        <>
          <section aria-labelledby="recent-heading" className="mb-10">
            <SectionLabel
              index="✿ 1"
              title="최근 시도한 영상"
              count={home.data?.recentAttempts.length ?? 0}
              ordinalColor="text-pink-deep"
            />
            <div className="stagger space-y-3">
              {(home.data?.recentAttempts ?? []).map((row) => (
                <VideoCard
                  key={row.attempt.id}
                  video={recentToCard(row)}
                  dishId={row.video.dishId}
                  videoId={row.video.id}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="top-dishes-heading" className="mb-10">
            <SectionLabel
              index="❀ 2"
              title="자주 만든 메뉴"
              count={home.data?.topDishes.length ?? 0}
              ordinalColor="text-mint-deep"
            />
            {home.data?.topDishes.length ? (
              <div className="flex flex-wrap gap-2">
                {home.data.topDishes.map(({ dish, attemptCount }, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  return (
                    <Link
                      key={dish.id}
                      href={`/dish/${dish.slug}`}
                      className={`group inline-flex items-center gap-2 rounded-full border ${accent.border} ${accent.bg} ${accent.text} px-3.5 py-1.5 text-[13px] font-medium transition hover:-translate-y-0.5 hover:shadow-soft`}
                    >
                      <span aria-hidden className={accent.ordinal}>
                        〔
                      </span>
                      <span>{dish.name}</span>
                      <span className="font-tnum text-[12px] opacity-70">
                        {attemptCount}번
                      </span>
                      <span aria-hidden className={accent.ordinal}>
                        〕
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">
                아직 자주 만든 메뉴가 없어요.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
