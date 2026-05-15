"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiJson } from "@/lib/api";

interface HomeResponse {
  emptyState: boolean;
  recentRecipes: Array<{
    id: string;
    title: string;
    averageRating: number | null;
    attemptCount: number;
    lastTriedAt: string | null;
    servings: string | null;
  }>;
}

export function HomeClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: () => apiJson.get<HomeResponse>("/api/home"),
  });

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-display-lg text-ink">나만의요리사</h1>
        <Link
          href="/search"
          className="text-body text-primary hover:underline"
        >
          검색
        </Link>
      </header>

      <div className="mt-8 flex gap-3">
        <Link href="/ingest">
          <Button variant="primary">레시피 가져오기</Button>
        </Link>
        <Link href="/trash">
          <Button variant="secondary-pill">휴지통</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-10 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data?.emptyState ? (
        <EmptyState
          className="mt-12"
          title="첫 레시피를 가져와볼까요?"
          description="YouTube 영상이나 텍스트를 붙여넣으면 재료/단계를 자동으로 정리해 드려요."
          cta={
            <Link href="/ingest">
              <Button>레시피 가져오기</Button>
            </Link>
          }
        />
      ) : (
        <section className="mt-10">
          <h2 className="text-body-strong text-ink">최근 만든 레시피</h2>
          <ul className="mt-3 divide-y divide-divider-soft">
            {data?.recentRecipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipe/${r.id}`}
                  className="block py-3 hover:bg-canvas-parchment rounded-sm px-2 -mx-2"
                >
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-body-strong text-ink truncate">{r.title}</h3>
                    {r.averageRating !== null && (
                      <span className="text-caption text-primary tabular-nums">
                        ★ {r.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-caption text-ink-muted-80">
                    {r.servings ?? ""}
                    {r.lastTriedAt && (r.servings ? " · " : "") + `마지막 시도 ${r.lastTriedAt}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
