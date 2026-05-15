# 다음 사이클 Jira 시안 — Ingestion 우선 (좁힌 v0.5)

> 작성일: 2026-05-15 (v5 — L70 AttemptStepNote v0.5 IN 복원 반영)
> 기준: PRD v0.5.3 / Design v2.0.1 / Tech v3.0.2 / Decision Log v2.3 (L49~L70)
>
> **v5 변경점 (v4 대비)**:
> - L70: AttemptStepNote v0.5 IN 복원 (P1 직접 해결). Customization UI·쿨타임 홈은 OOS 유지.
> - F-0 셋업: `attempt_step_notes` 테이블 v0.5 IN으로 명시.
> - F-5 시도 기록: AttemptStepNote API 3개 + UI 입력란 추가. video_timestamp 자동 캡처는 다음 사이클.
>
> **v4 변경점 (v3 대비)**:
> - F-1 Ingestion: blog 자동 수집 제거 → 사용자 직접 텍스트 붙여넣기로 일원화
> - F-1 H5 평가 트리거 명시 + F-1↔F-2 의존성 재정의 + F-8 회고 추가
>
> **v3 변경점 요약**:
> - L67/L68/L69: 마이그레이션 폐기 + H6 56px 확정 + v0.5 스코프 좁힘

---

## EPIC

**제목:** `[nayo] v0.5 Ingestion 우선 구현`

```
## Why
v0.5 PIVOT 설계 완성(2026-05-14) + office-hours 검토(2026-05-15) 후 스코프 좁힘.
Recipe 1급 + Ingestion 흐름을 핵심으로, H5 가설 단독 검증 가능한 구조로 출시.

## What (좁힌 v0.5 스코프 — L69 + L70)
- DB 리셋 + 신규 v0.5 스키마 셋업 (L67)
- Recipe CRUD (Ingestion 결과 편집)
- Ingestion 흐름 (YouTube URL 자동 메타 + 텍스트 직접 붙여넣기 → Draft → 검수 → 저장)
- 단순 검색·자동완성
- 단순 메뉴 페이지 (Recipe 목록 + Source 목록)
- 시도 기록 (rating + changes 자유 텍스트 + improvement_note + **선택적 단계별 메모 (AttemptStepNote — L70 IN 복원)**)
- 단순 홈 (검색바 + 최근 Recipe 5개)
- code-review → qa → security → ship → canary → 회고

## Out of Scope (L69 + L70 — 다음 사이클로 분리)
- RecipeCustomization UI (스키마만 v0.5 포함, Attempt.changes 자유 텍스트로 1차 대응)
- 홈 v2 쿨타임 ("안 먹은 지 n일") — 데이터 누적 후 효용
- AttemptStepNote.video_timestamp 자동 캡처 (YouTube IFrame Player API)
- archived Recipe + 영구 삭제 2단계 다이얼로그
- Source 접근 불가 lazy check
- LLM 실호출 (Gemini 어댑터)
- 마이그레이션 (L67 폐기)

## 참조
- docs/nayo/prd.md v0.5.2 — §5.1 좁힌 스코프
- docs/nayo/tech-decision.md v3.0.1 — 스키마 §3, Ingestion §7
- docs/nayo/design-decision.md v2.0.1 — 화면 인벤토리
- docs/nayo/decision-log.md v2.2 — L49~L69
```

---

## F-0 — 신규 셋업 (DB 리셋 + 스키마)

