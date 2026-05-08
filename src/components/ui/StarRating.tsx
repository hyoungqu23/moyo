"use client";

import { useState } from "react";
import { clsx } from "clsx";

const MAX = 5;

function Heart({
  state,
  hoverState,
  onLeftClick,
  onRightClick,
  onHoverLeft,
  onHoverRight,
  onHoverEnd,
}: {
  state: "full" | "half" | "empty";
  hoverState: "full" | "half" | null;
  onLeftClick: () => void;
  onRightClick: () => void;
  onHoverLeft: () => void;
  onHoverRight: () => void;
  onHoverEnd: () => void;
}) {
  // hover preview overrides committed state for visual feedback
  const showFull =
    hoverState === "full" || (!hoverState && state === "full");
  const showHalf =
    hoverState === "half" || (!hoverState && state === "half");

  return (
    <span
      aria-hidden
      className="relative inline-block h-9 w-9 select-none"
      onMouseLeave={onHoverEnd}
    >
      {/* base outline heart */}
      <span
        className={clsx(
          "pointer-events-none absolute inset-0 grid place-items-center text-[32px] leading-none transition",
          showFull ? "text-pink-deep" : "text-pink/40",
        )}
      >
        {showFull ? "♥" : "♡"}
      </span>

      {/* half-fill overlay */}
      {showHalf ? (
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ clipPath: "inset(0 50% 0 0)" }}
        >
          <span className="absolute inset-0 grid place-items-center text-[32px] leading-none text-pink-deep">
            ♥
          </span>
        </span>
      ) : null}

      {/* split click zones — left half = N - 0.5, right half = N */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-1/2 cursor-pointer rounded-l-full"
        onClick={onLeftClick}
        onMouseEnter={onHoverLeft}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-0 top-0 h-full w-1/2 cursor-pointer rounded-r-full"
        onClick={onRightClick}
        onMouseEnter={onHoverRight}
      />
    </span>
  );
}

export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const set = (next: number) => onChange(Math.max(0, Math.min(MAX, next)));
  const [hover, setHover] = useState<number | null>(null);

  const display = hover ?? value;

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="평점"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={value}
      aria-valuetext={`${value.toFixed(1)}점`}
      className="inline-flex select-none items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-soft"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          set(value + 0.5);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          set(value - 0.5);
        }
        if (event.key === "Home") {
          event.preventDefault();
          set(0);
        }
        if (event.key === "End") {
          event.preventDefault();
          set(MAX);
        }
      }}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX }, (_, i) => {
          const idx = i + 1; // 1..5
          const committedState =
            value >= idx
              ? "full"
              : value >= idx - 0.5
                ? "half"
                : "empty";
          const hoverState =
            hover == null
              ? null
              : hover >= idx
                ? "full"
                : hover >= idx - 0.5
                  ? "half"
                  : null;
          return (
            <Heart
              key={i}
              state={committedState}
              hoverState={hoverState}
              onLeftClick={() => set(idx - 0.5)}
              onRightClick={() => set(idx)}
              onHoverLeft={() => setHover(idx - 0.5)}
              onHoverRight={() => setHover(idx)}
              onHoverEnd={() => setHover(null)}
            />
          );
        })}
      </div>
      <span className="font-tnum text-[14px] text-pink-ink">
        <span className="font-medium">{display.toFixed(1)}</span>
        <span className="text-pink/60"> / {MAX}</span>
      </span>
    </div>
  );
}
