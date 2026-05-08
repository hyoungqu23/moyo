# MVP — nayo (모두의요리사) 1차 릴리스 구현

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`docs/nayo/prd.md` v0.4 + `docs/nayo/tech-decision.md` v2.0 + `docs/nayo/design-decision.md` v1.1 에 명세된 MVP 1차 릴리스 기능 전체를 구현하여 로컬에서 실행 가능 + 모든 테스트 케이스(TC-01~TC-26) 통과 상태로 만든다.

구현 대상 기능 (PRD §5.1):

- (a) 메뉴 검색 + 영상 리스트 + 자동완성 (Dish LIKE 매칭 dropdown)
- (b) 시도 기록 (rating / changes / improvement_note / tried_at) + Steps 단계별 기록 + YouTube IFrame timestamp 자동 캡처
- (c) thumbs up/down + 검색 정렬 (디부스트 / 우선 노출 로직)
- (d-1차) description + 상위 댓글 1개 (best-effort) 원본 통과 노출
- (e) 메뉴 페이지 (Dish 단위 통합 뷰)
- (g) 메인 화면 (최근 시도 영상 5개 + 자주 만든 Dish Top 3)
- 삭제 정책 (Attempt soft delete + 30일 휴지통 / Video is_hidden / Dish 빈 것만 삭제)
- 영상 유튜브 접근불가 감지 + is_unavailable_on_youtube 처리

산출 화면 5개 (design-decision §화면 인벤토리): 0. 메인 화면 / 1. 검색 화면 / 2. 영상 카드 / 3. 영상 상세 / 4. 메뉴 페이지

산출 API 21개 (tech-decision §12 전체).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

작업 디렉토리: `/Users/hyoungmin/Developments/HyoungMin/side-project/nayo`

현재 상태: `docs/nayo/`만 존재. 코드 zero-state. Next.js 프로젝트 부트스트래핑부터 시작.

핵심 참조 문서 (모두 `docs/nayo/` 하위, 변경 금지):

- prd.md — 데이터 모델·기능 요구사항·MVP 스코프·검증 가설·성공 지표
- tech-decision.md — 스택·Drizzle 스키마·API 21개·정렬 알고리즘·테스트 케이스 TC-01~TC-26
- design-decision.md — 화면 5개·반응형 분기·자체 구현 컴포넌트·VQ·a11y·자동완성/삭제 UX
- design-system.md — Apple Web Design System 차용 토큰 명세 (colors/typography/spacing/radius)
- decision-log.md — L1~L44 의사결정 종합 (의문 발생 시 1차 참조처)
- README.md — 페이즈 진행도 (현재 ALIGN 완료, BUILD 진입 직전)
- harness-state.md — PM Working Memory

산출 디렉토리 구조 (tech-decision §3.1, §13.2 기반):

- app/ Next.js App Router (page/layout/route handlers)
- app/api/ 21개 API Route (요청 검증 zod + requireAuth + Drizzle)
- components/ui/ 자체 구현 컴포넌트 14개 (BottomSheet, Dialog, Combobox 등)
- db/schema.ts Drizzle 단일 스키마 파일 (5 테이블)
- db/index.ts DB 커넥션
- db/migrations/ drizzle-kit generate 산출
- lib/auth.ts requireAuth() 미들웨어
- lib/sort-videos.ts 검색 정렬 알고리즘 (TC-01~TC-04)
- lib/youtube.ts YouTube Data API + IFrame Player API 래퍼
- hooks/ use-body-scroll-lock 등
- drizzle.config.ts
- tailwind.config.ts Apple 토큰 매핑 (tech-decision §13.1 그대로)
- vitest.config.ts
- playwright.config.ts (E2E 선택, 흐름 1-2개)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[기술 스택 — tech-decision §2 그대로 준수, 변경 금지]

- Next.js App Router (Pages Router 금지)
- TypeScript strict + path alias `@/`
- Drizzle ORM (DB 쿼리 전용) + supabase-js (Auth 전용) — 역할 분리 엄수
- Tailwind CSS + design-system.md 토큰. shadcn/ui default 미사용
- TanStack Query (서버 상태) + react-hook-form + zod
- Vitest (단위/컴포넌트) + Playwright (E2E 선택)

[보안 경계 — tech-decision §4.2, 위반 시 즉시 fail]

- 21개 전 API Route에 `requireAuth()` 적용 필수
- 모든 Drizzle 쿼리는 `eq(테이블.userId, userId)` 명시 강제
- Drizzle direct connection 경로에서 RLS는 작동 안 함 → WHERE user_id가 단일 보안 경계
- `SUPABASE_SERVICE_ROLE_KEY`는 server-side only, 클라이언트 노출 금지
- Step 추가/수정 시 `attempt_id`가 요청 user 소유 attempt인지 상위 WHERE로 검증

