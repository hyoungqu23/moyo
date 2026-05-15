"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IngredientRow } from "@/components/recipes/IngredientRow";
import { StepRow } from "@/components/recipes/StepRow";
import { SourceCard } from "@/components/sources/SourceCard";
import { AttemptSheet } from "@/components/recipes/AttemptSheet";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiJson } from "@/lib/api";

interface RecipeDetailResponse {
  recipe: {
    id: string;
    dishId: string;
    title: string;
    servings: string | null;
    description: string | null;
  };
  ingredients: Array<{ id: string; name: string; amount: string; optional: boolean; displayOrder: number }>;
  steps: Array<{ id: string; instruction: string; timerSeconds: number | null; note: string | null; displayOrder: number }>;
  sources: Array<{
    id: string;
    type: "youtube" | "blog" | "text" | "manual";
    url: string | null;
    title: string | null;
    channel: string | null;
    thumbnailUrl: string | null;
    isUnavailableOnSource: boolean;
  }>;
  attempts: Array<{
    id: string;
    rating: string | null;
    triedAt: string;
    improvementNote: string | null;
  }>;
}

export function RecipeDetailClient({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();

  const recipeQuery = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => apiJson.get<RecipeDetailResponse>(`/api/recipes/${recipeId}`),
  });

  const [attemptOpen, setAttemptOpen] = useState(false);

  const titleMutation = useMutation<unknown, ApiError, { title?: string; servings?: string | null; description?: string | null }>({
    mutationFn: (patch) => apiJson.patch(`/api/recipes/${recipeId}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }),
    onError: (e) => toast.show(e.message, "error"),
  });

  const deleteMutation = useMutation<void, ApiError>({
    mutationFn: () => apiJson.delete(`/api/recipes/${recipeId}`),
    onSuccess: () => {
      toast.show("레시피를 삭제했어요.", "success");
      router.push("/");
    },
    onError: (e) => toast.show(e.message, "error"),
  });

  if (recipeQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-content px-4 py-12">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    );
  }

  if (recipeQuery.isError || !recipeQuery.data) {
    return (
      <main className="mx-auto w-full max-w-content px-4 py-12">
        <p className="text-body text-ink-muted-80">레시피를 불러오지 못했어요.</p>
      </main>
    );
  }

  const { recipe, ingredients, steps, sources, attempts } = recipeQuery.data;

  return (
    <>
      <main className="mx-auto w-full max-w-content px-4 py-12">
        {/* 헤더 — 인라인 편집 */}
        <header>
          <input
            type="text"
            defaultValue={recipe.title}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== recipe.title) {
                titleMutation.mutate({ title: e.target.value.trim() });
              }
            }}
            className="w-full bg-transparent text-display-lg text-ink outline-none focus:bg-canvas-parchment rounded-sm px-1 -mx-1"
            aria-label="레시피 이름"
          />
          <input
            type="text"
            defaultValue={recipe.servings ?? ""}
            placeholder="인분 (예: 2인분)"
            onBlur={(e) => {
              const v = e.target.value.trim() || null;
              if (v !== (recipe.servings ?? null)) {
                titleMutation.mutate({ servings: v });
              }
            }}
            className="mt-2 w-full bg-transparent text-body text-ink-muted-80 outline-none focus:bg-canvas-parchment rounded-sm px-1 -mx-1"
            aria-label="인분"
          />
          <textarea
            defaultValue={recipe.description ?? ""}
            placeholder="메모"
            rows={2}
            onBlur={(e) => {
              const v = e.target.value.trim() || null;
              if (v !== (recipe.description ?? null)) {
                titleMutation.mutate({ description: v });
              }
            }}
            className="mt-3 w-full bg-transparent text-body text-ink outline-none focus:bg-canvas-parchment rounded-sm px-1 -mx-1 resize-y"
            aria-label="레시피 메모"
          />
        </header>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => setAttemptOpen(true)}>조정하기 / 기록하기</Button>
          <Button
            variant="secondary-pill"
            onClick={() => {
              if (confirm("정말 이 레시피를 삭제할까요? 시도 기록이 있으면 삭제할 수 없어요.")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            삭제
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="text-body-strong text-ink">재료</h2>
          {ingredients.length === 0 ? (
            <p className="mt-2 text-caption text-ink-muted-48">아직 재료가 없어요.</p>
          ) : (
            <ul className="mt-2 divide-y divide-divider-soft">
              {ingredients.map((ing) => (
                <li key={ing.id}>
                  <IngredientRow
                    value={{ name: ing.name, amount: ing.amount, optional: ing.optional }}
                    onChange={(next) => {
                      apiJson
                        .patch(`/api/recipes/${recipeId}/ingredients/${ing.id}`, {
                          name: next.name,
                          amount: next.amount,
                          optional: next.optional,
                        })
                        .then(() => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }))
                        .catch((e: ApiError) => toast.show(e.message, "error"));
                    }}
                    onRemove={() => {
                      apiJson
                        .delete(`/api/recipes/${recipeId}/ingredients/${ing.id}`)
                        .then(() => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }))
                        .catch((e: ApiError) => toast.show(e.message, "error"));
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-body-strong text-ink">조리 단계</h2>
          {steps.length === 0 ? (
            <p className="mt-2 text-caption text-ink-muted-48">아직 단계가 없어요.</p>
          ) : (
            <ol className="mt-2 divide-y divide-divider-soft">
              {steps.map((step, idx) => (
                <li key={step.id}>
                  <StepRow
                    index={idx}
                    value={{
                      instruction: step.instruction,
                      timerSeconds: step.timerSeconds,
                      note: step.note,
                    }}
                    onChange={(next) => {
                      apiJson
                        .patch(`/api/recipes/${recipeId}/steps/${step.id}`, {
                          instruction: next.instruction,
                          timerSeconds: next.timerSeconds,
                          note: next.note,
                        })
                        .then(() => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }))
                        .catch((e: ApiError) => toast.show(e.message, "error"));
                    }}
                    onRemove={() => {
                      apiJson
                        .delete(`/api/recipes/${recipeId}/steps/${step.id}`)
                        .then(() => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }))
                        .catch((e: ApiError) => toast.show(e.message, "error"));
                    }}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        {attempts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-body-strong text-ink">시도 이력</h2>
            <ul className="mt-3 space-y-2">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-baseline gap-3 text-body border-b border-divider-soft pb-2"
                >
                  <time className="text-caption text-ink-muted-80 tabular-nums">{a.triedAt}</time>
                  {a.rating && (
                    <span className="text-primary text-caption">★ {a.rating}</span>
                  )}
                  {a.improvementNote && (
                    <span className="text-ink flex-1 truncate">{a.improvementNote}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {sources.length > 0 && (
          <section className="mt-10">
            <h2 className="text-body-strong text-ink">참고한 소스</h2>
            <div className="mt-3 space-y-2">
              {sources.map((src) => (
                <SourceCard
                  key={src.id}
                  source={src}
                  onDelete={() => {
                    apiJson
                      .delete(`/api/recipes/${recipeId}/sources/${src.id}`)
                      .then(() => qc.invalidateQueries({ queryKey: ["recipe", recipeId] }))
                      .catch((e: ApiError) => toast.show(e.message, "error"));
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <AttemptSheet
        open={attemptOpen}
        onClose={() => setAttemptOpen(false)}
        recipeId={recipeId}
        steps={steps}
        onSaved={() => {
          setAttemptOpen(false);
          qc.invalidateQueries({ queryKey: ["recipe", recipeId] });
          toast.show("시도 기록을 저장했어요.", "success");
        }}
      />
    </>
  );
}
