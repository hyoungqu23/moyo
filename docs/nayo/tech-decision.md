# Tech Decision — nayo (나만의요리사)

> 버전: 3.0.2 (L70 — AttemptStepNote v0.5 IN 확정)
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-15 (L70 — attempt_step_notes 테이블 v0.5 IN 명시. video_timestamp 필드는 스키마 포함하되 v0.5에서 항상 null 저장. 자동 캡처 로직은 다음 사이클.)
> 페이즈: ENGINEER
> 기반: PRD v0.5 + Design Decision Doc v2.0 + dev-dialogue 합의
> dev-gate: T1-T6 전항목 PASS
> **중요**: 코드 마이그레이션 실행은 다음 사이클 (이번 사이클 OOS). Migration Plan 문서까지 작성.

---

## 1. 메타

| 항목 | 내용 |
|------|------|
| feature | nayo (나만의요리사) |
| appetite | Standard |
| 페이즈 | ENGINEER |
| 이전 페이즈 | DESIGN (D1-D4 전항목 PASS — design-decision v2.0) |
| 다음 페이즈 | ALIGN |
| user_scope | decision-log (5/22까지 설계 패키지 완성. 코드 마이그레이션 실행은 다음 사이클) |
| LLM 실호출 | 다음 사이클 OOS — 이번 사이클은 stub 함수 인터페이스 + 프롬프트 설계까지 |

---

## 2. 기술 스택 요약 (v2.0 유지)

| Layer | 결정 | 근거 |
|-------|------|------|
| Frontend | Next.js App Router | SSR + 라우팅 + API Route 한 번에 처리 |
| Hosting | Vercel | Next.js 공식 호스팅, 환경변수 관리 |
| Backend/DB | Supabase (Postgres + Auth + Storage) | 신속한 구축, Auth·Storage 번들 |
| Auth | Google OAuth (단일 계정) | 단일 사용자, 최소 인증 복잡도 |
| YouTube API | Next.js API Route 서버 프록시 | API Key 은닉, quota 집중 관리 |
| Quota Cache | Supabase 테이블 `youtube_cache` (24h TTL) | DB 기반 캐시 — 재배포 이후에도 유지 |
| ORM | Drizzle (server-side query·migration) | type-safe SQL, migration 자동화 지원. Auth만 supabase-js 사용 |
| UI Components | 자체 구현 (bottom sheet, dialog, dropdown, toggle, search input, combobox 등) | 외부 headless 라이브러리 미사용. Apple 디자인 시스템 토큰 + Tailwind CSS |
| Styling | Tailwind CSS + design-system.md 토큰 매핑 | Apple 토큰 직접 매핑 |
| State / Fetching | TanStack Query (서버 상태) + React useState (로컬) | 서버 상태·캐싱·낙관적 업데이트 |
| Form | react-hook-form + zod | 유효성 검증 타입 안전성 |
| Testing | Vitest (단위/컴포넌트) + Playwright (E2E 핵심 흐름 1-2개, 선택) | 자체 컴포넌트 a11y + 정렬 알고리즘 단위 테스트 필수 |
| TypeScript | strict + path alias | 타입 안전성, @/ alias |
| Code Style | ESLint (Next.js 기본) + Prettier | 표준 |
| Env | `.env.local` (개발) / Vercel 환경변수 (배포) | 표준 |
| 분석/이벤트 | 클릭 이벤트 미수집. M1~M6는 DB count. H-시리즈는 자기보고로 회고 | 단일 사용자 도구, 수집 오버헤드 불필요 |
| Cron / 정기 작업 | Vercel Cron (또는 Supabase pg_cron) | Attempt 30일 자동 hard delete, Recipe archived 30일 hard delete, youtube_cache 만료 레코드 정리 |
| Ingestion Blog 파싱 | linkedom (또는 @mozilla/readability) | 서버사이드 HTML 파싱, 경량. 실호출 다음 사이클 |
| LLM Stub | callLLMForIngestion 인터페이스만 정의 | Gemini 어댑터는 다음 사이클 |
| Mock Store | Zustand Mock Store 패턴 (팀 결정 dev-gate-003 자동 적용) | API 미개발 단계 선개발. API 연동 시 TanStack Query Mutations로 교체 |

---

## 3. 데이터 모델 (Drizzle Schema — Postgres, v0.5 전면 재설계)

### 3.1 파일 위치

```
db/
  schema.ts        ← Drizzle 스키마 정의 (단일 파일)
  index.ts         ← DB 커넥션 (drizzle-orm/postgres-js)
  migrations/      ← drizzle-kit generate 산출
drizzle.config.ts  ← drizzle-kit 설정
```

### 3.1 ERD (텍스트 트리)

```
auth.users (Supabase — 외부 참조, 드리즐 스키마 미정의)
  └─ Dish (user_id, name)
      └─ Recipe (dish_id, user_id, title, servings, description, archived_at)
          ├─ RecipeIngredient (recipe_id, name, amount, unit, optional, display_order)
          ├─ RecipeStep (recipe_id, display_order, instruction, timer_seconds, note)
          ├─ RecipeSource (recipe_id, type, url, raw_content, youtube_video_id, title, channel,
          │                thumbnail_url, published_at, is_unavailable_on_source,
          │                fetched_at, deleted_at)
          ├─ RecipeCustomization (recipe_id, base_ingredient_id?, base_step_id?,
          │                       diff_type, diff_payload, created_at, updated_at)
          └─ Attempt (recipe_id, user_id, rating, changes, improvement_note,
                      tried_at, deleted_at)
              └─ AttemptStepNote (attempt_id, recipe_step_id?, video_timestamp?, note, deleted_at)

youtube_cache (cache_key, results, fetched_at, expires_at)

[선택 — 이번 사이클 설계만]
usage_counters (user_id, month, ingest_count, llm_count)
ingestion_cache (cache_key, draft, created_at)
```

**도메인 경계 설명**
- RecipeCustomization = Recipe 자체에 영구 누적되는 "내 버전" diff (재료 수치 조정, 단계 메모 등)
- AttemptStepNote = 특정 1회 시도에만 귀속되는 일회성 메모 (§3.5 결정 영역 참조)

### 3.2 Drizzle 테이블 코드 (TypeScript)

