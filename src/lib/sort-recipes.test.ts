import { describe, expect, it } from "vitest";

import { sortRecipeResults, type RecipeSortInput } from "./sort-recipes";

function r(p: Partial<RecipeSortInput> & { id: string }): RecipeSortInput {
  return {
    title: "X",
    averageRating: null,
    attemptCount: 0,
    lastTriedAt: null,
    createdAt: "2026-05-15T00:00:00Z",
    archivedAt: null,
    ...p,
  };
}

describe("sortRecipeResults", () => {
  it("높은 평점: avg >= 4.0 인 Recipe가 topRated", () => {
    const result = sortRecipeResults([
      r({ id: "a", averageRating: 4.5, attemptCount: 1 }),
      r({ id: "b", averageRating: 3.0, attemptCount: 0 }),
    ]);
    expect(result.topRated.map((x) => x.id)).toEqual(["a"]);
    expect(result.recent.map((x) => x.id)).toEqual(["b"]);
  });

  it("높은 평점: attempt_count >= 2 만으로도 topRated", () => {
    const result = sortRecipeResults([
      r({ id: "a", averageRating: 3.0, attemptCount: 2 }),
      r({ id: "b", averageRating: 3.5, attemptCount: 1 }),
    ]);
    expect(result.topRated.map((x) => x.id)).toEqual(["a"]);
  });

  it("topRated: average_rating DESC 정렬", () => {
    const result = sortRecipeResults([
      r({ id: "low", averageRating: 4.0, attemptCount: 1 }),
      r({ id: "high", averageRating: 4.8, attemptCount: 1 }),
      r({ id: "mid", averageRating: 4.5, attemptCount: 1 }),
    ]);
    expect(result.topRated.map((x) => x.id)).toEqual(["high", "mid", "low"]);
  });

  it("recent: created_at DESC 정렬", () => {
    const result = sortRecipeResults([
      r({ id: "old", createdAt: "2026-04-01T00:00:00Z" }),
      r({ id: "new", createdAt: "2026-05-15T00:00:00Z" }),
      r({ id: "mid", createdAt: "2026-05-01T00:00:00Z" }),
    ]);
    expect(result.recent.map((x) => x.id)).toEqual(["new", "mid", "old"]);
  });

  it("archived Recipe는 모두 제외 (topRated/recent 모두)", () => {
    const result = sortRecipeResults([
      r({ id: "live", averageRating: 4.5, attemptCount: 2 }),
      r({
        id: "archived",
        averageRating: 4.8,
        attemptCount: 5,
        archivedAt: "2026-05-15T00:00:00Z",
      }),
    ]);
    expect(result.topRated.map((x) => x.id)).toEqual(["live"]);
    expect(result.recent).toHaveLength(0);
  });
});
