import { describe, expect, it } from "vitest";
import { sortVideoResults, type VideoWithStats } from "@/lib/sort-videos";

const base = (input: Partial<VideoWithStats>): VideoWithStats => ({
  id: input.id ?? "id",
  youtubeVideoId: input.youtubeVideoId ?? input.id ?? "yt",
  title: input.title ?? "title",
  channel: input.channel ?? "channel",
  thumbnailUrl: input.thumbnailUrl ?? "https://i.ytimg.com/vi/x/hqdefault.jpg",
  publishedAt: input.publishedAt ?? "2026-05-01T00:00:00Z",
  thumbs: input.thumbs ?? null,
  averageRating: input.averageRating ?? null,
  attemptCount: input.attemptCount ?? 0,
  lastTriedAt: input.lastTriedAt,
});

describe("sortVideoResults TC-01~TC-04", () => {
  it("TC-01 sorts thumbs up by rating desc then attempt count desc", () => {
    const result = sortVideoResults([
      base({ id: "a", thumbs: "up", averageRating: 4, attemptCount: 9 }),
      base({ id: "b", thumbs: "up", averageRating: 5, attemptCount: 1 }),
      base({ id: "c", thumbs: "up", averageRating: 4, attemptCount: 10 }),
    ]);
    expect(result.thumbsUpSection.map((video) => video.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("TC-02 returns no thumbs up section when there are no liked videos", () => {
    const result = sortVideoResults([
      base({ id: "a" }),
      base({ id: "b", thumbs: "down" }),
    ]);
    expect(result.thumbsUpSection).toHaveLength(0);
  });

  it("TC-03 keeps thumbs down videos in the general section", () => {
    const result = sortVideoResults([base({ id: "a", thumbs: "down" })]);
    expect(result.generalSection[0]?.thumbs).toBe("down");
  });

  it("TC-04 sorts general videos by publishedAt desc", () => {
    const result = sortVideoResults([
      base({ id: "old", publishedAt: "2026-01-01T00:00:00Z" }),
      base({ id: "new", publishedAt: "2026-05-01T00:00:00Z" }),
    ]);
    expect(result.generalSection.map((video) => video.id)).toEqual([
      "new",
      "old",
    ]);
  });
});
