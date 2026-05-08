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
        "rounded-md border border-hairline bg-paper-2 p-5 transition",
        "hover:border-hairline-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