```typescript
// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  date,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────
// Dish (메뉴)
// 삭제 정책: 연결된 Recipe가 없는 경우만 hard delete. Recipe 존재 시 deny + 422.
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
// Recipe (레시피) — v0.5 신규 1급 엔티티
// 삭제 정책: Attempt >= 1건이면 hard delete deny → archived_at 전환 권고.
//            Attempt 0건이면 hard delete 가능.
//            archived_at != null Recipe는 검색·홈 비노출. 30일 후 Cron hard delete.
// ─────────────────────────────────────────
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "restrict" }), // Dish 삭제 시 Recipe 있으면 restrict
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    servings: text("servings"), // 자유 표기 ("2인분", "1~2인분")
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }), // null = 활성. §3.4 결정: 옵션 B
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dishUserIdx: index("recipes_dish_user_idx").on(t.dishId, t.userId),
    userArchivedIdx: index("recipes_user_archived_idx").on(t.userId, t.archivedAt), // 홈 쿼리용
  }),
);

// ─────────────────────────────────────────
// RecipeIngredient (재료) — v0.5 신규
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
    amount: text("amount").notNull(), // 자유 표기 ("500g", "1큰술", "적당량")
    unit: text("unit"), // 단위 별도 표기 (선택)
    optional: boolean("optional").notNull().default(false),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeOrderIdx: index("recipe_ingredients_recipe_order_idx").on(t.recipeId, t.displayOrder),
  }),
);

// ─────────────────────────────────────────
// RecipeStep (조리 단계) — v0.5 신규
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
    timerSeconds: integer("timer_seconds"), // null이면 타이머 없음. 0 이상 정수만 허용 (앱 레이어 zod 검증)
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeOrderIdx: index("recipe_steps_recipe_order_idx").on(t.recipeId, t.displayOrder),
  }),
);

// ─────────────────────────────────────────
// RecipeSource (출처) — v0.5 신규 (기존 Video 흡수)
// type: 'youtube' | 'blog' | 'text' | 'manual'
// UNIQUE(recipe_id, url) WHERE url IS NOT NULL: 동일 Recipe에 동일 URL 중복 방지
// 삭제 정책: soft delete 가능. 연결된 Recipe·Attempt 보존.
// ─────────────────────────────────────────
export const recipeSources = pgTable(
  "recipe_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'youtube' | 'blog' | 'text' | 'manual'
    url: text("url"),
    rawContent: text("raw_content"),
    youtubeVideoId: text("youtube_video_id"),
    title: text("title"),
    channel: text("channel"),
    thumbnailUrl: text("thumbnail_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isUnavailableOnSource: boolean("is_unavailable_on_source").notNull().default(false),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeIdx: index("recipe_sources_recipe_idx").on(t.recipeId),
    // UNIQUE(recipe_id, url) WHERE url IS NOT NULL — 동일 Recipe에 동일 URL 중복 방지
    recipeUrlUnique: unique("recipe_sources_url_unique").on(t.recipeId, t.url),
    // 참고: Drizzle에서 PARTIAL UNIQUE는 raw SQL로 처리 필요
    // CREATE UNIQUE INDEX recipe_sources_url_unique ON recipe_sources(recipe_id, url) WHERE url IS NOT NULL;
  }),
);

// ─────────────────────────────────────────
// RecipeCustomization (조정 이력) — v0.5 신규
// diff_type: 'amount_adjust' | 'step_note' | 'swap' | 'skip'
// diff_payload: jsonb
//   amount_adjust: { "from": "500g", "to": "450g" }
//   step_note: { "note": "불 세기를 중간으로 낮춤" }
//   swap: { "from": "고추장 1큰술", "to": "고추가루 1/2큰술 + 설탕 1/4큰술" }
//   skip: { "reason": "재료 없음" }
// 삭제 정책: Recipe hard delete 시 CASCADE.
// ─────────────────────────────────────────
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
    baseStepId: uuid("base_step_id").references(() => recipeSteps.id, { onDelete: "set null" }),
    diffType: text("diff_type").notNull(), // 'amount_adjust' | 'step_note' | 'swap' | 'skip'
    diffPayload: jsonb("diff_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeIdx: index("recipe_customizations_recipe_idx").on(t.recipeId),
  }),
);

// ─────────────────────────────────────────
// Attempt (시도) — v0.5 변경: FK video_id → recipe_id
// rating: numeric(2,1) — 0.0~5.0. 0.5 단위는 앱 레이어(zod)에서 검증.
// deleted_at: soft delete 30일 후 자동 hard delete (Vercel Cron).
// 삭제 정책 (L65, 2026-05-15 갱신):
//   - soft delete (deleted_at) 30일 휴지통 후 Cron hard delete.
//   - Recipe DELETE 시도: Attempt >= 1건이면 422 + archived_at 권고 (직접 hard delete deny).
//   - Recipe archived_at != null 상태에서 사용자 명시 "영구 삭제" 또는 Cron 30일 자동 hard delete 시:
//     attempts FK ON DELETE CASCADE로 함께 영구 삭제 (옵션 A 채택, L65).
//     RecipeCustomization, RecipeSource, RecipeIngredient/Step도 동일 CASCADE.
//     AttemptStepNote는 attempts CASCADE → 자연스럽게 함께 영구 삭제.
//   - 영구 삭제 UI는 design-decision v2.0 §휴지통 2단계 확인 다이얼로그로 보호.
// ─────────────────────────────────────────
export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }), // L65: Recipe 영구 삭제 시 Attempt CASCADE (archived 30일 grace period가 실수 방어선)
    userId: uuid("user_id").notNull(),
    rating: numeric("rating", { precision: 2, scale: 1 }), // 0.0~5.0, nullable 허용 (평점 미입력 시도)
    changes: text("changes"),
    improvementNote: text("improvement_note"),
    triedAt: date("tried_at").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipeDeletedTriedIdx: index("attempts_recipe_idx").on(
      t.recipeId,
      t.deletedAt,
      t.triedAt,
    ),
    userTriedAtIdx: index("attempts_user_tried_at_idx").on(t.userId, t.triedAt), // 홈 최근 시도 쿼리
    deletedAtIdx: index("attempts_deleted_at_idx").on(t.deletedAt), // Cron용
  }),
);

// ─────────────────────────────────────────
// AttemptStepNote (시도별 단계 메모) — v0.5 IN (L70)
// §3.5 결정: 옵션 A 채택 (별도 테이블)
// L70 (2026-05-15): v0.5 스코프 IN 확정. P1 직접 해결.
//   - 스키마 전체 v0.5 IN.
//   - video_timestamp 필드는 스키마 포함하되, v0.5 OOS — 항상 null 저장.
//   - 자동 캡처 (YouTube IFrame Player API getCurrentTime()) = 다음 사이클.
// 이유:
//   (1) RecipeCustomization = Recipe 자체에 영구 누적되는 내 버전
//   (2) AttemptStepNote = 특정 1회 시도의 일회성 메모
//   (3) video_timestamp는 Attempt 단위 (재생 시점), Customization과 무관
//   (4) RM4/RM10 성공 지표 독립 측정 가능
// 삭제 정책: Attempt hard delete 시 CASCADE.
// ─────────────────────────────────────────
export const attemptStepNotes = pgTable(
  "attempt_step_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    recipeStepId: uuid("recipe_step_id").references(() => recipeSteps.id, {
      onDelete: "set null", // RecipeStep 삭제 시 참조만 끊김 (메모 보존)
    }),
    videoTimestamp: integer("video_timestamp"), // 초 단위 양의 정수 또는 null. 음수 거부(앱 레이어 zod)
    note: text("note").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete (개별 삭제)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attemptIdx: index("attempt_step_notes_attempt_idx").on(t.attemptId),
  }),
);

// ─────────────────────────────────────────
// YouTube Cache (v2.0 유지)
// cache_key 규칙:
//   검색 캐시  = "search:" + normalized_query (소문자+trim)
//   영상 상세 = "video:" + youtube_video_id
// ─────────────────────────────────────────
export const youtubeCache = pgTable(
  "youtube_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cacheKey: text("cache_key").notNull().unique(),
    results: jsonb("results").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    cacheKeyIdx: index("youtube_cache_cache_key_idx").on(t.cacheKey),
    expiresAtIdx: index("youtube_cache_expires_at_idx").on(t.expiresAt),
  }),
);

// ─────────────────────────────────────────
// [설계만] UsageCounters — LLM 비용 제어
// 이번 사이클 OOS (LLM 실호출 구현 다음 사이클)
// ─────────────────────────────────────────
export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    month: varchar("month", { length: 7 }).notNull(), // "2026-05" 형식
    ingestCount: integer("ingest_count").notNull().default(0),
    llmCount: integer("llm_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userMonthUnique: unique("usage_counters_user_month_unique").on(t.userId, t.month),
  }),
);

// ─────────────────────────────────────────
// [설계만] IngestionCache — Ingestion 결과 캐시
// cache_key = hash(sourceType + url|text)
// 이번 사이클 OOS (LLM 실호출 구현 다음 사이클)
// ─────────────────────────────────────────
export const ingestionCache = pgTable(
  "ingestion_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cacheKey: text("cache_key").notNull().unique(),
    draft: jsonb("draft").notNull(), // RecipeDraft 구조
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cacheKeyIdx: index("ingestion_cache_key_idx").on(t.cacheKey),
  }),
);
```

### 3.3 인덱스 정책

| 인덱스 | 목적 |
|--------|------|
| `dishes_user_id_idx` | 자동완성 MVP 조회의 user_id 필터 최적화 |
| `recipes_dish_user_idx` (dish_id, user_id) | Dish 단위 Recipe 목록 |
| `recipes_user_archived_idx` (user_id, archived_at) | 홈 쿼리 — archived_at IS NULL 필터 최적화 |
| `recipe_ingredients_recipe_order_idx` (recipe_id, display_order) | Recipe 단위 재료 목록 정렬 |
| `recipe_steps_recipe_order_idx` (recipe_id, display_order) | Recipe 단위 단계 목록 정렬 |
| `recipe_sources_recipe_idx` (recipe_id) | Recipe 단위 Source 목록 |
| `recipe_sources_url_unique` (recipe_id, url) WHERE url IS NOT NULL | 동일 Recipe 동일 URL 중복 방지 |
| `recipe_customizations_recipe_idx` (recipe_id) | Recipe 단위 Customization 목록 |
| `attempts_recipe_idx` (recipe_id, deleted_at, tried_at DESC) | Recipe 단위 Attempt 이력 정렬 |
| `attempts_user_tried_at_idx` (user_id, tried_at DESC) | 홈 최근 시도 쿼리 최적화 |
| `attempts_deleted_at_idx` (deleted_at) | 휴지통 조회 + Cron 최적화 |
| `attempt_step_notes_attempt_idx` (attempt_id) | Attempt 단위 단계 메모 목록 |
| `youtube_cache_cache_key_idx` | cache_key 단일 컬럼 조회 |
| `youtube_cache_expires_at_idx` | 만료 캐시 정리 쿼리 최적화 |

### 3.4 결정 영역 — Recipe.archived 형태

**결정: 옵션 B 채택 — `archived_at timestamptz nullable`**

| 옵션 | 스키마 | 장단점 |
|------|--------|--------|
| A | `archived boolean default false` | 단순하나 archived 시점 추적 불가 |
| **B (채택)** | **`archived_at timestamptz nullable`** | **archived 시점 추적 가능. Cron 자동 hard delete 정책(30일) 기준으로 활용 가능. null = 활성. not null = archived.** |

**적용**: `WHERE archived_at IS NULL` = 활성 Recipe. `WHERE archived_at IS NOT NULL` = 보관된 Recipe.

### 3.5 결정 영역 — 단계 메모 보존 방식

**결정: 옵션 A 채택 — AttemptStepNote 별도 테이블**

| 옵션 | 구조 | 결정 |
|------|------|------|
| A (채택) | `attempt_step_notes` 별도 테이블 (1 Attempt : N AttemptStepNote, recipe_step_id 참조) | **채택** |
| B | RecipeCustomization에 통합 (diff_type='step_note') | 기각 |

**옵션 A 채택 사유:**
1. RecipeCustomization = Recipe 자체에 영구 누적되는 내 버전 (diff 이력). 모든 시도에 걸쳐 누적.
2. AttemptStepNote = 특정 1회 시도의 일회성 메모. 다음 시도에 안 따라할 수도 있음.
3. 두 도메인 분리 시 RM4(Attempt 기록 미참조) 신호와 RM10(Customization 사용성) 신호가 독립 측정 가능.
4. video_timestamp는 Attempt 단위의 영상 재생 시점 — Customization과 무관한 데이터.

### 3.6 파생 필드 계산 방식

파생 필드(`average_rating`, `attempt_count`, `last_tried_at`, `days_since_last_tried`)는 DB에 저장하지 않는다. API Route에서 Drizzle SQL로 집계:

```typescript
// Recipe별 파생 필드 집계 (soft delete된 attempt 제외)
const stats = await db
  .select({
    recipeId: attempts.recipeId,
    avgRating: sql<string>`ROUND(AVG(${attempts.rating}::numeric), 1)`,
    attemptCount: sql<number>`COUNT(*)::integer`,
    lastTriedAt: sql<string>`MAX(${attempts.triedAt})`,
    daysSinceLastTried: sql<number>`(CURRENT_DATE - MAX(${attempts.triedAt}))::integer`,
  })
  .from(attempts)
  .where(
    and(
      eq(attempts.userId, userId),
      isNull(attempts.deletedAt), // soft delete 제외
    ),
  )
  .groupBy(attempts.recipeId);
```

---

## 4. 인증 전략 (v2.0 유지 + Recipe 도메인 적용)

### 4.1 Google OAuth

