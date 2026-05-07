"use client";

import { Button } from "@/components/ui/Button";
import type { ThumbState } from "@/lib/sort-videos";

export function ToggleGroup({
  value,
  onChange,
}: {
  value: ThumbState;
  onChange: (value: ThumbState) => void;
}) {
  const toggle = (next: Exclude<ThumbState, null>) =>
    onChange(value === next ? null : next);
  return (
    <div role="group" aria-label="영상 평가" className="flex gap-2">
      <Button
        variant="icon"
        aria-label="좋아요"
        aria-pressed={value === "up"}
        className={value === "up" ? "text-primary" : "text-body-muted"}
        onClick={() => toggle("up")}
      >
        <span aria-hidden="true">▲</span>
      </Button>
      <Button
        variant="icon"
        aria-label="싫어요"
        aria-pressed={value === "down"}
        className={value === "down" ? "text-primary" : "text-body-muted"}
        onClick={() => toggle("down")}
      >
        <span aria-hidden="true">▼</span>
      </Button>
    </div>
  );
}