```
## What
v0.4 DB 폐기 → v0.5 빈 DB 신규 생성. 마이그레이션 없음 (L67).

## AC
- 기존 v0.4 supabase 인스턴스 폐기 (또는 신규 supabase 프로젝트 분리)
- Drizzle 신규 스키마 (9테이블):
  - recipes (dish_id, user_id, title, servings, description, archived_at)
  - recipe_ingredients (recipe_id CASCADE, name, amount, unit, optional, display_order)
  - recipe_steps (recipe_id CASCADE, display_order, instruction, timer_seconds, note)
  - recipe_sources (recipe_id CASCADE, type CHECK, url, raw_content, youtube_video_id, ...)
  - recipe_customizations (recipe_id CASCADE, diff_type CHECK, diff_payload jsonb) **스키마만, UI는 OOS**
  - attempts (recipe_id CASCADE — L65, user_id, rating, changes, improvement_note, tried_at, deleted_at)
  - **attempt_step_notes** (attempt_id CASCADE, recipe_step_id SET NULL, note NOT NULL, video_timestamp nullable, deleted_at) — **L70 v0.5 IN**
  - dishes (user_id, name)
  - youtube_cache, ingestion_cache, usage_counters
- Raw SQL: CREATE UNIQUE INDEX recipe_sources_url_unique ON recipe_sources(recipe_id, url) WHERE url IS NOT NULL
- 인덱스: recipes_user_archived_idx, attempts_recipe_idx, attempts_user_tried_at_idx, attempt_step_notes_attempt_idx 등

## Out of Scope (v0.5)
- attempt_step_notes.video_timestamp 자동 캡처 로직 (스키마 컬럼은 존재, v0.5 UI에서 항상 null 저장)
- Migration SQL 8단계 (L67 — 폐기)

## DoD
- pnpm drizzle-kit generate + pnpm drizzle-kit push 성공
- pnpm typecheck 0 errors
- supabase studio 또는 psql로 9테이블 생성 확인
- PARTIAL UNIQUE index 적용 확인 (\d+ recipe_sources)
```

---

## F-1 — Ingestion: 출처 → 내 레시피 (핵심)

```
## What
YouTube URL은 자동 메타 수집, 블로그·일반 텍스트는 사용자 직접 붙여넣기.
규칙 기반 파싱 후 사용자가 검수해 Recipe로 저장.
**v0.5 사이클의 핵심 — H5(규칙 기반 파싱 충분성) 단독 검증**.

PRD §5.1 정합: "YouTube URL → 규칙 기반 파싱 → Draft → 검수 → 저장.
블로그·텍스트는 수동 붙여넣기로 지원."
블로그 자동 수집(readability/linkedom)은 다음 사이클(PRD §5.2 j항).

## AC
POST /api/recipes/ingest
- 입력: { dishId, sourceType ∈ {youtube, text}, payload }
- youtube: youtube_cache → videos.list 1회 호출 → snippet.description 추출
  → RecipeSource (type=youtube, youtube_video_id, title, channel, thumbnail_url, published_at, url, raw_content=description) 메타 저장
- text: 사용자가 직접 붙여넣은 본문 → raw_content
  → 블로그 URL을 함께 입력한 경우: type=blog, url, raw_content=사용자 붙여넣은 본문
  → URL 없이 텍스트만: type=text, url=null, raw_content=본문

**v0.5 외부 fetch는 YouTube Data API videos.list만**. 임의 URL 서버 fetch 없음 → SSRF 위험 0.

규칙 기반 파싱 (raw_content 대상):
- 재료 정규식: "{이름} {수량}{단위}" 패턴 ("돼지고기 500g", "고추장 2큰술")
- 단계 정규식: 1./①/② 번호 매김 또는 줄바꿈 + 동사형 종결

confidence 산출:
- low: 빈 추출 또는 매칭 실패 → 사용자에게 처음부터 직접 입력 권유 EmptyState
- med: 부분 매칭 → ConfidenceField로 의심 필드 ⚠ 강조
- high: 재료 5+ 단계 3+

LLM stub (v0.5 OOS):
- callLLMForIngestion(text): throw new Error('LLM not implemented (next cycle)')
- confidence == 'low' 시 stub 호출 → catch → 사용자 텍스트 폴백 안내

검수 화면 (F-2 Recipe CRUD UI 재사용):
- IngredientRow / StepRow 인라인 편집
- ConfidenceField (low/med/high 시각 차별화 — aria-describedby + ⚠ 아이콘)
- "레시피 저장" → POST /api/recipes Transaction으로 Recipe + Ingredient[] + Step[] + Source 일괄 생성

POST /api/recipes:
- Draft 확정 저장
- requireAuth + Dish 소유권 검증
- ingestion_cache (cache_key = hash(sourceType + url|text), draft jsonb, created_at)

## H5 평가 트리거 (운영 1~2주 후 → F-8 회고에서 측정)
- M5 ≥ 70%: H5 PASS → v0.6은 Customization UI로 진행
- M5 50~70%: H5 보류 → ConfidenceField UX 개선 검토 + Customization UI 병행
- M5 < 50%: H5 깨짐 → v0.6 LLM 실호출(Gemini 어댑터) 우선 (OOS-4 해제)

## DoD
- TC-Ingestion-1 규칙 파싱 정확도 (5개 한국 요리 YouTube description 샘플로 confidence high 60%+)
- TC-Ingestion-2 캐시 HIT/MISS
- TC-Ingestion-3 LLM stub throw → 사용자 폴백 흐름
- TC-Ingestion-4 YouTube videos.list items[] 빈 응답 처리 (Source 생성 실패 메시지)
- ConfidenceField a11y: aria-describedby + ⚠ 아이콘 병행
- M5 측정 인스트루먼테이션: ingestion 시도 / draft 생성 / 저장 완료 3단계 카운터
```

