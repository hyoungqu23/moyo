"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

function focusables(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])",
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-disabled") !== "true" &&
      !element.hasAttribute("data-autofocus-skip"),
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  triggerRef?: React.RefObject<HTMLElement>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    focusables(panelRef.current)[0]?.focus();
  }, [open]);

  if (!open) return null;

  const close = () => {
    triggerRef?.current?.focus();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/25 backdrop-blur-[1px]"
      onMouseDown={close}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[68vh] max-h-[68vh] w-full flex-col rounded-t-lg border-t border-hairline bg-ivory-soft shadow-sticker"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
          if (event.key === "Tab" && panelRef.current) {
            const list = focusables(panelRef.current);
            const first = list[0];
            const last = list[list.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        {/* Drag handle — visual cue */}
        <div className="flex justify-center pt-2.5 pb-1.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-hairline-strong" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 pb-3">
          <h2
            id={titleId}
            className="font-display text-[18px] font-medium leading-none text-ink"
          >
            <span aria-hidden className="mr-1.5 text-pink-deep">
              ✎
            </span>
            {title}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            data-autofocus-skip
            onClick={close}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-pink-soft hover:text-ink active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Content fills remaining space — children manage their own scroll */}
        <div className="flex min-h-0 flex-1 flex-col px-5 pt-4 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
