# nayo (나만의요리사)

Next.js App Router app for the `docs/nayo` product spec (v0.5 PIVOT).

다양한 출처(YouTube / blog / text)의 레시피를 내 Recipe로 정규화·축적하는 개인 레시피북.

## 설계 진행도 (v0.5 PIVOT)

| 단계 | 산출물 | 상태 |
|------|--------|------|
| DISCOVER | PRD v0.5.3 (`docs/nayo/prd.md`) | ✅ |
| DESIGN | Design Decision v2.0.1 (`docs/nayo/design-decision.md`) | ✅ |
| ENGINEER | Tech Decision v3.0.2 (`docs/nayo/tech-decision.md`) | ✅ |
| ALIGN | Decision Log v2.3 — L1~L70 (`docs/nayo/decision-log.md`) | ✅ |
| BUILD F-0 | DB 리셋 + 신규 Drizzle 셋업 (11 테이블) | ✅ |
| BUILD F-1 | Ingestion API + 규칙 파싱 + UI 검수 | ✅ |
| BUILD F-2 | Recipe CRUD API + IngredientRow / StepRow | ✅ |
| BUILD F-3 | 검색 + 자동완성 + sortRecipeResults | ✅ |
| BUILD F-4 | 메뉴 페이지 + Recipe 상세 | ✅ |
| BUILD F-5 | 시도 기록 + AttemptStepNote (L70) | ✅ |
| BUILD F-6 | 단순 홈 + 휴지통 | ✅ |
| BUILD F-7 | typecheck / lint / build / 테스트 PASS | ✅ |
| F-8 (다음 세션) | 운영 1~2주 후 회고 → v0.6 스코프 결정 | ⬜ |

## v0.5 Out of Scope (다음 사이클)

- `RecipeCustomization` UI (스키마만, Attempt.changes 자유 텍스트로 1차 대응)
- 홈 v2 쿨타임 "안 먹은 지 N일" (데이터 누적 후)
- `attempt_step_notes.video_timestamp` 자동 캡처 (YouTube IFrame)
- archived Recipe + 영구 삭제 2단계 다이얼로그
- Source 접근 불가 자동 lazy check
- LLM 실호출 (Gemini 어댑터)
- 블로그 자동 수집 (readability/linkedom)

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Copy environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

| Variable | 출처 | 비고 |
|----------|------|------|
| `DATABASE_URL` | Supabase Dashboard → Project Settings → Database → Connection string (URI) | Drizzle direct connection. 로컬 Supabase면 기본값(`postgres://postgres:postgres@127.0.0.1:54322/postgres`) 사용 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | 클라이언트 노출 OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → API → `anon` key | 클라이언트 노출 OK |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API → `service_role` key | **server-only**. `NEXT_PUBLIC_` 절대 금지 |
| `YOUTUBE_API_KEY` | Google Cloud Console → YouTube Data API v3 → API key | **server-only**. Ingestion 시 `videos.list` 단일 호출에만 사용 |
| `GEMINI_API_KEY` | (v0.5 OOS — `stub` 값 그대로 두면 됨) | LLM 실호출은 다음 사이클 |

### 3. Configure Google OAuth (Supabase)

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID 생성
2. Supabase Dashboard → Authentication → Providers → Google → Client ID/Secret 입력
3. Redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`

### 4. Apply schema to Supabase

Drizzle migration + raw SQL PARTIAL UNIQUE를 한 번에 push:

```bash
pnpm drizzle-kit push
```

`recipe_sources_url_unique` PARTIAL UNIQUE index 적용 확인:

```bash
psql "$DATABASE_URL" -c "\d+ recipe_sources" | grep recipe_sources_url_unique
```

### 5. Run the dev server

```bash
pnpm dev
```

Open `http://localhost:3000` → `/sign-in`으로 리디렉션.

## Verification (F-7 DONE WHEN 기준)

```bash
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors
pnpm vitest run  # 11 PASS (parse-rules 6 + sort-recipes 5)
pnpm build       # 14 routes
```

## Manual QA — v0.5 핵심 흐름

1. **Ingestion (YouTube)** — `/ingest` 진입 → YouTube URL 입력 → 분석 → Draft 검수 (재료/단계 confidence 시각) → 수정 → 저장 → Recipe 상세 자동 이동
2. **Ingestion (텍스트)** — `/ingest` → "텍스트" 토글 → 본문 붙여넣기 → 규칙 파싱 → 검수 → 저장
3. **Recipe 편집** — Recipe 상세에서 재료/단계 인라인 편집 → 자동 저장
4. **시도 기록** — Recipe 상세 → "조정하기 / 기록하기" → AttemptSheet (BottomSheet on mobile / Dialog on desktop) → 평점·변경·메모·단계별 메모 → 저장 → 이전 Attempt 단계 메모가 미리보기로 노출 (P1 시나리오, L70)
5. **검색·자동완성** — `/search` → Dish/Recipe LIKE 매칭 dropdown
6. **메뉴 페이지** — `/dish/[id]` → 내 레시피 (높은 평점 / 전체) + 참고 소스 분리 노출
7. **휴지통** — Attempt 삭제 → `/trash` → 복구 / 영구 삭제

## Out of Scope (Done 판정 무관)

- Vercel 실배포 (로컬 빌드까지)
- Vercel Cron (Attempt 30일 hard delete 코드 작성까지)
- `attempt_step_notes.video_timestamp` 자동 캡처 (YouTube IFrame Player API)
- LLM 실호출 (Gemini 어댑터 — 다음 사이클)
- 블로그 자동 수집 (readability/linkedom)
- 가구/Household, 타인 평가, 날씨 API — Phase 2

## 다음 세션 회고 트리거 (F-8)

배포 후 1~2주 운영 (Recipe 누적 ≥ 3 / Attempt 누적 ≥ 5) 도달 시:

- `docs/nayo/retro-v0.5.md` 작성
- M5 (Ingestion 성공률) 측정 + confidence 분포 (`usage_counters` 테이블)
- v0.6 스코프 결정:
  - M5 ≥ 70% → `RecipeCustomization` UI 진행 (OOS-5a 해제)
  - M5 50~70% → ConfidenceField UX 개선 + Customization 병행
  - M5 < 50% → LLM 실호출(Gemini 어댑터) 우선 (OOS-4 해제)
