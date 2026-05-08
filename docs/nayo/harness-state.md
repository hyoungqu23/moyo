# harness-state.md — moyo (모두의요리사)

## 기본 정보
- feature_name: moyo
- feature_full_name: 모두의요리사
- appetite: **Standard** (헤르메스 L3 자율 결정, 2026-05-04 — 사유 아래 의사결정 로그 L11 참조)
- 시작일: 2026-05-03
- user_scope: null

## 현재 상태
- phase: ALIGN
- 위치: Athena(align)
- 최종 갱신: 2026-05-08

## 현재 위치
- current_phase: BUILD 재진입 대기 (ALIGN 6차 rewind 완료)
- current_skill: Athena(align) 6차 rewind 완료. BUILD 후 갭 4건 확정 (L45~L48). 문서 6종 + 코드 갱신 완료. decision-log v1.5 갱신 완료.
- iteration_count(ALIGN): 6 (rewind_count 증가 없음 — 사용자 명시 요청)
- previous_phase: ENGINEER (dev-dialogue rewind 완료 — tech-decision.md v2.1)

## 가설 (잠정)
- 사용자가 제시한 솔루션 가설(유튜브 API 활용, 메뉴명 검색, 영상 메모/체크, description·고정댓글 노출)은 보류 상태로 기록.
- 사용자 명시 의도: "솔루션은 뒤로하고, 불편함부터 정의하자." (문제 정의 합의 완료)
- 현재 우회 방법: **없음 — 매번 새로 검색** (대안 0).
- 핵심 인사이트: 검색은 문제가 아니다. 회상 + 누적 학습 부재가 본질.

