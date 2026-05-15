import { describe, expect, it } from "vitest";

import { parseRecipeText } from "./parse-rules";

describe("parseRecipeText", () => {
  it("빈 입력 → confidence low + 빈 결과", () => {
    const r = parseRecipeText("");
    expect(r.overallConfidence).toBe("low");
    expect(r.ingredients).toHaveLength(0);
    expect(r.steps).toHaveLength(0);
  });

  it("재료 섹션 + 번호 단계 → high confidence", () => {
    const text = `재료
돼지고기 500g
양파 1개
대파 1대
고추장 2큰술
간장 1큰술
고추가루 1큰술
설탕 1작은술

만드는 방법
1. 돼지고기를 한 입 크기로 자른다.
2. 양념장을 만들어 고기에 버무린다.
3. 팬에 기름을 두르고 양파를 볶는다.
4. 양념한 고기를 넣고 익을 때까지 볶는다.`;
    const r = parseRecipeText(text);
    expect(r.ingredients.length).toBeGreaterThanOrEqual(5);
    expect(r.steps.length).toBeGreaterThanOrEqual(3);
    expect(r.overallConfidence).toBe("high");
  });

  it("부분 매칭 → med", () => {
    const text = `돼지고기 500g
양파 1개
고추장 2큰술`;
    const r = parseRecipeText(text);
    expect(r.ingredients.length).toBe(3);
    expect(r.steps.length).toBe(0);
    expect(r.overallConfidence).toBe("med");
  });

  it("①②③ 번호 매김 단계 인식", () => {
    const text = `① 양념장을 만든다
② 고기를 양념에 재운다
③ 팬에 볶는다`;
    const r = parseRecipeText(text);
    expect(r.steps.length).toBe(3);
    expect(r.steps[0].instruction).toContain("양념장");
  });

  it("'약간'/'적당량' 같은 비수치 단위 허용", () => {
    const text = `재료
소금 약간
후추 조금
참기름 적당량`;
    const r = parseRecipeText(text);
    expect(r.ingredients.length).toBeGreaterThanOrEqual(2);
  });

  it("팁 섹션 → tips 배열", () => {
    const text = `재료
돼지고기 500g

팁
고기는 미리 양념에 재워두면 더 맛있어요.
센 불에서 빠르게 볶는 게 포인트.`;
    const r = parseRecipeText(text);
    expect(r.tips.length).toBeGreaterThan(0);
  });
});
