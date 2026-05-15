# v0.5 BUILD — nayo (나만의요리사) Recipe 중심 레시피북

> 작성일: 2026-05-15
> 기반: PRD v0.5.3 / Design v2.0.1 / Tech v3.0.2 / Decision Log v2.3 (L49~L70) / next-cycle-jira-plan v5
> 사이클: BUILD + VERIFY + SHIP + REFLECT (v0.5 PIVOT 첫 출시)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v0.5 PIVOT 설계 패키지(L49~L70)에 따라 nayo를 **Recipe 중심 개인 레시피북**으로 새로 구현한다.
**H5(Ingestion 규칙 기반 파싱 충분성) 단독 검증**을 핵심 학습 목표로 두고,
운영 1~2주 후 H1'/H4/H5 1차 신호를 확보하는 데까지 도달한다.

핵심 정체성:

> 다양한 출처(YouTube / blog / text)의 레시피를 내 Recipe로 정규화·축적하여
> 이전 실패와 변형 이력을 Recipe 단위로 누적하는 개인 레시피북.

구현 대상 기능 (PRD v0.5.3 §5.1 — L69+L70 좁힌 스코프, 9개 Jira 티켓 F-0~F-8과 매핑):

- (F-0) DB 리셋 + v0.5 신규 셋업 (9테이블 + raw SQL PARTIAL UNIQUE)
- (F-1) Ingestion 흐름 — YouTube URL 자동 메타 + 텍스트 직접 붙여넣기 → 규칙 파싱 → Draft → 검수 → 저장 **(이번 사이클 핵심)**
- (F-2) Recipe CRUD — 재료/단계/Source 인라인 편집
- (F-3) 검색 + 자동완성 + Recipe 평점 정렬
- (F-4) 단순 메뉴 페이지 + Recipe 상세
- (F-5) 시도 기록 (Attempt) + 선택적 단계별 메모 (AttemptStepNote) — L70
- (F-6) 단순 홈 (검색바 + 최근 만든 Recipe 5개)
- (F-7) 빌드 검증 + 배포 + canary
- (F-8) 운영 1~2주 후 회고 → v0.6 스코프 결정 트리거

산출 화면 7개 (design-decision v2.0.1 §화면 인벤토리, v0.5 OOS 화면 제외): 0. 홈 / 1. 검색 / 2. 메뉴 페이지 / 3. Recipe 상세·편집 / 4. Ingestion(입력+검수) / 5. Attempt Sheet / 6. 단순 휴지통

산출 API 약 24개 (tech-decision v3.0.2 §12 중 v0.5 IN 항목만):

- Ingestion 2개 / Recipe CRUD 11개 / Attempt + StepNote 7개 / 검색·홈·Dish 4개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

작업 디렉토리: `/Users/hm2/Private/nayo` (환경에 따라 path 다를 수 있음)

현재 상태:

- `docs/nayo/` v0.5 설계 패키지 완성 (PRD v0.5.3, Design v2.0.1, Tech v3.0.2, Decision Log v2.3)
- v0.4 BUILD 직전까지 작성된 코드 = **L67 결정으로 폐기 또는 archive 브랜치 보관**
- L67: DB 리셋 + 신규 셋업 → 코드 작업도 zero-state에서 새로 시작
- v0.4 코드 보존 방식 (택1, 작업 전 결정):
  - (A) `archive/v0.4` 브랜치로 보관 후 main 리셋
  - (B) v0.4 리포지토리를 별도 보관 (github.com/hyoungqu23/moyo) + 새 리포지토리에서 v0.5 시작
  - (C) main에서 v0.4 코드 git rm 후 새 커밋 시작

핵심 참조 문서 (모두 `docs/nayo/` 하위, **변경 금지**):

