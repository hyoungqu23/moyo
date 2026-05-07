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
        "rounded-lg border border-hairline bg-white p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