---

## F-2 — Recipe CRUD: 백엔드 API + 인라인 편집 UI

```
## What
Recipe의 제목·분량·설명·재료·단계를 인라인으로 CRUD.
**F-1 Ingestion 검수 화면이 이 컴포넌트(IngredientRow / StepRow)를 재사용**하므로
F-2 백엔드 API 구현이 F-1의 전제. UI는 F-1과 동시 개발 가능.

## AC — 백엔드 API (F-1 전제, 먼저 구현)
- PATCH /api/recipes/{id} (title / servings / description)
- POST | PATCH | DELETE /api/recipes/{id}/ingredients/{iid}
- POST | PATCH | DELETE /api/recipes/{id}/steps/{sid}
- POST | PATCH | DELETE /api/recipes/{id}/sources/{sourceId}
- DELETE /api/recipes/{id}:
  - Attempt 0건 → hard delete (모든 하위 CASCADE)
  - Attempt ≥ 1건 → 422 + 안내 ("시도 기록이 있어 삭제할 수 없어요. 다음 사이클에서 보관 기능 제공 예정.")
  - **archived 전환 + 영구 삭제 2단계 다이얼로그는 v0.5 OOS (OOS-5d)**.
    archived_at 컬럼은 스키마에 존재하나 v0.5 UI는 set 안 함.

## AC — UI (F-1 Ingestion 검수 화면과 공유)
- IngredientRow: name / amount / unit / optional 토글 / drag handle
- StepRow: instruction / timer_seconds (옵션) / drag handle
- 두 컴포넌트는 Ingestion 5-C 검수 화면(F-1)과 Recipe 상세 편집 화면(F-4) 모두에서 동일 props로 사용
- drag handle: role="button" + aria-grabbed + ArrowUp/Down 키보드 reorder

## DoD
- TC-Recipe-1 PATCH (title/servings/description)
- TC-Recipe-2~4 Ingredient/Step/Source CRUD
- TC-Recipe-5 DELETE (Attempt 0건 → 성공, ≥1건 → 422)
- requireAuth + Recipe 소유권 체인 검증 (모든 하위 리소스 API에서 상위 Recipe.userId 선검증)
- IngredientRow/StepRow 컴포넌트가 Ingestion 검수와 Recipe 편집에서 동일 동작 확인
- pnpm typecheck 0 errors
```

---

## F-3 — 검색 + 자동완성 + 정렬

```
## What
메뉴명·Recipe 제목으로 검색. 기존 Dish 자동완성 dropdown.
Recipe 평점 기반 정렬.

## AC
- GET /api/dishes/autocomplete (LIKE 매칭)
- GET /api/dishes/{id}/recipes (Recipe 목록)
- GET /api/recipes?q={query} (Recipe 검색 — title + ingredient.name LIKE)

클라이언트 sortRecipeResults() 순수 함수:
- "높은 평점" 영역: average_rating ≥ 4.0 OR attempt_count ≥ 2
- 일반 영역: created_at DESC

자동완성 UI:
- Combobox 자체 구현 (role=combobox + aria-expanded)
- 키보드 nav (ArrowUp/Down/Enter/Escape)
- 디바운스 300ms

## DoD
- TC-Sort-1~4 sortRecipeResults() 단위 PASS
- Combobox a11y TC PASS
- 자동완성 LIKE quote escape (SQL injection 방어)
```

