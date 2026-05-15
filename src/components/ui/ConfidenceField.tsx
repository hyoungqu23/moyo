"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type ConfidenceLevel = "low" | "med" | "high";

interface Props {
  level: ConfidenceLevel;
  /** 입력 필드 또는 표시 노드. */
  children: ReactNode;
  /** 라벨 — 입력의 의미를 명시 (예: "재료 이름"). */
  label?: string;
  className?: string;
}

const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  low: "확신 낮음 — 확인 필요",
  med: "부분 추출 — 확인 권장",
  high: "정확히 추출됨",
};

/**
 * Ingestion Draft 검수 화면용 신뢰도 마커.
 *
 * 색상 단독 정보 전달 금지 — ⚠ 아이콘 + aria-describedby 텍스트로 보강.
 * design-decision §ConfidenceField.
 */
export function ConfidenceField({ level, children, label, className }: Props) {
  const descId = useId();
  const showWarning = level !== "high";
  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "flex items-stretch gap-2 rounded-sm",
          level === "low" && "ring-1 ring-inset ring-[#f59e0b]/50",
          level === "med" && "ring-1 ring-inset ring-hairline",
          level === "high" && "ring-1 ring-inset ring-transparent",
        )}
        aria-describedby={descId}
      >
        {showWarning && (
          <span
            aria-hidden
            className={cn(
              "shrink-0 w-6 flex items-center justify-center",
              level === "low" ? "text-[#b45309]" : "text-ink-muted-80",
            )}
            title={LEVEL_LABEL[level]}
          >
            ⚠
          </span>
        )}
        <div className="flex-1">{children}</div>
      </div>
      <p id={descId} className="text-caption text-ink-muted-48 sr-only">
        {label ? `${label}: ` : ""}
        {LEVEL_LABEL[level]}
      </p>
    </div>
  );
}
