/**
 * sortRecipeResults() — tech-decision §6.2.
 *
 * 클라이언트 측 순수 함수. API Route는 DB 집계만 책임지고,
 * 최종 정렬(우선 노출 vs 일반)은 여기서 결정한다.
 *
 * "높은 평점" 영역: average_rating >= 4.0 OR attempt_count >= 2.
 * 그 외: 일반 영역 — created_at DESC.
 */

export interface RecipeSortInput {
  id: string;
  title: string;
  averageRating: number | null; // 0~5, null = 평가 없음
  attemptCount: number;
  lastTriedAt: string | null; // ISO date
  createdAt: string; // ISO timestamp
  archivedAt: string | null;
}

export interface SortedRecipes<T extends RecipeSortInput> {
  /** 평점·시도 이력이 있는 Recipe — 상단 노출. */
  topRated: T[];
  /** 신규 / 시도 적음 — 하단. */
  recent: T[];
}

const TOP_RATING_THRESHOLD = 4.0;
const TOP_ATTEMPT_THRESHOLD = 2;

export function sortRecipeResults<T extends RecipeSortInput>(
  recipes: T[],
): SortedRecipes<T> {
  const visible = recipes.filter((r) => r.archivedAt === null);

  const topRated = visible
    .filter(
      (r) =>
        (r.averageRating !== null && r.averageRating >= TOP_RATING_THRESHOLD) ||
        r.attemptCount >= TOP_ATTEMPT_THRESHOLD,
    )
    .sort((a, b) => {
      // average_rating DESC → attempt_count DESC → last_tried_at DESC.
      const ar = a.averageRating ?? -1;
      const br = b.averageRating ?? -1;
      if (br !== ar) return br - ar;
      if (b.attemptCount !== a.attemptCount) return b.attemptCount - a.attemptCount;
      const al = a.lastTriedAt ?? "";
      const bl = b.lastTriedAt ?? "";
      return bl.localeCompare(al);
    });

  const topRatedIds = new Set(topRated.map((r) => r.id));
  const recent = visible
    .filter((r) => !topRatedIds.has(r.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { topRated, recent };
}
