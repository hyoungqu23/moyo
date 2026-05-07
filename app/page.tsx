"use client";

import { useQuery } from "@tanstack/react-query";
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
    attemptCount: 0,
    lastTriedAt: row.attempt.triedAt,
    isHidden: row.video.isHidden,
    isUnavailableOnYoutube: row.video.isUnavailableOnYoutube,
  };
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

  return (
    <main className="bg-parchment">
      <section className="mx-auto max-w-content px-8 py-20">
        <div className="mx-auto max-w-prosewide">
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
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="aspect-video" />
            ))}
          </div>
        ) : home.isError ? (
          <EmptyState
            title="홈 데이터를 불러오지 못했어요"
            action={{ href: "/", label: "다시 시도" }}
          />
        ) : home.data?.empty ? (
          <EmptyState
            title="메뉴를 검색해 시작해보세요"
            action={{ href: "/search", label: "메뉴 검색하기" }}
          />
        ) : (
          <div className="mt-16 grid gap-16">
            <section aria-labelledby="recent-heading">
              <h1
                id="recent-heading"
                className="mb-6 text-[21px] font-semibold"
              >
                최근 시도한 영상
              </h1>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <section
              aria-labelledby="top-dishes-heading"
              className="bg-white px-6 py-10"
            >
              <h2
                id="top-dishes-heading"
                className="mb-5 text-[21px] font-semibold"
              >
                자주 만든 메뉴
              </h2>
              {home.data?.topDishes.length ? (
                <div className="flex flex-wrap gap-2">
                  {home.data.topDishes.map(({ dish, attemptCount }) => (
                    <a
                      key={dish.id}
                      href={`/dish/${dish.slug}`}
                      className="rounded-full border border-hairline bg-white px-4 py-3 text-sm"
                    >
                      {dish.name}
                      <span className="ml-2 text-ink-muted">
                        {attemptCount}회
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  아직 자주 만든 메뉴가 없어요.
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