- prd.md v0.5.3 — Recipe 중심 데이터 모델 / 기능 요구사항 / MVP 스코프 / 가설 H1'~H6 / 지표 M1~M6
- tech-decision.md v3.0.2 — 스택 / 9테이블 Drizzle 스키마 / API contract / Ingestion 흐름 / LLM stub / 정렬 분리
- design-decision.md v2.0.1 — 화면 인벤토리 / 반응형 분기 / 자체 구현 컴포넌트 / VQ / a11y
- design-system.md — Apple Web Design System 토큰
- decision-log.md v2.3 — L1~L70 의사결정 종합 (특히 L65 CASCADE / L67 리셋 / L68 H6 56px / L69 스코프 / L70 StepNote)
- next-cycle-jira-plan.md v5 — F-0~F-8 9개 티켓 (Jira 진입 시 직접 복사)
- improvement-backlog.md v2 — F1-1~F4-4 누적 friction
- harness-state.md — PM Working Memory

산출 디렉토리 구조 (tech-decision §3.1 + §13 기반):

- `app/` Next.js App Router (page / layout / route handlers)
- `app/api/` API Route 약 24개 (zod + requireAuth + Drizzle)
- `components/ui/` 자체 구현 컴포넌트
  - 신규: IngredientRow / StepRow / ConfidenceField / SourceCard / SourceBadge
  - 기존 재사용: BottomSheet / Dialog / Combobox / StarRating / ToggleGroup / Toast / Skeleton / EmptyState / Button(primary/secondary-pill)
- `db/schema.ts` Drizzle 단일 스키마 (9테이블)
- `db/migrations/` drizzle-kit generate 산출 + raw SQL PARTIAL UNIQUE 1개
- `lib/auth.ts` requireAuth() 미들웨어 (Supabase OAuth)
- `lib/sort-recipes.ts` sortRecipeResults() 순수 함수
- `lib/youtube.ts` YouTube Data API videos.list 래퍼
- `lib/ingestion/`
  - `parse-rules.ts` 규칙 기반 파싱 (재료 정규식 + 단계 번호 매김)
  - `confidence.ts` low/med/high 산출
  - `llm-stub.ts` callLLMForIngestion() → throw (실호출 OOS)
- `hooks/` use-body-scroll-lock 등
- `drizzle.config.ts`
- `tailwind.config.ts` Apple 토큰 매핑 (tech-decision §13.1)
- `vitest.config.ts`
- `playwright.config.ts` (E2E 선택, Ingestion 흐름 1개)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[기술 스택 — tech-decision §2, 변경 금지]

- Next.js App Router (Pages Router 금지)
- TypeScript strict + path alias `@/`
- Drizzle ORM (DB 쿼리) + supabase-js (Auth만) — 역할 분리 엄수
- Tailwind CSS + design-system.md 토큰. shadcn/ui default 미사용
- TanStack Query (서버 상태) + react-hook-form + zod
- Vitest (단위/컴포넌트) + Playwright (E2E 선택)

[보안 경계 — tech-decision §4.2, 위반 시 즉시 fail]

- 모든 API Route에 `requireAuth()` 필수
- 모든 Drizzle 쿼리에 `eq(테이블.userId, userId)` 명시
- Drizzle direct connection에서 RLS 미작동 → WHERE user_id가 단일 보안 경계
- **소유권 체인 검증** (L65 CASCADE 정합):
  - Recipe 하위 리소스(Ingredient/Step/Source/Customization) 접근 전 Recipe.userId 선검증
  - AttemptStepNote 접근 전 Attempt.userId 선검증 + Attempt → Recipe.userId 체인
- `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY`: server-side only
- **v0.5 외부 fetch = YouTube Data API `videos.list`만**. 임의 URL 서버 fetch 금지 (SSRF 위험 0)
- blog 입력은 사용자가 텍스트 직접 붙여넣기로만 처리 (자동 fetch 안 함)

[자체 구현 컴포넌트 a11y — tech-decision §13.2, design-decision §접근성]

