"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary-pill" | "dark-utility" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** scale(0.95) press transform 적용. design-system §Buttons. */
  pressMicro?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/95 active:bg-primary rounded-pill px-[22px] py-[11px] text-body font-normal",
  "secondary-pill":
    "bg-transparent text-primary border border-primary rounded-pill px-[22px] py-[11px] text-body font-normal",
  "dark-utility":
    "bg-ink text-white rounded-sm px-[15px] py-[8px] text-caption",
  ghost:
    "bg-transparent text-primary hover:underline px-2 py-1 text-body",
  // v0.5 OOS UI (영구 삭제 2단계 다이얼로그) 대비 — 색상만 미리.
  danger:
    "bg-transparent text-danger border border-danger rounded-pill px-[22px] py-[11px] text-body font-normal",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className, pressMicro = true, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center transition-transform select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:transform-none",
        "min-h-[44px] min-w-[44px]",
        VARIANT_CLASS[variant],
        pressMicro && "active:scale-[0.97]",
        className,
      )}
      {...props}
    />
  );
});
