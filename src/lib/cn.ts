/**
 * className 결합 — clsx 단일 export.
 * Tailwind 클래스 충돌은 *순서로 해결* (twMerge 미사용 — 의존성 최소화, 토큰 명확하게 작성).
 */

import clsx from "clsx";

export const cn = clsx;