## 의사결정 로그
- [2026-05-03 / L1] 피처명 = `moyo` (사용자 지정, 모두의요리사의 줄임말). 이전 임시명 `recipe-tracker`는 폐기.
- [2026-05-03 / L1] 문제 정의 합의 완료 — `problem-definition.md` 저장. JTBD: 이전 실패·변형 이력 기억하여 매번 더 나은 결과 만들기. 비-목표 4종 명시.
- [2026-05-03 / L2] 데이터 모델 합의 — Dish / Video / Attempt 3-tier 구조. Video 단위 thumbs(up/down/미설정), Attempt에 rating(0~5, 0.5단위)·changes·improvement_note·tried_at.
- [2026-05-03 / L3] MVP 스코프 확정 — (a)메뉴검색, (b)시도기록, (c)thumbs+정렬, (d-1차)description+고정댓글 원본 노출, (e)메뉴페이지. Phase 2: (d-2차)LLM요약, (f)통계.
- [2026-05-03 / L4] 검색 정렬 로직 확정 — thumbs up 영상: 별점평균 높은 순 우선 노출. 나머지: publishedAt 최신순. thumbs down: 최신순 영역 포함 + 시각적 디부스트.
- [2026-05-03 / L5] 성공 지표 S2 행동 지표 기준 확정 — M1 Attempt 생성 횟수, M2 thumbs 등록 누적 수, M3 재시도 영상 비율(동일 Video Attempt 2건 이상 비율).
- [2026-05-03 / L6] 가설 H1~H4 확정 — H1 원본 노출 충분성, H2 thumbs down 디부스트 효과, H3 thumbs up 정렬 회상 비용 감소, H4 Attempt 기록 실제 참조 여부.
- [2026-05-03 / L7] UI 분리 영구 가이드 확정 — PRD에 UI 묘사 포함 금지. DISCOVER 중 수집된 UI 노트는 `design-notes-from-discover.md`에 별도 보관.
- [2026-05-03 / L8] prd-writer 완료 — `prd.md` 작성 완료. `design-notes-from-discover.md` 작성 완료. review-loop 진입 대기.
- [2026-05-03 / L9] review-loop 1R 완료 — UI 묘사 제거("시각적으로 디부스트되어 표시된다" → "디부스트 처리된다"), OQ2 "시각 처리" → "처리 방식" 교체. 버전 0.1 → 0.2.
- [2026-05-03 / L10] prd-review 완료 — R1 PASS / R2 PASS(WARN: H2·H3 click-through 측정 전제 ENGINEER 페이즈 확인 필요) / R3 PASS(이니셔티브 파일 없음, 검증 스킵) / R4 PASS(도메인 컨텍스트 파일 없음, 검증 스킵). DISCOVER 페이즈 완료. DESIGN 페이즈 진입 대기.
- [2026-05-04 / L3 자율] appetite = Standard 확정. 사유: 신규 앱(코드 0), 외부 API(YouTube Data v3) 통합, DB 3-tier(Dish/Video/Attempt) 신규 설계, 검색 정렬 로직 신규, 5개 MVP 기능. Quick Fix(1-3일) 초과·Epic(신규 도메인·아키텍처 변경)에는 못 미침. Wall-clock 1-2주 추정(사이드 페이스에서는 늘어질 수 있음).
- [2026-05-04 / L1] 디자인 시스템 = Apple Web Design System 차용 (사용자 명시). 전문 명세 `design-system.md` 보관. Tailwind 토큰 매핑으로 구현. shadcn/ui default 폐기.
- [2026-05-04 / L1] 시도 기록 입력 UX = 반응형 분기. 모바일: bottom sheet. 태블릿/데스크톱: Dialog or Drawer.
- [2026-05-04 / L1] "더보기" 인터랙션 = 인라인 확장 (카드들이 그 자리에서 아래로 펼쳐짐).
- [2026-05-03 / L13] DESIGN 완료 — design-decision.md 작성 완료. D1-D4 전항목 PASS (WARN 2건: D2 폼 border 토큰 미부여, D4 ink-muted-48 대비율 경계선).
- [2026-05-03 / L14] 화면 인벤토리 4개 확정 — 검색 화면 / 영상 카드 / 영상 상세 / 메뉴 페이지.
- [2026-05-03 / L15] 컴포넌트 매핑 확정 — store-utility-card 변형(영상 카드), product-tile-dark(영상 상세 상단), button-primary(모든 주요 CTA), search-input(메뉴 검색).
- [2026-05-03 / L16] 빈/로딩/에러/disabled 4가지 상태 + 접근성 계획 + VQ1~VQ5 시각 품질 계획 확정.
- [2026-05-03 / L17] ORM = Drizzle 확정. Auth만 supabase-js 사용. DB 연결: drizzle-orm/postgres-js + DATABASE_URL.
- [2026-05-03 / L18] UI 컴포넌트 자체 구현 확정. Vaul·Radix UI Dialog 폐기. BottomSheet·Dialog·ToggleGroup·StarRating 등 9종 자체 구현. a11y 책임(focus trap·aria-*·키보드 navigation·ESC·body scroll lock) 컴포넌트별 명시.
- [2026-05-03 / L19] divider-subtle 토큰 등록 확정. rgba(0,0,0,0.08) → Tailwind 커스텀 색상 토큰 `divider-subtle`. DESIGN-GAP-1 해결.
- [2026-05-03 / L20] 클릭 이벤트 미수집 확정. M1·M2·M3는 DB count로 측정. H2·H3는 자기보고로 회고. ENGINEER 페이즈 gap_signal 해소.
- [2026-05-03 / L21] 검색 정렬 책임 분리 확정. API Route: DB 집계 + YouTube 캐시. 클라이언트: sortVideoResults() 최종 정렬. 단위 테스트 대상.
- [2026-05-03 / L22] dev-gate T1-T5 전항목 PASS. tech-decision.md 작성 완료. ENGINEER 페이즈 종료. ALIGN 페이즈 진입 대기.
- [2026-05-03 / L23-ALIGN] doc-align 완료 (1차). Critical 0 / Major 0 / Minor 1(design-decision.md 합의 이력 마지막 행 "right drawer" → "dialog" 자동 수정). ALIGN 1차 status: success.
- [2026-05-03 / L24-ALIGN] decision-log.md 작성 완료. L1~L24 전체 결정 기록. Out of Scope 8종. 미결(Open Decision) 6종. 리스크 플래그 3종 인계.
- [2026-05-03 / L25-ALIGN-REWIND] doc-align rewind 1차 — Codex 외부 검토 6건 정정. H2·H3 검증 방법 자기보고 회고로 PRD 갱신. 고정 댓글→상위 댓글 1개 best-effort 전 문서 통일. Right Drawer→Dialog 본문 정정. 보안 경계 재정의(Drizzle WHERE = 단일 경계). PRD 메타 갱신. 캐시 키 cache_key 단일 컬럼+prefix 통일. L25~L28 신규 결정 추가. ALIGN iteration 2 완료. BUILD 진입 대기.
- [2026-05-03 / L26] 고정 댓글 → 상위 댓글 1개 best-effort 확정. API 제약(order=relevance, maxResults=1) + 403 commentsDisabled 폴백.
- [2026-05-03 / L27] 보안 경계 재정의 확정. Drizzle WHERE user_id = 단일 보안 경계. RLS는 server 경로 미적용.
- [2026-05-03 / L28] 캐시 키 통일 확정. cache_key TEXT UNIQUE 단일 컬럼. "search:"+normalized_query / "video:"+youtube_video_id prefix 규칙.
- [2026-05-03 / L29] prd-writer rewind 1차 (사용자 명시 요청) — B1 §1.0 문제 발견 내러티브 신규: raw user input 인용, 4단계 발견 흐름(격주 반복→우회 수단 0→검색이 문제 아님→사용자 자기 귀인), unmet need 명시.
- [2026-05-03 / L30] B2 §2.3 페인↔기능 매핑 표 신규 — P1~P5 ↔ §4.x 기능 매트릭스. §2 솔루션 개요가 "왜 이 기능들"을 정당화.
- [2026-05-03 / L31] B3 §9.5 Risk·Mitigation 신규 — RM1~RM7 시나리오·시그널·완화 분기. H1~H4 가정이 깨질 때의 분기 경로 명시.
- [2026-05-03 / L32] B4 참고 문서 박스 신규 — PRD 헤더에 7개 산출물 링크(problem-definition.md, design-decision.md, design-system.md, tech-decision.md, decision-log.md, design-notes-from-discover.md, harness-state.md).
- [2026-05-03 / L33] review-loop 2R 완료 — UI 묘사 침투 없음 확인. 모호한 표현·중복 서술·숫자 일관성 전항목 검토 통과.
- [2026-05-03 / L34] prd-review 재실행 (1차 rewind 후) — R1 PASS(§1.0 내러티브로 강화) / R2 PASS(§9.5 RM 추가로 명확화) / R3 PASS(이니셔티브 파일 없음, 검증 스킵) / R4 PASS(외부 API 사실 검증 완료). PRD v0.3 확정. ALIGN 재진입 대기.
- [2026-05-03 / ALIGN-RERUN] ALIGN 재실행 (iteration 3) — 12개 항목 전항목 PASS. 기존 8항목 재검증 변동 없음. 신규 4항목(B1~B4): 항목 9 PASS(problem-definition.md 정합), 항목 10 PASS(§4.x ID 정합), 항목 11 PASS(RM1~RM7 ↔ tech-decision·decision-log 정합), 항목 12 PASS(7개 파일 전부 실재). Critical 0 / Major 0 / Minor 0. decision-log v1.2 갱신 완료. BUILD 진입 대기.
- [2026-05-03 / L35] B1 분리 확정 — 자동완성 MVP 포함, 부분 검색 통합 결과 Phase 2. 자동완성: 기존 Dish LIKE 매칭(`LOWER(name) LIKE LOWER('%query%')`), 한국어 형태소 미적용. 부분 검색(형태소·동의어): 실사용 후 사용자 자주 부분 검색하는지 모니터링 후 도입 검토.
- [2026-05-03 / L36] B2 영상 유튜브 접근불가 엣지 확정 — is_unavailable_on_youtube=true 시: 카드 보이되 사용할 수 없는 영상임 표시(시각 처리는 DESIGN에서 결정), 시도 기록·steps 보존, 검색 결과 노출 X, 메뉴 페이지·메인 화면 최근 시도에는 노출.
- [2026-05-03 / L37] B4 Attempt 생성 트리거 확정 — 명시적 "기록하기" CTA만. thumbs up/down은 Video 단위 상태 변경, Attempt 생성 X. 단순 영상 view·진입 후 이탈 = Attempt 생성 X.
- [2026-05-03 / L38] B5β Step 엔티티 + timestamp 자동 캡처 확정 — Attempt에 steps[] 1:N 관계 추가. Step: id·attempt_id·note(not null)·video_timestamp(int, nullable, 초 단위)·created_at. YouTube IFrame Player API `player.getCurrentTime()` 자동 캡처. 임베드 차단 시 수동 입력 폴백(mm:ss 또는 null). Step 사후 edit 가능.
- [2026-05-03 / L39] B6 삭제 정책 확정 — Attempt: soft delete 30일 휴지통 자동 hard delete, 복구 가능. Step: Attempt soft delete 중 숨김·복구 연동, Attempt hard delete 시 FK cascade, 개별 edit·delete 가능. Video: Attempt 있으면 hard delete deny + is_hidden 토글. Dish: 빈 것만 hard delete.
- [2026-05-03 / L40] B7-A 메인 화면 확정 — 검색바 + 최근 시도 영상 5개(Attempt JOIN Video ORDER BY tried_at DESC LIMIT 5) + 자주 만든 Dish Top 3(Dish JOIN Attempt count ORDER BY count DESC LIMIT 3). 신규 사용자(시도 0): 빈 상태. 화면 구성·레이아웃은 DESIGN에서 결정.
- [2026-05-03 / L41] review-loop 3R 완료 — UI 묘사 침투 없음. 모호 표현·중복·숫자 일관성 전항목 검토 통과. 수정 사항 없음.
- [2026-05-03 / L42] prd-review 재실행 (2차 rewind 후) — R1 PASS / R2 PASS(M4 Step 사용률 측정 가능, 행동 분기 명시) / R3 PASS(이니셔티브 파일 없음, 검증 스킵) / R4 PASS(IFrame Player API getCurrentTime() 사실 검증 완료, 임베드 차단 폴백 명시). PRD v0.4 확정.
- [2026-05-03 / L43] design-dialogue rewind (사용자 명시 요청, rewind_count 증가 없음) — design-decision.md v1.1 보강: B7-A 메인 화면 신규(화면 인벤토리 4→5), B1 자동완성 dropdown UX 명세(Combobox/Autocomplete 자체 구현, keyboard nav, aria 완비), B5β Step 입력 UX(반응형 분기+IFrame 연동+timestamp capture+step edit 정책), B2 영상 삭제 엣지 시각 처리(opacity 30%+grayscale+배지, thumbs down과 시각 구분), B6 삭제 UX 전체(Attempt soft delete+휴지통+Toast, Video 숨김 토글+숨긴 영상 목록, Dish 삭제 정책), VQ 전면 갱신(VQ1 9개 요소 일관성 표, VQ3 신규 마이크로 인터랙션, VQ4 신규 치수), 컴포넌트 목록에 Combobox/Autocomplete+StepInputRow+DeletedVideoAlert 추가, 접근성 계획 6개 항목 확장. D1-D4 재검증: FAIL 0 / WARN 1(danger 컬러 예외 조건부 통과) / Comment 1(Combobox 자체 구현). 조건부 PASS.
- [2026-05-03 / L44] dev-dialogue rewind (사용자 명시 요청, rewind_count 증가 없음) — tech-decision.md v2.0 보강: §3.2 Drizzle schema 확장(steps 신규 테이블, attempts.deleted_at, videos.is_hidden/is_unavailable_on_youtube), §3.3 인덱스 정책 확장(attempts_deleted_at_idx, steps 2개 인덱스, dishes_user_id_idx), §7 YouTube IFrame Player API 통합(동적 로드·getCurrentTime·임베드 차단 감지·OQ6 해소), §8 메인 화면 쿼리 명세(최근 시도 5개·Dish Top 3·Promise.all 병렬), §9 자동완성 LIKE 쿼리(SQL injection 방지·디바운스 300ms·Combobox a11y), §10 삭제 정책 구현(Attempt soft delete+Cron+휴지통+복구+영구삭제, Video 숨김/hard delete, Dish hard delete+422), §11 유튜브 접근불가 lazy check(videos.list 빈 응답→is_unavailable_on_youtube, 검색 결과 비노출, DeletedVideoAlert), §12 API contract 9→21개 확장(신규 12개 엔드포인트), §13.1 danger 컬러 토큰 등록(D2 WARN 해소), §13.2 자체 구현 컴포넌트 Combobox+StepInputRow+DeletedVideoAlert 추가, TC-21~TC-26 추가. T1-T5 재실행 전항목 PASS.
- [2026-05-03 / L45] OQ6 해소 — Step.video_timestamp 검증 정책 확정: 0 이상 정수 또는 null만 허용(zod). 영상 길이 초과 허용(사용자 기록 보존). 음수 거부(400).
- [2026-05-03 / L46] danger 컬러 등록 확정 — Tailwind `danger: rgb(220,38,38)` + design-system.md 주석 추가. 사용처: 영구 삭제 버튼 텍스트 한정.
- [2026-05-03 / L47] API contract 21개 확정 — 기존 9개 + 신규 12개(/api/home, /api/dishes/autocomplete, /api/dishes/{id} DELETE, /api/videos/{id}/hidden, /api/videos/{id} DELETE, /api/attempts/{id}/steps CRUD 3개, /api/attempts/trash, /api/attempts/{id} DELETE, /api/attempts/{id}/restore, /api/attempts/{id}/permanent). 전 엔드포인트 requireAuth() + WHERE user_id 강제.
- [2026-05-03 / L48] Vercel Cron 확정 — Attempt 30일 자동 hard delete (UTC 02:00 일일 실행). youtube_cache 만료 레코드 정리 병행 가능. U8 주기적 YouTube 삭제 체크는 MVP 미포함.
- [2026-05-03 / L49] T6 엔티티 검증 확정 — Step 추가/수정 API에서 attempt_id가 요청 user의 attempt인지 상위 WHERE 절로 검증. 모든 중첩 리소스 API에서 소유권 체인 검증 필수.
- [2026-05-03 / L50] TC-21~TC-26 추가 확정 — Step timestamp 자동 캡처(TC-21), 임베드 차단 폴백(TC-22), 자동완성 LIKE(TC-23), 메인 화면 쿼리(TC-24), 삭제 정책(TC-25), 유튜브 삭제 감지(TC-26). 코일 Step 5-A TC 명세서 T3 재검증 PASS.
- [2026-05-03 / L41] API 개수 19→21 정합 확정 — `GET /api/attempts/trash` 포함, 엔드포인트 직접 카운트 기준. tech-decision §4.2·§12, decision-log, harness-state, README.md 전체 통일.
- [2026-05-03 / L42] Video 삭제 count 쿼리 정정 — deleted_at IS NULL 제거(휴지통 attempt 보호) + user_id 보안 경계 추가. Dish count 쿼리도 user_id 추가.
- [2026-05-03 / L43] Dish/Step 삭제 모델 PRD↔Tech 통일 — PRD Dish deleted_at 제거(hard delete only). PRD Step deleted_at 추가(개별 삭제 가능 — Tech·decision-log 일치).
- [2026-05-03 / L44] 이전 명칭 `is_deleted_on_youtube`를 `is_unavailable_on_youtube`로 rename — YouTube API 삭제·비공개 구분 불가. 사용자 라벨은 "사용할 수 없는 영상"으로 통일. 3문서 전체 적용. Phase 2 enum 도입 미결.

