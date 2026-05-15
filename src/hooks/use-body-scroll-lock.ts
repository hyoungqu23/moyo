import { useEffect } from "react";

/**
 * Modal 열림 동안 body scroll 잠금.
 *
 * - 단순 overflow: hidden + paddingRight scrollbar 보정.
 * - 닫힐 때 원복.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.paddingRight = original.paddingRight;
    };
  }, [active]);
}
