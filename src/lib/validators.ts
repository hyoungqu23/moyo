/**
 * 공용 zod 스키마.
 *
 * 모든 API Route 입력 검증의 단일 출처.
 * 클라이언트 react-hook-form resolver와 공유 가능.
 */

import { z } from "zod";

import {
  recipeCustomizationDiffTypeValues,
  recipeSourceTypeValues,
} from "@/db/schema";

// === 공용 ID ===
export const uuidSchema = z.string().uuid();

// === Dish ===
export const dishCreateSchema = z.object({
  name: z.string().trim().min(1, "메뉴 이름을 입력해주세요.").max(80),
});
export type DishCreateInput = z.infer<typeof dishCreateSchema>;

// === Recipe ===
export const recipeIngredientDraftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.string().trim().min(1).max(40),
  unit: z.string().trim().max(20).nullish(),
  optional: z.boolean().default(false),
});

export const recipeStepDraftSchema = z.object({
  instruction: z.string().trim().min(1).max(2000),
  timerSeconds: z.number().int().min(0).max(86400).nullish(), // ≥ 0, 24h 상한
  note: z.string().trim().max(1000).nullish(),
});

export const recipeSourceDraftSchema = z.object({
  type: z.enum(recipeSourceTypeValues),
  url: z.string().trim().url().max(2000).nullish(),
  rawContent: z.string().trim().max(50000).nullish(),
  youtubeVideoId: z.string().trim().max(40).nullish(),
  title: z.string().trim().max(200).nullish(),
  channel: z.string().trim().max(200).nullish(),
  thumbnailUrl: z.string().trim().url().max(2000).nullish(),
  publishedAt: z.coerce.date().nullish(),
});

/** POST /api/recipes — Draft 확정 저장. */
export const recipeCreateSchema = z.object({
  dishId: uuidSchema,
  title: z.string().trim().min(1).max(120),
  servings: z.string().trim().max(40).nullish(),
  description: z.string().trim().max(4000).nullish(),
  ingredients: z.array(recipeIngredientDraftSchema).default([]),
  steps: z.array(recipeStepDraftSchema).default([]),
  sources: z.array(recipeSourceDraftSchema).default([]),
});
export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;

export const recipePatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    servings: z.string().trim().max(40).nullish(),
    description: z.string().trim().max(4000).nullish(),
    archivedAt: z.coerce.date().nullish(), // 명시 null = 보관 해제
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });
export type RecipePatchInput = z.infer<typeof recipePatchSchema>;

// === RecipeIngredient ===
export const ingredientCreateSchema = recipeIngredientDraftSchema.extend({
  displayOrder: z.number().int().min(0).optional(),
});
export const ingredientPatchSchema = recipeIngredientDraftSchema
  .partial()
  .extend({
    displayOrder: z.number().int().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });

// === RecipeStep ===
export const stepCreateSchema = recipeStepDraftSchema.extend({
  displayOrder: z.number().int().min(0).optional(),
});
export const stepPatchSchema = recipeStepDraftSchema
  .partial()
  .extend({
    displayOrder: z.number().int().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });

// === RecipeSource ===
export const sourceCreateSchema = recipeSourceDraftSchema;
export const sourcePatchSchema = recipeSourceDraftSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });

// === RecipeCustomization (v0.5는 스키마만, UI/API 미사용 — 다음 사이클 대비) ===
export const customizationCreateSchema = z.object({
  baseIngredientId: uuidSchema.nullish(),
  baseStepId: uuidSchema.nullish(),
  diffType: z.enum(recipeCustomizationDiffTypeValues),
  diffPayload: z.record(z.string(), z.unknown()),
});

// === Attempt + AttemptStepNote ===
export const ratingSchema = z
  .number()
  .min(0)
  .max(5)
  .multipleOf(0.5, "평점은 0.5 단위로 입력해주세요.")
  .nullish();

export const attemptCreateSchema = z.object({
  rating: ratingSchema,
  changes: z.string().trim().max(2000).nullish(),
  improvementNote: z.string().trim().max(2000).nullish(),
  triedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다."),
  stepNotes: z
    .array(
      z.object({
        recipeStepId: uuidSchema.nullish(),
        note: z.string().trim().min(1).max(1000),
      }),
    )
    .default([]),
});
export type AttemptCreateInput = z.infer<typeof attemptCreateSchema>;

export const attemptPatchSchema = z
  .object({
    rating: ratingSchema,
    changes: z.string().trim().max(2000).nullish(),
    improvementNote: z.string().trim().max(2000).nullish(),
    triedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });

export const stepNoteCreateSchema = z.object({
  recipeStepId: uuidSchema.nullish(),
  note: z.string().trim().min(1).max(1000),
  // videoTimestamp는 v0.5 OOS — 입력 받지 않음 (L70).
});
export const stepNotePatchSchema = z
  .object({
    note: z.string().trim().min(1).max(1000).optional(),
    recipeStepId: uuidSchema.nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드가 없습니다.",
  });

// === Ingestion ===
const ingestPayloadYouTube = z.object({
  url: z.string().trim().url(),
});
const ingestPayloadText = z.object({
  url: z.string().trim().url().nullish(),
  text: z.string().trim().min(1).max(50000),
});

export const ingestSchema = z.discriminatedUnion("sourceType", [
  z.object({
    dishId: uuidSchema.optional(), // 없으면 신규 Dish 생성용 dishName 사용
    dishName: z.string().trim().min(1).max(80).optional(),
    sourceType: z.literal("youtube"),
    payload: ingestPayloadYouTube,
  }),
  z.object({
    dishId: uuidSchema.optional(),
    dishName: z.string().trim().min(1).max(80).optional(),
    sourceType: z.literal("text"),
    payload: ingestPayloadText,
  }),
]);
export type IngestInput = z.infer<typeof ingestSchema>;

// === 자동완성·검색 ===
export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(1).max(60),
});
export const recipeSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(60).optional(),
  dishId: uuidSchema.optional(),
});