```
흐름:
1. 사용자 → Google OAuth (supabase-js signInWithOAuth({ provider: 'google' }))
2. Supabase Auth → Google 인증 완료 → session cookie 발급
3. 모든 API Route: session 확인 → requireAuth() 통과
```

- Auth 처리: `supabase-js` 전용
- DB 쿼리 (Recipe/Attempt/etc.): Drizzle 전용

### 4.2 보안 경계 정의

**서버 API(Drizzle direct DATABASE_URL)에서 `WHERE user_id`가 유일한 실질 보안 경계이다.**

- Drizzle direct connection은 RLS `auth.uid()` 미작동 → RLS는 보조 방어선 불가.
- **결론**: 모든 API Route에 `requireAuth()` + Drizzle 쿼리에 `eq(테이블.userId, userId)` 강제.

**Recipe / Attempt 소유권 체인 검증 패턴:**

```typescript
// Recipe 하위 리소스 접근 전 Recipe 소유권 검증
const recipe = await db.query.recipes.findFirst({
  where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
});
if (!recipe) throw new ForbiddenError();

// Attempt 하위 리소스 접근 전 Attempt 소유권 검증
const attempt = await db.query.attempts.findFirst({
  where: and(eq(attempts.id, attemptId), eq(attempts.userId, userId)),
});
if (!attempt) throw new ForbiddenError();
```

**하위 테이블 소유권 체인 규칙:**
- `recipe_ingredients`, `recipe_steps`, `recipe_customizations`: 상위 Recipe user_id 검증 후 진입
- `attempt_step_notes`: 상위 Attempt user_id 검증 후 진입
- 중첩 리소스는 반드시 상위 소유권 체인 검증 선행

**Gemini API Key 보안:**
```typescript
// server-side only — GEMINI_API_KEY는 클라이언트 미노출
const geminiApiKey = process.env.GEMINI_API_KEY; // NEXT_PUBLIC_ prefix 절대 금지
```
- build-time grep 권장: `grep -r "GEMINI_API_KEY" src/ --include="*.tsx" --include="*.ts"` 로 클라이언트 노출 여부 검증

### 4.3 requireAuth 미들웨어

```typescript
// lib/auth.ts — API Route 공통 유틸
export async function requireAuth(request: NextRequest): Promise<{ userId: string }> {
  const supabase = createServerClient(/* ... */);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, "Unauthorized");
  return { userId: session.user.id };
}
```

**Ingestion SSRF 방지:**
```typescript
// server-side URL fetch 시 차단 리스트 + 5s 타임아웃
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "::1", "0.0.0.0", "169.254.169.254"];
function assertSafeUrl(url: string): void {
  const parsed = new URL(url);
  if (BLOCKED_HOSTS.includes(parsed.hostname)) {
    throw new ApiError(400, "URL not allowed");
  }
}
// fetch with 5s timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const res = await fetch(url, { signal: controller.signal });
```

---

## 5. YouTube Data API (v2.0 유지 + Ingestion에서 활용)

### 5.1 Quota 관리

| API 호출 | quota 비용 | 비고 |
|----------|-----------|------|
| search.list | 100 units/call | 캐시 HIT 시 0 소모 |
| videos.list | 1 unit/call | 캐시 HIT 시 0 소모. Ingestion 시 Source 메타 수집용으로도 사용 |
| commentThreads.list | 1 unit/call | 캐시 HIT 시 0 소모 (Ingestion 시 미호출) |
| 일일 한도 | 10,000 units | 캐시 적중률이 핵심 |

### 5.2 캐시 정책 (v2.0 유지)

- 캐시 키: `youtube_cache.cache_key` TEXT UNIQUE 단일 컬럼
  - 검색: `"search:" + normalized_query` (소문자+trim)
  - 영상 상세: `"video:" + youtube_video_id`
- TTL: 24h (기본값). 추후 72h/7d 연장 검토 가능 (U2)
- Quota 초과 시: 429 응답 → 클라이언트 EmptyState "잠시 후 다시 시도해주세요"

### 5.3 Ingestion 시 YouTube Source 메타 수집

```typescript
// POST /api/recipes/ingest에서 type=youtube 처리
// 1. youtube_cache 조회 (cache_key = "video:" + youtubeVideoId)
// 2. MISS: videos.list 호출 → snippet(title, channelTitle, description, thumbnails, publishedAt) 수집
// 3. RecipeSource 레코드 생성:
//    { type: 'youtube', url, youtubeVideoId, title, channel, thumbnailUrl, publishedAt, rawContent: description }
```

---

## 6. 검색 정렬 (v2.0 책임 분리 유지 + Recipe 단위 재정의)

### 6.1 흐름

```
1단계 — API Route에서 Recipe 검색 결과 수신 (Dish.name, Recipe.title LIKE 매칭)

2단계 — DB JOIN (Drizzle)
  recipes 테이블에서 average_rating, attempt_count, last_tried_at, days_since_last_tried 집계
  archived_at IS NULL 조건 필수

3단계 — 클라이언트 정렬 (sortRecipeResults — 순수 함수)

  [우선 노출 영역 "높은 평점"]
    - 조건: average_rating >= 4.0 OR attempt_count >= 2 인 Recipe가 1개 이상일 때만 섹션 표시
    - 정렬: average_rating DESC → attempt_count DESC (동률 처리)

  [일반 영역]
    - 나머지 Recipe: created_at DESC (최신 저장순)
    - archived Recipe: 미노출 (API에서 이미 필터링)
```

### 6.2 정렬 함수

```typescript
// lib/sort-recipes.ts
export type RecipeWithStats = {
  id: string;
  title: string;
  dishName: string;
  averageRating: number | null;
  attemptCount: number;
  lastTriedAt: string | null;
  createdAt: string;
  thumbnailUrl?: string;
};

export type SortedRecipeResult = {
  highRatedSection: RecipeWithStats[];
  generalSection: RecipeWithStats[];
};

export function sortRecipeResults(recipes: RecipeWithStats[]): SortedRecipeResult {
  const highRated = recipes.filter(
    (r) => (r.averageRating !== null && r.averageRating >= 4.0) || r.attemptCount >= 2,
  );

  if (highRated.length === 0) {
    return {
      highRatedSection: [],
      generalSection: [...recipes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }

  const highRatedSorted = [...highRated].sort((a, b) => {
    const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return b.attemptCount - a.attemptCount;
  });

  const highRatedIds = new Set(highRated.map((r) => r.id));
  const general = recipes
    .filter((r) => !highRatedIds.has(r.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { highRatedSection: highRatedSorted, generalSection: general };
}
```

---

## 7. Ingestion API 설계 (v0.5 신규 핵심)

### 7.1 POST /api/recipes/ingest — 입력 zod 스키마

```typescript
import { z } from "zod";

export const IngestInputSchema = z.discriminatedUnion("sourceType", [
  z.object({
    dishId: z.string().uuid(),
    sourceType: z.literal("youtube"),
    payload: z.object({ url: z.string().url() }),
  }),
  z.object({
    dishId: z.string().uuid(),
    sourceType: z.literal("blog"),
    payload: z.object({ url: z.string().url() }),
  }),
  z.object({
    dishId: z.string().uuid(),
    sourceType: z.literal("text"),
    payload: z.object({ text: z.string().min(1).max(50000) }),
  }),
]);

export type IngestInput = z.infer<typeof IngestInputSchema>;
```

### 7.2 Draft 응답 zod 스키마

```typescript
export const IngredientDraftSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string().optional(),
  optional: z.boolean().default(false),
  confidence: z.enum(["low", "med", "high"]).default("med"),
});

export const StepDraftSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string(),
  timerSeconds: z.number().int().nonnegative().optional(),
  confidence: z.enum(["low", "med", "high"]).default("med"),
});

export const RecipeDraftSchema = z.object({
  draftId: z.string().uuid(), // 임시 UUID (서버 생성, 저장 시 활용)
  title: z.string(),
  servings: z.string().optional(),
  ingredients: z.array(IngredientDraftSchema),
  steps: z.array(StepDraftSchema),
  tips: z.array(z.string()).default([]),
  overallConfidence: z.enum(["low", "med", "high"]),
  confidencePerField: z.object({
    title: z.enum(["low", "med", "high"]),
    servings: z.enum(["low", "med", "high"]).optional(),
    ingredients: z.enum(["low", "med", "high"]),
    steps: z.enum(["low", "med", "high"]),
  }),
});

export type RecipeDraft = z.infer<typeof RecipeDraftSchema>;
```

### 7.3 처리 단계

```
POST /api/recipes/ingest 처리 흐름:

1. requireAuth()
2. IngestInputSchema zod 검증
3. sourceType별 원문 추출:
   - youtube:
     a. URL에서 youtube_video_id 파싱 (정규식: /[?&]v=([^&#]+)/ 또는 /youtu\.be\/([^?#]+)/)
     b. youtube_cache HIT 확인 (cache_key = "video:" + youtubeVideoId)
     c. MISS: videos.list 호출 → description + 메타 추출 → 캐시 저장
     d. rawContent = description
   - blog:
     a. assertSafeUrl(url) — SSRF 차단 리스트 검증
     b. fetch(url, { signal: AbortController(5s) })
     c. 404/410/타임아웃 → isUnavailableOnSource = true + 사용자 안내
     d. linkedom 또는 @mozilla/readability로 HTML 텍스트 추출
     e. rawContent = 추출된 텍스트
   - text:
     d. rawContent = payload.text

4. 규칙 기반 파싱 (우선):
   - 재료 섹션 감지: 정규식 /재료|Ingredients|주재료|양념|부재료/i
   - 재료 row 추출: /^(.+?)\s+([\d\/\.]+\s*(?:g|ml|개|큰술|작은술|컵|kg|l|T|t)?)\s*$/gm
   - 단계 섹션 감지: /만드는 법|조리법|Steps?|How to/i
   - 단계 번호: /^\s*(?:\d+[\.\)]\s*|[①-⑩]\s*|Step\s*\d+[:\.\s])/gim

5. confidence 산출 (§9 참조):
   - high: 재료 5+ AND 단계 3+ AND 정상 패턴 매칭
   - med: 재료 또는 단계 일부만 추출 (규칙 부분 매칭)
   - low: 재료 0개 OR 단계 0개

6. confidence == 'low' → callLLMForIngestion() 호출 [이번 사이클은 stub]

7. draftId = randomUUID() 생성
8. RecipeDraft 응답 반환
```