- BottomSheet / Dialog: focus trap + ESC 닫기 + body scroll lock + role="dialog" + aria-modal
- Combobox: role="combobox" + aria-expanded/controls/activedescendant + ↑↓ Enter ESC Tab
- StarRating: role="slider" + aria-valuenow/min/max + ArrowLeft/Right
- ConfidenceField: aria-describedby + ⚠ 아이콘 병행 (색상 단독 정보 전달 금지)
- IngredientRow / StepRow: drag handle role="button" + aria-grabbed + ArrowUp/Down 키보드 reorder
- 외부 headless UI 라이브러리 도입 금지 (Radix / Vaul 등)
- 포커스 링: 2px solid #0071e3
- 터치 타겟 최소 44×44px

[디자인 토큰 — design-system.md + tech-decision §13.1]

- Single accent: `{colors.primary} #0066cc` 하나. 두 번째 브랜드 컬러 금지
- danger 컬러 `rgb(220, 38, 38)`: v0.5는 사실상 미사용 (영구 삭제 다이얼로그 OOS-5d)
- Photography-first: 카드 / 버튼 / 텍스트에 shadow 금지. product-shadow는 썸네일 / 영상에만
- 트랜지션: 150~300ms, 500ms 이상 금지
- 모바일 퍼스트, breakpoint ≤833px ↔ ≥834px (시도 기록 입력: BottomSheet ↔ Dialog 분기)

[데이터 정합성 — tech-decision §3 + §10]

- `attempts.recipe_id` FK `ON DELETE CASCADE` (L65) — Recipe hard delete 시 attempts/step-notes 함께 정리
- `recipe_sources` PARTIAL UNIQUE `(recipe_id, url) WHERE url IS NOT NULL` — Drizzle 자동 미지원, **raw SQL migration 필수** (L67 / F4-3)
- `attempt_step_notes`: attempt_id CASCADE, recipe_step_id SET NULL
- **`attempt_step_notes.video_timestamp` 컬럼은 스키마 존재, v0.5는 항상 null 저장** (자동 캡처 OOS, L70)
- `recipe_customizations`: 스키마만 존재. v0.5 UI는 row 생성 안 함 (Attempt.changes 자유 텍스트로 1차 대응, L70)
- Recipe hard delete: Attempt 0건일 때만 가능. ≥1건이면 422 + 안내 ("시도 기록이 있어 삭제할 수 없어요"). archived 전환·영구 삭제 다이얼로그는 v0.5 OOS-5d
- Dish hard delete: 연결 Recipe 0건일 때만, 그 외 422
- 모든 파생 필드 (`average_rating` / `attempt_count` / `last_tried_at` / `days_since_last_tried`) 저장 안 함, 런타임 집계
- soft-deleted attempt는 파생 필드 집계에서 제외 (`isNull(attempts.deletedAt)`)

[Ingestion — tech-decision §7]

- `POST /api/recipes/ingest` 입력: `{ dishId, sourceType ∈ {youtube, text}, payload }`
  - youtube: youtube_cache 확인 → `videos.list` 1회 호출 → `snippet.description` 추출 → RecipeSource 메타 (`type=youtube`, `youtube_video_id`, `title`, `channel`, `thumbnail_url`, `published_at`, `url`, `raw_content=description`)
  - text: 사용자가 직접 붙여넣은 본문. blog URL을 함께 입력한 경우 `type=blog`, `url` 저장 + `raw_content` 사용자 본문. URL 없으면 `type=text`, `url=null`.
- 규칙 기반 파싱:
  - 재료 정규식: "{이름} {수량}{단위}" 패턴 (예: "돼지고기 500g", "고추장 2큰술")
  - 단계 정규식: `1.` / `①` / `②` 번호 매김 또는 줄바꿈 + 동사형 종결
- confidence 산출:
  - `low`: 빈 추출 또는 매칭 실패 → 사용자에게 처음부터 직접 입력 권유 EmptyState
  - `med`: 부분 매칭 → ConfidenceField로 의심 필드 ⚠ 강조
  - `high`: 재료 5+ 단계 3+