## 이터레이션 이력

| 차수 | 날짜 | 내용 |
|------|------|------|
| ALIGN 1차 | 2026-05-03 | doc-align 최초 실행. Critical 0 / Major 0 / Minor 1 자동 수정. |
| ALIGN 2차 (rewind) | 2026-05-03 | Codex 외부 검토 6건 정정. Major 4 + Minor 2. L25~L28 추가. |
| ALIGN 3차 (재실행) | 2026-05-03 | Apollo prd-writer rewind 후속. 12개 항목 PASS. decision-log v1.2. |
| ALIGN 4차 (4차 재실행) | 2026-05-08 | 외부 팀 리뷰 + PRD v0.4 + design-decision v1.1 + tech-decision v2.0 보강 후속. 20개 항목 PASS. decision-log v1.3. |
| ALIGN 5차 (rewind) | 2026-05-08 | Codex 외부 검토 후 정합성 재정리. Major 4 (API 개수, Video SQL, Dish/Step 모델, is_unavailable_on_youtube rename) + Minor 4 (ARIA combobox, 인덱스 명세, PRD OQ 분리, 메타). decision-log v1.4. rewind_count 증가 없음 — 사용자 명시 요청. |
| ALIGN 6차 (rewind) | 2026-05-08 | BUILD 후 갭 4건 확정. L45: GET /api/dishes/{id}/attempts 신규(API 21→22). L46: videos UNIQUE(youtube_video_id, dish_id) + onConflictDoUpdate. L47: 영상 카드 ?dish_id=&video_id= URL 전달. L48: thumbs PATCH 실호출. 문서 6종 + 코드 갱신. decision-log v1.5. rewind_count 증가 없음 — 사용자 명시 요청. |