[자체 구현 컴포넌트 a11y — tech-decision §13.2, design-decision §접근성]

- BottomSheet/Dialog: focus trap + ESC 닫기 + body scroll lock + role="dialog" + aria-modal
- Combobox: role="combobox" + aria-expanded/controls/activedescendant + ↑↓Enter ESC Tab
- ToggleGroup(thumbs): aria-pressed + Space/Enter 토글 + 색상 단독 정보 전달 금지(아이콘 병행)
- StarRating: role="slider" + aria-valuenow/min/max + ArrowLeft/Right
- 외부 headless 라이브러리 도입 금지 (Radix/Vaul 등 — design-decision §시스템 예외 참조)
- 포커스 링: 2px solid {colors.primary-focus} #0071e3
- 터치 타겟 최소 44×44px

[디자인 토큰 — design-system.md + tech-decision §13.1]

- Single accent: {colors.primary} #0066cc 하나. 두 번째 브랜드 컬러 금지
- danger 컬러는 영구 삭제 버튼 텍스트에만 한정 사용 (rgb(220,38,38))
- Photography-first: 카드/버튼/텍스트에 shadow 금지. product-shadow는 썸네일/영상에만
- 트랜지션: 150-300ms, 500ms 이상 금지
- 모바일 퍼스트, breakpoint ≤833px ↔ ≥834px (시도 기록 입력: BottomSheet ↔ Dialog 분기)

[데이터 정합성 — tech-decision §3, §10]

- Attempt soft delete 30일 휴지통 (deleted_at 기록 → Vercel Cron으로 hard delete)
- Step ON DELETE CASCADE: Attempt hard delete 시 cascade
- Video hard delete deny 조건: 휴지통 attempt 포함 전체 카운트 (deleted_at IS NULL 조건 제거 필수)
- Dish hard delete: 연결 Video 0건일 때만, 그 외 422
- 모든 파생 필드(average_rating/attempt_count/last_tried_at)는 저장 안 함, 런타임 집계
- soft-deleted attempt는 파생 필드 집계에서 제외 (`isNull(attempts.deletedAt)`)

[YouTube API — tech-decision §5]

- API Key는 server-side API Route에서만 사용, 클라이언트 노출 금지
- youtube_cache 테이블 24h TTL. cache_key = "search:" + normalized_query 또는 "video:" + youtube_video_id
- search.list = 100 units/call, 캐시 적중률이 quota 보호의 핵심
- commentThreads.list 403 (commentsDisabled) catch → 댓글 영역 미표시
- videos.list items[] 빈 응답 → is_unavailable_on_youtube=true 갱신 (lazy check)
- Step.video_timestamp: zod 검증 0 이상 정수 또는 null. 음수 거부(400). 영상 길이 초과는 허용

[검색 정렬 분리 — tech-decision §6]

- API Route: DB 집계 + YouTube 캐시
- 클라이언트: 최종 정렬은 lib/sort-videos.ts의 sortVideoResults() 순수 함수에서
- thumbs up 영역: average_rating DESC → attempt_count DESC (동률 처리)
- 일반 영역: publishedAt DESC, thumbs down은 동일 영역 포함 (opacity 40% + grayscale)

[금지]

- PRD에 UI 묘사 추가 금지 (PRD-UI 분리 영구 가이드, 메모리 등록됨)
- 문서(docs/nayo/\*.md) 수정 금지 — 결정은 이미 확정됨
- 외부 headless UI 라이브러리 도입 금지
- 기능 외삽 금지 — Phase 2 백로그(LLM 요약, 통계, 부분 검색 통합)는 절대 구현 금지
- 클릭 이벤트 수집 금지 — M1·M2·M3·M4는 DB count로만 측정

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONE WHEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] 빌드 / 타입 체크

- `pnpm typecheck` (tsc --noEmit) 0 errors
- `pnpm lint` (Next.js ESLint + Prettier) 0 errors
- `pnpm build` (Next.js 프로덕션 빌드) 성공

[2] DB / 마이그레이션

- `pnpm drizzle-kit generate` 산출물 db/migrations/ 존재
- 5개 테이블(allowed_users / dishes / videos / attempts / steps / youtube_cache) 정의 완료
- 인덱스 11개 (tech-decision §3.3 표) 모두 등록
- `.env.local.example` 파일에 DATABASE*URL/SUPABASE*\*/YOUTUBE_API_KEY 5개 변수 명시
- README에 로컬 셋업 명령 (drizzle-kit push로 로컬 Supabase 적용 가능)

[3] API 21개 — tech-decision §12 전부 구현

