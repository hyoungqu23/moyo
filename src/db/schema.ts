/**
 * Drizzle Schema — v0.5 PIVOT
 *
 * 기반: tech-decision.md v3.0.2 §3.2 + Decision Log L49~L70.
 * 9테이블 + 보조 2테이블 (ingestion_cache / usage_counters).
 *
 * 주의:
 *  - `recipe_sources` PARTIAL UNIQUE (recipe_id, url) WHERE url IS NOT NULL은
 *    Drizzle에서 자동 생성 불가 → migration 파일에 raw SQL로 추가 필요 (F4-3).
 *    아래 주석으로 위치 명시. CREATE UNIQUE INDEX recipe_sources_url_unique
 *      ON recipe_sources (recipe_id, url) WHERE url IS NOT NULL;
 *
 *  - `attempts.recipe_id` FK: ON DELETE CASCADE (L65 — Recipe archived 영구 삭제 시
 *    attempts·attempt_step_notes·recipe_* 함께 정리).
 *
 *  - `attempt_step_notes.video_timestamp`: 컬럼 존재. v0.5 UI는 항상 null 저장 (L70).
 *    자동 캡처 로직(YouTube IFrame getCurrentTime)은 다음 사이클.
 *
 *  - `recipe_customizations`: 스키마만 존재. v0.5 UI는 row 생성 안 함 (L70).
 *    Attempt.changes 자유 텍스트로 1차 대응.
 *
 *  - Supabase `auth.users`는 우리 스키마 바깥. user_id는 uuid로만 저장 (FK 명시 X).
 *    보안 경계는 Drizzle WHERE user_id (RLS는 server-side direct connection 무관, L27).
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────
// dishes (카테고리·검색 진입점)
// ─────────────────────────────────────────
export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("dishes_user_id_idx").on(t.userId),
  }),
);

// ─────────────────────────────────────────
// recipes — v0.5 1급 엔티티
// 삭제 정책 (L65 / tech §10):
//   - Attempt 0건 → hard delete 가능 (모든 하위 CASCADE)
//   - Attempt ≥ 1건 → 422 + archived_at 전환 권고
//   - archived_at != null Recipe는 검색·홈 비노출
//   - archived 30일 grace period 후 Cron 자동 hard delete (v0.5 OOS 코드 작성 불필요,
//     archived UI도 v0.5 OOS-5d)
// ─────────────────────────────────────────
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    servings: text("servings"), // 자유 표기: "2인분", "1~2인분" 등
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }), // null = 활성 (옵션 B, §3.4)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dishUserIdx: index("recipes_dish_user_idx").on(t.dishId, t.userId),
    userArchivedIdx: index("recipes_user_archived_idx").on(t.userId, t.archivedAt), // 홈 쿼리용
  }),
);

// ─────────────────────────────────────────
// recipe_ingredients (재료)
// 삭제 정책: Recipe hard delete 시 CASCADE.
// ─────────────────────────────────────────
export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: text("amount").notNull(), // 자유 표기 "500g", "1큰술", "적당량"
    unit: text("unit"),
    optional: boolean("optional").notNull().default(false),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeOrderIdx: index("recipe_ingredients_recipe_order_idx").on(t.recipeId, t.displayOrder),
  }),
);

// ─────────────────────────────────────────
// recipe_steps (조리 단계)
// 삭제 정책: Recipe hard delete 시 CASCADE.
// ─────────────────────────────────────────
export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull(),
    instruction: text("instruction").notNull(),
    timerSeconds: integer("timer_seconds"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeOrderIdx: index("recipe_steps_recipe_order_idx").on(t.recipeId, t.displayOrder),
    timerSecondsCheck: check(
      "recipe_steps_timer_seconds_check",
      sql`${t.timerSeconds} IS NULL OR ${t.timerSeconds} >= 0`,
    ),
  }),
);

// ─────────────────────────────────────────
// recipe_sources (출처) — 기존 v0.4 videos 흡수
// PARTIAL UNIQUE (recipe_id, url) WHERE url IS NOT NULL
//   → Drizzle 미지원, raw SQL migration 별도 (F4-3, L67).
// 삭제 정책:
//   - Recipe hard delete 시 CASCADE
//   - Source 단독 soft delete 가능 (deleted_at) — Recipe·Attempt 보존
// ─────────────────────────────────────────
export const recipeSourceTypeValues = ["youtube", "blog", "text", "manual"] as const;
export type RecipeSourceType = (typeof recipeSourceTypeValues)[number];

export const recipeSources = pgTable(
  "recipe_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    url: text("url"),
    rawContent: text("raw_content"),
    youtubeVideoId: text("youtube_video_id"),
    title: text("title"),
    channel: text("channel"),
    thumbnailUrl: text("thumbnail_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isUnavailableOnSource: boolean("is_unavailable_on_source").notNull().default(false),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    recipeIdx: index("recipe_sources_recipe_idx").on(t.recipeId),
    // UNIQUE INDEX recipe_sources_url_unique (recipe_id, url) WHERE url IS NOT NULL
    //   → raw SQL migration 0001_partial_unique_recipe_source_url.sql
    typeCheck: check(
      "recipe_sources_type_check",
      sql`${t.type} IN ('youtube', 'blog', 'text', 'manual')`,
    ),
  }),
);

// ─────────────────────────────────────────
// recipe_customizations (조정 이력) — v0.5는 스키마만 (L70).
// UI 없음. Attempt.changes 자유 텍스트로 P4·P5 1차 대응.
// 다음 사이클 OOS-5a에서 UI 도입.
// ─────────────────────────────────────────
export const recipeCustomizationDiffTypeValues = [
  "amount_adjust",
  "step_note",
  "swap",
  "skip",
] as const;
export type RecipeCustomizationDiffType =
  (typeof recipeCustomizationDiffTypeValues)[number];

export const recipeCustomizations = pgTable(
  "recipe_customizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    baseIngredientId: uuid("base_ingredient_id").references(() => recipeIngredients.id, {
      onDelete: "set null",
    }),
    baseStepId: uuid("base_step_id").references(() => recipeSteps.id, {
      onDelete: "set null",
    }),
    diffType: text("diff_type").notNull(),
    diffPayload: jsonb("diff_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeIdx: index("recipe_customizations_recipe_idx").on(t.recipeId),
    diffTypeCheck: check(
      "recipe_customizations_diff_type_check",
      sql`${t.diffType} IN ('amount_adjust', 'step_note', 'swap', 'skip')`,
    ),
  }),
);

// ─────────────────────────────────────────
// attempts (시도) — v0.5 FK 변경: video_id → recipe_id
// 삭제 정책 (L65, 2026-05-15):
//   - soft delete (deleted_at) 30일 휴지통 후 Cron hard delete
//   - Recipe DELETE 시도: Attempt ≥ 1건이면 422 + archived_at 권고
//   - archived 30일 후 또는 사용자 명시 영구 삭제 시:
//       attempts FK ON DELETE CASCADE로 함께 영구 삭제
//   - 영구 삭제 UI(2단계 다이얼로그)는 v0.5 OOS-5d
// ─────────────────────────────────────────
export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    rating: numeric("rating", { precision: 2, scale: 1 }), // 0.0~5.0, 0.5 단위 (앱 zod 검증)
    changes: text("changes"),
    improvementNote: text("improvement_note"),
    triedAt: date("tried_at").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeIdx: index("attempts_recipe_idx").on(t.recipeId, t.deletedAt, t.triedAt),
    userTriedAtIdx: index("attempts_user_tried_at_idx").on(t.userId, t.triedAt), // 홈 쿼리
    deletedAtIdx: index("attempts_deleted_at_idx").on(t.deletedAt), // Cron 30일 hard delete
  }),
);

// ─────────────────────────────────────────
// attempt_step_notes — v0.5 IN (L70, 2026-05-15 복원)
// P1(실패 반복) 직접 해결. 단계 단위 메모.
// video_timestamp 컬럼 존재하나 v0.5 UI는 항상 null 저장 (자동 캡처 OOS).
// 삭제 정책: Attempt hard delete 시 CASCADE, recipe_step FK는 SET NULL.
// ─────────────────────────────────────────
export const attemptStepNotes = pgTable(
  "attempt_step_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    recipeStepId: uuid("recipe_step_id").references(() => recipeSteps.id, {
      onDelete: "set null",
    }),
    note: text("note").notNull(),
    videoTimestamp: integer("video_timestamp"), // v0.5 OOS: 항상 null
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attemptIdx: index("attempt_step_notes_attempt_idx").on(t.attemptId),
    videoTimestampCheck: check(
      "attempt_step_notes_video_timestamp_check",
      sql`${t.videoTimestamp} IS NULL OR ${t.videoTimestamp} >= 0`,
    ),
  }),
);

// ─────────────────────────────────────────
// youtube_cache — v0.4 유지 (24h TTL)
// cache_key prefix: "video:" + youtube_video_id (v0.5는 search 미사용)
// ─────────────────────────────────────────
export const youtubeCache = pgTable("youtube_cache", {
  cacheKey: text("cache_key").primaryKey(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────
// ingestion_cache — v0.5 신규
// cache_key = hash(sourceType + url|text)
// 동일 입력 재처리 방지.
// ─────────────────────────────────────────
export const ingestionCache = pgTable(
  "ingestion_cache",
  {
    cacheKey: text("cache_key").primaryKey(),
    userId: uuid("user_id").notNull(),
    sourceType: text("source_type").notNull(),
    draft: jsonb("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("ingestion_cache_user_idx").on(t.userId),
  }),
);

// ─────────────────────────────────────────
// usage_counters — v0.5 신규 (F-8 회고 M5 측정 입력)
// M5 = 저장 완료 Recipe / Ingestion 시도. confidence 분포 + LLM 호출 누적.
// ─────────────────────────────────────────
export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: uuid("user_id").notNull(),
    month: text("month").notNull(), // "YYYY-MM" 포맷
    ingestAttemptCount: integer("ingest_attempt_count").notNull().default(0),
    ingestDraftCount: integer("ingest_draft_count").notNull().default(0),
    ingestSaveCount: integer("ingest_save_count").notNull().default(0),
    llmCallCount: integer("llm_call_count").notNull().default(0),
    confidenceHighCount: integer("confidence_high_count").notNull().default(0),
    confidenceMedCount: integer("confidence_med_count").notNull().default(0),
    confidenceLowCount: integer("confidence_low_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex("usage_counters_pk").on(t.userId, t.month),
  }),
);

// ─────────────────────────────────────────
// 타입 export
// ─────────────────────────────────────────
export type Dish = typeof dishes.$inferSelect;
export type NewDish = typeof dishes.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
export type RecipeStep = typeof recipeSteps.$inferSelect;
export type NewRecipeStep = typeof recipeSteps.$inferInsert;
export type RecipeSource = typeof recipeSources.$inferSelect;
export type NewRecipeSource = typeof recipeSources.$inferInsert;
export type RecipeCustomization = typeof recipeCustomizations.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
export type AttemptStepNote = typeof attemptStepNotes.$inferSelect;
export type NewAttemptStepNote = typeof attemptStepNotes.$inferInsert;
