"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { Toast } from "@/components/ui/Toast";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { useMediaQuery } from "@/hooks/use-media-query";
import { apiFetch } from "@/lib/api";
import { attemptInputSchema, type stepInputSchema } from "@/lib/validators";
import { loadYouTubeIframeApi, type YouTubePlayer } from "@/lib/youtube-iframe";
import type { ThumbState } from "@/lib/sort-videos";
import type { Attempt, Dish, Step, Video } from "@/db/schema";
import type { z } from "zod";

type YoutubeVideoResponse = {
  unavailable: boolean;
  description: string;
  topComment: string | null;
  embeddable?: boolean;
  title?: string;
  channel?: string;
  publishedAt?: string;
  duration?: string | null;
};

type StepInput = z.infer<typeof stepInputSchema>;

type AttemptFormValues = {
  rating: number;
  triedAt: string;
  changes: string;
  improvementNote: string;
  steps: Array<{ note: string; manual: string; captured: number | null }>;
};

const DESCRIPTION_LIMIT = 300;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimestamp(seconds: number | null) {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimestamp(value: string): number | null {
  if (!value.trim()) return null;
  const [m, s = "0"] = value.split(":");
  const total = Number(m) * 60 + Number(s);
  return Number.isFinite(total) && total >= 0 ? Math.floor(total) : null;
}

function resolveStepSeconds(value: {
  manual: string;
  captured: number | null;
}): number | null {
  if (value.manual.trim()) return parseTimestamp(value.manual);
  return value.captured;
}

export function VideoDetailClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const initialDishId = searchParams.get("dish_id");
  const initialVideoRecordId = searchParams.get("video_id"); // Video UUID
  const pendingDishName = searchParams.get("q"); // dish name to lazy-create
  const queryClient = useQueryClient();

  // Resolved ids cached locally so that lazy creation only runs once.
  // Either pre-populated from the URL (existing dish/video) or filled in
  // when the user takes a meaningful action (save attempt or thumbs).
  const [resolvedDishId, setResolvedDishId] = useState<string | null>(
    initialDishId,
  );
  const [resolvedVideoRecordId, setResolvedVideoRecordId] = useState<
    string | null
  >(initialVideoRecordId);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 834px)");
  const [thumbs, setThumbs] = useState<ThumbState>(null);
  const [open, setOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [embedReady, setEmbedReady] = useState(false);
  const playerHostId = useId();

  const detail = useQuery<YoutubeVideoResponse>({
    queryKey: ["youtube", "video", id],
    queryFn: () => apiFetch<YoutubeVideoResponse>(`/api/youtube/video/${id}`),
  });

  // Lookup: "what does the user already know about this video?".
  // Hydrates thumbs, the resolved dish/video ids, and aggregates so a
  // returning visit reflects the prior state instead of starting blank.
  type LookupResponse = {
    dish: Dish | null;
    video: (Video & { thumbs: ThumbState }) | null;
    averageRating: number | null;
    attemptCount: number;
  };
  const lookupKey = initialDishId
    ? `dish_id=${initialDishId}`
    : pendingDishName
      ? `dish_name=${encodeURIComponent(pendingDishName)}`
      : "";
  const lookup = useQuery<LookupResponse>({
    queryKey: ["videos", "lookup", id, initialDishId, pendingDishName],
    queryFn: () =>
      apiFetch<LookupResponse>(`/api/videos/lookup?yt_id=${id}&${lookupKey}`),
    enabled: !!lookupKey,
  });

  // Hydrate local state when the lookup returns a record. Use the
  // primitive thumbs as the dep so we only sync when the server's view
  // actually changes (avoids clobbering an in-flight optimistic toggle).
  const serverThumbs = lookup.data?.video?.thumbs ?? null;
  const serverVideoRecordId = lookup.data?.video?.id ?? null;
  const serverDishId = lookup.data?.dish?.id ?? null;
  useEffect(() => {
    if (serverThumbs !== null) setThumbs(serverThumbs);
  }, [serverThumbs]);
  useEffect(() => {
    if (serverVideoRecordId && !resolvedVideoRecordId) {
      setResolvedVideoRecordId(serverVideoRecordId);
    }
  }, [serverVideoRecordId, resolvedVideoRecordId]);
  useEffect(() => {
    if (serverDishId && !resolvedDishId) setResolvedDishId(serverDishId);
  }, [serverDishId, resolvedDishId]);

  // Attempts list for this video record. Only enabled once the video has
  // been ensured (URL param, lazy-created, or hydrated from lookup).
  const attempts = useQuery({
    queryKey: ["videos", resolvedVideoRecordId, "attempts"],
    queryFn: () =>
      apiFetch<{
        attempts: Array<{ attempt: Attempt; steps: Step[] }>;
      }>(`/api/videos/${resolvedVideoRecordId}/attempts`),
    enabled: !!resolvedVideoRecordId,
  });

  const embeddable =
    !!detail.data &&
    detail.data.embeddable !== false &&
    !detail.data.unavailable;

  useEffect(() => {
    if (!embeddable) return;
    if (!playerHostRef.current) return;
    let active = true;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (!active || !playerHostRef.current) return;
        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId: id,
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => setEmbedReady(true),
            onError: () => setEmbedReady(false),
          },
        });
      })
      .catch(() => setEmbedReady(false));
    return () => {
      active = false;
      playerRef.current?.destroy();
      playerRef.current = null;
      setEmbedReady(false);
    };
  }, [embeddable, id]);

  const getCurrentTime = useCallback(() => {
    return playerRef.current
      ? Math.floor(playerRef.current.getCurrentTime())
      : 0;
  }, []);

  const form = useForm<AttemptFormValues>({
    defaultValues: {
      rating: 4,
      triedAt: todayIso(),
      changes: "",
      improvementNote: "",
      steps: [],
    },
  });
  const stepFields = useFieldArray({ control: form.control, name: "steps" });

  // Find or create a dish for the pending name. Idempotent on the server's
  // unique-by-name behaviour at the application layer.
  const ensureDish = async (rawName: string): Promise<string> => {
    const name = rawName.trim();
    if (!name) throw new Error("메뉴 이름이 비어 있어요");
    const { dishes } = await apiFetch<{ dishes: Dish[] }>(
      `/api/dishes/autocomplete?q=${encodeURIComponent(name)}`,
    );
    const exact = dishes.find((d) => d.name.trim() === name);
    if (exact) return exact.id;
    const { dish } = await apiFetch<{ dish: Dish }>("/api/dishes", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
    return dish.id;
  };

  // Resolve dish_id + video record id, creating both if missing. Called by
  // the first meaningful action (attempt save or thumbs toggle) to lazily
  // commit a "real" dish/video to the database.
  const ensureVideoRecord = async (): Promise<{
    dishId: string;
    videoRecordId: string;
  }> => {
    let actualDishId = resolvedDishId;
    if (!actualDishId) {
      if (!pendingDishName) {
        throw new Error("메뉴 정보가 없어요. 검색 화면에서 다시 진입해주세요.");
      }
      actualDishId = await ensureDish(pendingDishName);
      setResolvedDishId(actualDishId);
    }

    const payload = {
      dishId: actualDishId,
      youtubeVideoId: id,
      title: detail.data?.title ?? id,
      channel: detail.data?.channel ?? "",
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: detail.data?.publishedAt ?? null,
    };
    const { video } = await apiFetch<{ video: Video }>("/api/videos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (resolvedVideoRecordId !== video.id) {
      setResolvedVideoRecordId(video.id);
    }
    return { dishId: actualDishId, videoRecordId: video.id };
  };

  const submitAttempt = useMutation({
    mutationFn: async (values: AttemptFormValues) => {
      const { videoRecordId } = await ensureVideoRecord();
      const stepsParsed: StepInput[] = values.steps
        .filter((step) => step.note.trim().length > 0)
        .map((step) => ({
          note: step.note.trim(),
          videoTimestamp: resolveStepSeconds(step),
        }));
      const parsed = attemptInputSchema.parse({
        videoId: videoRecordId,
        rating: values.rating,
        changes: values.changes || undefined,
        improvementNote: values.improvementNote || undefined,
        triedAt: values.triedAt,
        steps: stepsParsed,
      });
      const { attempt } = await apiFetch<{ attempt: Attempt }>(
        "/api/attempts",
        {
          method: "POST",
          body: JSON.stringify(parsed),
        },
      );
      return attempt;
    },
    onSuccess: () => {
      setToast("시도 기록이 저장됐어요");
      setOpen(false);
      form.reset({
        rating: 4,
        triedAt: todayIso(),
        changes: "",
        improvementNote: "",
        steps: [],
      });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      // Refresh this video's attempts list so the UI shows the new entry.
      queryClient.invalidateQueries({
        queryKey: ["videos", resolvedVideoRecordId, "attempts"],
      });
      // Refresh the lookup aggregates (averageRating / attemptCount).
      queryClient.invalidateQueries({
        queryKey: ["videos", "lookup", id],
      });
    },
    onError: (error: Error) => {
      // Surface the underlying problem in the dev console so users can debug.
      console.error("[attempt save] failed", error);
      setToast(error.message ?? "저장 중 오류가 발생했습니다");
    },
  });

  const onSubmit: SubmitHandler<AttemptFormValues> = (values) => {
    submitAttempt.mutate(values);
  };

  const onInvalid = (errors: unknown) => {
    console.warn("[attempt save] form invalid", errors);
    setToast("입력값을 다시 확인해주세요");
  };

  // thumbs 토글 — 첫 클릭 시 dish + video를 lazy-create한 뒤 PATCH.
  // 의도된 평가 행위라 dish 생성을 정당화한다 (단순 검색만으로는 안 만듦).
  const thumbsMutation = useMutation({
    mutationFn: async (next: ThumbState) => {
      const { videoRecordId } = await ensureVideoRecord();
      await apiFetch(`/api/videos/${videoRecordId}/thumbs`, {
        method: "PATCH",
        body: JSON.stringify({ thumbs: next }),
      });
    },
    onError: (error: Error) => {
      console.error("[thumbs] failed", error);
      setToast(error.message ?? "평가 저장 중 오류가 발생했어요");
    },
  });

  const handleThumbsChange = (next: ThumbState) => {
    setThumbs(next); // 낙관적 업데이트
    thumbsMutation.mutate(next);
  };

  const description = detail.data?.description ?? "";
  const showDescriptionToggle = description.length > DESCRIPTION_LIMIT;
  const visibleDescription =
    descriptionExpanded || !showDescriptionToggle
      ? description
      : description.slice(0, DESCRIPTION_LIMIT);

  const inputClass =
    "h-11 w-full rounded-md border border-hairline bg-ivory-soft px-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-pink-deep focus:outline-none";
  const textareaClass =
    "min-h-24 w-full rounded-md border border-hairline bg-ivory-soft p-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-pink-deep focus:outline-none";
  const labelClass = "grid gap-1.5 text-[13px] font-medium text-ink-soft";

  const formContent = (
    <form
      className="flex max-h-full min-h-0 flex-col"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {/* Scrollable middle */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pb-4 pr-1">
        {!resolvedDishId && pendingDishName ? (
          <div className="rounded-md border border-mint-deep/30 bg-mint-soft px-3 py-2.5 text-[12px] text-mint-ink">
            <p className="font-medium">
              ✿ 저장하면 메뉴 「{pendingDishName}」가 새로 만들어져요
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed">
              평가나 기록 없이 그냥 둘러볼 때는 만들어지지 않습니다.
            </p>
          </div>
        ) : !resolvedDishId ? (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-[12px] text-danger">
            <p className="font-medium">메뉴 정보가 없어요</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed">
              검색 화면에서 다시 진입해주세요.
            </p>
          </div>
        ) : null}
      <div className={labelClass}>
        <span>평점</span>
        <Controller
          control={form.control}
          name="rating"
          render={({ field }) => (
            <div className="rounded-md border border-hairline bg-ivory-soft px-4 py-3">
              <StarRating value={field.value} onChange={field.onChange} />
              <p className="mt-1 text-[11px] text-ink-faint">
                하트를 눌러 평점을 매겨주세요. 왼쪽 절반은 반점.
              </p>
            </div>
          )}
        />
      </div>
      <label className={labelClass}>
        <span aria-hidden="true">시도 날짜 *</span>
        <input
          aria-label="시도 날짜"
          aria-required="true"
          type="date"
          className={inputClass}
          {...form.register("triedAt")}
        />
      </label>
      <label className={labelClass}>
        변경 사항
        <textarea
          aria-label="변경 사항"
          placeholder="레시피와 다르게 한 점이 있다면…"
          className={textareaClass}
          {...form.register("changes")}
        />
      </label>
      <label className={labelClass}>
        개선 메모
        <textarea
          aria-label="개선 메모"
          placeholder="다음에 만들 때 시도해볼 것"
          className={textareaClass}
          {...form.register("improvementNote")}
        />
      </label>
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-ink-soft">
          단계별 기록 <span className="text-ink-faint">· 선택</span>
        </p>
        <div role="list" className="grid gap-3">
          {stepFields.fields.map((field, index) => (
            <div
              role="listitem"
              key={field.id}
              className="grid gap-3 rounded-md border border-hairline bg-mint-soft/40 p-3"
            >
              <textarea
                aria-label="단계 메모"
                placeholder="이 시점에 무엇을 했나요?"
                className={textareaClass}
                {...form.register(`steps.${index}.note`)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary-pill"
                  aria-label="현재 재생 시간 기록"
                  aria-disabled={!embedReady}
                  disabled={!embedReady}
                  onClick={() =>
                    form.setValue(`steps.${index}.captured`, getCurrentTime())
                  }
                >
                  지금 시간 기록
                </Button>
                <input
                  aria-label="수동 재생 시간"
                  className="h-11 w-24 rounded-md border border-hairline bg-ivory-soft px-3 font-tnum text-[14px] text-ink focus:border-pink-deep focus:outline-none"
                  placeholder="mm:ss"
                  defaultValue={formatTimestamp(field.captured)}
                  {...form.register(`steps.${index}.manual`)}
                />
                <Button
                  type="button"
                  variant="icon"
                  aria-label="이 단계 삭제"
                  onClick={() => stepFields.remove(index)}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary-pill"
          onClick={() =>
            stepFields.append({ note: "", manual: "", captured: null })
          }
        >
          + 단계 추가
        </Button>
      </div>
      </div>

      {/* Sticky footer — always visible, never blocked by scroll */}
      <div className="-mx-5 -mb-5 mt-3 border-t border-hairline bg-ivory-soft px-5 py-3">
        <Button
          type="submit"
          disabled={submitAttempt.isPending}
          className="w-full"
        >
          {submitAttempt.isPending ? "저장 중…" : "저장하기"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="px-5 pt-5">
      {/* Player */}
      <div className="mb-5 overflow-hidden rounded-md border border-hairline shadow-soft">
        {detail.isLoading ? (
          <Skeleton className="aspect-video w-full !rounded-none" />
        ) : detail.data?.unavailable || !embeddable ? (
          <div className="grid aspect-video place-items-center bg-ink-soft px-6 text-center text-[13px] text-paper-2">
            <p>
              이 영상은 더 이상 유튜브에서 사용할 수 없거나
              <br />
              임베드가 차단되어 있어요.
            </p>
          </div>
        ) : (
          <div
            ref={playerHostRef}
            id={playerHostId}
            className="aspect-video w-full bg-ink"
          />
        )}
      </div>

      {/* Title + meta */}
      <div className="mb-4">
        <h1 className="font-display text-[22px] font-medium leading-snug text-ink">
          {detail.data?.title ?? "영상 상세"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(resolvedDishId || pendingDishName) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2.5 py-0.5 text-[12px] text-pink-ink">
              <span aria-hidden>✿</span>
              {lookup.data?.dish?.name ?? pendingDishName ?? "메뉴"}
              {resolvedDishId ? null : (
                <span className="text-pink-deep/70">· 평가 시 생성</span>
              )}
            </span>
          )}
          {lookup.data?.averageRating != null &&
          lookup.data.attemptCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-2.5 py-0.5 text-[12px] text-ink">
              <span aria-hidden className="text-pink-deep">
                ♥
              </span>
              <span className="font-tnum font-medium">
                {lookup.data.averageRating.toFixed(1)}
              </span>
              <span className="text-ink-muted">
                · <span className="font-tnum">{lookup.data.attemptCount}</span>
                번
              </span>
            </span>
          ) : null}
          {detail.data?.channel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-0.5 text-[12px] text-mint-ink">
              <span aria-hidden>✎</span>
              {detail.data.channel}
            </span>
          ) : null}
          {detail.data?.publishedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-0.5 text-[12px] text-lavender-ink">
              <span aria-hidden>·</span>
              <span className="font-tnum">
                {new Date(detail.data.publishedAt)
                  .toISOString()
                  .slice(0, 10)
                  .replace(/-/g, ".")}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Thumbs sticker pair — the signature interaction */}
      <div className="mb-7">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <span aria-hidden className="text-pink-deep">
            ✿
          </span>
          이 영상 어떠셨어요?
        </p>
        <ToggleGroup value={thumbs} onChange={handleThumbsChange} />
      </div>

      {/* Attempt record section — kept high so 기록하기 stays within thumb-reach */}
      <section aria-labelledby="attempt-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-lavender-deep">
              ✎ 기록
            </p>
            <h2
              id="attempt-heading"
              className="font-display text-[20px] font-medium leading-tight text-ink"
            >
              내 시도 기록
              {attempts.data && attempts.data.attempts.length > 0 ? (
                <span className="ml-2 text-[14px] font-medium text-ink-muted">
                  <span className="font-tnum">
                    {attempts.data.attempts.length}
                  </span>
                  번
                </span>
              ) : null}
            </h2>
          </div>
          <Button ref={triggerRef} onClick={() => setOpen(true)}>
            + 기록하기
          </Button>
        </div>
        {!resolvedVideoRecordId || attempts.isLoading ? null : attempts.data &&
          attempts.data.attempts.length > 0 ? (
          <ul className="stagger space-y-3" role="list">
            {attempts.data.attempts.map(({ attempt, steps: stepRows }) => {
              const ratingNum = Number(attempt.rating ?? 0);
              const filled = Math.max(0, Math.min(5, Math.round(ratingNum)));
              const tried = (() => {
                const d = new Date(attempt.triedAt);
                if (Number.isNaN(d.getTime())) return null;
                return `${d.getMonth() + 1}월 ${d.getDate()}일`;
              })();
              return (
                <li
                  key={attempt.id}
                  className="rounded-md border border-hairline bg-ivory-soft p-3 shadow-soft"
                  role="listitem"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          aria-label={`별점 ${ratingNum.toFixed(1)}점`}
                          className="text-[14px] tracking-tight"
                        >
                          <span className="text-pink-deep">
                            {"♥".repeat(filled)}
                          </span>
                          <span className="text-pink/60">
                            {"♡".repeat(5 - filled)}
                          </span>
                        </span>
                        <span className="font-tnum text-[13px] font-medium text-pink-ink">
                          {ratingNum.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {tried ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-mint-ink">
                            <span aria-hidden>✓</span>
                            <span className="font-tnum">{tried}</span>
                          </span>
                        ) : null}
                        {stepRows.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2 py-0.5 text-lavender-ink">
                            <span aria-hidden>✎</span>
                            단계{" "}
                            <span className="font-tnum">{stepRows.length}</span>
                          </span>
                        ) : null}
                      </div>
                      {attempt.changes ? (
                        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                          {attempt.changes}
                        </p>
                      ) : null}
                      {attempt.improvementNote ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                          <span className="text-pink-deep">→</span>{" "}
                          {attempt.improvementNote}
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
            title="아직 시도 기록이 없어요"
            description="이 영상으로 만들어 본 적이 있다면 기록해 두세요."
          />
        )}
      </section>

      {/* Description — reference info, kept below the action area */}
      {detail.isLoading ? (
        <Skeleton className="mb-6 h-32" />
      ) : description ? (
        <section className="mb-6 rounded-md border border-hairline bg-ivory-soft p-4 shadow-soft">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-pink-deep">
            <span aria-hidden>✿</span>
            영상 설명
          </p>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
            {visibleDescription}
            {showDescriptionToggle ? (
              <button
                type="button"
                className="ml-2 font-medium text-pink-deep hover:text-pink-ink"
                onClick={() => setDescriptionExpanded((value) => !value)}
              >
                {descriptionExpanded ? "접기" : "더 보기"}
              </button>
            ) : null}
          </p>
        </section>
      ) : null}

      {/* Top comment */}
      {detail.data?.topComment ? (
        <section className="mb-6 rounded-md border border-hairline bg-mint-soft/40 p-4 shadow-soft">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-mint-deep">
            <span aria-hidden>❀</span>
            인기 댓글
          </p>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
            {detail.data.topComment}
          </p>
        </section>
      ) : null}

      {open ? (
        isDesktop ? (
          <Dialog
            open
            onClose={() => setOpen(false)}
            title="시도 기록"
            triggerRef={triggerRef}
          >
            {formContent}
          </Dialog>
        ) : (
          <BottomSheet
            open
            onClose={() => setOpen(false)}
            title="시도 기록"
            triggerRef={triggerRef}
          >
            {formContent}
          </BottomSheet>
        )
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