### 7.4 LLM Stub 인터페이스

```typescript
// lib/ingestion/llm-stub.ts
// 이번 사이클: 인터페이스만 정의. 실호출 구현은 다음 사이클.
// [팀 결정 dev-gate-003 적용] API 미개발 단계 → Zustand Mock Store 패턴 적용
// 실호출 구현 전까지 서버 stub 반환 + 클라이언트 Mock Store에서 상태 관리

export interface LLMIngestionAdapter {
  parse(rawContent: string): Promise<RecipeDraft>;
}

// Gemini 어댑터 인터페이스 (다음 사이클 구현)
export interface GeminiIngestionAdapter extends LLMIngestionAdapter {
  modelId: "gemini-1.5-flash" | "gemini-2.0-flash";
}

// 이번 사이클 stub
export async function callLLMForIngestion(_rawContent: string): Promise<RecipeDraft> {
  // LLM 실호출 구현 전 placeholder
  // 다음 사이클: GeminiIngestionAdapter 구현 후 교체
  return {
    draftId: crypto.randomUUID(),
    title: "",
    ingredients: [],
    steps: [],
    tips: [],
    overallConfidence: "low" as const,
    confidencePerField: {
      title: "low" as const,
      ingredients: "low" as const,
      steps: "low" as const,
    },
  };
}
```

### 7.5 POST /api/recipes — Draft 확정 저장

```typescript
export const RecipeCreateSchema = z.object({
  dishId: z.string().uuid(),
  draftId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  servings: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.string().min(1),
      unit: z.string().optional(),
      optional: z.boolean().default(false),
      displayOrder: z.number().int().nonnegative(),
    }),
  ),
  steps: z.array(
    z.object({
      displayOrder: z.number().int().positive(),
      instruction: z.string().min(1),
      timerSeconds: z.number().int().nonnegative().optional(),
      note: z.string().optional(),
    }),
  ),
  sources: z.array(
    z.object({
      type: z.enum(["youtube", "blog", "text", "manual"]),
      url: z.string().url().optional(),
      rawContent: z.string().optional(),
      youtubeVideoId: z.string().optional(),
      title: z.string().optional(),
      channel: z.string().optional(),
      thumbnailUrl: z.string().url().optional(),
      publishedAt: z.string().datetime().optional(),
    }),
  ),
});
```

**처리**: DB Transaction 내에서 `recipes` + `recipe_ingredients[]` + `recipe_steps[]` + `recipe_sources[]` 일괄 생성.

UNIQUE(recipe_id, url) WHERE url IS NOT NULL 위반 시:
```typescript
await db.insert(recipeSources).values(sourceData).onConflictDoUpdate({
  target: [recipeSources.recipeId, recipeSources.url],
  set: { title: sql`EXCLUDED.title`, thumbnailUrl: sql`EXCLUDED.thumbnail_url`, fetchedAt: sql`NOW()` },
});
```

---

## 8. AmountStepper ± 단위 정책 (v0.5 신규)

```typescript
// lib/amount-stepper.ts

type StepUnit = {
  step: number;
  canNumeric: boolean;
};

const UNIT_STEP_MAP: Record<string, StepUnit> = {
  g: { step: 10, canNumeric: true },
  kg: { step: 0.1, canNumeric: true },
  ml: { step: 10, canNumeric: true },
  l: { step: 0.1, canNumeric: true },
  개: { step: 1, canNumeric: true },
  큰술: { step: 0.5, canNumeric: true },
  T: { step: 0.5, canNumeric: true },
  작은술: { step: 0.5, canNumeric: true },
  t: { step: 0.5, canNumeric: true },
  컵: { step: 0.5, canNumeric: true },
  줌: { step: 1, canNumeric: true },
};

const NON_NUMERIC_AMOUNTS = ["약간", "적당량", "조금", "많이", "소금간", "취향껏"];

export type AmountStepperConfig = {
  step: number;
  canUseNumericStepper: boolean;
  fallbackMode: "direct-input" | "memo-only";
};

// 자유 표기 amount에서 숫자+단위 분리 시도
const AMOUNT_REGEX = /^([\d\/\.]+)\s*(g|kg|ml|l|개|큰술|T|작은술|t|컵|줌)?$/;

export function resolveAmountStepperConfig(amount: string, unit?: string): AmountStepperConfig {
  const effectiveUnit = unit ?? extractUnit(amount);

  if (!effectiveUnit) {
    // 비수치 표기 확인
    const isNonNumeric = NON_NUMERIC_AMOUNTS.some((nnu) => amount.includes(nnu));
    return {
      step: 0,
      canUseNumericStepper: false,
      fallbackMode: isNonNumeric ? "memo-only" : "direct-input",
    };
  }

  const config = UNIT_STEP_MAP[effectiveUnit];
  if (!config) {
    return { step: 1, canUseNumericStepper: true, fallbackMode: "direct-input" };
  }

  return { step: config.step, canUseNumericStepper: true, fallbackMode: "direct-input" };
}

function extractUnit(amount: string): string | undefined {
  const match = amount.match(AMOUNT_REGEX);
  return match?.[2];
}
```

**비수치 재료 처리:**
- `약간`, `적당량` 등 → AmountStepper ± 버튼 비활성화 + "조정 사유 메모" 모드
- diff_payload: `{ "memo": "소금을 평소보다 약간 덜 넣음" }`
- ConfidenceField: aria-disabled="true", 비활성 시각 표현

---

## 9. ConfidenceField threshold (v0.5 신규)

### 9.1 confidence 산출식

```typescript
// lib/ingestion/confidence.ts

export type ConfidenceLevel = "low" | "med" | "high";

export interface ParsedRecipeResult {
  ingredients: Array<{ name: string; amount: string }>;
  steps: Array<{ instruction: string }>;
  ingredientPatternMatchRate: number; // 0.0~1.0
  stepPatternMatchRate: number; // 0.0~1.0
}

export function calcOverallConfidence(parsed: ParsedRecipeResult): ConfidenceLevel {
  const { ingredients, steps, ingredientPatternMatchRate, stepPatternMatchRate } = parsed;

  if (ingredients.length === 0 || steps.length === 0) return "low";

  if (
    ingredients.length >= 5 &&
    steps.length >= 3 &&
    ingredientPatternMatchRate >= 0.8 &&
    stepPatternMatchRate >= 0.8
  ) {
    return "high";
  }

  return "med";
}

export function calcFieldConfidence(
  fieldValue: string | undefined,
  patternMatchRate: number,
): ConfidenceLevel {
  if (!fieldValue || fieldValue.trim().length === 0) return "low";
  if (patternMatchRate >= 0.8) return "high";
  if (patternMatchRate >= 0.4) return "med";
  return "low";
}
```

### 9.2 시각 표현 매핑 (design-decision §ConfidenceField 연계)

| confidence | border | 아이콘 | aria |
|-----------|--------|--------|------|
| `low` | `2px solid #f59e0b` | ⚠ | `aria-describedby="confidence-hint-{id}"` "확인이 필요해요" |
| `med` | `1px solid {colors.hairline}` | 없음 | `aria-describedby` "신뢰도 보통" |
| `high` | `1px solid #16a34a` | ✓ (subtle) | 시각 표시 최소화 |

---

## 10. 삭제 정책 구현 (v0.5 갱신)

### 10.1 Recipe 삭제 / 보관

```typescript
// DELETE /api/recipes/{id}
// Attempt 존재 여부 확인 (휴지통 포함 전체 카운트)
const [{ attemptCount }] = await db
  .select({ attemptCount: sql<number>`COUNT(*)::integer` })
  .from(attempts)
  .where(
    and(
      eq(attempts.recipeId, recipeId),
      eq(attempts.userId, userId), // 보안 경계
    ),
  );

if (Number(attemptCount) > 0) {
  // Attempt 있으면 hard delete deny → 422 + archived_at 전환 권고
  return Response.json(
    { error: "이 레시피는 시도 기록이 있어 삭제할 수 없어요. 보관 처리를 권장합니다.", code: "HAS_ATTEMPTS" },
    { status: 422 },
  );
}
// Attempt 0건이면 hard delete (하위 RecipeIngredient/Step/Source/Customization CASCADE)
await db.delete(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
```

### 10.2 Recipe 보관 (archived_at 전환)

```typescript
// PATCH /api/recipes/{id} — archived_at 갱신
await db
  .update(recipes)
  .set({ archivedAt: new Date(), updatedAt: new Date() })
  .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
```

**archived Recipe 30일 자동 hard delete (Vercel Cron):**

L65 (2026-05-15) 갱신: `attempts.recipe_id` FK가 `ON DELETE CASCADE`로 변경됨.
archived 30일 경과 시 Recipe와 함께 attempts·attempt_step_notes·recipe_customizations·recipe_ingredients·recipe_steps·recipe_sources가 전부 CASCADE로 영구 삭제된다.

```sql
-- 일일 실행 (cron: "0 3 * * *" — UTC 03:00)
DELETE FROM recipes
WHERE archived_at < NOW() - INTERVAL '30 days';
-- CASCADE 경로:
--   recipes → recipe_ingredients (CASCADE)
--   recipes → recipe_steps (CASCADE)
--   recipes → recipe_sources (CASCADE)
--   recipes → recipe_customizations (CASCADE)
--   recipes → attempts (CASCADE, L65)
--     attempts → attempt_step_notes (CASCADE)
-- 단일 DELETE 한 줄로 7개 테이블 row가 일관 정리됨.
```

**사용자 명시 "영구 삭제" (archived Recipe 상세 화면):**

