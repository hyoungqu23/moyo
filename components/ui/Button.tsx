import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary-pill" | "danger" | "icon";

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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-[17px] transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:opacity-80",
        variant === "secondary-pill" &&
          "border border-primary bg-transparent text-primary hover:bg-primary/10",
        variant === "danger" && "bg-transparent text-danger hover:bg-red-50",
        variant === "icon" &&
          "h-11 w-11 bg-[rgba(210,210,215,0.64)] p-0 text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
