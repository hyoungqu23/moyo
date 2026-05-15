import { cn } from "@/lib/cn";

type SourceType = "youtube" | "blog" | "text" | "manual";

const LABEL: Record<SourceType, string> = {
  youtube: "YouTube",
  blog: "Blog",
  text: "Text",
  manual: "Manual",
};

interface Props {
  type: SourceType;
  className?: string;
}

export function SourceBadge({ type, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill bg-canvas/85 backdrop-blur px-2 py-[2px] text-caption text-ink-muted-80",
        className,
      )}
      aria-label={`출처 유형: ${LABEL[type]}`}
    >
      {LABEL[type]}
    </span>
  );
}
