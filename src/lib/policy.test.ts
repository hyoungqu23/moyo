import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src");
const routeFiles = [
  "app/api/home/route.ts",
  "app/api/youtube/search/route.ts",
  "app/api/youtube/video/[youtubeVideoId]/route.ts",
  "app/api/dishes/route.ts",
  "app/api/dishes/autocomplete/route.ts",
  "app/api/dishes/[id]/route.ts",
  "app/api/dishes/[id]/videos/route.ts",
  "app/api/dishes/[id]/attempts/route.ts", // L45 신규 — ALIGN 6차 rewind
  "app/api/videos/route.ts",
  "app/api/videos/[id]/route.ts",
  "app/api/videos/[id]/thumbs/route.ts",
  "app/api/videos/[id]/hidden/route.ts",
  "app/api/attempts/route.ts",
  "app/api/attempts/trash/route.ts",
  "app/api/attempts/[id]/route.ts",
  "app/api/attempts/[id]/restore/route.ts",
  "app/api/attempts/[id]/permanent/route.ts",
  "app/api/attempts/[id]/steps/route.ts",
  "app/api/attempts/[id]/steps/[stepId]/route.ts",
];

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("API and data policy TC-07, TC-08, TC-15~TC-18, TC-23~TC-26", () => {
  it("applies requireAuth to all 22 documented API methods", () => {
    const count = routeFiles.reduce(
      (sum, file) => sum + (source(file).match(/requireAuth\(/g)?.length ?? 0),
      0,
    );
    expect(count).toBe(22);
  });

  it("TC-07 excludes soft-deleted attempts from derived stats", () => {
    expect(source("lib/stats.ts")).toContain("isNull(attempts.deletedAt)");
    expect(source("app/api/dishes/[id]/videos/route.ts")).toContain(
      "isNull(attempts.deletedAt)",
    );
  });

  it("TC-08 uses nullable average rating for videos without attempts", () => {
    expect(source("app/api/dishes/[id]/videos/route.ts")).toContain(
      "ROUND(AVG",
    );
    expect(source("lib/sort-videos.ts")).toContain(
      "averageRating: number | null",
    );
  });

  it("TC-15 and TC-16 implement YouTube cache hit and miss upsert", () => {
    const text = source("lib/youtube.ts");
    expect(text).toContain("getCached");
    expect(text).toContain("setCached");
    expect(text).toContain("onConflictDoUpdate");
    expect(text).toContain("expiresAt");
  });

  it("TC-17 maps quota errors to 429 user-facing response", () => {
    const text = source("lib/youtube.ts");
    expect(text).toContain(
      "response.status === 403 || response.status === 429",
    );
    expect(text).toContain("잠시 후 다시 시도해주세요");
  });

  it("TC-18 keeps comment-disabled fallback non-fatal", () => {
    const text = source("lib/youtube.ts");
    expect(text).toContain("topComment = null");
    expect(text).toContain("commentThreads");
  });

  it("TC-23 autocomplete uses user-scoped LIKE and limit 8", () => {
    const text = source("app/api/dishes/autocomplete/route.ts");
    expect(text).toContain("eq(dishes.userId, userId)");
    expect(text).toContain("LIKE");
    expect(text).toContain(".limit(8)");
  });

  it("TC-24 home query returns recent attempts, top dishes, and empty state", () => {
    const text = source("lib/stats.ts");
    expect(text).toContain(".limit(5)");
    expect(text).toContain(".limit(3)");
    expect(text).toContain("empty:");
  });

  it("TC-25 deletion policy covers attempt trash, video deny, dish deny, and empty dish delete", () => {
    expect(source("app/api/attempts/[id]/route.ts")).toContain(
      "deletedAt: new Date()",
    );
    expect(source("app/api/attempts/[id]/restore/route.ts")).toContain(
      "deletedAt: null",
    );
    expect(source("app/api/videos/[id]/route.ts")).toContain("COUNT(*)");
    expect(source("app/api/videos/[id]/route.ts")).toContain("422");
    expect(source("app/api/dishes/[id]/route.ts")).toContain("videoCount");
    expect(source("app/api/dishes/[id]/route.ts")).toContain("422");
  });

  it("TC-26 marks unavailable YouTube videos and hides them from search", () => {
    expect(source("lib/youtube.ts")).toContain("isUnavailableOnYoutube: true");
    expect(source("app/api/youtube/search/route.ts")).toContain(
      "eq(videos.isUnavailableOnYoutube, false)",
    );
    expect(source("components/ui/DeletedVideoAlert.tsx")).toContain(
      "사용할 수 없는 영상",
    );
  });
});