- 9개 기존: /api/youtube/search, /api/youtube/video/{id}, /api/dishes (GET/POST), /api/dishes/{id}/videos, /api/videos (POST), /api/videos/{id}/thumbs (PATCH), /api/attempts (POST), /api/attempts/{id} (PATCH)
- 12개 신규: /api/home, /api/dishes/autocomplete, /api/dishes/{id} (DELETE), /api/videos/{id}/hidden (PATCH), /api/videos/{id} (DELETE), /api/attempts/{id}/steps (POST/PATCH/DELETE), /api/attempts/trash, /api/attempts/{id} (DELETE), /api/attempts/{id}/restore, /api/attempts/{id}/permanent
- 21개 전체 requireAuth() 적용 + Drizzle 쿼리 user_id WHERE 강제 (코드 grep으로 검증)

[4] 자체 구현 컴포넌트 14개 — tech-decision §13.2 전부 구현

- BottomSheet, Dialog, Dropdown, ToggleGroup, StarRating, SearchInput, Card, Button(primary/secondary-pill/danger), Toast, Skeleton, EmptyState, Combobox, StepInputRow, DeletedVideoAlert

[5] 화면 5개 — design-decision §화면 인벤토리 전부 구현

- 메인 화면(/) — 검색바 + 최근 시도 5 + Dish 칩 Top 3 + 신규 사용자 빈 상태
- 검색 화면(/search) — 자동완성 dropdown + thumbs up 우선 영역 + 일반 영역 + 디부스트
- 영상 상세(/video/[id]) — IFrame + thumbs + description 300자 토글 + 상위 댓글 + 시도 기록 영역
- 메뉴 페이지(/dish/[slug]) — 메뉴명 헤더 + 시도 이력(parchment) + 영상 목록(light)
- 휴지통(/trash) — 30일 내 soft-deleted Attempt 복구/영구 삭제

[6] 테스트 — tech-decision §15 + 테스트 케이스 명세서

- `pnpm vitest run` 모두 PASS:
  - TC-01~04 sortVideoResults() 단위 (lib/sort-videos.test.ts)
  - TC-05~06 Attempt API
  - TC-07~08 파생 필드 집계 정확성
  - TC-09~14 컴포넌트 a11y (BottomSheet/Dialog/ToggleGroup/StarRating)
  - TC-15~17 캐시 HIT/MISS/Quota 429
  - TC-18 댓글 비활성화 폴백
  - TC-21~22 Step timestamp + IFrame 차단 폴백
  - TC-23 자동완성 LIKE 쿼리
  - TC-24 메인 화면 쿼리 (최근 시도 / Dish Top 3 / 빈 상태)
  - TC-25 삭제 정책 4종 (Attempt soft + Video 422 + Dish 422 + 빈 Dish 성공)
  - TC-26 유튜브 접근불가 감지 (items[] 빈 응답 → is_unavailable_on_youtube=true)
- TC-19~20(E2E)은 README에 수동 QA 절차 명세 (Playwright는 선택)
- 컴포넌트 a11y 테스트는 @testing-library + jest-dom 기준

[7] 보안 / 정합성 자가 검증

- API Route 21개 전체에서 `requireAuth(` grep → 21건 매칭
- Drizzle쿼리 grep으로 모든 select/update/delete에 `eq(.*\.userId,` 포함 확인
- `.env.local`은 .gitignore 등록 + 커밋되지 않음 확인
- `NEXT_PUBLIC_` 접두사 없는 변수가 클라이언트 번들에 포함 안 됨

[8] 로컬 실행 + 핵심 흐름 수동 검증

- `pnpm dev` 후 `http://localhost:3000` 접속 시 메인 화면 렌더
- Google OAuth 로그인 → 화이트리스트 검증 → 메인 진입 흐름 동작
- 메뉴 검색 → 영상 카드 → thumbs up → 재검색 시 우선 노출 영역 노출 확인
- 영상 상세 → "기록하기" → BottomSheet/Dialog → Step 추가 → "지금 시간 기록"(IFrame 가능 시 자동 캡처) → 저장 → attempt_count +1
- Attempt 삭제 → 휴지통 → 복구 동작
- 보고: 어떤 흐름은 동작, 어떤 흐름은 막힘 — 명시적 보고 (UI 수동 테스트는 CLI에서 안 되므로 동작 가능한 범위까지만 시도하고 한계 명시)

[Out of Scope — Done 판정과 무관]

- Vercel 실배포 (로컬 빌드 성공까지)
- Vercel Cron (코드는 작성하되 실제 등록 안 함)
- 30일 자동 hard delete의 실제 트리거 검증 (SQL 작성까지)
- Phase 2 기능 (LLM 요약 / 통계 / 부분 검색 통합) — 절대 구현 금지

[루프 종료 조건]
위 [1]~[8] 모두 PASS이면 종료. 단, [8]은 자동화 불가 영역 명시 보고로 갈음. PASS 못한 항목이 남으면 plan → act → test → review 다음 사이클에서 그 항목만 타깃하여 재시도.
