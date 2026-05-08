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
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-mint-soft/70 px-6 py-14 text-center">
      <p className="flex items-center gap-2 text-[12px] text-mint-deep">
        <span aria-hidden>✿</span>
        <span>비어 있는 페이지</span>
        <span aria-hidden>✿</span>
      </p>
      <h2 className="font-display text-[24px] leading-tight text-ink">
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