```typescript
// DELETE /api/recipes/{id}?force=true
// archived_at != null 인 Recipe에만 허용. 그 외는 422.
// 2단계 확인 다이얼로그(design-decision v2.0 §휴지통)는 클라이언트 책임.
// 서버에서도 archived_at IS NOT NULL 가드.

const [recipe] = await db
  .select({ id: recipes.id, archivedAt: recipes.archivedAt })
  .from(recipes)
  .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));

if (!recipe) return Response.json({ error: "Not found" }, { status: 404 });
if (!recipe.archivedAt) {
  return Response.json(
    { error: "보관(archived) 상태 레시피만 영구 삭제할 수 있어요.", code: "NOT_ARCHIVED" },
    { status: 422 },
  );
}

await db.delete(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
// CASCADE로 attempts·attempt_step_notes·recipe_* 일괄 정리.
```

**Trade-off 인지 (L65):** Attempt CASCADE 영구 삭제 = 과거 시도 기록 영구 손실. archived 30일 grace period가 실수 방어선이며, 영구 삭제는 명시적 사용자 의도 + 2단계 확인 후에만 실행.

### 10.3 Attempt soft delete / 복구 / 영구 삭제

```typescript
// DELETE /api/attempts/{id} → soft delete
await db
  .update(attempts)
  .set({ deletedAt: new Date(), updatedAt: new Date() })
  .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));

// POST /api/attempts/{id}/restore
await db
  .update(attempts)
  .set({ deletedAt: null, updatedAt: new Date() })
  .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));

// DELETE /api/attempts/{id}/permanent
await db.delete(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));
// attempt_step_notes: FK CASCADE로 함께 삭제
```

**Attempt 30일 자동 hard delete:**

```sql
-- 일일 실행 (cron: "0 2 * * *" — UTC 02:00)
DELETE FROM attempts
WHERE deleted_at < NOW() - INTERVAL '30 days';
-- attempt_step_notes: ON DELETE CASCADE
```

### 10.4 RecipeSource soft delete

```typescript
// DELETE /api/recipes/{id}/sources/{sourceId}
// 1. Recipe 소유권 체인 검증
const recipe = await db.query.recipes.findFirst({
  where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
});
if (!recipe) throw new ForbiddenError();

// 2. Source soft delete
await db
  .update(recipeSources)
  .set({ deletedAt: new Date() })
  .where(and(eq(recipeSources.id, sourceId), eq(recipeSources.recipeId, recipeId)));
// 연결된 Recipe·Attempt 보존
```

### 10.5 Dish hard delete

```typescript
// DELETE /api/dishes/{id}
const [{ recipeCount }] = await db
  .select({ recipeCount: sql<number>`COUNT(*)::integer` })
  .from(recipes)
  .where(and(eq(recipes.dishId, dishId), eq(recipes.userId, userId)));

if (Number(recipeCount) > 0) {
  return Response.json({ error: "먼저 레시피를 정리해주세요" }, { status: 422 });
}
await db.delete(dishes).where(and(eq(dishes.id, dishId), eq(dishes.userId, userId)));
```

---

## 11. Source 접근 불가 감지 (v0.5 일반화)

```typescript
// YouTube: videos.list items[] 빈 응답 → is_unavailable_on_source = true
if (ytData.items.length === 0) {
  await db
    .update(recipeSources)
    .set({ isUnavailableOnSource: true })
    .where(
      and(
        eq(recipeSources.youtubeVideoId, youtubeVideoId),
        eq(recipeSources.recipeId, recipeId),
      ),
    );
}

// Blog: fetch 404/410/타임아웃 → is_unavailable_on_source = true
if (response.status === 404 || response.status === 410 || timedOut) {
  await db
    .update(recipeSources)
    .set({ isUnavailableOnSource: true })
    .where(eq(recipeSources.id, sourceId));
}

// Text: 항상 available (is_unavailable_on_source = false)
```

**검색 결과 필터링:**
```typescript
.where(and(
  eq(recipes.userId, userId),
  isNull(recipes.archivedAt), // 보관된 Recipe 제외
))
// is_unavailable_on_source인 Source의 Recipe는 제외하지 않음
// (Recipe 자체는 유효 — Source만 접근 불가 표시)
```

---

## 12. API Contract (v0.5 전체 — 32개 엔드포인트)

| 메서드 | 경로 | Auth | 입력(zod) | 출력 | 보안 검증 |
|--------|------|------|-----------|------|----------|
| `GET` | `/api/home` | O | — | 쿨타임 3+더보기7 / 최근 5 / 자주 Top3 | userId 필터 |
| `GET` | `/api/dishes` | O | — | Dish 목록 | userId 필터 |
| `POST` | `/api/dishes` | O | `{ name }` | Dish | — |
| `DELETE` | `/api/dishes/{id}` | O | — | 204 | Recipe 0건 체크 |
| `GET` | `/api/dishes/autocomplete?q={prefix}` | O | `q: string` | Dish[] max 8 | userId 필터 |
| `POST` | `/api/recipes/ingest` | O | `IngestInputSchema` | `RecipeDraft` | SSRF 차단 + userId |
| `POST` | `/api/recipes` | O | `RecipeCreateSchema` | Recipe | dishId 소유 검증 |
| `GET` | `/api/recipes/{id}` | O | — | Recipe + ingredients + steps + sources + attempts | recipeId+userId |
| `PATCH` | `/api/recipes/{id}` | O | `{ title?, servings?, description?, archivedAt? }` | Recipe | recipeId+userId |
| `DELETE` | `/api/recipes/{id}` | O | — | 204 or 422 | Attempt 0건 체크 |
| `POST` | `/api/recipes/{id}/ingredients` | O | `{ name, amount, unit?, optional?, displayOrder }` | RecipeIngredient | Recipe 소유권 |
| `PATCH` | `/api/recipes/{id}/ingredients/{iid}` | O | `{ name?, amount?, unit?, optional?, displayOrder? }` | RecipeIngredient | Recipe 소유권 |
| `DELETE` | `/api/recipes/{id}/ingredients/{iid}` | O | — | 204 | Recipe 소유권 |
| `POST` | `/api/recipes/{id}/steps` | O | `{ displayOrder, instruction, timerSeconds?, note? }` | RecipeStep | Recipe 소유권 |
| `PATCH` | `/api/recipes/{id}/steps/{sid}` | O | `{ displayOrder?, instruction?, timerSeconds?, note? }` | RecipeStep | Recipe 소유권 |
| `DELETE` | `/api/recipes/{id}/steps/{sid}` | O | — | 204 | Recipe 소유권 |
| `POST` | `/api/recipes/{id}/customizations` | O | `{ baseIngredientId?, baseStepId?, diffType, diffPayload }` | RecipeCustomization | Recipe 소유권 |
| `PATCH` | `/api/recipes/{id}/customizations/{cid}` | O | `{ diffPayload }` | RecipeCustomization | Recipe 소유권 체인 |
| `DELETE` | `/api/recipes/{id}/customizations/{cid}` | O | — | 204 | Recipe 소유권 체인 |
| `DELETE` | `/api/recipes/{id}/sources/{sourceId}` | O | — | 204 | Recipe 소유권 + Source soft delete |
| `POST` | `/api/recipes/{id}/attempts` | O | `{ rating?, changes?, improvementNote?, triedAt }` | Attempt | Recipe 소유권 |
| `PATCH` | `/api/attempts/{id}` | O | `{ rating?, changes?, improvementNote?, triedAt? }` | Attempt | userId 필터 |
| `DELETE` | `/api/attempts/{id}` | O | — | 204 | soft delete + userId |
| `POST` | `/api/attempts/{id}/restore` | O | — | 204 | userId 필터 |
| `DELETE` | `/api/attempts/{id}/permanent` | O | — | 204 | userId 필터 |
| `GET` | `/api/attempts/trash` | O | — | Attempt[] (30일 내) | userId 필터 |
| `POST` | `/api/attempts/{id}/step-notes` | O | `{ recipeStepId?, videoTimestamp?, note }` | AttemptStepNote | Attempt 소유권 |
| `PATCH` | `/api/attempts/{id}/step-notes/{snId}` | O | `{ note?, videoTimestamp? }` | AttemptStepNote | Attempt 소유권 체인 |
| `DELETE` | `/api/attempts/{id}/step-notes/{snId}` | O | — | 204 | Attempt 소유권 체인 |
| `GET` | `/api/youtube/search?q={menu}&dish_id={id}` | O | `q: string` | Recipe-enriched 검색 결과 | userId 필터 |
| `GET` | `/api/youtube/video/{youtube_video_id}` | O | — | 영상 메타 | userId 필터 |
| `GET` | `/api/dishes/{id}/recipes` | O | — | Dish 단위 Recipe 목록 | Dish 소유권 |

**공통 보안 원칙**: 32개 전 엔드포인트 `requireAuth()` 적용. 하위 리소스는 상위 소유권 체인 검증 선행.

**폐기**: `/api/videos/*`, `/api/attempts/{id}/steps/*`, `/api/dishes/{id}/attempts` → Recipe 기반으로 재설계

---

## 13. Migration Plan (v0.5 신규 — 이번 사이클 실행 OOS)

> 다음 사이클 첫 작업 라벨. Migration Plan 문서까지 작성. 실행(코드 마이그레이션)은 다음 사이클.

### 13.1 사전 조건

1. **Supabase snapshot 백업** (필수 — 롤백 기준점)
2. **로컬 또는 staging 환경에서 dry-run** (`BEGIN` → 스크립트 전체 실행 → `ROLLBACK`)
3. **record count 검증**: 각 단계 후 before/after count 일치 확인

### 13.2 Migration 단계별 SQL 스크립트

