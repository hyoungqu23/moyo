import { DeletedVideoAlert } from "@/components/ui/DeletedVideoAlert";
import type { VideoWithStats } from "@/lib/sort-videos";
import { clsx } from "clsx";

type VideoCardProps = {
  video: VideoWithStats;
  dishId?: string | null;
  videoId?: string | null;
};

function formatDate(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일`;
}

function Stars({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-[14px] text-ink-faint">아직 평가 전</span>;
  }
  const filled = Math.round(value);
  return (
    <span
      aria-label={`평균 ${value.toFixed(1)}점`}
      className="inline-flex items-center gap-1.5"
    >
      <span className="text-[15px] leading-none tracking-wider text-persimmon">
        {"★".repeat(filled)}
        <span className="text-ink-faint">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="text-[14px] text-ink-muted">{value.toFixed(1)}</span>
    </span>
  );
}

export function VideoCard({ video, dishId, videoId }: VideoCardProps) {
  const params = new URLSearchParams();
  if (dishId) params.set("dish_id", dishId);
  if (videoId) params.set("video_id", videoId);
  const qs = params.toString();
  const href = `/video/${video.youtubeVideoId}${qs ? `?${qs}` : ""}`;

  const muted = video.thumbs === "down" || video.isUnavailableOnYoutube;
  const lastTried = formatDate(video.lastTriedAt);

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
          "relative overflow-hidden rounded-md border border-hairline bg-paper-2 p-3 transition",
          "group-hover:border-hairline-strong group-hover:-translate-y-px",
          muted && "opacity-50",
        )}
      >
        <div className="flex gap-3">
          <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-sm border border-hairline">
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
            <h3 className="line-clamp-2 text-[17px] leading-snug text-ink">
              {video.title}
            </h3>
            <p className="mt-1 truncate text-[14px] text-ink-muted">
              {video.channel}
            </p>

            <div className="mt-2 flex items-center justify-between gap-2">
              <Stars value={video.averageRating} />
              <span className="text-[13px] text-ink-muted">
                {lastTried ?? "—"}
                {video.attemptCount > 0 ? (
                  <span className="ml-2 text-ink-faint">
                    {video.attemptCount}번
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      </article>
    </a>
  );
}
