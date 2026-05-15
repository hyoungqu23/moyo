"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiJson } from "@/lib/api";

interface AutocompleteResponse {
  dishes: Array<{ id: string; name: string }>;
  recipes: Array<{ id: string; title: string; dishId: string }>;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const trimmed = q.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["autocomplete", trimmed],
    queryFn: () =>
      apiJson.get<AutocompleteResponse>(
        `/api/dishes/autocomplete?q=${encodeURIComponent(trimmed)}`,
      ),
    enabled: trimmed.length > 0,
  });

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <Link href="/" className="text-caption text-primary hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-4 text-tagline text-ink">검색</h1>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="메뉴 이름 또는 레시피 이름"
        autoFocus
        className="mt-4 w-full rounded-pill border border-hairline px-5 py-3 text-body text-ink bg-canvas"
        aria-label="검색어"
      />

      {trimmed.length === 0 && (
        <p className="mt-8 text-caption text-ink-muted-48">
          메뉴 이름이나 레시피 이름을 입력해주세요.
        </p>
      )}

      {trimmed.length > 0 && isFetching && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {data && trimmed.length > 0 && !isFetching && (
        <div className="mt-6 space-y-6">
          {data.dishes.length > 0 && (
            <section>
              <h2 className="text-body-strong text-ink">메뉴</h2>
              <ul className="mt-2 divide-y divide-divider-soft">
                {data.dishes.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/dish/${d.id}`}
                      className="block py-3 text-body text-ink hover:bg-canvas-parchment rounded-sm px-2 -mx-2"
                    >
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.recipes.length > 0 && (
            <section>
              <h2 className="text-body-strong text-ink">레시피</h2>
              <ul className="mt-2 divide-y divide-divider-soft">
                {data.recipes.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/recipe/${r.id}`}
                      className="block py-3 text-body text-ink hover:bg-canvas-parchment rounded-sm px-2 -mx-2"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.dishes.length === 0 && data.recipes.length === 0 && (
            <p className="text-caption text-ink-muted-48">결과가 없어요.</p>
          )}
        </div>
      )}
    </main>
  );
}
