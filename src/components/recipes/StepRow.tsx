"use client";

import { useState } from "react";

import { ConfidenceField } from "@/components/ui/ConfidenceField";
import { cn } from "@/lib/cn";

export interface StepRowValue {
  instruction: string;
  timerSeconds?: number | null;
  note?: string | null;
  confidence?: "low" | "med" | "high";
}

interface Props {
  index: number;
  value: StepRowValue;
  onChange: (next: StepRowValue) => void;
  onRemove?: () => void;
  /** Attempt 기록 모드에서 단계별 메모 미리보기 표시. */
  previousStepNote?: string | null;
  /** Attempt 기록 모드에서 사용 — 이 단계에 메모 추가/수정. */
  attemptNote?: string | null;
  onAttemptNoteChange?: (next: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StepRow({
  index,
  value,
  onChange,
  onRemove,
  previousStepNote,
  attemptNote,
  onAttemptNoteChange,
  disabled,
  className,
}: Props) {
  const [showNoteEditor, setShowNoteEditor] = useState(
    typeof attemptNote === "string" && attemptNote.length > 0,
  );

  const row = (
    <div className={cn("space-y-2 py-2", className)}>
      <div className="flex items-start gap-2">
        <span className="shrink-0 w-7 h-7 mt-2 inline-flex items-center justify-center rounded-pill bg-canvas-parchment text-caption text-ink-muted-80">
          {index + 1}
        </span>
        <textarea
          aria-label={`단계 ${index + 1} 조리 지시`}
          rows={2}
          value={value.instruction}
          onChange={(e) => onChange({ ...value, instruction: e.target.value })}
          disabled={disabled}
          placeholder="조리 단계 설명"
          className="flex-1 rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas resize-y min-h-[64px]"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="단계 삭제"
            disabled={disabled}
            className="text-ink-muted-48 hover:text-ink min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm"
          >
            <span aria-hidden>−</span>
          </button>
        )}
      </div>
      {/* Attempt 기록 모드: 단계별 메모 + 이전 시도 미리보기 (L70 P1 시나리오). */}
      {onAttemptNoteChange && (
        <div className="pl-9 space-y-1">
          {previousStepNote && (
            <p className="text-caption text-ink-muted-80 bg-canvas-parchment rounded-sm px-2 py-1">
              <span className="text-ink-muted-48">지난 시도 메모: </span>
              {previousStepNote}
            </p>
          )}
          {showNoteEditor ? (
            <textarea
              aria-label={`단계 ${index + 1} 메모`}
              rows={2}
              value={attemptNote ?? ""}
              onChange={(e) => onAttemptNoteChange(e.target.value)}
              disabled={disabled}
              placeholder="이 단계에서 메모 (예: 불 세기 강하게)"
              className="w-full rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas resize-y min-h-[56px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNoteEditor(true)}
              disabled={disabled}
              className="text-caption text-primary hover:underline rounded-pill border border-divider-soft px-3 py-1"
            >
              + 메모 추가
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (value.confidence && value.confidence !== "high") {
    return (
      <ConfidenceField level={value.confidence} label={`단계 ${index + 1}`}>
        {row}
      </ConfidenceField>
    );
  }
  return row;
}
