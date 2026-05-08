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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-[15px] font-medium transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-pink-deep text-white shadow-sticker hover:bg-pink-ink",
        variant === "secondary-pill" &&
          "border border-pink-deep/40 bg-pink-soft text-pink-ink hover:bg-pink/60",
        variant === "danger" &&
          "border border-danger/40 bg-transparent text-danger hover:bg-danger/5",
        variant === "icon" &&
          "h-11 w-11 rounded-full border border-hairline bg-ivory-soft p-0 text-ink",
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
