/**
 * LLM fallback stub — v0.5 OOS (L51 / L70).
 *
 * confidence == 'low' 시 호출 의도였으나 실호출은 다음 사이클.
 * stub은 throw하고 호출자(Route Handler)가 catch → 사용자에게
 * "텍스트를 직접 정리해주세요" 폴백 안내를 보낸다.
 *
 * 인터페이스는 다음 사이클 Gemini 어댑터 구현 시 시그니처 유지.
 */

import "server-only";

import type { RecipeDraft } from "./types";

export interface LLMIngestionAdapter {
  generateDraft(rawContent: string): Promise<RecipeDraft>;
}

/**
 * v0.5: 항상 throw. 호출 코드는 try/catch로 폴백 흐름을 라우팅.
 */
export async function callLLMForIngestion(_rawContent: string): Promise<RecipeDraft> {
  throw new Error("LLM not implemented (next cycle — OOS-4)");
}