---

## F-4 — 단순 메뉴 페이지 + Recipe 상세

```
## What
Dish 단위 통합 뷰. "내 레시피" 목록 + "참고한 소스" 목록 분리.
**archived Recipe 영역·휴지통 영역은 v0.5 OOS (OOS-5d)**.

## AC
- 메뉴 페이지 (/dish/{slug}):
  - Dish 헤더 (name + 누적 Recipe 수 + 누적 Attempt 수)
  - "내 레시피" 영역: Recipe 카드 목록 (title + average_rating + attempt_count + last_tried_at)
  - "참고한 소스" 영역: SourceCard 목록 (type 배지 + title + url)

- Recipe 상세 (/recipe/{id}):
  - 헤더 (title / servings / description 인라인 편집)
  - 재료 영역 (IngredientRow 목록)
  - 단계 영역 (StepRow 목록)
  - 시도 이력 영역 (Attempt 목록)
  - "기록하기" CTA (Attempt 생성 진입)
  - **"조정하기" CTA → v0.5는 비활성/숨김 (OOS-5a — UI 미구현)**

UI:
- Recipe parchment surface + Source light surface
- IngredientRow / StepRow / SourceCard 컴포넌트 사용

## DoD
- pnpm dev로 메뉴 페이지·Recipe 상세 렌더링 확인
- 핵심 흐름: 메뉴 페이지 → Recipe 상세 → 편집 → 저장
```

---

## F-5 — 시도 기록 (Attempt + AttemptStepNote)

```
## What
Recipe를 한 번 만든 결과 기록.
rating + changes + improvement_note + tried_at + **선택적 단계별 메모 (AttemptStepNote — L70)**.
**Customization 수치 ± UI는 v0.5 OOS (OOS-5a)**. 대신 changes 자유 텍스트로 1차 대응.

## AC — Attempt
- POST /api/recipes/{id}/attempts
- PATCH | DELETE /api/attempts/{id}
- Attempt BottomSheet (≤833px) / Dialog (≥834px):
  - StarRating (0~5, 0.5 단위)
  - changes (textarea, P4·P5 1차 대응 — "고추장 1큰술 → 0.5큰술" 형태 자유 텍스트)
  - improvement_note (textarea)
  - tried_at (date picker)
  - **단계별 메모 영역 (L70 신규)**: 각 RecipeStep 카드마다 "메모 추가" pill → 인라인 textarea 확장
- 생성 트리거: Recipe 상세 화면 "기록하기" CTA만
- Attempt 생성 후 Recipe.average_rating·attempt_count·last_tried_at 즉시 재계산
- Attempt 삭제: soft delete (deleted_at). 30일 Cron hard delete.

## AC — AttemptStepNote (L70 신규)
- POST | PATCH | DELETE /api/attempts/{id}/step-notes/{snId}
- 입력 zod: `{ recipeStepId: uuid (nullable), note: string (required) }`
- video_timestamp 필드 = **v0.5는 항상 null 저장** (자동 캡처 다음 사이클)
- requireAuth + Attempt 소유권 체인 검증 (attempts.user_id 선검증 후 step-note 접근)
- UI 동작:
  - Attempt Sheet 안에 RecipeStep 목록 표시 (Recipe.steps 참조)
  - 각 단계 카드에 "단계 메모 추가" pill → 클릭 시 textarea 인라인 확장
  - 저장 시 attempt_step_notes row 생성 + recipe_step_id 참조
  - 이전 Attempt에 동일 단계 메모가 있으면 미리보기로 노출 (P1 직접 해결 — "지난번 이 단계에서 적은 메모")

## OOS (v0.5)
- AttemptStepNote.video_timestamp 자동 캡처 (YouTube IFrame Player API)
- 휴지통 화면 (단순 삭제만, 복구는 다음 사이클)

## DoD
- TC-Attempt-1 생성·재계산 PASS
- TC-StepNote-1 CRUD PASS
- TC-StepNote-2 이전 Attempt 동일 단계 메모 미리보기 (P1 시나리오)
- StarRating a11y: role="slider" + aria-valuenow/min/max
- BottomSheet/Dialog 반응형 분기 PASS
- AttemptStepNote 입력란 a11y (textarea + aria-label)
```

