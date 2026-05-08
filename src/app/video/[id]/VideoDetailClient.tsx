"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import { useMediaQuery } from "@/hooks/use-media-query";
import { apiFetch } from "@/lib/api";
import { attemptInputSchema, type stepInputSchema } from "@/lib/validators";
import { loadYouTubeIframeApi, type YouTubePlayer } from "@/lib/youtube-iframe";
import type { ThumbState } from "@/lib/sort-videos";
import type { Attempt, Video } from "@/db/schema";
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
  const dishId = searchParams.get("dish_id");
  const videoId = searchParams.get("video_id"); // Video UUID — thumbs 실호출 대상 (L48)
  const queryClient = useQueryClient();
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

  const embeddable =
    detail.data?.embeddable !== false && !detail.data?.unavailable;

  useEffect(() => {
    if (!embeddable) return;
    if (!playerHostRef.current) return;
    let active = true;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (!active || !playerHostRef.current) return;
        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId: id,
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

  const upsertVideo = async (): Promise<Video> => {
    if (!dishId) throw new Error("메뉴를 먼저 선택해주세요");
    const payload = {
      dishId,
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
    return video;
  };

  const submitAttempt = useMutation({
    mutationFn: async (values: AttemptFormValues) => {
      const video = await upsertVideo();
      const stepsParsed: StepInput[] = values.steps
        .filter((step) => step.note.trim().length > 0)
        .map((step) => ({
          note: step.note.trim(),
          videoTimestamp: resolveStepSeconds(step),
        }));
      const parsed = attemptInputSchema.parse({
        videoId: video.id,
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
    },
    onError: (error: Error) =>
      setToast(error.message ?? "저장 중 오류가 발생했습니다"),
  });

  const onSubmit: SubmitHandler<AttemptFormValues> = (values) =>
    submitAttempt.mutate(values);

  // thumbs 토글 — videoId(URL param)가 있을 때 PATCH /api/videos/{videoId}/thumbs 실호출 (L48).
  // videoId 없는 경우(직접 URL 진입)는 낙관적 UI만 변경하고 서버 호출 없음.
  const thumbsMutation = useMutation({
    mutationFn: async (next: ThumbState) => {
      if (!videoId) return; // video_id 없으면 실호출 생략
      await apiFetch(`/api/videos/${videoId}/thumbs`, {
        method: "PATCH",
        body: JSON.stringify({ thumbs: next }),
      });
    },
    onError: (error: Error) =>
      setToast(error.message ?? "thumbs 저장 중 오류가 발생했습니다"),
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
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {!dishId ? (
        <p className="rounded-md bg-lavender-soft px-3 py-2.5 text-[12px] text-lavender-ink">
          ✎ 기록을 저장하려면 검색 화면에서 메뉴를 선택해 진입해주세요.
        </p>
      ) : null}
      <label className={labelClass}>
        평점 (0~5, 0.5 단위)
        <input
          type="number"
          step={0.5}
          min={0}
          max={5}
          aria-required="true"
          className={inputClass}
          {...form.register("rating", { valueAsNumber: true })}
        />
      </label>
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
      <Button type="submit" disabled={submitAttempt.isPending || !dishId}>
        {submitAttempt.isPending ? "저장 중…" : "저장하기"}
      </Button>
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

      {/* Description */}
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

      {/* Attempt record section */}
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
            </h2>
          </div>
          <Button ref={triggerRef} onClick={() => setOpen(true)}>
            + 기록하기
          </Button>
        </div>
        <EmptyState
          title="아직 시도 기록이 없어요"
          description="이 영상으로 만들어 본 적이 있다면 기록해 두세요."
        />
      </section>

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
