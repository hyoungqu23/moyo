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

  const totalCount =
    sorted.thumbsUpSection.length + sorted.generalSection.length;

  return (
    <div className="px-5 pt-5">
      {/* Search input pinned just below header */}
      <div className="mb-6">
        <form
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
        {initialQuery ? (
          <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-muted">
            <span aria-hidden className="text-pink-deep">
              ✿
            </span>
            <span>
              <span className="font-medium text-ink">{initialQuery}</span>
              <span className="ml-1">검색 결과</span>
              {search.isSuccess ? (
                <span className="ml-1 text-ink-faint">
                  · <span className="font-tnum">{totalCount}</span>개
                </span>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>

      {!initialQuery ? (
        <EmptyState
          title="만들고 싶은 메뉴를 검색해보세요"
          description="메뉴 이름을 입력하면 유튜브에서 영상을 찾아드려요."
        />
      ) : search.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
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
              aria-labelledby="liked-heading"
              className="mb-8"
            >
              <SectionLabel
                glyph="♥"
                glyphColor="text-pink-deep"
                title="내가 좋아한 영상"
                count={sorted.thumbsUpSection.length}
              />
              <div className="stagger space-y-3">
                {sorted.thumbsUpSection.map((video) => {
                  const itemDishId =
                    (video as { dishId?: string | null }).dishId ??
                    dishId ??
                    null;
                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      dishId={itemDishId}
                      // pass the search query as a pending dish name when
                      // the dish has not been created yet; the video page
                      // will lazily ensure it on save.
                      q={itemDishId ? null : initialQuery}
                      videoId={
                        video.id !== video.youtubeVideoId ? video.id : null
                      }
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="latest-heading" className="mb-8">
            <SectionLabel
              glyph="❀"
              glyphColor="text-mint-deep"
              title="최신순"
              count={sorted.generalSection.length}
            />
            {sorted.generalSection.length === 0 ? (
              <EmptyState title="이 메뉴는 아직 유튜브 결과가 없어요" />
            ) : (
              <div className="stagger space-y-3">
                {sorted.generalSection.map((video) => {
                  const itemDishId =
                    (video as { dishId?: string | null }).dishId ??
                    dishId ??
                    null;
                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      dishId={itemDishId}
                      q={itemDishId ? null : initialQuery}
                      videoId={
                        video.id !== video.youtubeVideoId ? video.id : null
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