## rewind 이력
- 2026-05-03: doc-align rewind 1차 — Codex 외부 검토 6건 정정 (Major 4 + Minor 2)
- 2026-05-03: prd-writer rewind 1차 — 사용자 명시 요청에 따른 PRD 보강 (B1~B4). 게이트 FAIL 자동 재시도 아님 — rewind_count 증가 없음 (사용자 명시 요청은 자동 재시도가 아님).
- 2026-05-03: ALIGN 재실행 — Apollo prd-writer rewind 1차 후속. 사용자 명시 요청. rewind_count 증가 없음.
- 2026-05-03: prd-writer rewind 2차 — 외부 팀 리뷰(석영·예진·용헌·민정) + 본인 코멘트 6개 결정 영역 추가 합의. 사용자 명시 요청 — rewind_count 증가 없음.
- 2026-05-03: design-dialogue rewind — PRD v0.4 보강(B1·B2·B5β·B6·B7-A) 후속 design-decision 보강. 사용자 명시 요청 — rewind_count 증가 없음. D1-D4 재검증 조건부 PASS.
- 2026-05-03: dev-dialogue rewind — PRD v0.4 + design-decision v1.1 후속 tech-decision 보강. 사용자 명시 요청 — rewind_count 증가 없음. T1-T5 재실행 전항목 PASS. tech-decision.md v2.0.
- 2026-05-08: ALIGN 4차 재실행 — 외부 팀 리뷰 + Apollo PRD v0.4 + Aphrodite design-decision v1.1 + Hephaestus tech-decision v2.0 보강 후속. 사용자 명시 요청 — rewind_count 증가 없음. 20개 항목 PASS. decision-log v1.3. BUILD 진입 대기.
- 2026-05-08: ALIGN 5차 rewind — Codex 외부 검토 후 정합성 재정리 (Major 4 + Minor 4). API 개수 19→21, Video 삭제 SQL 정정, Dish/Step 삭제 모델 통일, is_unavailable_on_youtube rename, ARIA combobox 통일, 자동완성 인덱스 명세, PRD OQ 분리, 메타데이터 정정. 사용자 명시 요청 — rewind_count 증가 없음. decision-log v1.4. BUILD 진입 대기.
- 2026-05-08: ALIGN 6차 rewind — BUILD 후 갭 4건 확정 (Major 4). L45: GET /api/dishes/{id}/attempts 신규(API 21→22). L46: videos UNIQUE(youtube_video_id, dish_id) + onConflictDoUpdate upsert. L47: 영상 카드 링크 ?dish_id=&video_id= URL 파라미터 전달. L48: thumbs 토글 PATCH /api/videos/{id}/thumbs 실호출 + 낙관적 업데이트. 문서 6종(decision-log/prd/tech-decision/design-decision/harness-state/README) + 코드 갱신(schema/migration/routes/pages/components). 사용자 명시 요청 — rewind_count 증가 없음. decision-log v1.5. BUILD 재진입 대기.

