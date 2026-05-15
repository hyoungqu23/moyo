import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-sm bg-canvas-parchment animate-pulse",
        className,
      )}
    />
  );
}
