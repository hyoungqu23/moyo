import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary-pill" | "danger" | "icon" | "ghost";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    children: ReactNode;
  }
>(function Button({ variant = "primary", className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-[16px] transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-ink text-paper-2 shadow-ink hover:bg-ink-soft",
        variant === "secondary-pill" &&
          "border border-ink/30 bg-transparent text-ink hover:bg-ink/5",
        variant === "danger" &&
          "border border-danger/30 bg-transparent text-danger hover:bg-danger/5",
        variant === "icon" &&
          "h-11 w-11 rounded-full border border-hairline bg-paper-2 p-0 text-ink",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-ink-muted hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