## rewind_count
- 1 (자동 재시도 rewind만 계산 — 사용자 명시 요청 prd-writer rewind 2회 제외)

## session_signals (Observer Mode)

### gap_signals
- [RESOLVED / L20] H2·H3 가설 검증 방법("subsequent click-through 감소", "최초 클릭 비율 상승") — 클릭 이벤트 미수집 확정. H2·H3는 자기보고로 회고. M1·M2·M3 DB count로 대체 측정.
- [RESOLVED / L19] DESIGN-GAP-1: `rgba(0, 0, 0, 0.08)` → `divider-subtle` Tailwind 토큰 등록 확정 (tech-decision.md 7.1).
- [RESOLVED / L18] DESIGN-GAP-2: Bottom Sheet / Right Drawer — 라이브러리 없이 자체 구현 확정. BottomSheet(모바일 ≤833px) + Dialog(데스크톱 ≥834px). a11y 책임 tech-decision.md 7.2에 명시.
- [RESOLVED / ALIGN] design-decision.md 합의 이력 "데스크톱 right drawer" → "데스크톱 dialog" 자동 수정 완료. (Minor 불일치, Athena(align) 자동 처리)
- [RESOLVED / prd-writer rewind 1차] PRD §1.0 문제 발견 내러티브 부재 → 사용자 단독 독해 시 "사용자 불편 → 문제 발견 → 문제 정의" 내러티브 약함. B1 §1.0 신규 삽입으로 해소. (2026-05-03)
- [RESOLVED / dev-dialogue rewind] OQ6 — Step.video_timestamp 영상 길이 초과 시 검증 정책 확정: 0 이상 정수 또는 null 허용, 영상 길이 초과 허용, 음수 거부(400). tech-decision.md §7.3.
- [RESOLVED / dev-dialogue rewind] "영구 삭제" 버튼 danger 컬러 예외 — Tailwind `danger: rgb(220,38,38)` 토큰 등록 완료. design-system.md 주석 추가. D2 WARN 해소.
- [RESOLVED / dev-dialogue rewind] Combobox/Autocomplete 자체 구현 — RM7(a11y 회귀 리스크) 연계. Vitest a11y TC-23 포함. TC 명세서에 keyboard nav 검증 항목 포함. BUILD 페이즈에서 크로스 브라우저 검증 필요.
- [OPEN / prd-writer rewind 2차] OQ5 — 자동완성 한국어 매칭 정확도: 실사용 후 부정확 빈발 시 pg_trgm GIN index 도입 검토. 트리거 기준 미결. 실사용 후 결정 (U7).
- [OPEN / ALIGN 5차 rewind] Phase 2 — is_unavailable_on_youtube enum 도입 검토 (삭제/비공개 세부 구분). 실사용 후 사용자에게 가치 있는지 확인 후 결정 (L44 후속 의존성).
- [RESOLVED / ALIGN 6차 rewind / L45] Dish 페이지 "내 시도 이력" EmptyState 하드코딩 → GET /api/dishes/{id}/attempts 신규로 해소.
- [RESOLVED / ALIGN 6차 rewind / L46] videos 중복 저장 가능성 → UNIQUE(youtube_video_id, dish_id) + onConflictDoUpdate로 해소.
- [RESOLVED / ALIGN 6차 rewind / L47] 영상 카드 dish_id 소실 → URL ?dish_id=&video_id= 전달로 해소.
- [RESOLVED / ALIGN 6차 rewind / L48] thumbs 토글 API 미연결 → PATCH /api/videos/{id}/thumbs useMutation + 낙관적 업데이트로 해소.

