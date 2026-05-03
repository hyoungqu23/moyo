# harness-state.md — moyo (모두의요리사)

## 기본 정보
- feature_name: moyo
- feature_full_name: 모두의요리사
- appetite: **Standard** (헤르메스 L3 자율 결정, 2026-05-04 — 사유 아래 의사결정 로그 L11 참조)
- 시작일: 2026-05-03
- user_scope: null

## 현재 위치
- current_phase: ALIGN 완료 → BUILD 진입 대기
- current_skill: doc-align 재실행 완료 (12개 항목 PASS). code-review (BUILD 진입 후)
- iteration_count(ALIGN): 3
- previous_phase: ALIGN 재실행 (Apollo prd-writer rewind 후속, 2026-05-03)

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
- [2026-05-03 / L29] prd-writer rewind (사용자 명시 요청) — B1 §1.0 문제 발견 내러티브 신규: raw user input 인용, 4단계 발견 흐름(격주 반복→우회 수단 0→검색이 문제 아님→사용자 자기 귀인), unmet need 명시.
- [2026-05-03 / L30] B2 §2.3 페인↔기능 매핑 표 신규 — P1~P5 ↔ §4.x 기능 매트릭스. §2 솔루션 개요가 "왜 이 기능들"을 정당화.
- [2026-05-03 / L31] B3 §9.5 Risk·Mitigation 신규 — RM1~RM7 시나리오·시그널·완화 분기. H1~H4 가정이 깨질 때의 분기 경로 명시.
- [2026-05-03 / L32] B4 참고 문서 박스 신규 — PRD 헤더에 7개 산출물 링크(problem-definition.md, design-decision.md, design-system.md, tech-decision.md, decision-log.md, design-notes-from-discover.md, harness-state.md).
- [2026-05-03 / L33] review-loop 2R 완료 — UI 묘사 침투 없음 확인. 모호한 표현·중복 서술·숫자 일관성 전항목 검토 통과.
- [2026-05-03 / L34] prd-review 재실행 — R1 PASS(§1.0 내러티브로 강화) / R2 PASS(§9.5 RM 추가로 명확화) / R3 PASS(이니셔티브 파일 없음, 검증 스킵) / R4 PASS(외부 API 사실 검증 완료). PRD v0.3 확정. ALIGN 재진입 대기.
- [2026-05-03 / ALIGN-RERUN] ALIGN 재실행 (iteration 3) — 12개 항목 전항목 PASS. 기존 8항목 재검증 변동 없음. 신규 4항목(B1~B4): 항목 9 PASS(problem-definition.md 정합), 항목 10 PASS(§4.x ID 정합), 항목 11 PASS(RM1~RM7 ↔ tech-decision·decision-log 정합), 항목 12 PASS(7개 파일 전부 실재). Critical 0 / Major 0 / Minor 0. decision-log v1.2 갱신 완료. BUILD 진입 대기.

## rewind 이력
- 2026-05-03: doc-align rewind 1차 — Codex 외부 검토 6건 정정 (Major 4 + Minor 2)
- 2026-05-03: prd-writer rewind — 사용자 명시 요청에 따른 PRD 보강 (B1~B4). 게이트 FAIL 자동 재시도 아님 — rewind_count 증가 없음 (사용자 명시 요청은 자동 재시도가 아님).
- 2026-05-03: ALIGN 재실행 — Apollo prd-writer rewind 후속. 사용자 명시 요청. rewind_count 증가 없음.

## rewind_count
- 1 (자동 재시도 rewind만 계산 — 사용자 명시 요청 prd-writer rewind 제외)

## session_signals (Observer Mode)

### gap_signals
- [RESOLVED / L20] H2·H3 가설 검증 방법("subsequent click-through 감소", "최초 클릭 비율 상승") — 클릭 이벤트 미수집 확정. H2·H3는 자기보고로 회고. M1·M2·M3 DB count로 대체 측정.
- [RESOLVED / L19] DESIGN-GAP-1: `rgba(0, 0, 0, 0.08)` → `divider-subtle` Tailwind 토큰 등록 확정 (tech-decision.md 7.1).
- [RESOLVED / L18] DESIGN-GAP-2: Bottom Sheet / Right Drawer — 라이브러리 없이 자체 구현 확정. BottomSheet(모바일 ≤833px) + Dialog(데스크톱 ≥834px). a11y 책임 tech-decision.md 7.2에 명시.
- [RESOLVED / ALIGN] design-decision.md 합의 이력 "데스크톱 right drawer" → "데스크톱 dialog" 자동 수정 완료. (Minor 불일치, Athena(align) 자동 처리)
- [OPEN / prd-writer rewind] PRD §1.0 문제 발견 내러티브 부재 → 사용자 단독 독해 시 "사용자 불편 → 문제 발견 → 문제 정의" 내러티브 약함. B1 §1.0 신규 삽입으로 해소. (2026-05-03)

### friction_signals
- [ALIGN rewind 1차] ALIGN 1차 doc-align이 본문 일관성(Right Drawer→Dialog 본문 미반영, H2·H3 검증 방법 PRD 미갱신) 및 외부 API 사실 검증(YouTube commentThreads.list 고정 댓글 보장 불가, Drizzle direct connection RLS 비작동) 누락. 다음 세션 개선 입력: doc-align 스킬 실행 시 (1) 합의 이력만 아닌 본문 전체 grep 필수, (2) 외부 API 공식 문서 사실 검증 체크리스트 포함.
- [prd-writer rewind] PRD v0.2까지 §1.5 핵심 인사이트가 문제 발견 내러티브(raw user input, 발견 흐름, unmet need 귀인)를 요약만 했을 뿐 사용자 경험이 단독 독해 가능한 수준으로 기술되지 않음. prd-writer 스킬 기본 출력물에 §1.0 문제 발견 내러티브 섹션 포함 여부를 appetite 무관 기본 항목으로 고려 필요.
- [ALIGN 재실행] prd-writer 기본 출력물에 §1.0 문제 발견 내러티브 섹션 포함을 appetite 무관 기본 항목으로 고려 권장 (Apollo friction_signal 흡수).
- [ALIGN 재실행] prd-review R1 기준에 "단독 독해 시 불편→발견→정의 내러티브 완결성" 항목 추가 검토 권장 (Apollo friction_signal 흡수).

## repo_sync_status
- 미실행
