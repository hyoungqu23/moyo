"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Dish } from "@/db/schema";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { VideoCard } from "@/components/video/VideoCard";
import { apiFetch, ApiError } from "@/lib/api";
import {
  sortVideoResults,
  type ThumbState,
  type VideoWithStats,
} from "@/lib/sort-videos";

type SearchResultItem = {
  youtubeVideoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  publishedAt: string | null;
  thumbs?: ThumbState;
  averageRating?: string | number | null;
  attemptCount?: number;
  lastTriedAt?: string | null;
  isHidden?: boolean;
  isUnavailableOnYoutube?: boolean;
  /** 이미 저장된 영상의 Video UUID — URL 파라미터로 전달하여 thumbs 실호출 활성화 (L47) */
  id?: string | null;
  /** 이미 저장된 영상의 Dish UUID — URL 파라미터로 전달하여 기록하기 기능 활성화 (L47) */
  dishId?: string | null;
};

function toCard(
  item: SearchResultItem,
): VideoWithStats & { dishId?: string | null } {
  const rating = item.averageRating;
  return {
    id: item.id ?? item.youtubeVideoId,
    youtubeVideoId: item.youtubeVideoId,
    title: item.title,
    channel: item.channel,
    thumbnailUrl: item.thumbnailUrl,
    publishedAt: item.publishedAt ?? null,
    thumbs: (item.thumbs as ThumbState) ?? null,
    averageRating:
      rating === null || rating === undefined ? null : Number(rating),
    attemptCount: Number(item.attemptCount ?? 0),
    lastTriedAt: item.lastTriedAt ?? null,
    isHidden: item.isHidden ?? false,
    isUnavailableOnYoutube: item.isUnavailableOnYoutube ?? false,
    dishId: item.dishId ?? null,
  };
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageBody />
    </Suspense>
  );
}

function SearchPageBody() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const dishId = params.get("dish_id") ?? undefined;

  const [draft, setDraft] = useState(initialQuery);
  const debouncedDraft = useDebounced(draft.trim());

  const autocomplete = useQuery({
    queryKey: ["dishes", "autocomplete", debouncedDraft],
    queryFn: () =>
      apiFetch<{ dishes: Dish[] }>(
        `/api/dishes/autocomplete?q=${encodeURIComponent(debouncedDraft)}`,
      ),
    enabled: debouncedDraft.length > 0,
  });
  const dishOptions = (autocomplete.data?.dishes ?? []).map((dish) => ({
    id: dish.id,
    label: dish.name,
  }));

  const search = useQuery({
    queryKey: ["youtube", "search", initialQuery, dishId ?? ""],
    queryFn: () =>
      apiFetch<{ videos: SearchResultItem[] }>(
        `/api/youtube/search?q=${encodeURIComponent(initialQuery)}${dishId ? `&dish_id=${dishId}` : ""}`,
      ),
    enabled: initialQuery.length > 0,
  });

  const submit = (q: string, nextDishId?: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const url = `/search?q=${encodeURIComponent(trimmed)}${nextDishId ? `&dish_id=${nextDishId}` : ""}`;
    router.push(url);
  };

  const sorted = search.data
    ? sortVideoResults(search.data.videos.map(toCard))
    : { thumbsUpSection: [], generalSection: [] };

  return (
    <main className="bg-white">
      <div className="sticky top-11 z-30 border-b border-hairline bg-parchment/80 px-8 py-4 backdrop-blur">
        <form
          className="mx-auto max-w-prosewide"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <SearchInput
            options={dishOptions}
            value={draft}
            onValueChange={setDraft}
            onSelect={(option) => submit(option.label, option.id)}
          />
        </form>
      </div>
      {!initialQuery ? (
        <EmptyState title="메뉴를 검색해보세요" />
      ) : search.isLoading ? (
        <div className="mx-auto max-w-content px-8 py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="aspect-video" />
            ))}
          </div>
        </div>
      ) : search.isError ? (
        <EmptyState
          title={
            search.error instanceof ApiError && search.error.status === 429
              ? "잠시 후 다시 시도해주세요"
              : "검색 결과를 불러오지 못했어요"
          }
          action={{
            href: `/search?q=${encodeURIComponent(initialQuery)}${dishId ? `&dish_id=${dishId}` : ""}`,
            label: "재시도",
          }}
        />
      ) : (
        <>
          {sorted.thumbsUpSection.length > 0 ? (
            <section
              className="mx-auto max-w-content px-8 py-20"
              aria-labelledby="liked-heading"
            >
              <h1 id="liked-heading" className="mb-6 text-[21px] font-semibold">
                내가 좋아한 영상
              </h1>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sorted.thumbsUpSection.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    dishId={(video as { dishId?: string | null }).dishId}
                    videoId={
                      video.id !== video.youtubeVideoId ? video.id : null
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
          <section
            className="bg-parchment px-8 py-20"
            aria-labelledby="latest-heading"
          >
            <div className="mx-auto max-w-content">
              <h2
                id="latest-heading"
                className="mb-6 text-[21px] font-semibold"
              >
                최신순
              </h2>
              {sorted.generalSection.length === 0 ? (
                <EmptyState title="이 메뉴는 아직 유튜브 결과가 없어요" />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sorted.generalSection.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      dishId={(video as { dishId?: string | null }).dishId}
                      videoId={
                        video.id !== video.youtubeVideoId ? video.id : null
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
