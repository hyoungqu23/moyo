"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type ToastVariant = "info" | "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const baseId = useId();
  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((prev) => [...prev, { id, message, variant }]);
      // 3.5초 후 자동 제거.
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [baseId],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="알림"
        className="fixed bottom-4 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-md px-4 py-3 text-body shadow-product max-w-[480px] w-full",
              t.variant === "success" && "bg-ink text-white",
              t.variant === "error" && "bg-danger text-white",
              t.variant === "info" && "bg-canvas border border-hairline text-ink",
              "animate-fade-up",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
