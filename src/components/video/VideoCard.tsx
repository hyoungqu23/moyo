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

function Hearts({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint">
        <span aria-hidden className="text-pink/70 tracking-tight">
          ♡♡♡♡♡
        </span>
        <span>아직 평가 전</span>
      </span>
    );
  }
  const filled = Math.round(value);
  return (
    <span
      aria-label={`평균 ${value.toFixed(1)}점`}
      className="inline-flex items-center gap-1.5"
    >
      <span aria-hidden className="text-[14px] tracking-tight">
        <span className="text-pink-deep">{"♥".repeat(filled)}</span>
        <span className="text-pink/70">{"♡".repeat(5 - filled)}</span>
      </span>
      <span className="font-tnum text-[12px] font-medium text-pink-ink">
        {value.toFixed(1)}
      </span>
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
          "relative overflow-hidden rounded-md border border-hairline bg-ivory-soft p-3 shadow-soft transition",
          "group-hover:-translate-y-0.5 group-hover:shadow-sticker",
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
            <div className="flex items-start gap-1.5">
              <span
                aria-hidden
                className="mt-1 text-[12px] leading-none text-pink-deep"
              >
                ⊹
              </span>
              <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-ink">
                {video.title}
              </h3>
            </div>
            <p className="mt-1 truncate pl-[18px] text-[12px] text-ink-muted">
              {video.channel}
            </p>

            <div className="mt-2 flex items-center justify-between gap-2 pl-[18px]">
              <Hearts value={video.averageRating} />
              {lastTried || video.attemptCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[11px] text-mint-ink">
                  {lastTried ? (
                    <span className="font-tnum">{lastTried}</span>
                  ) : null}
                  {video.attemptCount > 0 ? (
                    <span className="text-mint-deep">
                      {lastTried ? "·" : null} {video.attemptCount}번
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </a>
  );
}
