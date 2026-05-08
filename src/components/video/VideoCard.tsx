import { DeletedVideoAlert } from "@/components/ui/DeletedVideoAlert";
import type { VideoWithStats } from "@/lib/sort-videos";
import { clsx } from "clsx";

type VideoCardProps = {
  video: VideoWithStats;
  dishId?: string | null;
  videoId?: string | null;
  /**
   * Pending dish name to carry through to the video page when the dish
   * has not been created yet. The video page lazily ensures the dish on
   * the first meaningful action (save attempt / thumbs).
   */
  q?: string | null;
};

function formatDate(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일`;
}

function Hearts({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span
        aria-label="아직 평가 전"
        className="inline-flex items-center text-[14px] leading-none tracking-tight text-pink/60"
      >
        ♡♡♡♡♡
      </span>
    );
  }
  const filled = Math.round(value);
  return (
    <span
      aria-label={`평균 ${value.toFixed(1)}점`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
    >
      <span aria-hidden className="text-[14px] leading-none tracking-tight">
        <span className="text-pink-deep">{"♥".repeat(filled)}</span>
        <span className="text-pink/60">{"♡".repeat(5 - filled)}</span>
      </span>
      <span className="font-tnum text-[12px] font-medium text-pink-ink">
        {value.toFixed(1)}
      </span>
    </span>
  );
}

export function VideoCard({ video, dishId, videoId, q }: VideoCardProps) {
  const params = new URLSearchParams();
  if (dishId) params.set("dish_id", dishId);
  else if (q) params.set("q", q);
  if (videoId) params.set("video_id", videoId);
  const qs = params.toString();
  const href = `/video/${video.youtubeVideoId}${qs ? `?${qs}` : ""}`;

  const muted = video.thumbs === "down" || video.isUnavailableOnYoutube;
  const lastTried = formatDate(video.lastTriedAt);
  const hasMeta = !!lastTried || video.attemptCount > 0;

  return (
    <a
      href={href}
      aria-label={
        video.isUnavailableOnYoutube
          ? `사용할 수 없는 영상: ${video.title}`
          : video.title
      }
      className="group block"
    >
      <article
        className={clsx(
          "relative overflow-hidden rounded-md border border-hairline bg-ivory-soft p-3 shadow-soft transition",
          "group-hover:-translate-y-0.5 group-hover:shadow-sticker",
          muted && "opacity-50",
        )}
      >
        {/* Top row: thumbnail + title/channel */}
        <div className="flex gap-3">
          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-sm border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {video.isUnavailableOnYoutube ? (
              <div className="absolute right-1 top-1">
                <DeletedVideoAlert />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-ink">
              {video.title}
            </h3>
            <p className="mt-1 truncate text-[12px] text-ink-muted">
              {video.channel}
            </p>
          </div>
        </div>

        {/* Meta row spans the full card width — never gets squeezed by
            the thumbnail column. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Hearts value={video.averageRating} />
          {hasMeta ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mint-soft px-2 py-0.5 text-[11px] text-mint-ink">
              {lastTried ? (
                <span className="font-tnum">{lastTried}</span>
              ) : null}
              {video.attemptCount > 0 ? (
                <span className="text-mint-deep">
                  {lastTried ? " · " : null}
                  {video.attemptCount}번
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </article>
    </a>
  );
}
