/**
 * 규칙 기반 파싱 — Ingestion 1순위 (LLM은 fallback, v0.5 stub).
 *
 * 한국어 요리 텍스트 (YouTube description, 사용자 붙여넣기) 대상.
 * 보수적 패턴: 잘못 추출하느니 못 추출하는 게 낫다 (사용자가 후편집).
 */

import type { ParseResult, ParsedIngredient, ParsedStep } from "./types";

const KO_UNIT_TOKENS = [
  "g", "kg", "ml", "l", "L",
  "개", "알", "쪽", "장", "마리", "조각",
  "큰술", "작은술", "스푼", "스푼반",
  "컵", "공기", "스푼", "줌",
  "T", "t", "ts", "Ts", "tbsp", "tsp",
];

const KO_UNIT_PATTERN = KO_UNIT_TOKENS
  .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const QUANTITY_PATTERN = `(?:\\d+(?:[./]\\d+)?|약간|적당량|조금|소량)`;

// "{재료명} {수량}{단위?}" — 행 끝까지.
// "돼지고기 500g" / "고추장 1큰술" / "마늘 2쪽" / "소금 약간"
const INGREDIENT_LINE = new RegExp(
  `^\\s*(?:[-•·*▪︎▶◦]\\s*)?` + // optional bullet
    `(.{1,40}?)\\s+(${QUANTITY_PATTERN}\\s*(?:${KO_UNIT_PATTERN})?)\\s*$`,
  "u",
);

// "1. 재료를 손질한다." / "① 양념장 만들기" / "▶ 다진 마늘 ..."
// 명시 alternation (character class에서 일부 환경 부분 매칭 이슈 회피).
const STEP_LINE = new RegExp(
  `^\\s*(?:(\\d{1,2})[.)]|(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮|⑯|⑰|⑱|⑲|⑳)|▶|▷|◆)\\s*(.{2,})$`,
  "u",
);

// "재료" / "양념" / "주재료" 헤더 감지.
const INGREDIENT_HEADER = /(재료|양념|주재료|부재료|소스)/u;
const STEP_HEADER = /(만드는|조리|순서|step|cook)/iu;
const TIPS_HEADER = /(팁|tip|꿀팁|포인트)/iu;

export function parseRecipeText(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return {
      ingredients: [],
      steps: [],
      tips: [],
      overallConfidence: "low",
    };
  }

  // 줄 분리 (유튜브 description의 다중 줄바꿈 정리).
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // 섹션 모드 — header를 만나면 전환.
  type Section = "scan" | "ingredients" | "steps" | "tips";
  let section: Section = "scan";

  const ingredients: ParsedIngredient[] = [];
  const steps: ParsedStep[] = [];
  const tips: string[] = [];

  for (const line of lines) {
    // 단계 패턴: 섹션 무관 (번호 매김이 있으면 단계로 간주).
    // 헤더 감지보다 우선 — "② 고기를 양념에..." 같이 본문에 "양념"이 있어도
    // 헤더로 오인하지 않게.
    const stepMatch = line.match(STEP_LINE);
    if (stepMatch) {
      const instruction = (stepMatch[3] ?? "").trim();
      if (instruction.length >= 2) {
        steps.push({ instruction, confidence: "high" });
      }
      continue;
    }

    // 섹션 헤더 감지 (짧은 줄에서만, 그리고 단계 패턴이 아닌 줄에서).
    if (line.length <= 20) {
      if (INGREDIENT_HEADER.test(line)) {
        section = "ingredients";
        continue;
      }
      if (STEP_HEADER.test(line)) {
        section = "steps";
        continue;
      }
      if (TIPS_HEADER.test(line)) {
        section = "tips";
        continue;
      }
    }

    // 재료 패턴.
    const ingredientMatch = line.match(INGREDIENT_LINE);
    if (ingredientMatch && section !== "steps" && section !== "tips") {
      const name = (ingredientMatch[1] ?? "").trim();
      const amount = (ingredientMatch[2] ?? "").trim();
      if (name && amount) {
        ingredients.push({
          name,
          amount,
          confidence: section === "ingredients" ? "high" : "med",
        });
        continue;
      }
    }

    if (section === "tips" && line.length >= 2) {
      tips.push(line);
    }
  }

  // 전체 confidence (H5 평가 입력).
  // high: 재료 5+ AND 단계 3+
  // med: 부분 추출
  // low: 빈 추출
  let overallConfidence: ParseResult["overallConfidence"] = "low";
  if (ingredients.length >= 5 && steps.length >= 3) {
    overallConfidence = "high";
  } else if (ingredients.length > 0 || steps.length > 0) {
    overallConfidence = "med";
  }

  return { ingredients, steps, tips, overallConfidence };
}
