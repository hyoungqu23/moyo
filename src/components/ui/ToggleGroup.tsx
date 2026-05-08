"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import type { ThumbState } from "@/lib/sort-videos";

export function ToggleGroup({
  value,
  onChange,
  disabled = false,
}: {
  value: ThumbState;
  onChange: (value: ThumbState) => void;
  disabled?: boolean;
}) {
  const toggle = (next: Exclude<ThumbState, null>) =>
    onChange(value === next ? null : next);

  // bounce-pop one-shot when value flips into the matching state
  const [popUp, setPopUp] = useState(false);
  const [popDown, setPopDown] = useState(false);
  useEffect(() => {
    if (value === "up") {
      setPopUp(true);
      const t = setTimeout(() => setPopUp(false), 360);
      return () => clearTimeout(t);
    }
  }, [value]);
  useEffect(() => {
    if (value === "down") {
      setPopDown(true);
      const t = setTimeout(() => setPopDown(false), 360);
      return () => clearTimeout(t);
    }
  }, [value]);

  const upActive = value === "up";
  const downActive = value === "down";

  return (
    <div
      role="group"
      aria-label="영상 평가"
      className="flex w-full items-stretch gap-2"
    >
      <button
        type="button"
        aria-label="좋아요"
        aria-pressed={upActive}
        disabled={disabled}
        onClick={() => toggle("up")}
        className={clsx(
          "group flex flex-1 items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-[14px] font-medium transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
          upActive
            ? "-rotate-[1.2deg] border-pink-deep bg-pink-deep text-white shadow-sticker hover:bg-pink-ink"
            : "border-pink-deep/30 bg-pink-soft/50 text-pink-ink hover:-translate-y-px hover:border-pink-deep/60 hover:bg-pink-soft hover:shadow-soft",
        )}
      >
        <span
          aria-hidden
          className={clsx(
            "inline-block text-[18px] leading-none transition",
            popUp && "animate-bounce-pop",
            upActive ? "text-white" : "text-pink-deep",
          )}
        >
          {upActive ? "♥" : "♡"}
        </span>
        <span>좋아요</span>
      </button>

      <button
        type="button"
        aria-label="싫어요"
        aria-pressed={downActive}
        disabled={disabled}
        onClick={() => toggle("down")}
        className={clsx(
          "group flex flex-1 items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-[14px] font-medium transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
          downActive
            ? "rotate-[1.2deg] border-lavender-deep bg-lavender-deep text-white shadow-sticker hover:bg-lavender-ink"
            : "border-lavender-deep/30 bg-lavender-soft/50 text-lavender-ink hover:-translate-y-px hover:border-lavender-deep/60 hover:bg-lavender-soft hover:shadow-soft",
        )}
      >
        <span
          aria-hidden
          className={clsx(
            "relative inline-block h-[18px] w-[18px] text-[18px] leading-none transition",
            popDown && "animate-bounce-pop",
          )}
        >
          {/* outline heart with diagonal slash — softer than a bare ✕,
              keeps the heart vocabulary across both buttons */}
          <span
            className={clsx(
              "absolute inset-0 grid place-items-center",
              downActive ? "text-white" : "text-lavender-deep",
            )}
          >
            ♡
          </span>
          <span
            aria-hidden
            className={clsx(
              "pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[18px] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] rounded-full",
              downActive ? "bg-white" : "bg-lavender-deep",
            )}
          />
        </span>
        <span>별로예요</span>
      </button>
    </div>
  );
}
