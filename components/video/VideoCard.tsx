import { Card } from "@/components/ui/Card";
import { DeletedVideoAlert } from "@/components/ui/DeletedVideoAlert";
import type { VideoWithStats } from "@/lib/sort-videos";

type VideoCardProps = {
  video: VideoWithStats;
  /** Dish UUID — 있으면 ?dish_id= query string에 포함하여 VideoDetailClient의 기록하기 기능 활성화 (L47) */
  dishId?: string | null;
  /** Video UUID — 있으면 ?video_id= query string에 포함하여 thumbs 실호출 활성화 (L47/L48) */
  videoId?: string | null;
};

export function VideoCard({ video, dishId, videoId }: VideoCardProps) {
  const params = new URLSearchParams();
  if (dishId) params.set("dish_id", dishId);
  if (videoId) params.set("video_id", videoId);
  const qs = params.toString();
  const href = `/video/${video.youtubeVideoId}${qs ? `?${qs}` : ""}`;

  return (
    <a
      href={href}
      aria-label={video.isUnavailableOnYoutube ? `사용할 수 없는 영상: ${video.title}` : video.title}
      className="block"
    >
      <Card className={video.thumbs === "down" ? "opacity-40 grayscale" : video.isUnavailableOnYoutube ? "opacity-30 grayscale" : ""}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt="" className="product-shadow aspect-video w-full rounded-sm object-cover" loading="lazy" />
          {video.isUnavailableOnYoutube ? <div className="absolute right-2 top-2"><DeletedVideoAlert /></div> : null}
        </div>
        <h3 className="mt-5 text-[17px] font-semibold leading-tight">{video.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{video.channel}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-muted">
          <span>시도 {video.attemptCount}회</span>
          <span>평균 {video.averageRating ?? "-"}점</span>
          <span>{video.lastTriedAt ?? "아직 기록 없음"}</span>
          {video.thumbs === "down" ? <span>싫어요</span> : null}
        </div>
      </Card>
    </a>
  );
}