```sql
-- ============================================================
-- Migration v0.4 → v0.5 (nayo Recipe 중심 재설계)
-- 실행 환경: Supabase Postgres
-- 실행 방식: BEGIN/COMMIT transaction (dry-run: BEGIN/ROLLBACK)
-- ============================================================

BEGIN;

-- ── STEP 1: 신규 테이블 생성 ──────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  title text NOT NULL,
  servings text,
  description text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount text NOT NULL,
  unit text,
  optional boolean NOT NULL DEFAULT FALSE,
  display_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  display_order integer NOT NULL,
  instruction text NOT NULL,
  timer_seconds integer CHECK (timer_seconds >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('youtube', 'blog', 'text', 'manual')),
  url text,
  raw_content text,
  youtube_video_id text,
  title text,
  channel text,
  thumbnail_url text,
  published_at timestamptz,
  is_unavailable_on_source boolean NOT NULL DEFAULT FALSE,
  fetched_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- PARTIAL UNIQUE: (recipe_id, url) WHERE url IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS recipe_sources_url_unique
  ON recipe_sources (recipe_id, url)
  WHERE url IS NOT NULL;

CREATE TABLE IF NOT EXISTS recipe_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  base_ingredient_id uuid REFERENCES recipe_ingredients(id) ON DELETE SET NULL,
  base_step_id uuid REFERENCES recipe_steps(id) ON DELETE SET NULL,
  diff_type text NOT NULL CHECK (diff_type IN ('amount_adjust', 'step_note', 'swap', 'skip')),
  diff_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempt_step_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  recipe_step_id uuid REFERENCES recipe_steps(id) ON DELETE SET NULL,
  video_timestamp integer CHECK (video_timestamp >= 0),
  note text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- ── STEP 2: videos → recipe_sources 데이터 복사 ──────────────
-- (recipe_id는 STEP 4에서 갱신 예정 — 임시 placeholder NULL)

INSERT INTO recipe_sources (
  id, recipe_id, type,
  url, youtube_video_id,
  title, channel, thumbnail_url, published_at,
  is_unavailable_on_source, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid, -- 임시 placeholder (STEP 4에서 갱신)
  'youtube',
  'https://www.youtube.com/watch?v=' || youtube_video_id,
  youtube_video_id,
  title,
  channel,
  thumbnail_url,
  published_at,
  is_unavailable_on_youtube,
  created_at
FROM videos;

-- ── STEP 3: Dish별 placeholder Recipe 생성 ───────────────────
-- 각 Dish 1개당 Recipe 1개 placeholder ("기본 레시피" 제목)

INSERT INTO recipes (id, dish_id, user_id, title, created_at, updated_at)
SELECT
  gen_random_uuid(),
  id AS dish_id,
  user_id,
  name || ' 기본 레시피' AS title,
  created_at,
  created_at
FROM dishes;

-- ── STEP 4: recipe_sources.recipe_id 갱신 ────────────────────
-- videos.dish_id → recipes.dish_id 매핑으로 recipe_id 연결

UPDATE recipe_sources rs
SET recipe_id = r.id
FROM videos v
JOIN recipes r ON r.dish_id = v.dish_id
WHERE rs.youtube_video_id = v.youtube_video_id
  AND rs.recipe_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- ── STEP 5: attempts 테이블 변경 ─────────────────────────────

-- 5-a: recipe_id 컬럼 추가 (nullable — STEP 5-c에서 NOT NULL 추가)
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES recipes(id) ON DELETE RESTRICT;

-- 5-b: attempts.video_id → recipes.id 매핑
UPDATE attempts a
SET recipe_id = r.id
FROM videos v
JOIN recipes r ON r.dish_id = v.dish_id
WHERE a.video_id = v.id;

-- 5-c: recipe_id NOT NULL 제약 추가 (모두 매핑된 후)
ALTER TABLE attempts ALTER COLUMN recipe_id SET NOT NULL;

-- 5-d: video_id 컬럼 제거
ALTER TABLE attempts DROP COLUMN IF EXISTS video_id;

-- ── STEP 6: steps → attempt_step_notes 복사 ──────────────────
-- 기존 steps 테이블의 note/video_timestamp를 attempt_step_notes로 이관
-- recipe_step_id는 NULL (기존 step은 RecipeStep과 1:1 매핑 불가)

INSERT INTO attempt_step_notes (id, attempt_id, recipe_step_id, video_timestamp, note, created_at)
SELECT
  gen_random_uuid(),
  attempt_id,
  NULL, -- recipe_step_id 미매핑 (사용자가 후속 연결 또는 폐기)
  video_timestamp,
  note,
  created_at
FROM steps
WHERE deleted_at IS NULL; -- soft delete된 step은 이관 제외

-- ── STEP 7: 인덱스 생성 ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS dishes_user_id_idx ON dishes (user_id);
CREATE INDEX IF NOT EXISTS recipes_dish_user_idx ON recipes (dish_id, user_id);
CREATE INDEX IF NOT EXISTS recipes_user_archived_idx ON recipes (user_id, archived_at);
CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_order_idx ON recipe_ingredients (recipe_id, display_order);
CREATE INDEX IF NOT EXISTS recipe_steps_recipe_order_idx ON recipe_steps (recipe_id, display_order);
CREATE INDEX IF NOT EXISTS recipe_sources_recipe_idx ON recipe_sources (recipe_id);
CREATE INDEX IF NOT EXISTS recipe_customizations_recipe_idx ON recipe_customizations (recipe_id);
CREATE INDEX IF NOT EXISTS attempts_recipe_idx ON attempts (recipe_id, deleted_at, tried_at DESC);
CREATE INDEX IF NOT EXISTS attempts_user_tried_at_idx ON attempts (user_id, tried_at DESC);
CREATE INDEX IF NOT EXISTS attempt_step_notes_attempt_idx ON attempt_step_notes (attempt_id);

-- ── STEP 8: 구 테이블 drop ───────────────────────────────────
-- 반드시 record count 검증 후 실행

DROP TABLE IF EXISTS steps;
DROP TABLE IF EXISTS videos;

-- ── STEP 9: record count 검증 쿼리 (ROLLBACK 전 실행) ─────────
SELECT 'recipes' as tbl, COUNT(*) FROM recipes
UNION ALL SELECT 'recipe_sources', COUNT(*) FROM recipe_sources
UNION ALL SELECT 'attempts', COUNT(*) FROM attempts
UNION ALL SELECT 'attempt_step_notes', COUNT(*) FROM attempt_step_notes;

-- dry-run 시: ROLLBACK; (검증 후 문제 없으면 COMMIT)
COMMIT;
-- dry-run: ROLLBACK;
```

### 13.3 Rollback 시나리오

```
1. Supabase Dashboard → Project → Database → Backups → 마이그레이션 직전 snapshot 복원
2. 로컬 dry-run: 위 SQL을 BEGIN; … ROLLBACK; 으로 실행 → 실제 DB 변경 없음
3. Staging 검증 후 프로덕션 적용 (Supabase staging project 권장)
```

### 13.4 Dry-run 절차

```bash
# 1. 로컬 Supabase 시작
supabase start

# 2. 현재 스키마 적용
pnpm drizzle-kit push

# 3. dry-run SQL 실행 (BEGIN → 스크립트 → record count 확인 → ROLLBACK)
psql $DATABASE_URL -c "BEGIN; \i migration-v0.5-dryrun.sql; SELECT 'recipes', COUNT(*) FROM recipes; ROLLBACK;"

# 4. 이상 없으면 프로덕션에서 COMMIT으로 실행
```

---

## 14. LLM 비용 전략 (v0.5 신규 — 실호출 구현 다음 사이클)

### 14.1 Provider 우선순위

| 순위 | Provider | 무료 한도 (2026-05 기준 — 실호출 직전 재확인 필수) |
|------|----------|------------------------------------------------|
| 1순위 | Gemini API free tier (gemini-1.5-flash) | 15 RPM / 1500 req/day / 1M tokens/min |
| 2순위 | OpenAI gpt-4o-mini | 유료 (실호출 이전 단계 미사용) |

### 14.2 호출 시점

- `/api/recipes/ingest` 에서 규칙 기반 파싱 결과 confidence == 'low'일 때만 1회 호출
- 검색·조회 단계 LLM 호출 **절대 금지**
- 동일 URL 결과 캐시: `ingestion_cache.cache_key = hash(sourceType + url|text)` (이번 사이클 설계만)

### 14.3 프롬프트 설계 (다음 사이클 구현 대비 명세)

```
system: "한국어 요리 텍스트에서 재료와 조리 단계를 JSON으로 추출하세요.
         확실하지 않으면 추측하지 말고 해당 필드를 비워두세요.
         재료가 없으면 빈 배열, 단계가 없으면 빈 배열을 반환하세요."

user: "{raw_content}"

response_schema:
{
  "title": "string",
  "servings": "string | null",
  "ingredients": [
    { "name": "string", "amount": "string", "optional": "boolean" }
  ],
  "steps": [
    { "order": "number", "instruction": "string", "timer_seconds": "number | null" }
  ],
  "tips": ["string"]
}
```

### 14.4 무료 사용 제어

```typescript
// 이번 사이클: 설계만. 실호출 다음 사이클.
// 검증 단계 (1인 사용자 + Gemini 무료 한도 1500/day로 충분)
const MAX_MONTHLY_LLM_CALLS = 30; // 무료 사용자 월 한도 (설계 기준값)

// LLM 실호출 전 확인 로직 (다음 사이클 구현 시 활성화)
async function checkLLMQuota(userId: string): Promise<boolean> {
  const month = new Date().toISOString().slice(0, 7); // "2026-05"
  // usage_counters 조회 → llm_count < MAX_MONTHLY_LLM_CALLS
  return true; // stub
}
```

### 14.5 오류 처리

- LLM 응답이 schema 위반 시 1회 재시도
- 그래도 실패 시: 사용자 텍스트 폴백 안내 (검수 화면에서 빈 필드 표시 + "내용을 직접 입력해주세요")

---

## 15. 홈 쿼리 명세 (v0.5 재설계)

### 15.1 쿨타임 쿼리 (안 먹은 지 N일)

