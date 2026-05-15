"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { SourceCard } from "@/components/sources/SourceCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiJson } from "@/lib/api";
import { sortRecipeResults, type RecipeSortInput } from "@/lib/sort-recipes";

interface DishRecipesResponse {
  dish: { id: string; name: string };
  recipes: Array<{
    id: string;
    title: string;
    servings: string | null;
    description: string | null;
    archivedAt: string | null;
    createdAt: string;
    averageRating: number | null;
    attemptCount: number;
    lastTriedAt: string | null;
  }>;
  sources: Array<{
    id: string;
    recipeId: string;
    type: "youtube" | "blog" | "text" | "manual";
    url: string | null;
    title: string | null;
    channel: string | null;
    thumbnailUrl: string | null;
    isUnavailableOnSource: boolean;
  }>;
}

export function DishDetailClient({ dishId }: { dishId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dish", dishId],
    queryFn: () => apiJson.get<DishRecipesResponse>(`/api/dishes/${dishId}/recipes`),
  });

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-content px-4 py-12">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-content px-4 py-12">
        <p className="text-body text-ink-muted-80">메뉴를 불러오지 못했어요.</p>
      </main>
    );
  }

  const { dish, recipes, sources } = data;
  const recipesSortInput: RecipeSortInput[] = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    averageRating: r.averageRating,
    attemptCount: r.attemptCount,
    lastTriedAt: r.lastTriedAt,
    createdAt: r.createdAt,
    archivedAt: r.archivedAt,
  }));
  const sorted = sortRecipeResults(recipesSortInput);
  const totalAttempts = recipes.reduce((sum, r) => sum + r.attemptCount, 0);

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <Link href="/" className="text-caption text-primary hover:underline">
        ← 홈
      </Link>
      <header className="mt-4 flex items-baseline justify-between gap-3">
        <h1 className="text-display-lg text-ink">{dish.name}</h1>
        <span className="text-caption text-ink-muted-80">
          레시피 {recipes.length}개 · 시도 {totalAttempts}회
        </span>
      </header>
      <div className="mt-6">
        <Link href={`/ingest?dishName=${encodeURIComponent(dish.name)}`}>
          <Button variant="primary">이 메뉴에 레시피 추가</Button>
        </Link>
      </div>

      <section className="mt-10 bg-canvas-parchment rounded-md p-4">
        <h2 className="text-body-strong text-ink">내 레시피</h2>
        {sorted.topRated.length === 0 && sorted.recent.length === 0 ? (
          <p className="mt-2 text-caption text-ink-muted-48">아직 레시피가 없어요.</p>
        ) : (
          <>
            {sorted.topRated.length > 0 && (
              <div className="mt-3">
                <h3 className="text-caption text-ink-muted-80">높은 평점</h3>
                <ul className="mt-2 divide-y divide-divider-soft">
                  {sorted.topRated.map((r) => (
                    <RecipeRow key={r.id} recipe={r} />
                  ))}
                </ul>
              </div>
            )}
            {sorted.recent.length > 0 && (
              <div className="mt-5">
                <h3 className="text-caption text-ink-muted-80">전체 레시피</h3>
                <ul className="mt-2 divide-y divide-divider-soft">
                  {sorted.recent.map((r) => (
                    <RecipeRow key={r.id} recipe={r} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {sources.length > 0 && (
        <section className="mt-10">
          <h2 className="text-body-strong text-ink">참고한 소스</h2>
          <div className="mt-3 space-y-2">
            {sources.map((src) => (
              <SourceCard key={src.id} source={src} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function RecipeRow({ recipe }: { recipe: RecipeSortInput & { servings?: string | null } }) {
  return (
    <li>
      <Link
        href={`/recipe/${recipe.id}`}
        className="block py-3 hover:bg-canvas/50 rounded-sm px-2 -mx-2"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-body-strong text-ink truncate">{recipe.title}</span>
          {recipe.averageRating !== null && (
            <span className="text-caption text-primary tabular-nums">
              ★ {recipe.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-1 text-caption text-ink-muted-80">
          시도 {recipe.attemptCount}회
          {recipe.lastTriedAt && ` · 마지막 ${recipe.lastTriedAt}`}
        </p>
      </Link>
    </li>
  );
}
