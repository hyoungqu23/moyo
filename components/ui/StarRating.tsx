"use client";

export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const set = (next: number) => onChange(Math.max(0, Math.min(5, next)));
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="평점"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      className="min-h-11 rounded-full border border-hairline px-4 py-2 text-[17px]"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          set(value + 0.5);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          set(value - 0.5);
        }
      }}
    >
      {"★".repeat(Math.floor(value))}
      {value % 1 ? "½" : ""}
      <span className="ml-2 text-ink-muted">{value.toFixed(1)}</span>
    </div>
  );
}
