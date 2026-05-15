"use client";

import { cn } from "@/lib/cn";

import { ConfidenceField } from "@/components/ui/ConfidenceField";

export interface IngredientRowValue {
  name: string;
  amount: string;
  optional?: boolean;
  /** Ingestion 검수 단계에서 ConfidenceField 결정 입력. 일반 편집은 undefined. */
  confidence?: "low" | "med" | "high";
}

interface Props {
  value: IngredientRowValue;
  onChange: (next: IngredientRowValue) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function IngredientRow({ value, onChange, onRemove, disabled, className }: Props) {
  const row = (
    <div className={cn("flex flex-wrap items-center gap-2 py-1", className)}>
      <input
        type="text"
        aria-label="재료 이름"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        disabled={disabled}
        placeholder="재료"
        className="flex-1 min-w-[40%] rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
      />
      <input
        type="text"
        aria-label="수량"
        value={value.amount}
        onChange={(e) => onChange({ ...value, amount: e.target.value })}
        disabled={disabled}
        placeholder="수량"
        className="w-[30%] min-w-[100px] rounded-sm border border-hairline px-3 py-2 text-body text-ink bg-canvas"
      />
      <label className="flex items-center gap-1 text-caption text-ink-muted-80 select-none">
        <input
          type="checkbox"
          checked={value.optional ?? false}
          onChange={(e) => onChange({ ...value, optional: e.target.checked })}
          disabled={disabled}
        />
        선택
      </label>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="재료 삭제"
          disabled={disabled}
          className="text-ink-muted-48 hover:text-ink min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm"
        >
          <span aria-hidden>−</span>
        </button>
      )}
    </div>
  );

  if (value.confidence && value.confidence !== "high") {
    return (
      <ConfidenceField level={value.confidence} label="재료">
        {row}
      </ConfidenceField>
    );
  }
  return row;
}