```typescript
// GET /api/home → 쿨타임 Recipe (기본 3개, 더보기 최대 7개)
const cooldownRecipes = await db
  .select({
    recipe: recipes,
    lastTriedAt: sql<string | null>`MAX(${attempts.triedAt})`,
    daysSince: sql<number | null>`(CURRENT_DATE - MAX(${attempts.triedAt}))::integer`,
    avgRating: sql<string | null>`ROUND(AVG(${attempts.rating}::numeric), 1)`,
    attemptCount: sql<number>`COUNT(${attempts.id})::integer`,
  })
  .from(recipes)
  .leftJoin(
    attempts,
    and(eq(attempts.recipeId, recipes.id), isNull(attempts.deletedAt)),
  )
  .where(and(eq(recipes.userId, userId), isNull(recipes.archivedAt)))
  .groupBy(recipes.id)
  .orderBy(sql`MAX(${attempts.triedAt}) ASC NULLS LAST`) // 오래된 순 (NULLS LAST = 미시도 레시피는 맨 뒤)
  .limit(7); // 기본 3개 표시, 클라이언트에서 더보기 시 7개까지
```

### 15.2 최근 만든 레시피

```typescript
// 최근 5개 Attempt → Recipe JOIN
const recentAttempts = await db
  .select({ recipe: recipes, attempt: attempts })
  .from(attempts)
  .innerJoin(recipes, eq(attempts.recipeId, recipes.id))
  .where(
    and(
      eq(attempts.userId, userId),
      isNull(attempts.deletedAt),
      isNull(recipes.archivedAt),
    ),
  )
  .orderBy(desc(attempts.triedAt))
  .limit(5);
```

### 15.3 자주 만든 메뉴 Top 3

```typescript
// Dish JOIN Recipe JOIN Attempt → attempt_count DESC
const topDishes = await db
  .select({
    dish: dishes,
    attemptCount: sql<number>`COUNT(${attempts.id})::integer`,
  })
  .from(dishes)
  .innerJoin(recipes, eq(recipes.dishId, dishes.id))
  .innerJoin(attempts, eq(attempts.recipeId, recipes.id))
  .where(
    and(
      eq(dishes.userId, userId),
      isNull(attempts.deletedAt),
      isNull(recipes.archivedAt),
    ),
  )
  .groupBy(dishes.id)
  .orderBy(desc(sql`COUNT(${attempts.id})`))
  .limit(3);
```

**성능:** 세 쿼리 `Promise.all` 병렬 실행. TanStack Query `staleTime: 5분`.

---

## 16. 자동완성 LIKE 쿼리 (v2.0 유지)

```typescript
// GET /api/dishes/autocomplete?q={prefix}
export async function getAutocompleteDishes(userId: string, query: string) {
  return db
    .select()
    .from(dishes)
    .where(
      and(eq(dishes.userId, userId), sql`LOWER(${dishes.name}) LIKE LOWER(${"%" + query + "%"})`),
    )
    .limit(8);
}

// Recipe title 자동완성도 동일 패턴 (선택)
export async function getAutocompleteRecipes(userId: string, query: string) {
  return db
    .select()
    .from(recipes)
    .where(
      and(
        eq(recipes.userId, userId),
        isNull(recipes.archivedAt),
        sql`LOWER(${recipes.title}) LIKE LOWER(${"%" + query + "%"})`,
      ),
    )
    .limit(8);
}
```

- 한글 형태소 미적용 (Phase 2 OQ5/U1)
- 디바운스 300ms: 클라이언트 SearchInput 컴포넌트에 적용

---

## 17. 자체 구현 컴포넌트 a11y (v2.0 유지 + v0.5 신규 컴포넌트)

| 컴포넌트 | 위치 | a11y 구현 책임 |
|----------|------|--------------|
| `BottomSheet` | `components/ui/bottom-sheet.tsx` | focus trap, ESC 닫기, body scroll lock, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `Dialog` | `components/ui/dialog.tsx` | focus trap, ESC 닫기, backdrop 클릭 닫기, body scroll lock, `role="dialog"`, `aria-modal="true"` |
| `AmountStepper` | `components/ui/amount-stepper.tsx` | **56×56px 터치 타겟 (요건 필수)**. `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="{재료명} 수량"`. ArrowUp/Down 키. 최솟값(0) 시 `[–]` `aria-disabled="true"` |
| `ConfidenceField` | `components/ui/confidence-field.tsx` | `aria-describedby="confidence-hint-{fieldId}"`. 힌트 텍스트: 숨겨진 텍스트 포함. 아이콘(⚠/✓) + 텍스트 병행 (색상 단독 전달 금지) |
| `RecipeCustomizationSheet` | `components/ui/recipe-customization-sheet.tsx` | BottomSheet/Dialog 분기. focus trap. 열릴 때 첫 번째 AmountStepper `[–]`로 포커스. ESC 닫힘 시 "조정하기" CTA로 포커스 복귀 |
| `IngredientRow` | `components/ui/ingredient-row.tsx` | drag handle: `role="button"`, `aria-grabbed`, `aria-roledescription="재정렬 핸들"`. 삭제: `aria-label="이 재료 삭제"` |
| `StepRow` | `components/ui/step-row.tsx` | drag handle: `role="button"`, `aria-grabbed`. 삭제: `aria-label="이 단계 삭제"` |
| `SourceBadge` | `components/ui/source-badge.tsx` | `aria-label="출처: {type}"`. 아이콘 only → label 필수 |
| `SourceCard` | `components/ui/source-card.tsx` | is_unavailable_on_source=true 시: `aria-label="접근 불가 소스: {title}"`, 탭 불가 |
| `CooldownCard` | `components/ui/cooldown-card.tsx` | `aria-label="안 먹은 지 {N}일: {Recipe title}"`. 미시도: "아직 시도 안 함" |
| `DeletedSourceAlert` | `components/ui/deleted-source-alert.tsx` | `role="alert"`. `aria-label="접근 불가 소스: {title}"` |
| `StarRating` | `components/ui/star-rating.tsx` | `role="radiogroup"`. 각 별 `role="radio"`, `aria-label="{N}점"`. ArrowLeft/Right |
| `Combobox` | `components/ui/combobox.tsx` | `role="combobox"`, `aria-expanded`, `aria-activedescendant`. dropdown: `role="listbox"`. 항목: `role="option"`, `aria-selected`. 키보드: ↑↓ Enter ESC Tab |
| `Toast` | `components/ui/toast.tsx` | `role="status"` (성공), `role="alert"` (실패), `aria-live` |
| `EmptyState` | `components/ui/empty-state.tsx` | `role="region"`, `aria-label` 각 상황 명시 |

**focus trap 구현 (v2.0 유지):**
- 외부 라이브러리 없이 직접 구현
- 모달 마운트 시 focusable elements 수집 → 첫 번째로 `focus()` → Tab/Shift+Tab 경계 순환 → 언마운트 시 트리거 버튼으로 포커스 복귀

**body scroll lock 구현 (v2.0 유지):**
```typescript
// hooks/use-body-scroll-lock.ts — v2.0 유지
```

---

## 18. 시각 품질 계획 (VQ) — v0.5 갱신

design-decision.md VQ1~VQ5 기반.

| 기준 | 구현 방식 | 관련 컴포넌트 |
|------|---------|------------|
| VQ1 인터랙션 상태 | Tailwind hover:/focus:/disabled: 유틸리티. `transform: scale(0.95)` active. 포커스 링 2px solid `{colors.primary-focus}`. AmountStepper `[±]`: hover 배경 `rgba(0,0,0,0.06)`, active scale(0.95) + 햅틱. ConfidenceField: low=노란 border, high=초록 border | Button, AmountStepper, RecipeCard, IngredientRow, StepRow, ConfidenceField |
| VQ2 빈/로딩/에러 | Skeleton 컴포넌트 shimmer. EmptyState 공통화. Ingestion 5-B: IngredientRow·StepRow 형태 Skeleton 순차 애니메이션. ErrorBoundary 적용 | Skeleton, EmptyState, Ingestion 처리 중 화면 |
| VQ3 트랜지션 | BottomSheet `transform 300ms ease-out`. Dialog `opacity+transform 200ms ease-out`. 더보기 `max-height 250ms ease-in-out`. AmountStepper 값 변경 `opacity 80ms`. Toast fade-in 150ms/5s/fade-out 150ms. 최대 300ms 준수 | BottomSheet, Dialog, AmountStepper, Toast |
| VQ4 레이아웃 | `{spacing.xl}` 32px 좌우 여백(모바일). `{spacing.section}` 80px 섹션 padding. `max-w-[1440px]`. AmountStepper `[±]` 56×56px. IngredientRow/StepRow 최소 높이 56px. RecipeCustomizationSheet max-width 560px(≥834px). Dialog max-width 640px | 전체 페이지 레이아웃, AmountStepper, RecipeCustomizationSheet |
| VQ5 포커스·aria | focus trap 자체 구현 (외부 라이브러리 없음). RecipeCustomizationSheet 열릴 때 첫 AmountStepper `[–]`로 포커스. Ingestion 저장 후 Recipe 상세 `<h1>`으로 포커스. Confirmation Dialog (삭제): 초기 포커스 "취소" 버튼 | BottomSheet, Dialog, RecipeCustomizationSheet, Combobox |

---

## 19. 환경변수 / 시크릿 관리

| 변수명 | 위치 | 설명 |
|--------|------|------|
| `DATABASE_URL` | server-side only | Supabase Postgres direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 노출 가능 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 클라이언트 노출 가능 | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side only | 관리 목적. API Route에서만 사용 |
| `YOUTUBE_API_KEY` | server-side only | YouTube Data API v3 키. 클라이언트 미노출 |
| `GEMINI_API_KEY` | server-side only | Gemini API 키 (다음 사이클 실호출 시 필요). `NEXT_PUBLIC_` prefix 절대 금지 |

---

## 20. 테스트 케이스 명세서 (TC — v0.5 전면 갱신)