### friction_signals
- [ALIGN rewind 1차] ALIGN 1차 doc-align이 본문 일관성(Right Drawer→Dialog 본문 미반영, H2·H3 검증 방법 PRD 미갱신) 및 외부 API 사실 검증(YouTube commentThreads.list 고정 댓글 보장 불가, Drizzle direct connection RLS 비작동) 누락. 다음 세션 개선 입력: doc-align 스킬 실행 시 (1) 합의 이력만 아닌 본문 전체 grep 필수, (2) 외부 API 공식 문서 사실 검증 체크리스트 포함.
- [prd-writer rewind 1차] PRD v0.2까지 §1.5 핵심 인사이트가 문제 발견 내러티브(raw user input, 발견 흐름, unmet need 귀인)를 요약만 했을 뿐 사용자 경험이 단독 독해 가능한 수준으로 기술되지 않음. prd-writer 스킬 기본 출력물에 §1.0 문제 발견 내러티브 섹션 포함 여부를 appetite 무관 기본 항목으로 고려 필요.
- [ALIGN 재실행] prd-writer 기본 출력물에 §1.0 문제 발견 내러티브 섹션 포함을 appetite 무관 기본 항목으로 고려 권장 (Apollo friction_signal 흡수).
- [ALIGN 재실행] prd-review R1 기준에 "단독 독해 시 불편→발견→정의 내러티브 완결성" 항목 추가 검토 권장 (Apollo friction_signal 흡수).
- [prd-writer rewind 2차] 팀 리뷰(석영·예진·용헌·민정)가 doc-align 1차에서 잡지 못한 6개 결정 영역(자동완성 분리, 유튜브 삭제 엣지, Attempt 트리거, Step+timestamp, 삭제 정책, 메인 화면) 발굴. 다음 사이클에 외부 팀 리뷰 단계를 ALIGN 이전 또는 prd-writer 완료 직후에 구조적으로 도입 검토 권장.
- [ALIGN 4차 재실행] 팀 리뷰가 doc-align 1차에서 잡지 못한 6개 결정 영역(B1·B2·B4·B5β·B6·B7-A) 발굴 — 다음 사이클에 외부 팀 리뷰 단계를 ALIGN 이전 또는 prd-writer 완료 직후에 구조적으로 도입 검토 권장 (Hermes 지시 friction_signal 반영).
- [ALIGN 5차 rewind] Codex 외부 검토가 doc-align 4차에서 잡지 못한 8건 발굴 — Video 삭제 SQL의 휴지통 충돌(보안+정책 복합 버그)이 Tier 1 자동 감지 대상 임에도 4차까지 미발견. 다음 사이클에 Video/Dish count 쿼리 user_id 누락 여부를 doc-align 체크리스트 항목으로 추가 권장.

## repo_sync_status
- 미실행
