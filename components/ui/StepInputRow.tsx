"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function formatTimestamp(seconds: number | null) {
  if (seconds === null) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function parseTimestamp(value: string) {
  if (!value.trim()) return null;
  const [minutes, seconds = "0"] = value.split(":");
  const parsed = Number(minutes) * 60 + Number(seconds);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function StepInputRow({
  embedAvailable,
  getCurrentTime,
}: {
  embedAvailable: boolean;
  getCurrentTime?: () => number;
}) {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  return (
    <div
      role="listitem"
      className="grid gap-3 rounded-lg border border-hairline p-4"
    >
      <textarea
        aria-label="단계 메모"
        className="min-h-24 rounded-sm border border-black/10 p-3 text-[17px]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary-pill"
          aria-label="현재 재생 시간 기록"
          aria-disabled={!embedAvailable}
          disabled={!embedAvailable}
          onClick={() => setTimestamp(Math.floor(getCurrentTime?.() ?? 0))}
        >
          지금 시간 기록
        </Button>
        <input
          aria-label="수동 재생 시간"
          className="h-11 rounded-sm border border-black/10 px-3"
          value={formatTimestamp(timestamp)}
          onChange={(event) => setTimestamp(parseTimestamp(event.target.value))}
          placeholder="mm:ss"
        />
        <Button type="button" variant="icon" aria-label="이 단계 삭제">
          ×
        </Button>
      </div>
    </div>
  );
}