---

## F-6 — 단순 홈

```
## What
검색바 + 최근 만든 Recipe 5개.
**쿨타임 "안 먹은 지 n일" 영역 + 자주 만든 메뉴 영역은 v0.5 OOS (OOS-5b)**.

## AC
- GET /api/home
  - 최근 만든 Recipe 5개 (Attempt JOIN Recipe ORDER BY tried_at DESC LIMIT 5)
  - 신규 사용자 (Attempt 0): EmptyState — "첫 레시피를 가져와볼까요?" + Ingestion 진입 CTA

홈 UI:
- 검색바 (검색 화면 진입)
- 최근 Recipe 카드 5개 (title + Dish 이름 + last_tried_at + 마지막 rating)
- 신규 사용자 EmptyState

## OOS (v0.5)
- CooldownCard ("안 먹은 지 N일") — OOS-5b
- 자주 만든 메뉴 Top 3 — 다음 사이클
- 날씨 보조 카피 — 다음 사이클

## DoD
- 홈 쿼리 < 200ms (Promise.all 병렬 + 인덱스 활용)
- 신규/기존 사용자 모두 렌더링 확인
```

---

## F-7 — 빌드 검증 + 배포

```
## What
code-review → qa → security → ship → canary.

## AC
Code Review (C1-C5 / F1-F7 / B1-B6):
- requireAuth 모든 엔드포인트 매칭
- Recipe/Attempt 소유권 체인 grep (하위 리소스 접근 시 상위 user_id 선검증)
- GEMINI_API_KEY 클라이언트 번들 미포함 (build-time grep)
- LLM stub throw 처리 확인
- PARTIAL UNIQUE index raw SQL migrations 파일 포함 확인
- attempts.recipe_id CASCADE 적용 (L65) 확인

QA:
- 핵심 흐름 수동 검증:
  1. Ingestion: YouTube URL → 메타 자동 수집 → description 규칙 파싱 → Draft 검수 → 저장
  2. Ingestion: 텍스트 직접 붙여넣기 → 규칙 파싱 → Draft 검수 → 저장
  3. Recipe 편집: 재료 추가/수정/순서 변경 + Source 추가/삭제
  4. Attempt 기록: 평점 + memo 저장 → Recipe 파생 필드 즉시 재계산
  5. 검색: 자동완성 → Recipe 상세 진입
  6. 홈: 최근 Recipe 카드 → Recipe 상세
- M5 측정 도구 (Ingestion 시도/Draft/저장 3단계 카운터) 정상 작동
- 첫 Recipe 생성 시 신규 사용자 EmptyState 정상 노출

Security:
- SQL injection 방어 (Drizzle 파라미터화 grep)
- API key 노출 검증 (`NEXT_PUBLIC_` prefix 없는 키가 클라이언트 번들에 없는지)
- **외부 fetch 범위 확인**: 서버 측 외부 호출은 YouTube Data API videos.list만 (v0.5 SSRF 위험 0 — 사용자 임의 URL fetch 없음 (L69 정합))
- 인증 토큰 클라이언트 저장 검증

Deploy:
- pnpm build 0 errors
- Vercel 환경변수: DATABASE_URL / SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / YOUTUBE_API_KEY / GEMINI_API_KEY (stub 값)
- Vercel Cron 등록: Attempt 30일 hard delete (UTC 03:00 일일)
- 배포 후 5분 canary (콘솔 에러 / 5xx 0)

## DoD
- 프로덕션 URL 접속 + 홈 렌더링 (EmptyState 또는 최근 Recipe 카드)
- 첫 Recipe Ingestion 수동 검증 통과 (YouTube URL 1개로 Recipe 1개 생성)
- canary 5분 무이상
```

---

## F-8 — 운영 회고 + 다음 사이클 결정 트리거