- LLM stub: `callLLMForIngestion(text): Promise<RecipeDraft>` → `throw new Error('LLM not implemented (next cycle)')`. confidence=low 시 stub 호출 → catch → 사용자 텍스트 폴백 안내.
- `ingestion_cache`: `cache_key = hash(sourceType + url|text)`, draft jsonb, created_at
- `usage_counters` (user_id, month, ingest_count, llm_count)

[YouTube API — tech-decision §5]

- API Key는 server-side만, 클라이언트 노출 금지
- `youtube_cache` 24h TTL. `cache_key = "video:" + youtube_video_id`
- `videos.list` items[] 빈 응답 → 사용자에게 "영상을 찾을 수 없어요" 안내 (자동 `is_unavailable_on_source` 갱신은 v0.5 OOS-5e)

[검색 정렬 분리 — tech-decision §6]

- API Route: DB 집계 (recipes JOIN attempts → average_rating / attempt_count / last_tried_at)
- 클라이언트: `lib/sort-recipes.ts` `sortRecipeResults()` 순수 함수에서 최종 정렬
- "높은 평점" 영역: `average_rating >= 4.0 OR attempt_count >= 2` → average_rating DESC → attempt_count DESC
- 일반 영역: created_at DESC

[금지]

- PRD에 UI 묘사 추가 금지 (PRD-UI 분리 영구 가이드)
- 문서 (`docs/nayo/*.md`) 수정 금지 — 결정 확정됨 (단, v0.5 BUILD 중 발견된 누락/오류는 명시적 결정 후 갱신)
- 외부 headless UI 라이브러리 도입 금지
- **v0.5 OOS 기능 외삽 금지**:
  - RecipeCustomization UI (스키마만 존재, OOS-5a)
  - 쿨타임 홈 "안 먹은 지 N일" 영역 (OOS-5b)
  - AttemptStepNote.video_timestamp 자동 캡처 (OOS, L70)
  - archived Recipe + 영구 삭제 2단계 다이얼로그 (OOS-5d)
  - Source 접근 불가 자동 lazy check (OOS-5e)
  - LLM 실호출 (OOS-4)
  - 블로그 자동 수집 readability/linkedom (OOS, PRD §5.2 j)
- 클릭 이벤트 수집 금지 — M1~M6은 DB count로만 측정
- v0.4 마이그레이션 SQL 작성 금지 (L67 폐기, 리셋으로 대체)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONE WHEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] 빌드 / 타입 체크

- `pnpm typecheck` (tsc --noEmit) 0 errors
- `pnpm lint` (Next.js ESLint + Prettier) 0 errors
- `pnpm build` (Next.js 프로덕션 빌드) 성공

[2] DB / 스키마 (F-0)

- `pnpm drizzle-kit generate` 산출물 `db/migrations/` 존재
- **9개 테이블** 정의 완료:
  - recipes / recipe_ingredients / recipe_steps / recipe_sources / recipe_customizations / attempts / attempt_step_notes / dishes / youtube_cache
  - 보조: ingestion_cache / usage_counters
- 인덱스 (tech-decision §3.3 표) 모두 등록 — 특히 `recipes_user_archived_idx`, `attempts_recipe_idx`, `attempts_user_tried_at_idx`, `attempt_step_notes_attempt_idx`
- **raw SQL PARTIAL UNIQUE** `recipe_sources_url_unique` 마이그레이션 파일 포함 (F4-3)
- `attempts.recipe_id` FK `ON DELETE CASCADE` 적용 확인 (`\d+ attempts`)
- `.env.local.example` 파일에 5개 환경변수 명시: `DATABASE_URL` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `YOUTUBE_API_KEY` / `GEMINI_API_KEY` (stub 값 OK)
- README에 로컬 셋업 명령 (`pnpm install` → `cp .env.local.example .env.local` → `pnpm drizzle-kit push` → `pnpm dev`)

