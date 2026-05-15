"use client";

import { useSyncExternalStore } from "react";

/**
 * useMediaQuery — SSR safe (서버에서는 항상 false).
 *
 * design-decision §반응형: ≤833px ↔ ≥834px 분기.
 * 예: const isDesktop = useMediaQuery("(min-width: 834px)");
 *
 * useSyncExternalStore 패턴 — useEffect + setState 회피.
 */

function subscribe(query: string) {
  return (callback: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };
}

function getSnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), getSnapshot(query), getServerSnapshot);
}

/** ≤833px / ≥834px 표준 분기. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 834px)");
}
