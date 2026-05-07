export type ThumbState = "up" | "down" | null;

export type VideoWithStats = {
  id: string;
  youtubeVideoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  publishedAt: string | Date | null;
  thumbs: ThumbState;
  averageRating: number | null;
  attemptCount: number;
  lastTriedAt?: string | null;
  isHidden?: boolean;
  isUnavailableOnYoutube?: boolean;
};

export type SortedVideoResult = {
  thumbsUpSection: VideoWithStats[];
  generalSection: VideoWithStats[];
};

export function sortVideoResults(videos: VideoWithStats[]): SortedVideoResult {
  const visible = videos.filter(
    (video) => !video.isHidden && !video.isUnavailableOnYoutube,
  );

  const thumbsUpSection = visible
    .filter((video) => video.thumbs === "up")
    .sort((a, b) => {
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.attemptCount - a.attemptCount;
    });

  const generalSection = visible
    .filter((video) => video.thumbs !== "up")
    .sort((a, b) => {
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      return bTime - aTime;
    });

  return { thumbsUpSection, generalSection };
}