| TC# | 대상 AC | 시나리오 | 유형 | 비고 |
|-----|--------|--------|------|------|
| TC-01 | 검색 정렬 (AC §4.2) | average_rating ≥ 4.0 Recipe 존재 → "높은 평점" 섹션 상단 표시, rating DESC 정렬 | 자동화 | sortRecipeResults() 단위 테스트 |
| TC-02 | 검색 정렬 (AC §4.2) | attempt_count ≥ 2 Recipe만 존재 → "높은 평점" 섹션 포함 | 자동화 | sortRecipeResults() 단위 테스트 |
| TC-03 | 검색 정렬 (AC §4.2) | 조건 미충족 → "높은 평점" 섹션 미생성, 전체 created_at DESC | 자동화 | sortRecipeResults() 단위 테스트 |
| TC-04 | 검색 정렬 (AC §4.2) | archived Recipe → 검색 결과 미노출 | 자동화 | sortRecipeResults() 단위 테스트 |
| TC-05 | Recipe CRUD (AC §4.4) | 정상 생성 — title, ingredients[], steps[], sources[] 일괄 transaction | 자동화 | API Route 단위 테스트 |
| TC-06 | Recipe CRUD (AC §4.4) | Recipe hard delete 시 Attempt >= 1 → 422 반환 + archived_at 전환 권고 | 자동화 | API Route 단위 테스트 |
| TC-07 | 파생 필드 (AC §3.2 Recipe) | Attempt 추가 후 average_rating 재계산 정확성 (numeric 소수점 1자리) | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-08 | 파생 필드 (AC §3.2 Recipe) | Attempt 0건 Recipe의 파생 필드 null 처리 (days_since_last_tried=null) | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-09 | AmountStepper a11y (AC §4.5) | role=spinbutton + aria-valuenow 초기값 렌더링 | 자동화 | Vitest + @testing-library |
| TC-10 | AmountStepper a11y (AC §4.5) | ArrowUp 키 → aria-valuenow +step 단위 갱신 | 자동화 | Vitest + @testing-library |
| TC-11 | AmountStepper a11y (AC §4.5) | 최솟값(0) 도달 시 [–] 버튼 aria-disabled="true" + opacity 50% | 자동화 | Vitest + @testing-library |
| TC-12 | ConfidenceField a11y (AC §5 Ingestion) | low confidence → 노란 border + ⚠ 아이콘 + aria-describedby 연결 | 자동화 | Vitest + @testing-library |
| TC-13 | RecipeCustomizationSheet a11y (AC §4.5) | Sheet 열릴 때 첫 AmountStepper [–] 버튼으로 포커스 이동 | 자동화 | Vitest + @testing-library |
| TC-14 | RecipeCustomizationSheet a11y (AC §4.5) | ESC 키 → Sheet 닫힘 + "조정하기" 버튼으로 포커스 복귀 | 자동화 | Vitest + @testing-library |
| TC-15 | IngredientRow/StepRow a11y (AC §4.4) | drag handle role=button + aria-grabbed 속성 존재 | 자동화 | Vitest + @testing-library |
| TC-16 | YouTube 캐시 HIT (AC §4.1) | 캐시 HIT → YouTube API 미호출 | 자동화 | Mock YouTube API |
| TC-17 | YouTube 캐시 MISS (AC §4.1) | 캐시 MISS + 만료 → YouTube API 호출 + 캐시 갱신 | 자동화 | Mock YouTube API |
| TC-18 | YouTube Quota 429 (AC §4.1) | YouTube API 429 → 클라이언트 EmptyState "잠시 후 다시 시도해주세요" | 자동화 | Mock 429 응답 |
| TC-19 | Ingestion 규칙 파싱 (AC §4.3) | 정형화된 텍스트 입력 → 재료 5+ / 단계 3+ 추출 → confidence=high | 자동화 | 규칙 파싱 단위 테스트 |
| TC-20 | Ingestion 규칙 파싱 (AC §4.3) | 비정형 텍스트 입력 → 재료 0개 → confidence=low → callLLMForIngestion stub 호출 | 자동화 | stub 호출 여부 검증 |
| TC-21 | Ingestion SSRF 차단 (AC §4.3) | blog type + localhost URL → 400 Bad Request | 자동화 | assertSafeUrl 단위 테스트 |
| TC-22 | 홈 쿼리 (AC §4.8) | 쿨타임 쿼리 — tried_at 오래된 순 정렬 / 미시도 Recipe NULLS LAST | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-23 | 홈 쿼리 (AC §4.8) | 최근 만든 레시피 5개 tried_at DESC / 자주 만든 메뉴 Top 3 count DESC | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-24 | Migration dry-run (AC §13) | BEGIN → Migration SQL 전체 실행 → record count 검증 → ROLLBACK 성공 | 수동 QA | TC 필수 (T3 통과 조건) |
| TC-25 | Attempt FK 무결성 (AC §3.7) | v0.5 migration 후 attempts.recipe_id NOT NULL 강제 / video_id 컬럼 부재 확인 | 수동 QA | Migration 후 schema 검증 |
| TC-26 | AttemptStepNote 검증 (AC §3.8) | video_timestamp 음수 입력 → 400 Bad Request | 자동화 | zod 스키마 단위 테스트 |
| TC-27 | 삭제 정책 (AC §4.9) | Attempt soft delete → 휴지통 조회 → 복구 → 목록 복귀 | 자동화 | API Route 단위 테스트 |
| TC-28 | 삭제 정책 (AC §4.9) | Recipe archived_at 전환 → 검색/홈 비노출 / 메뉴 페이지 "숨긴 레시피 보기" 표시 | 자동화 | API Route 단위 테스트 |
| TC-29 | 삭제 정책 (AC §4.9) | RecipeSource soft delete → Recipe·Attempt 보존 확인 | 자동화 | API Route 단위 테스트 |
| TC-30 | Source 접근 불가 감지 (AC §4.10) | YouTube videos.list items[] 빈 응답 → is_unavailable_on_source=true 갱신 | 자동화 | Mock YouTube API |
| TC-31 | Source 접근 불가 감지 (AC §4.10) | Blog URL 404 → is_unavailable_on_source=true 갱신 | 자동화 | Mock fetch 404 |
| TC-32 | BottomSheet/Dialog a11y (v2.0 유지) | 열릴 때 첫 필드 포커스 / ESC 닫힘 / focus trap / 트리거 복귀 | 자동화 | Vitest + @testing-library |

---

## 21. 미해결 / 후속 결정

| ID | 항목 | 현재 결정 | 후속 검토 시점 |
|----|------|----------|--------------|
| U1 | 한글 자동완성 정확도 | MVP는 `LOWER(name) LIKE LOWER('%query%')` sequential scan 허용 | 실사용 후 결정 |
| U2 | youtube_cache TTL | 24h (기본값) | API quota 소진율 모니터링 후 72h/7d 연장 검토 |
| U3 | Drizzle migration 자동화 | 수동 (`drizzle-kit migrate` 수동 실행) | Vercel 배포 훅 연동 검토 |
| U4 | LLM fallback threshold | M5(Ingestion 성공률) 측정 후 결정 | 다음 사이클 실사용 데이터 기반 |
| U5 | Gemini free tier 세부 한도 재확인 | 2026-05 기준 명세 (실호출 직전 공식 문서 재확인 필수) | 다음 사이클 실호출 구현 직전 |
| U6 | Recipe 영구 삭제 플로우 | Attempt 모두 영구 삭제 후 Recipe hard delete — design-decision에서 ENGINEER 확정 위임 | 다음 사이클 BUILD 전 |
| U7 | is_unavailable_on_source 자동 체크 | MVP: lazy check만. Cron 주기적 체크는 U7 미결 | 실사용 후 결정 |
| U8 | ingestion_cache 만료 정책 | 설계만 (이번 사이클 OOS). 다음 사이클 실호출 시 TTL 결정 | 다음 사이클 |

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | ORM 결정 | Drizzle 채택. Auth만 supabase-js 사용. |
| 2026-05-03 | UI 컴포넌트 결정 | 자체 구현 (Vaul·Radix UI Dialog 폐기). a11y 책임 명시. |
| 2026-05-03 | 환경변수 구조 | DATABASE_URL + SUPABASE_URL/KEY + YOUTUBE_API_KEY. server-side 격리. |
| 2026-05-03 | 검색 정렬 책임 | API Route: DB 집계 + YouTube 캐시. 클라이언트: 최종 정렬 분리. |
| 2026-05-03 | 보안 경계 재정의 | Drizzle direct DATABASE_URL에서 RLS auth.uid() 미작동. WHERE user_id 단일 보안 경계. |
| 2026-05-03 | 캐시 키 통일 | youtube_cache.cache_key TEXT UNIQUE. "search:"+normalized_query / "video:"+youtube_video_id prefix. |
| 2026-05-14 | v0.5 PIVOT 재작성 (Hephaestus dev-dialogue rewind 2차) | PRD v0.5 + Design Decision v2.0 후속. §3 스키마 전면 재설계 (Recipe 1급 엔티티 + RecipeIngredient + RecipeStep + RecipeSource + RecipeCustomization + AttemptStepNote). §3.4 Recipe.archived → archived_at (옵션 B 채택). §3.5 단계 메모 → AttemptStepNote 별도 테이블 (옵션 A 채택). §7 Ingestion API 신규 명세 (규칙 파싱 + LLM stub + zod 스키마). §8 AmountStepper ± 단위 정책. §9 ConfidenceField threshold 산출식. §10 삭제 정책 Recipe archived_at 갱신. §12 API contract 22→32개 확장. §13 Migration Plan SQL 스크립트 명세. §14 LLM 비용 전략 + 프롬프트 설계. §15 홈 쿼리 재설계. §17 신규 컴포넌트 13종 a11y 명세. TC-01~TC-32 전면 갱신. T1-T6 전항목 PASS. |
| 2026-05-14 | 팀 결정 dev-gate-003 자동 적용 | API 미개발 단계 (LLM 실호출 OOS) → Zustand Mock Store 패턴 자동 적용. callLLMForIngestion stub + 클라이언트 Mock Store 패턴. |