[3] API 약 24개 — tech-decision v3.0.2 §12, v0.5 IN 항목

- **Ingestion** (2): `POST /api/recipes/ingest`, `POST /api/recipes`
- **Recipe CRUD** (11): `GET/PATCH/DELETE /api/recipes/{id}`, `POST/PATCH/DELETE /api/recipes/{id}/ingredients/{iid}`, `POST/PATCH/DELETE /api/recipes/{id}/steps/{sid}`, `POST/PATCH/DELETE /api/recipes/{id}/sources/{sourceId}`
- **Attempt + StepNote** (7): `POST /api/recipes/{id}/attempts`, `PATCH/DELETE /api/attempts/{id}`, `POST/PATCH/DELETE /api/attempts/{id}/step-notes/{snId}`, `GET /api/attempts/trash`, `POST /api/attempts/{id}/restore`, `DELETE /api/attempts/{id}/permanent`
- **검색·홈·Dish** (~4): `GET /api/home`, `GET /api/dishes/autocomplete`, `GET /api/dishes/{id}/recipes`, `GET/POST /api/dishes`, `DELETE /api/dishes/{id}`
- **YouTube** (1): `GET /api/youtube/video/{youtube_video_id}` (Ingestion 내부에서만 사용)
- 모든 엔드포인트에 `requireAuth()` + `eq(*.userId, userId)` 강제 (코드 grep으로 검증)
- AttemptStepNote API에서 Attempt 소유권 체인 검증 (grep으로 패턴 확인)
- **v0.5 OOS API 미구현 확인**:
  - `POST/PATCH/DELETE /api/recipes/{id}/customizations/{cid}` (스키마만, API 없음)
  - 쿨타임 관련 home 쿼리 (`days_since_last_tried` 정렬) 없음 — 단순 `tried_at DESC LIMIT 5`만
  - `DELETE /api/recipes/{id}?force=true` (archived 영구 삭제) 없음

[4] 자체 구현 컴포넌트 — design-decision v2.0.1

- **신규 5종**: IngredientRow / StepRow / ConfidenceField / SourceCard / SourceBadge
- **기존 재사용 9종**: BottomSheet / Dialog / Combobox / StarRating / ToggleGroup / Toast / Skeleton / EmptyState / Button(primary/secondary-pill)
- **v0.5 OOS 컴포넌트 미구현 확인**:
  - AmountStepper (OOS-5a, 다음 사이클)
  - RecipeCustomizationSheet (OOS-5a)
  - CooldownCard (OOS-5b)
  - DeletedSourceAlert (OOS-5e)

[5] 화면 7개 — design-decision v2.0.1 §화면 인벤토리 (v0.5 IN만)

- **0. 홈** (`/`) — 검색바 + 최근 만든 Recipe 5개 + 신규 사용자 EmptyState ("첫 레시피를 가져와볼까요?" + Ingestion 진입 CTA)
- **1. 검색** (`/search`) — Dish 자동완성 dropdown + "높은 평점" 영역 + 일반 영역 + SourceBadge 오버레이
- **2. 메뉴 페이지** (`/dish/[slug]`) — Dish 헤더 (name + 누적 Recipe 수 + 누적 Attempt 수) + "내 레시피" parchment 영역 + "참고한 소스" light 영역
- **3. Recipe 상세·편집** (`/recipe/[id]`) — 헤더 (title / servings / description 인라인 편집) + IngredientRow 목록 + StepRow 목록 + Attempt 이력 + SourceCard 목록. **"조정하기" CTA는 v0.5 비활성/숨김** (OOS-5a)
- **4. Ingestion** (`/ingest`) — 4-A 입력 (sourceType ToggleGroup + URL/textarea) → 4-B 처리 중 Skeleton → 4-C Draft 검수 (ConfidenceField + IngredientRow/StepRow 인라인 편집)
- **5. Attempt Sheet** (BottomSheet ≤833px / Dialog ≥834px) — StarRating + changes textarea + improvement_note textarea + tried_at date picker + **단계별 메모 영역** (각 RecipeStep 카드에 "메모 추가" pill → 인라인 textarea, L70)
- **6. 단순 휴지통** (`/trash`) — Attempt soft delete 카드 목록 (tried_at + Recipe title + 삭제일) + "복구"·"영구 삭제" CTA. **Recipe archived 영역은 v0.5 OOS** (OOS-5d)

