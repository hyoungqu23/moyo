"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { StepRow } from "@/components/recipes/StepRow";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { useToast } from "@/components/ui/Toast";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ApiError, apiJson } from "@/lib/api";

interface StepLite {
  id: string;
  instruction: string;
  timerSeconds: number | null;
  note: string | null;
  displayOrder: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  steps: StepLite[];
  onSaved: () => void;
}

interface PreviousStepNoteMap {
  [recipeStepId: string]: string;
}

interface AttemptCreateResponse {
  attempt: { id: string };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Wrapper — open=false이면 inner를 마운트하지 않음.
 * inner 컴포넌트는 마운트마다 자연 reset (useEffect + setState 패턴 회피).
 */
export function AttemptSheet(props: Props) {
  if (!props.open) return null;
  return <AttemptSheetInner {...props} />;
}

function AttemptSheetInner({ open, onClose, recipeId, steps, onSaved }: Props) {
  const isDesktop = useIsDesktop();
  const toast = useToast();

  const [rating, setRating] = useState<number | null>(null);
  const [changes, setChanges] = useState("");
  const [improvementNote, setImprovementNote] = useState("");
  const [triedAt, setTriedAt] = useState(() => todayIso());
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [previousStepNotes, setPreviousStepNotes] = useState<PreviousStepNoteMap>({});

  // 마운트 1회: 이전 Attempt의 stepNotes 미리보기 fetch (P1 시나리오).
  useEffect(() => {
    let cancelled = false;
    apiJson
      .get<{
        recipe: unknown;
        attempts: Array<{ id: string }>;
      }>(`/api/recipes/${recipeId}`)
      .then(async (resp) => {
        const latest = resp.attempts?.[0];
        if (!latest) return;
        const att = await apiJson.get<{
          stepNotes: Array<{ recipeStepId: string | null; note: string }>;
        }>(`/api/attempts/${latest.id}`);
        if (cancelled) return;
        const map: PreviousStepNoteMap = {};
        for (const sn of att.stepNotes) {
          if (sn.recipeStepId) map[sn.recipeStepId] = sn.note;
        }
        setPreviousStepNotes(map);
      })
      .catch(() => {
        // silent
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const mutation = useMutation<AttemptCreateResponse, ApiError>({
    mutationFn: () =>
      apiJson.post<AttemptCreateResponse>(`/api/recipes/${recipeId}/attempts`, {
        rating,
        changes: changes.trim() || null,
        improvementNote: improvementNote.trim() || null,
        triedAt,
        stepNotes: Object.entries(stepNotes)
          .filter(([, note]) => note.trim().length > 0)
          .map(([recipeStepId, note]) => ({ recipeStepId, note: note.trim() })),
      }),
    onSuccess: () => onSaved(),
    onError: (e) => toast.show(e.message, "error"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="시도 기록"
      variant={isDesktop ? "dialog" : "bottom-sheet"}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary-pill" onClick={onClose} disabled={mutation.isPending}>
            취소
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "저장 중…" : "저장"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-caption text-ink-muted-80">평점</label>
          <div className="mt-2">
            <StarRating value={rating} onChange={setRating} />
          </div>
        </div>
        <label className="block">
          <span className="text-caption text-ink-muted-80">변경 사항 (자유 텍스트)</span>
          <textarea
            value={changes}
            onChange={(e) => setChanges(e.target.value)}
            rows={2}
            placeholder="예: 고추장 1큰술 → 0.5큰술"
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas resize-y"
          />
        </label>
        <label className="block">
          <span className="text-caption text-ink-muted-80">다음에 시도할 때 메모</span>
          <textarea
            value={improvementNote}
            onChange={(e) => setImprovementNote(e.target.value)}
            rows={2}
            placeholder="예: 양파를 더 오래 볶는다"
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas resize-y"
          />
        </label>
        <label className="block">
          <span className="text-caption text-ink-muted-80">시도한 날짜</span>
          <input
            type="date"
            value={triedAt}
            onChange={(e) => setTriedAt(e.target.value)}
            className="mt-1 w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
          />
        </label>

        {steps.length > 0 && (
          <div>
            <h3 className="text-body-strong text-ink">단계별 메모 (선택)</h3>
            <p className="text-caption text-ink-muted-48 mt-1">
              지난 시도에서 적었던 메모가 있다면 함께 보여드려요.
            </p>
            <div className="mt-2 divide-y divide-divider-soft">
              {steps.map((step, idx) => (
                <StepRow
                  key={step.id}
                  index={idx}
                  value={{
                    instruction: step.instruction,
                    timerSeconds: step.timerSeconds,
                    note: step.note,
                  }}
                  onChange={() => {
                    // Attempt Sheet에서는 Recipe 단계 자체는 *읽기*. 편집은 Recipe 상세에서.
                  }}
                  disabled
                  previousStepNote={previousStepNotes[step.id] ?? null}
                  attemptNote={stepNotes[step.id] ?? ""}
                  onAttemptNoteChange={(next) =>
                    setStepNotes((prev) => ({ ...prev, [step.id]: next }))
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
