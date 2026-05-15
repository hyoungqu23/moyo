/**
 * Ingestion 흐름의 공용 타입.
 */

import type { RecipeSourceType } from "@/db/schema";

export type ConfidenceLevel = "low" | "med" | "high";

export interface ParsedIngredient {
  name: string;
  amount: string;
  unit?: string | null;
  optional?: boolean;
  /** 어떤 패턴으로 추출됐는지 — 클라이언트 ConfidenceField 시각화 입력. */
  confidence: ConfidenceLevel;
}

export interface ParsedStep {
  instruction: string;
  timerSeconds?: number | null;
  note?: string | null;
  confidence: ConfidenceLevel;
}

export interface ParseResult {
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  tips: string[];
  /** 전체 confidence — low/med/high 결정 가설 입력 (H5). */
  overallConfidence: ConfidenceLevel;
}

export interface RecipeDraft {
  /** 클라이언트가 검수 후 POST /api/recipes에 보낼 형태. */
  dishId: string;
  title: string;
  servings: string | null;
  description: string | null;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  sources: Array<{
    type: RecipeSourceType;
    url: string | null;
    rawContent: string | null;
    youtubeVideoId: string | null;
    title: string | null;
    channel: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
  }>;
  parseResult: ParseResult;
}