[6] 테스트 — tech-decision §15 + 테스트 케이스 명세서

`pnpm vitest run` 모두 PASS:

- **TC-Sort-1~4** `sortRecipeResults()` 단위 (lib/sort-recipes.test.ts)
- **TC-Recipe-1~5** Recipe CRUD API (CREATE / READ / PATCH / DELETE 0건 / DELETE 1건 422)
- **TC-Ingredient/Step-1~6** 하위 리소스 CRUD + 소유권 체인 검증
- **TC-Ingestion-1** 규칙 파싱 정확도 — 5개 한국 요리 YouTube description 샘플에서 confidence `high` 60%+
- **TC-Ingestion-2** 캐시 HIT/MISS (ingestion_cache + youtube_cache)
- **TC-Ingestion-3** LLM stub throw → 사용자 폴백 흐름
- **TC-Ingestion-4** YouTube videos.list items[] 빈 응답 처리 ("영상을 찾을 수 없어요")
- **TC-Attempt-1~2** Attempt 생성 + 파생 필드 재계산 (average_rating / attempt_count / last_tried_at)
- **TC-StepNote-1** AttemptStepNote CRUD + 소유권 체인
- **TC-StepNote-2** v0.5 video_timestamp 항상 null 저장 검증
- **TC-StepNote-3** 이전 Attempt 동일 단계 메모 미리보기 (P1 시나리오)
- **TC-a11y-1~7** 컴포넌트 a11y (BottomSheet / Dialog / Combobox / StarRating / ConfidenceField / IngredientRow / StepRow)
- **TC-Home-1** 홈 쿼리 (최근 Recipe 5개 / 신규 사용자 EmptyState)
- **TC-Delete-1~4** 삭제 정책 (Attempt soft delete / Attempt 30일 Cron / Recipe 0건 hard / Recipe 1건+ 422 / Dish 빈 hard / Dish 비어있지 않음 422)
- **TC-Source-1** RecipeSource PARTIAL UNIQUE 동작 (동일 url 중복 시 onConflict 또는 UNIQUE 위반)

E2E (Playwright, 선택):

- Ingestion 흐름: 입력 → Draft 검수 → 저장
- 시도 기록 흐름: rating + 단계별 메모 저장

`@testing-library` + `jest-dom` 기준.

[7] 보안 / 정합성 자가 검증

- API Route 약 24개 전체에서 `requireAuth(` grep → 모두 매칭
- Drizzle 쿼리 grep으로 모든 select/update/delete에 `eq(.*\.userId,` 또는 소유권 체인 패턴 포함
- AttemptStepNote 접근 코드 grep으로 Attempt 소유권 선검증 패턴 확인
- `.env.local` 은 .gitignore 등록 + 커밋되지 않음
- `NEXT_PUBLIC_` 접두사 없는 변수가 클라이언트 번들에 포함 안 됨 (build-time grep)
- **외부 fetch grep**: 서버 측 외부 호출이 YouTube Data API `videos.list`만 (SSRF 위험 0). 임의 URL fetch 없음 확인.
- `GEMINI_API_KEY` 노출 없음 (client bundle grep)
- LLM stub `throw new Error` 정상 작동 확인 (실호출 막힘)
- raw SQL PARTIAL UNIQUE 마이그레이션 파일이 git 추적 + push 후 `\d+ recipe_sources` 결과에 반영 확인

[8] 로컬 실행 + 핵심 흐름 수동 검증

