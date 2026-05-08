import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-md border border-hairline bg-ivory-soft p-5 shadow-soft transition",
        "hover:-translate-y-px hover:shadow-sticker",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
