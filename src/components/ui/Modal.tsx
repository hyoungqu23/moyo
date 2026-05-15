"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { cn } from "@/lib/cn";

/**
 * Modal 베이스 — BottomSheet / Dialog 공통.
 *
 * tech-decision §13.2 a11y:
 *  - role="dialog" + aria-modal="true" + aria-labelledby
 *  - focus trap (Tab/Shift+Tab 순환)
 *  - ESC 닫기 + body scroll lock
 *  - 첫 진입 시 초점 진입 + 닫힐 때 트리거에 복귀
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** "bottom-sheet" — 모바일 ≤833px (full-width 하단), "dialog" — 데스크톱 ≥834px (중앙 카드). */
  variant: "bottom-sheet" | "dialog";
  children: ReactNode;
  /** 하단 고정 푸터 (예: CTA). */
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  variant,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  // 열림 직후 트리거 element를 캐시하고 첫 focusable로 진입.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const t = setTimeout(() => {
      const root = ref.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? root).focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // 닫힐 때 트리거로 포커스 복귀.
  useEffect(() => {
    if (open) return;
    const prev = triggerRef.current;
    if (prev && typeof prev.focus === "function") {
      prev.focus();
    }
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // focus trap
      const root = ref.current;
      if (!root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!open) return null;

  const isSheet = variant === "bottom-sheet";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        isSheet ? "items-end" : "items-center justify-center",
        "bg-black/40 backdrop-blur-[2px]",
        "animate-fade-up",
      )}
      onMouseDown={(e) => {
        // 오버레이 클릭으로 닫기.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "bg-canvas text-ink shadow-product outline-none focus:outline-none",
          isSheet
            ? "w-full rounded-t-lg max-h-[90dvh] flex flex-col"
            : "w-full max-w-[480px] rounded-lg max-h-[85vh] flex flex-col mx-4",
          className,
        )}
      >
        <header className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-divider-soft">
          <h2 id={titleId} className="text-tagline text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-ink-muted-48 hover:text-ink rounded-sm"
          >
            <span aria-hidden className="text-[20px] leading-none">
              ×
            </span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="px-5 py-4 border-t border-divider-soft bg-canvas-parchment/40">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
