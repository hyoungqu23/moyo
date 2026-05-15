"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { IngredientRow } from "@/components/recipes/IngredientRow";
import { StepRow } from "@/components/recipes/StepRow";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiJson } from "@/lib/api";
import type { ParsedIngredient, ParsedStep, RecipeDraft } from "@/lib/ingestion/types";

type Phase = "input" | "processing" | "review";

interface IngestResponse {
  draft: RecipeDraft;
}

interface SaveResponse {
  recipe: { id: string };
}

export default function IngestPage() {
  return (
    <Suspense fallback={<IngestSkeleton />}>
      <IngestForm />
    </Suspense>
  );
}

function IngestSkeleton() {
  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <h1 className="text-tagline text-ink">레시피 가져오기</h1>
    </main>
  );
}

function IngestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // 5-A 입력.
  const [sourceType, setSourceType] = useState<"youtube" | "text">("youtube");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [dishName, setDishName] = useState(searchParams.get("dishName") ?? "");

  // 5-B 처리 결과 / 5-C 검수.
  const [phase, setPhase] = useState<Phase>("input");
  const [draft, setDraft] = useState<RecipeDraft | null>(null);

  const ingestMutation = useMutation<IngestResponse, ApiError>({
    mutationFn: () => {
      const payload =
        sourceType === "youtube"
          ? { sourceType: "youtube" as const, payload: { url } }
          : {
              sourceType: "text" as const,
              payload: { text, url: url.trim() ? url : null },
            };
      return apiJson.post<IngestResponse>("/api/recipes/ingest", {
        ...payload,
        dishName: dishName.trim() || undefined,
      });
    },
    onMutate: () => setPhase("processing"),
    onSuccess: (data) => {
      setDraft(data.draft);
      setPhase("review");
    },
    onError: (err) => {
      toast.show(err.message, "error");
      setPhase("input");
    },
  });

  const saveMutation = useMutation<SaveResponse, ApiError>({
    mutationFn: () => {
      if (!draft) throw new Error("Draft not ready");
      return apiJson.post<SaveResponse>("/api/recipes", {
        dishId: draft.dishId,
        title: draft.title,
        servings: draft.servings,
        description: draft.description,
        ingredients: draft.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount,
          optional: i.optional ?? false,
        })),
        steps: draft.steps.map((s) => ({
          instruction: s.instruction,
          timerSeconds: s.timerSeconds ?? null,
          note: s.note ?? null,
        })),
        sources: draft.sources,
      });
    },
    onSuccess: (data) => {
      toast.show("레시피를 저장했어요.", "success");
      router.push(`/recipe/${data.recipe.id}`);
    },
    onError: (err) => toast.show(err.message, "error"),
  });

  const onStart = () => {
    if (sourceType === "youtube" && !url.trim()) {
      toast.show("YouTube URL을 입력해주세요.", "error");
      return;
    }
    if (sourceType === "text" && !text.trim()) {
      toast.show("레시피 텍스트를 붙여넣어 주세요.", "error");
      return;
    }
    ingestMutation.mutate();
  };

  if (phase === "processing") {
    return (
      <main className="mx-auto w-full max-w-content px-4 py-12">
        <h1 className="text-tagline text-ink">레시피를 분석하고 있어요</h1>
        <div className="mt-8 space-y-3" aria-live="polite">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/4" />
          <Skeleton className="h-6 w-1/4 mt-6" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    );
  }

  if (phase === "review" && draft) {
    return (
      <ReviewView
        draft={draft}
        onChange={setDraft}
        onSave={() => saveMutation.mutate()}
        onCancel={() => {
          setDraft(null);
          setPhase("input");
        }}
        saving={saveMutation.isPending}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <h1 className="text-tagline text-ink">레시피 가져오기</h1>
      <p className="mt-2 text-body text-ink-muted-80">
        YouTube URL을 넣거나, 텍스트로 직접 붙여넣어 주세요.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">출처 종류</legend>
        <div className="inline-flex rounded-pill border border-divider-soft bg-canvas overflow-hidden">
          {(
            [
              { v: "youtube", label: "YouTube" },
              { v: "text", label: "텍스트" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setSourceType(opt.v)}
              aria-pressed={sourceType === opt.v}
              className={
                "px-4 py-2 text-body min-h-[44px] " +
                (sourceType === opt.v
                  ? "bg-primary text-white"
                  : "text-ink hover:bg-canvas-parchment")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block mt-6">
        <span className="text-caption text-ink-muted-80">메뉴 이름 (선택)</span>
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="예: 제육볶음"
          className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
        />
      </label>

      {sourceType === "youtube" ? (
        <label className="block mt-4">
          <span className="text-caption text-ink-muted-80">YouTube URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
          />
        </label>
      ) : (
        <>
          <label className="block mt-4">
            <span className="text-caption text-ink-muted-80">원본 URL (선택)</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="블로그/웹사이트 주소"
              className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
            />
          </label>
          <label className="block mt-4">
            <span className="text-caption text-ink-muted-80">레시피 텍스트</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="재료와 만드는 방법을 그대로 붙여넣어 주세요."
              className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas resize-y"
            />
          </label>
        </>
      )}

      <div className="mt-8 flex gap-3">
        <Button onClick={onStart} disabled={ingestMutation.isPending}>
          분석 시작
        </Button>
      </div>
    </main>
  );
}

interface ReviewProps {
  draft: RecipeDraft;
  onChange: (next: RecipeDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function ReviewView({ draft, onChange, onSave, onCancel, saving }: ReviewProps) {
  const conf = draft.parseResult.overallConfidence;
  const ingredients = draft.ingredients;
  const steps = draft.steps;

  const isEmpty = ingredients.length === 0 && steps.length === 0;

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <h1 className="text-tagline text-ink">초안을 확인해주세요</h1>
      <p className="mt-2 text-body text-ink-muted-80">
        {conf === "high"
          ? "거의 정확히 추출됐어요. 필요하면 수정해주세요."
          : conf === "med"
            ? "일부만 추출됐어요. 노란 ⚠ 표시된 부분을 확인해주세요."
            : "자동 추출에 실패했어요. 텍스트를 직접 정리해주세요."}
      </p>

      <section className="mt-8">
        <label className="block">
          <span className="text-caption text-ink-muted-80">레시피 이름</span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body-strong text-ink bg-canvas"
          />
        </label>
        <label className="block mt-3">
          <span className="text-caption text-ink-muted-80">인분 (선택)</span>
          <input
            type="text"
            value={draft.servings ?? ""}
            onChange={(e) =>
              onChange({ ...draft, servings: e.target.value || null })
            }
            placeholder="예: 2인분"
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
          />
        </label>
      </section>

      <section className="mt-8">
        <h2 className="text-body-strong text-ink">재료</h2>
        {ingredients.length === 0 ? (
          <p className="mt-2 text-caption text-ink-muted-48">
            자동으로 인식된 재료가 없어요. 직접 추가해주세요.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-divider-soft">
            {ingredients.map((ing, idx) => (
              <IngredientRow
                key={idx}
                value={ing}
                onChange={(next) => {
                  const updated = [...ingredients];
                  updated[idx] = next as ParsedIngredient;
                  onChange({ ...draft, ingredients: updated });
                }}
                onRemove={() => {
                  const updated = ingredients.filter((_, i) => i !== idx);
                  onChange({ ...draft, ingredients: updated });
                }}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              ingredients: [
                ...ingredients,
                { name: "", amount: "", optional: false, confidence: "high" },
              ],
            })
          }
          className="mt-3 text-primary text-caption hover:underline"
        >
          + 재료 추가
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-body-strong text-ink">조리 단계</h2>
        {steps.length === 0 ? (
          <p className="mt-2 text-caption text-ink-muted-48">
            자동으로 인식된 단계가 없어요. 직접 추가해주세요.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-divider-soft">
            {steps.map((step, idx) => (
              <StepRow
                key={idx}
                index={idx}
                value={step}
                onChange={(next) => {
                  const updated = [...steps];
                  updated[idx] = next as ParsedStep;
                  onChange({ ...draft, steps: updated });
                }}
                onRemove={() => {
                  const updated = steps.filter((_, i) => i !== idx);
                  onChange({ ...draft, steps: updated });
                }}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              steps: [
                ...steps,
                { instruction: "", timerSeconds: null, note: null, confidence: "high" },
              ],
            })
          }
          className="mt-3 text-primary text-caption hover:underline"
        >
          + 단계 추가
        </button>
      </section>

      {isEmpty && (
        <EmptyState
          className="mt-6"
          title="자동 추출 결과가 비어있어요"
          description="텍스트를 다시 정리해서 재료/단계를 직접 채워주세요. 이번에 저장하지 않고 처음으로 돌아가도 돼요."
        />
      )}

      <div className="mt-10 flex justify-end gap-3">
        <Button variant="secondary-pill" onClick={onCancel} disabled={saving}>
          처음으로
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "저장 중…" : "레시피 저장"}
        </Button>
      </div>
    </main>
  );
}
