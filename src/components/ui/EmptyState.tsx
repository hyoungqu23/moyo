import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface Props {
  title: string;
  description?: string;
  /** primary CTA — children으로 받음. */
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, cta, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className,
      )}
    >
      <h3 className="text-tagline text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-prosewide text-body text-ink-muted-80">
          {description}
        </p>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
