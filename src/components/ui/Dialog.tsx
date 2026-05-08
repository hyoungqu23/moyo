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
      element.getAttribute("aria-disabled") !== "true",
  );
}

export function Dialog({
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
    const first = focusables(panelRef.current)[0];
    first?.focus();
  }, [open]);

  if (!open) return null;

  const close = () => {
    triggerRef?.current?.focus();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onMouseDown={close}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 transition duration-200"
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
        <h2 id={titleId} className="mb-5 text-[21px] font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