```
## What
배포 후 1~2주 본인 직접 사용 → H5/M5/H4/H1' 결과 정리 → v0.6 스코프 결정.
이 사이클이 검증 사이클이라는 점을 명시 — 데이터 누적이 다음 결정의 입력.

## AC
운영 기간: F-7 배포일 + 1~2주 (Attempt 누적 ≥ 5건 또는 Recipe 누적 ≥ 3건 도달 시점)

측정 데이터:
- M5 Ingestion 성공률 = 저장 완료 Recipe / Ingestion 시도
  → confidence high/med/low 비율 함께 기록
- M3 재시도 비율 = Attempt ≥ 2건 Recipe / 시도된 전체 Recipe (이 사이클은 N 작아 추세 신호만)
- M1 Attempt 총 수 (절대값)
- M2' Recipe 평점 등록 누적 수
- M4' (스키마만 있으므로 0 — UI 미구현)

본인 자기보고 회고 (RecipeCustomization·쿨타임 OOS인 점 고려):
- H1' "원본 보러 가야 했다" 빈도 — 규칙 파싱 결과로 충분했는가?
- H4 "다음 시도에 이전 기록을 참조했는가" 자기보고
- H5 "Ingestion 검수가 번거롭지 않았는가" 자기보고
- 누락된 페인 — Customization UI 부재가 실제로 답답했는가?
- 누락된 페인 — 쿨타임 영역 부재가 회상 비용에 영향 줬는가?

v0.6 결정 트리거 (PRD §6/§7 + L69 후속):
- M5 ≥ 70% + H5 자기보고 PASS → v0.6 = Customization UI (OOS-5a 해제)
- M5 50~70% → v0.6 = ConfidenceField UX 개선 + Customization UI 병행
- M5 < 50% → v0.6 = LLM 실호출(Gemini 어댑터, OOS-4 해제) 우선
- 쿨타임 자기보고 강함 → v0.6에 OOS-5b 동시 해제 검토
- archived 필요 자기보고 강함 → v0.6에 OOS-5d 동시 해제 검토

## DoD
- docs/nayo/retro-v0.5.md 작성:
  - 측정 데이터 표
  - 자기보고 회고 5문항 답
  - v0.6 스코프 후보 1~3개 (Hermes Apply Mode 입력)
- decision-log v2.3에 L70+ 등재 (회고 결정)
- improvement-backlog v3 갱신 (이번 사이클 friction 누적)
```

---

## 진행 순서

```
F-0 (셋업)
  └─ F-2 백엔드 (Recipe CRUD API)
      └─ F-1 Ingestion (Recipe API 의존)
          + F-2 UI (Ingestion 검수 화면과 컴포넌트 공유 — 부분 병렬)
              └─ F-3 검색 ─┐
              └─ F-4 메뉴/상세 ─┤  병렬
              └─ F-5 시도 기록 ─┤
              └─ F-6 홈 ─┘
                  └─ F-7 빌드 검증·배포
                      └─ F-8 운영 회고 (1~2주 후)
```

> F-0 → F-2 백엔드 → F-1: 의존 직렬.
> F-2 UI는 F-1과 컴포넌트 공유라 부분 병렬.
> F-3 ~ F-6은 F-2 완료 후 병렬.
> F-7은 F-3~F-6 전체 완료 후.
> F-8은 배포 1~2주 후 회고. **이 사이클이 검증 사이클임을 명시** — 데이터 누적 = 다음 사이클 입력.

---

## 변경 이력

- **v1 (2026-05-15)**: 12개 티켓 (4개 트랙 + PREB 2개)
- **v2 (2026-05-15)**: 8개 압축 — Migration 준비 + 실행 + API + UI + 검증 + 배포
- **v3 (2026-05-15)**: 7개 피쳐별 — L67/L68/L69 후 좁힌 스코프. Customization UI + 쿨타임 홈 다음 사이클로.
- **v4 (2026-05-15)**: PRD §5.1 정합 정리 (blog 자동 수집 제거, SSRF 항목 제거 — 외부 fetch는 YouTube API만). F-1 ↔ F-2 의존성 재정의 (백엔드 먼저, UI 공유). H5 평가 트리거 명시. F-8 운영 회고 단계 추가 (총 9개 티켓).
- **v5 (2026-05-15)**: L70 — AttemptStepNote v0.5 IN 복원. F-0 셋업 9테이블, F-5 시도 기록에 StepNote API/UI 추가. video_timestamp 자동 캡처는 다음 사이클 유지. 티켓 수 그대로 9개.
