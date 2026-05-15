"use client";

import { useId, type KeyboardEvent } from "react";

import { cn } from "@/lib/cn";

interface Props {
  value: number | null; // 0~5, 0.5 단위
  onChange: (next: number | null) => void;
  size?: number; // px
  disabled?: boolean;
  className?: string;
  /** "평점" 등 sr label. */
  label?: string;
}

const MAX = 5;
const STEP = 0.5;

/**
 * StarRating — role="slider" + aria-valuenow/min/max + ArrowLeft/Right.
 * 클릭 또는 키보드로 0~5 (0.5 단위).
 */
export function StarRating({
  value,
  onChange,
  size = 28,
  disabled,
  className,
  label = "평점",
}: Props) {
  const labelId = useId();
  const current = value ?? 0;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(MAX, current + STEP));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, current - STEP));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(MAX);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={current}
        aria-valuetext={`${current.toFixed(1)} 점`}
        aria-disabled={disabled}
        onKeyDown={onKey}
        className={cn(
          "inline-flex items-center gap-1 outline-none",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {Array.from({ length: MAX }).map((_, i) => {
          const filled = current >= i + 1;
          const half = !filled && current >= i + 0.5;
          return (
            <span
              key={i}
              role="presentation"
              onClick={(e) => {
                if (disabled) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const isLeft = e.clientX - rect.left < rect.width / 2;
                onChange(i + (isLeft ? 0.5 : 1));
              }}
              style={{ width: size, height: size }}
              className={cn(
                "relative inline-flex items-center justify-center cursor-pointer text-ink-muted-48",
                disabled && "cursor-not-allowed",
              )}
            >
              <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                {/* Outline star */}
                <svg viewBox="0 0 20 20" width={size} height={size} className="text-hairline">
                  <polygon
                    points="10,1 12.6,7.3 19.5,7.8 14.2,12.2 16,19 10,15.4 4,19 5.8,12.2 0.5,7.8 7.4,7.3"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span
                aria-hidden
                className="absolute inset-0 overflow-hidden flex items-center justify-start"
                style={{ width: filled ? "100%" : half ? "50%" : "0%" }}
              >
                <svg viewBox="0 0 20 20" width={size} height={size} className="text-primary">
                  <polygon
                    points="10,1 12.6,7.3 19.5,7.8 14.2,12.2 16,19 10,15.4 4,19 5.8,12.2 0.5,7.8 7.4,7.3"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </span>
          );
        })}
      </div>
      <span aria-hidden className="text-caption tabular-nums text-ink-muted-80 min-w-[2.5em]">
        {current.toFixed(1)}
      </span>
    </div>
  );
}
