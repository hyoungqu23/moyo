import { describe, expect, it } from "vitest";
import { attemptInputSchema, stepInputSchema } from "@/lib/validators";

describe("validators TC-05, TC-06, TC-21, TC-22", () => {
  it("TC-05 accepts a normal attempt payload with steps", () => {
    const result = attemptInputSchema.parse({
      videoId: "00000000-0000-0000-0000-000000000002",
      rating: 4.5,
      triedAt: "2026-05-08",
      changes: "간장 절반",
      improvementNote: "다음엔 덜 볶기",
      steps: [{ note: "양념", videoTimestamp: 83 }],
    });
    expect(result.steps?.[0]?.videoTimestamp).toBe(83);
  });

  it("TC-06 accepts rating 0.0 and today's tried_at", () => {
    expect(() =>
      attemptInputSchema.parse({
        videoId: "00000000-0000-0000-0000-000000000002",
        rating: 0,
        triedAt: "2026-05-08",
      }),
    ).not.toThrow();
  });

  it("TC-21 accepts non-negative integer timestamp", () => {
    expect(
      stepInputSchema.parse({ note: "불 조절", videoTimestamp: 0 })
        .videoTimestamp,
    ).toBe(0);
  });

  it("TC-22 rejects negative timestamps and allows null", () => {
    expect(() =>
      stepInputSchema.parse({ note: "bad", videoTimestamp: -1 }),
    ).toThrow();
    expect(
      stepInputSchema.parse({ note: "manual", videoTimestamp: null })
        .videoTimestamp,
    ).toBeNull();
  });
});
