import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-hairline-strong bg-paper-2/40 px-6 py-14 text-center">
      <p className="flex items-center gap-2 text-[14px] text-ink-faint">
        <span className="h-px w-8 bg-ink-faint/60" />
        <span>비어 있는 페이지</span>
        <span className="h-px w-8 bg-ink-faint/60" />
      </p>
      <h2 className="font-display text-[28px] font-bold leading-tight text-ink">
        {title}
      </h2>
      {description ? (
        <p className="max-w-[260px] text-[13px] leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <Link href={action.href} className="mt-2">
          <Button>{action.label}</Button>
        </Link>
      ) : null}
    </div>
  );
}