- `pnpm dev` 후 `http://localhost:3000` 접속 → 홈 렌더
- Google OAuth 로그인 → 메인 진입
- **신규 사용자 흐름** (L67 리셋 후 본인 첫 진입):
  - 홈 EmptyState 노출 → "첫 레시피를 가져와볼까요?" CTA → Ingestion 진입
- **Ingestion 흐름** (핵심 — H5 검증 시작점):
  - YouTube URL 입력 → 처리 중 Skeleton → Draft 화면 (재료/단계 자동 추출 + confidence 표시)
  - 사용자 검수 (의심 필드 ⚠ 강조 → 수정) → "레시피 저장"
  - 저장 완료 → Recipe 상세 화면 자동 이동
  - 또는: 텍스트 직접 붙여넣기 → 동일 흐름
- **Recipe 편집 흐름**: 상세 화면에서 재료 추가/수정/순서 변경 + 단계 메모 수정 → 저장
- **시도 기록 흐름** (P1 직접 해결 검증):
  - Recipe 상세 → "기록하기" → BottomSheet/Dialog
  - rating + changes ("고추장 2큰술 → 1큰술" 자유 텍스트, P4·P5 1차 대응) + improvement_note + tried_at
  - **단계별 메모**: 각 단계 카드에 "메모 추가" → 인라인 textarea → 저장
  - 저장 → Recipe 파생 필드 갱신 + 이전 Attempt의 동일 단계 메모가 미리보기로 노출 (P1 시나리오)
- **검색 흐름**: 메뉴명 입력 → 자동완성 dropdown → Recipe 상세 진입
- **메뉴 페이지 흐름**: Dish 진입 → 내 레시피 + 참고 소스 분리 노출 → Recipe 상세 진입
- **휴지통 흐름**: Attempt 삭제 → 휴지통 → 복구 / 영구 삭제
- 보고: 어느 흐름 동작 / 어디서 막힘 / UI 수동 테스트는 CLI에서 안 되므로 동작 가능한 범위까지만 시도하고 한계 명시

[9] H5 측정 인스트루먼테이션 (F-8 회고용)

- `usage_counters` 테이블 정상 작동 (Ingestion 시도 / Draft 생성 / 저장 완료 3단계 카운터)
- confidence high/med/low 분포 로깅 (서버 로그 또는 별도 테이블)
- M5 = 저장 완료 Recipe 수 / Ingestion 시도 수
- M1 (Attempt 생성 횟수) / M3 (재시도 비율) 계산 쿼리 정상 작동

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUT OF SCOPE — Done 판정과 무관
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이번 사이클 OOS (다음 사이클 후보 — decision-log §OOS 참조):

- **OOS-5a** RecipeCustomization UI 구현 (스키마만, Attempt.changes 자유 텍스트로 1차 대응)
- **OOS-5b** 쿨타임 홈 "안 먹은 지 N일" UX (데이터 누적 후)
- **OOS-5d** archived Recipe + 영구 삭제 2단계 다이얼로그
- **OOS-5e** Source 접근 불가 자동 lazy check
- **OOS-4** LLM 실호출 (Gemini 어댑터)
- **PRD §5.2 j** 블로그 자동 수집 (readability/linkedom)
- **AttemptStepNote.video_timestamp 자동 캡처** (L70 — 스키마 컬럼은 존재, v0.5는 null만)
- Vercel 실배포 (로컬 빌드 성공까지만)
- Vercel Cron 실제 등록 (코드 작성까지만)
- 30일 자동 hard delete 실제 트리거 검증 (SQL 작성까지)
- **Phase 2 기능 절대 구현 금지**: 가구/Household, 타인 평가, 날씨 API, 통계, 부분 검색 통합

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
루프 종료 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1]~[9] 모두 PASS이면 BUILD 사이클 종료.

단, [8]은 자동화 불가 영역이므로 명시 보고로 갈음. PASS 못한 항목이 남으면 plan → act → test → review 다음 사이클에서 그 항목만 타깃하여 재시도.
