# Decision Log — nayo (나만의요리사)

> 버전: 2.3
> 작성일: 2026-05-03
> 갱신일: 2026-05-15 (L70 — AttemptStepNote v0.5 IN 부분 복원. Customization UI·쿨타임 홈은 OOS 유지.)
> 페이즈: ALIGN (v0.5 PIVOT 사이클 — user_scope 종료 지점 + 다음 사이클 선행 결정 + office-hours 검토 + L69 부분 수정)
> 기반: PRD v0.5 + Design Decision Doc v2.0 + Tech Decision Doc v3.0 + harness-state.md

---

## 개요

본 문서는 nayo(모두의요리사) 피처의 DISCOVER → DESIGN → ENGINEER 전 페이즈에 걸쳐 확정된 의사결정을 종합한 단일 기록이다. 각 결정에는 컨텍스트·대안·선택·근거·영향·후속 의존성을 명시한다. ALIGN 페이즈 이후 BUILD(구현) 페이즈의 팀 결정 추출 근거로 활용된다.

---

## 범례

| 필드 | 설명 |
|------|------|
| ID | 결정 식별자 (L = 로그 번호, 페이즈 접두어 포함) |
| 날짜 | 결정 확정일 |
| 페이즈 | 결정이 이루어진 페이즈 |
| 상태 | CONFIRMED / OPEN / SUPERSEDED |
| 컨텍스트 | 왜 이 결정이 필요했는가 |
| 대안 | 검토된 선택지 |
| 선택 | 확정된 내용 |
| 근거 | 선택 이유 |
| 영향 | 이 결정이 미치는 범위 |
| 후속 의존성 | 이 결정에 의존하는 후속 결정·작업 |

---

## DISCOVER 페이즈 결정

---

### L1 — 피처명 확정

| 항목 | 내용 |
|------|------|
| ID | L1-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 피처 작업 시작 시 임시명 `recipe-tracker`를 사용 중이었음. 사용자가 원하는 명칭 확정 필요. |
| **대안** | `recipe-tracker` (임시명), `nayo` (사용자 제안) |
| **선택** | `nayo` — "모두의요리사"의 줄임말. |
| **근거** | 사용자 명시 지정. 도메인과 페르소나를 함축하는 이름. |
| **영향** | 모든 파일 경로, 문서 헤더, harness-state 피처명 통일. |
| **후속 의존성** | docs/nayo/ 디렉토리 구조, README.md 피처명. |

---

### L2 — 문제 정의 합의 (JTBD + 핵심 페인)

| 항목 | 내용 |
|------|------|
| ID | L2-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 솔루션(유튜브 API 활용, 메뉴 검색)이 먼저 제시된 상황에서 문제를 먼저 정의해야 하는 필요성 확인. |
| **대안** | (1) 솔루션 중심으로 진행, (2) 문제 정의 먼저 합의 후 솔루션 |
| **선택** | 문제 정의 먼저. JTBD "이전 실패 경험과 변형 이력 기억 → 같은 실수 반복 않고 더 나은 결과 만들기". 핵심 페인 P1~P5 확정. |
| **근거** | 사용자 명시 "솔루션은 뒤로하고 불편함부터 정의하자." 문제 정의 없이 솔루션 선택 시 범위 크리프 위험. |
| **영향** | problem-definition.md, prd.md 배경 섹션의 기준 확정. |
| **후속 의존성** | MVP 스코프 결정(L3), 가설 설계(L6), 성공 지표(L5). |

---

### L3 — 데이터 모델 확정 (Dish / Video / Attempt 3-tier)

| 항목 | 내용 |
|------|------|
| ID | L3-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 유튜브 레시피 영상 기반 시도 기록 시스템을 어떤 단위로 데이터를 구조화할지 결정 필요. |
| **대안** | (1) 단일 테이블(영상+메모 flat), (2) Video + Memo 2-tier, (3) Dish / Video / Attempt 3-tier |
| **선택** | Dish / Video / Attempt 3-tier. Video.thumbs(up/down/미설정), Attempt.rating(0~5, 0.5단위), Attempt.changes, Attempt.improvement_note, Attempt.tried_at. |
| **근거** | 같은 메뉴를 여러 영상으로 시도하는 사용 패턴을 수용하려면 Dish(메뉴) 단위 집계가 필요. 영상 단위 thumbs 평가와 시도 단위 기록을 분리해야 의미 있는 집계(average_rating, attempt_count) 가능. |
| **영향** | PRD 섹션 3, Drizzle 스키마 전체, 집계 쿼리 설계, 메뉴 페이지 기능. |
| **후속 의존성** | Drizzle 스키마(L17), 파생 필드 집계(tech-decision §3.4), 메뉴 페이지 기능(L3 MVP). |

---

### L4 — MVP 스코프 확정 ((a)~(e) 5개 + Phase 2 2개)

| 항목 | 내용 |
|------|------|
| ID | L4-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 초기 제안 기능 중 1차 릴리스 범위를 정해야 함. 가설 검증 전에 복잡한 기능을 포함하면 구현 비용 대비 학습 효율 저하. |
| **대안** | (1) LLM 요약 포함 전체 릴리스, (2) 핵심 5개 기능만 |
| **선택** | 1차: (a) 메뉴 검색, (b) 시도 기록, (c) thumbs+정렬, (d-1차) description+고정댓글 원본 노출, (e) 메뉴 페이지. Phase 2: (d-2차) LLM 요약, (f) 통계. |
| **근거** | H1 가설(원본 노출 충분성)이 검증되어야 LLM 요약(d-2차) 투자 판단 가능. 통계(f)는 데이터 축적 후 의미 있음. |
| **영향** | PRD 섹션 5, 디자인 화면 인벤토리, 기술 구현 범위 전체. |
| **후속 의존성** | design-decision 화면 4개(L14), tech-decision API 설계. Phase 2 결정은 H1 검증 결과에 의존. |

---

### L5 — 검색 정렬 로직 확정

| 항목 | 내용 |
|------|------|
| ID | L5-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 유튜브 API는 기본 relevance/date 정렬만 제공. 사용자 맞춤 정렬이 핵심 가치(회상 비용 감소 P2, 저품질 영상 재선택 방지 P3). |
| **대안** | (1) 유튜브 기본 정렬 그대로, (2) 평점 순 단순 정렬, (3) thumbs up 우선 + 내부 평점 순 + 나머지 최신순 + thumbs down 디부스트 |
| **선택** | thumbs up 영상(≥1개일 때) → average_rating DESC, 나머지 → publishedAt DESC, thumbs down → 일반 영역 포함 + 디부스트 처리. |
| **근거** | P2(회상 비용): 이미 검증된 좋은 영상을 즉시 발견. P3(저품질 재선택): thumbs down 디부스트로 재선택 억제하되 완전 숨김 금지(사용자 인지 보존). |
| **영향** | PRD 섹션 4.2, design-decision 검색 화면 구성, tech-decision sortVideoResults() 함수. |
| **후속 의존성** | sortVideoResults() 구현(L21), TC-01~TC-04 테스트, H2·H3 가설 검증. |

---

### L6 — 성공 지표 (S2 행동 지표, M1~M3) 확정

| 항목 | 내용 |
|------|------|
| ID | L6-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | 단일 사용자 도구이므로 통계적 유의성 기반 지표(S1) 부적합. 행동 증거 기반 지표 필요. |
| **대안** | S1(통계적 유의성), S2(행동 지표), S3(정성적) |
| **선택** | S2 행동 지표. M1 Attempt 생성 횟수, M2 thumbs 등록 누적 수, M3 재시도 영상 비율(동일 Video Attempt ≥2건 비율). |
| **근거** | 모두 DB count로 직접 측정 가능. 단일 사용자에게 의미 있는 행동 증거. |
| **영향** | PRD 섹션 7, L20(클릭 이벤트 미수집 결정)과 연계. |
| **후속 의존성** | L20(H2·H3 자기보고 회고), DB count 쿼리 구현. |

---

### L7 — 가설 H1~H4 확정

| 항목 | 내용 |
|------|------|
| ID | L7-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | MVP에서 무엇을 배울 것인지 사전 정의 필요. 가설 없이 기능 개발 시 피드백 루프 부재. |
| **대안** | 가설 미정의(구현 중심 진행) vs. 명시적 가설 정의 |
| **선택** | H1(원본 노출 충분성), H2(thumbs down 디부스트 효과), H3(thumbs up 정렬 회상 비용 감소), H4(Attempt 기록 실제 참조 여부). |
| **근거** | Phase 2 기능 투자 결정(LLM 요약, 통계)을 가설 검증 결과에 귀속시키기 위함. |
| **영향** | Phase 2 결정 기준, L20(H2·H3 검증 방법 변경). |
| **후속 의존성** | H2·H3 자기보고 회고(L20). H1 검증 → d-2차 LLM 요약 도입 여부. H4 검증 → 통계 기능(f) 우선순위. |

---

### L8 — UI 분리 영구 가이드 확정

| 항목 | 내용 |
|------|------|
| ID | L8-DISCOVER |
| 날짜 | 2026-05-03 |
| 페이즈 | DISCOVER |
| 상태 | CONFIRMED |
| **컨텍스트** | DISCOVER 중 수집된 UI 노트가 PRD에 혼입될 위험. PRD는 기능 요구사항 문서여야 함. |
| **대안** | (1) PRD에 UI 힌트 포함, (2) PRD UI 완전 분리 |
| **선택** | PRD에 UI 묘사 포함 금지(영구 가이드). DISCOVER 중 수집된 UI 노트는 design-notes-from-discover.md에 별도 보관. |
| **근거** | 사용자 명시 원칙. PRD-디자인 경계 유지로 관심사 분리. |
| **영향** | prd.md 작성 기준, design-decision.md 분리 원칙, review-loop에서 UI 묘사 제거(L9). |
| **후속 의존성** | 모든 후속 PRD 갱신 시 이 원칙 준수 필수. |

---

## DESIGN 페이즈 결정

---

### L9 — 디자인 시스템 선택 (Apple Web Design System)

| 항목 | 내용 |
|------|------|
| ID | L9-DESIGN |
| 날짜 | 2026-05-04 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | UI 라이브러리/디자인 시스템 선택 필요. shadcn/ui 기본값 또는 커스텀 시스템 중 선택. |
| **대안** | shadcn/ui default, Apple Web Design System 차용, Material Design, 완전 커스텀 |
| **선택** | Apple Web Design System 차용. Photography-first, Single accent(#0066cc), Low density, Tile rhythm 원칙. Tailwind CSS 토큰 매핑으로 구현. shadcn/ui default 제거. |
| **근거** | 사용자 명시 지정. 유튜브 썸네일 중심 콘텐츠에 Photography-first가 적합. 단일 사용자 도구의 단순한 인터랙션 패턴과 부합. |
| **영향** | 전체 컴포넌트 구현 방식, Tailwind 토큰 구조, UI 자체 구현 결정(L17)과 연계. |
| **후속 의존성** | Tailwind 토큰 등록(L18), 자체 구현 컴포넌트 a11y 책임(L17). |

---

### L10 — 반응형 전략 + 시도 기록 입력 UX 분기

| 항목 | 내용 |
|------|------|
| ID | L10-DESIGN |
| 날짜 | 2026-05-04 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | 시도 기록 입력 폼을 어떤 UI 패턴으로 제공할지 미결. 모바일과 데스크톱 경험 차이 고려 필요. |
| **대안** | (1) 항상 전체 페이지 이동, (2) 모달/팝업 단일 패턴, (3) 반응형 분기(모바일 BottomSheet / 데스크톱 Drawer 또는 Dialog) |
| **선택** | 반응형 분기. ≤833px → BottomSheet. ≥834px → Dialog (ENGINEER 페이즈에서 Right Drawer에서 Dialog로 최종 확정). |
| **근거** | 모바일에서 BottomSheet는 엄지 접근성 최적. 데스크톱에서 Dialog가 구현 복잡도 대비 UX 동등. Right Drawer의 photography-first 우위는 구현 비용으로 상쇄. |
| **영향** | BottomSheet, Dialog 자체 구현(L17), a11y focus trap(L17), VQ3 트랜지션. |
| **후속 의존성** | BottomSheet/Dialog 구현 완료 후 Playwright E2E(U5). |

---

### L11 — "더보기" 인터랙션 방식 (인라인 확장)

| 항목 | 내용 |
|------|------|
| ID | L11-DESIGN |
| 날짜 | 2026-05-04 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | thumbs up 영상 "더 보기"와 description "더 보기" 인터랙션 방식 미결. |
| **대안** | (1) 별도 페이지 이동, (2) 모달 팝업, (3) 인라인 확장(그 자리에서 펼쳐짐) |
| **선택** | 인라인 확장. 카드들이 그 자리에서 아래로 펼쳐짐. `transition: max-height 250ms ease-in-out`. |
| **근거** | 컨텍스트 유지(스크롤 위치 보존). Apple Low density 원칙 — 불필요한 페이지 전환 최소화. |
| **영향** | design-decision 검색 화면 구성, description 300자 + 더보기 처리, VQ3 트랜지션 스펙. |
| **후속 의존성** | VQ5 포커스 관리("더 보기" 확장 시 포커스 이동 없음). |

---

### L12 — description max length 정책 (OQ1 해소)

| 항목 | 내용 |
|------|------|
| ID | L12-DESIGN |
| 날짜 | 2026-05-03 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD OQ1: description 어느 길이까지 즉시 노출, 어디서 접을 것인가. PRD에서 "원본 텍스트 그대로 노출" 원칙만 있고 길이 처리 미결. |
| **대안** | (1) 전체 노출(스크롤 부담), (2) 200자, (3) 300자, (4) 500자 기준 |
| **선택** | 300자 즉시 노출 → "더 보기" 토글 → 인라인 전체 확장. 짤림 없이 전체 원문 접근 가능 보장. |
| **근거** | 300자는 레시피 핵심 재료 확인에 충분한 미리보기. 더 보기로 전체 원문 접근 보장하여 PRD "가공 없음" 원칙 준수. |
| **영향** | 영상 상세 화면 light tile 영역 구현, PRD H1 가설 검증 방식. |
| **후속 의존성** | 없음 (자기완결). |

---

### L13 — thumbs up 0개 처리 (OQ2 해소)

| 항목 | 내용 |
|------|------|
| ID | L13-DESIGN |
| 날짜 | 2026-05-03 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD OQ2: thumbs up 0개일 때 우선 노출 영역 처리 방식. PRD에서 "섹션 미표시" 방향만 제시. |
| **대안** | (1) 빈 섹션 + 안내 메시지, (2) 섹션 자체 미표시 |
| **선택** | 섹션 자체 미표시. 0개 상태의 별도 Empty UI 없음. |
| **근거** | 초기 사용자에게 불필요한 "아직 좋아한 영상이 없어요" 안내는 PRD 핵심 가치 전달보다 인지 부하 증가. 섹션이 사라지는 것이 자연스러운 progressive disclosure. |
| **영향** | 검색 화면 구성, sortVideoResults() thumbsUpSection이 빈 배열일 때 처리, TC-02. |
| **후속 의존성** | 없음 (자기완결). |

---

### L14 — 화면 인벤토리 4개 확정

| 항목 | 내용 |
|------|------|
| ID | L14-DESIGN |
| 날짜 | 2026-05-03 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | MVP 기능 5개를 몇 개의 화면으로 구성할지 결정 필요. |
| **대안** | (1) 단일 페이지(scroll), (2) 3개 화면, (3) 4개 화면 |
| **선택** | 4개 화면: 검색 화면 / 영상 카드(컴포넌트) / 영상 상세 화면 / 메뉴 페이지. |
| **근거** | 검색(a+c), 시도 기록(b), description+고정댓글(d-1차)을 영상 상세에 통합. 메뉴 페이지(e)는 Dish 단위 통합 뷰로 별도 화면. 영상 카드는 검색 화면과 메뉴 페이지 양쪽에서 재사용되는 공유 컴포넌트. |
| **영향** | 라우팅 구조(Next.js App Router), 컴포넌트 재사용성. |
| **후속 의존성** | 각 화면의 API 연결, 컴포넌트 매핑(L15). |

---

### L15 — 컴포넌트 매핑 확정

| 항목 | 내용 |
|------|------|
| ID | L15-DESIGN |
| 날짜 | 2026-05-03 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | Apple Web Design System 컴포넌트를 nayo 각 화면에 어떻게 매핑할지 결정 필요. |
| **대안** | 해당 없음 (매핑 정의 작업 자체가 결정). |
| **선택** | store-utility-card 변형(영상 카드), product-tile-dark(영상 상세 상단), button-primary(모든 주요 CTA), search-input(메뉴 검색). |
| **근거** | Photography-first 원칙에 최적화된 컴포넌트 선택. |
| **영향** | 자체 구현 컴포넌트 목록(L17)의 입력. |
| **후속 의존성** | 자체 구현 컴포넌트 a11y 책임 명세(L17). |

---

### L16 — divider 처리 방식 (surface 교차)

| 항목 | 내용 |
|------|------|
| ID | L16-DESIGN |
| 날짜 | 2026-05-03 |
| 페이즈 | DESIGN |
| 상태 | CONFIRMED |
| **컨텍스트** | 섹션 구분선(divider) 처리 방식. 기존 HR 태그 또는 색상 변화 |
| **대안** | (1) HR 태그/border, (2) surface 색상 교차로 divider 대체 |
| **선택** | canvas(white) ↔ canvas-parchment(#f5f5f7) surface 교차. 색 변화 자체가 divider 역할. |
| **근거** | Apple Low density 원칙. 추가 UI 요소 없이 시각적 구분 달성. Tile rhythm 원칙과 일치. |
| **영향** | divider-subtle 토큰이 폼 입력 border 용도로 별도 등록(L18). |
| **후속 의존성** | divider-subtle 토큰 등록(L18 — DESIGN-GAP-1 해결). |

---

## ENGINEER 페이즈 결정

---

### L17 — ORM 선택 (Drizzle)

| 항목 | 내용 |
|------|------|
| ID | L17-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | Supabase 환경에서 DB 접근 방식 선택. Supabase 클라이언트 직접 vs ORM. |
| **대안** | Supabase JS client 직접 쿼리, Prisma, Drizzle |
| **선택** | Drizzle (server-side query·migration). Auth 처리만 supabase-js 사용. DB 연결: drizzle-orm/postgres-js + DATABASE_URL. |
| **근거** | type-safe SQL, migration 자동화(drizzle-kit). Prisma 대비 경량. Supabase Auth와 DB를 분리하여 각각 최적 도구 사용. |
| **영향** | db/schema.ts, db/index.ts, drizzle.config.ts 구조, migration 워크플로우. |
| **후속 의존성** | U3(migration 자동화 후속 결정), 스키마 변경 시 drizzle-kit generate + migrate 필수. |

---

### L18 — UI 컴포넌트 자체 구현 (외부 headless 라이브러리 미사용)

| 항목 | 내용 |
|------|------|
| ID | L18-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | BottomSheet, Dialog, ToggleGroup 등을 위해 Vaul, Radix UI Dialog 등 headless 라이브러리 사용 검토. DESIGN-GAP-2로 등록. |
| **대안** | Vaul(Bottom Sheet), Radix UI Dialog, 자체 구현 |
| **선택** | 자체 구현. BottomSheet, Dialog, Dropdown, ToggleGroup, StarRating, SearchInput, Card, Button, Toast, Skeleton, EmptyState 11종. |
| **근거** | Apple 디자인 시스템 토큰 완전 제어 필요. 외부 라이브러리의 기본 스타일 오염 방지. 단일 사용자 도구이므로 라이브러리 의존성 최소화 전략 적합. |
| **영향** | focus trap 자체 구현(7.3), body scroll lock(7.4), a11y 책임 컴포넌트별 명시, TC-09~TC-14 테스트 케이스. |
| **후속 의존성** | 자체 구현 focus trap 브라우저별 동작 차이 → Vitest + @testing-library 단위 테스트 사전 검증(risk_flag). U5(Playwright E2E 선택 여부). |

---

### L19 — divider-subtle Tailwind 토큰 등록 (DESIGN-GAP-1 해결)

| 항목 | 내용 |
|------|------|
| ID | L19-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | design-decision에서 폼 입력 border를 `rgba(0, 0, 0, 0.08)`로 지정했으나 Tailwind 토큰으로 등록되지 않아 임의 값 사용 위험(DESIGN-GAP-1). |
| **대안** | (1) 임의값 사용(`border-[rgba(0,0,0,0.08)]`), (2) Tailwind 커스텀 토큰 등록 |
| **선택** | `divider-subtle` Tailwind 커스텀 색상 토큰 등록. `tailwind.config.ts`에 `rgba(0, 0, 0, 0.08)` 추가. |
| **근거** | 디자인 토큰 일관성 유지. 임의값 사용 시 토큰 관리 불가. |
| **영향** | tailwind.config.ts 토큰 목록, 폼 입력 border 사용처. |
| **후속 의존성** | 없음 (DESIGN-GAP-1 완전 해결). |

---

### L20 — 클릭 이벤트 미수집 확정 (H2·H3 자기보고 회고)

| 항목 | 내용 |
|------|------|
| ID | L20-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | H2(thumbs down 디부스트 효과)와 H3(thumbs up 정렬 회상 비용 감소)의 검증 방법이 "subsequent click-through 감소"와 "최초 클릭 비율 상승"으로 정의되어 있었으나, 클릭 이벤트 수집 인프라 없음(ENGINEER gap_signal). |
| **대안** | (1) GA4 또는 Amplitude 이벤트 수집 추가, (2) 클릭 이벤트 미수집 + 자기보고 회고 |
| **선택** | 클릭 이벤트 미수집. M1·M2·M3는 DB count로 측정. H2·H3는 자기보고 회고. |
| **근거** | 단일 사용자 도구에서 이벤트 수집 인프라 오버헤드 불필요. 자기보고가 단일 사용자에게 신뢰성 있는 대안. |
| **영향** | tech-decision §2 분석/이벤트 항목, PRD 가설 H2·H3 검증 방법 갱신 (ALIGN rewind 1차 정정 반영 — prd.md H2·H3 검증 방법 자기보고 회고로 수정 완료). |
| **후속 의존성** | Phase 2 결정 시 이벤트 수집 재검토 가능. |

---

### L21 — 검색 정렬 책임 분리 (API Route + 클라이언트)

| 항목 | 내용 |
|------|------|
| ID | L21-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | 검색 정렬을 서버(API Route)에서 할지 클라이언트에서 할지 결정 필요. |
| **대안** | (1) 서버 정렬(SQL ORDER BY), (2) 클라이언트 정렬, (3) 혼합(서버 집계 + 클라이언트 최종 정렬) |
| **선택** | API Route: DB 집계(thumbs, AVG rating, COUNT, MAX tried_at) + YouTube 캐시 조회. 클라이언트: sortVideoResults() 최종 정렬. |
| **근거** | YouTube 검색 결과(publishedAt 등)는 서버에서 집계하기 어려움. DB 데이터(thumbs, rating)는 서버에서 집계. 최종 정렬 알고리즘을 클라이언트에 두면 단위 테스트 용이. |
| **영향** | sortVideoResults() 함수(lib/sort-videos.ts), TC-01~TC-04 단위 테스트, TanStack Query 서버 상태 관리. |
| **후속 의존성** | TC-01~TC-04 구현 필수. |

---

### L22 — YouTube API 캐시 전략 (youtube_cache 테이블, 24h TTL)

| 항목 | 내용 |
|------|------|
| ID | L22-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | YouTube Data API v3 quota 10,000 units/day. search.list = 100 units/call로 무거움. 캐시 없이 사용 시 50회 검색 이후 quota 초과. |
| **대안** | (1) 메모리 캐시(Redis/Vercel KV), (2) 로컬 파일 캐시, (3) DB 테이블(Supabase Postgres) |
| **선택** | Supabase Postgres 테이블 `youtube_cache`. 24h TTL. 캐시 키: `search:{normalized_query}`, `video:{youtube_video_id}`. |
| **근거** | DB 기반 캐시는 재배포 이후에도 유지됨(Redis/메모리 대비 우위). 별도 인프라 불필요. |
| **영향** | youtube_cache 테이블 스키마, U2(TTL 연장 후속 결정), U6(만료 레코드 정리 후속 결정). |
| **후속 의존성** | U2: API quota 소진율 모니터링 후 72h/7d 연장 검토. U6: 1개월 후 row count 확인(만료 레코드 누적 위험 — risk_flag). |

---

### L23 — Google OAuth + 화이트리스트 인증

| 항목 | 내용 |
|------|------|
| ID | L23-ENGINEER |
| 날짜 | 2026-05-03 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | 단일 사용자 도구이지만 퍼블릭 배포 시 임의 접근 차단 필요. |
| **대안** | (1) 인증 없음, (2) 비밀번호 인증, (3) Google OAuth + 화이트리스트 |
| **선택** | Google OAuth (supabase-js signInWithOAuth) + allowed_users 테이블 화이트리스트. 초기 1건 수동 삽입. |
| **근거** | 단일 사용자이므로 복잡한 계정 관리 불필요. Google OAuth로 인증 위임. 화이트리스트로 허가된 이메일만 접근. |
| **영향** | allowed_users 테이블, requireAuth() 미들웨어, 모든 API Route 보안 경계. |
| **후속 의존성** | U4(다중 사용자 전환 시 RLS 재검토). |

---

### L24 — appetite 확정 (Standard)

| 항목 | 내용 |
|------|------|
| ID | L24-ENGINEER |
| 날짜 | 2026-05-04 |
| 페이즈 | ENGINEER |
| 상태 | CONFIRMED |
| **컨텍스트** | Hermes 자율 결정(L3 자율). 피처 복잡도 기준 appetite 분류 필요. |
| **대안** | Quick Fix(1-3일), Standard(1-2주), Epic(신규 도메인·아키텍처) |
| **선택** | Standard. 예상 wall-clock 1-2주 (사이드 페이스에서 늘어질 수 있음). |
| **근거** | 신규 앱(코드 0), 외부 API(YouTube Data v3) 통합, DB 3-tier 신규 설계, 검색 정렬 로직 신규, 5개 MVP 기능. Quick Fix 초과, Epic(신규 도메인·아키텍처 변경)에는 못 미침. |
| **영향** | 전체 피처 페이스 설정. |
| **후속 의존성** | 없음 (자기완결). |

---

---

## ALIGN rewind 1차 결정 (2026-05-03)

---

### L25 — H2·H3 검증 방법 = 자기보고 회고로 PRD 갱신 (ALIGN rewind 1차)

| 항목 | 내용 |
|------|------|
| ID | L25-ALIGN-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (rewind 1차) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD H2 검증 방법 "subsequent click-through 감소", H3 "최초 클릭 비율 상승"은 클릭 이벤트 수집 인프라를 전제함. ENGINEER 결정(L20)에서 클릭 이벤트 미수집 확정 → PRD 본문이 미갱신 상태로 불일치 잔존. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) 클릭 이벤트 수집 인프라 추가, (2) PRD H2·H3 검증 방법을 자기보고 회고로 갱신 |
| **선택** | PRD H2·H3 검증 방법을 자기보고 회고로 갱신. H2: "thumbs down 디부스트 후 자기보고로 저품질 영상 재선택 감소 여부 회고(분기별)". H3: "thumbs up 정렬 후 자기보고로 회상 시간 감소 여부 회고(분기별)". PRD에 성공 지표(M1~M3)와 가설 검증(H1~H4) 영역 분리 명시 추가. |
| **근거** | ENGINEER 페이즈 결정(클릭 이벤트 미수집, L20)이 최신·정답. PRD가 실제 구현 결정보다 오래된 가정을 유지하는 것은 불일치. 단일 사용자 도구에서 자기보고가 신뢰성 있는 대안. |
| **영향** | prd.md 섹션 6(H2·H3 검증 방법) 갱신. 영역 분리 명시 추가. |
| **후속 의존성** | 없음 (자기완결). |

---

### L26 — 고정 댓글 → 상위 댓글 1개 best-effort (외부 API 제약 반영)

| 항목 | 내용 |
|------|------|
| ID | L26-ALIGN-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (rewind 1차) |
| 상태 | CONFIRMED |
| **컨텍스트** | YouTube Data API v3 `commentThreads.list`는 pinned comment 필터 및 관련 필드를 지원하지 않음. `order=relevance, maxResults=1`은 관련도 상위 1개를 반환하며 고정 댓글을 보장하지 않음. PRD·design-decision·tech-decision 전체에 "고정 댓글"로 표기되어 사실 오류 상태. Codex 외부 검토에서 Major 불일치로 지적. 사용자 결정 사전 수령: 선택 A(best-effort). |
| **대안** | A. best-effort — "상위 댓글 1개" 표기 (API 실제 동작 반영). B. 댓글 기능 제거. |
| **선택** | A. `commentThreads.list` `order=relevance, maxResults=1` 호출. "상위 댓글 1개 (best-effort, 고정 댓글 포함 가능성 있으나 API상 보장 X)"로 표기. 폴백: 403 `commentsDisabled` catch 시 댓글 영역 미표시. |
| **근거** | 사용자 사전 결정(A). API 사실에 부합하는 표기로 모든 문서 일치. 기능 제거 없이 가능한 최선 동작 유지. |
| **영향** | prd.md 4.5, 5.1, 6(H1), 8, 부록 갱신. design-decision.md 영상 상세 구성, Empty 상태, Loading 상태 갱신. tech-decision.md 5.2 흐름, TC-18 갱신. |
| **후속 의존성** | TC-18 테스트 케이스: 403 commentsDisabled 응답 mock + 댓글 영역 미표시 검증. |

---

### L27 — 보안 경계 재정의: Drizzle WHERE = 단일 경계, RLS는 server 경로 미적용

| 항목 | 내용 |
|------|------|
| ID | L27-ALIGN-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (rewind 1차) |
| 상태 | CONFIRMED |
| **컨텍스트** | tech-decision §4.2에서 "RLS는 보조 레이어"로 기술했으나, Drizzle direct DATABASE_URL은 Supabase Auth JWT context를 자동 주입하지 않으므로 RLS `auth.uid()`가 서버 API 경로에서 작동하지 않음. 보조 방어선으로도 의존 불가. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) Supabase client 경로 추가 도입 + RLS 의존, (2) 보안 모델 재명시 (Drizzle WHERE = 단일 경계) |
| **선택** | 보안 모델 재명시. 서버 API 경로에서 `WHERE user_id = currentUser.id`가 유일한 실질 보안 경계. RLS는 server 경로 미적용. service role key 사용 시 RLS 자동 bypass. scoped helper 함수 도입 권장. |
| **근거** | 아키텍처 사실에 부합하는 보안 모델 명시. "RLS가 보조 방어선"이라는 잘못된 가정 제거 → 구현 시 보안 취약점 방지. |
| **영향** | tech-decision §4.2 재작성. decision-log U4 갱신. |
| **후속 의존성** | 모든 Drizzle 쿼리에서 `eq(테이블.userId, userId)` 누락 없이 적용 필수. BUILD 페이즈 코드 리뷰 C1 체크리스트에 추가 권장. |

---

### L28 — 캐시 키 통일: cache_key 단일 컬럼 + search:/video: prefix

| 항목 | 내용 |
|------|------|
| ID | L28-ALIGN-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (rewind 1차) |
| 상태 | CONFIRMED |
| **컨텍스트** | tech-decision §5.1 흐름 설명에서 `WHERE query = q` 표현과, §5.3 캐시 키 명세 `search:{normalized_query}`, `video:{youtube_video_id}` 표현이 충돌. Drizzle 스키마에서 `query` 컬럼이 단일 용도로 정의되어 있어 검색 캐시와 영상 상세 캐시를 동일 컬럼으로 구분하지 못하는 구조. Codex 외부 검토에서 Minor 불일치로 지적. |
| **대안** | (1) query/type 분리 컬럼, (2) cache_key 단일 컬럼 + prefix 규칙 |
| **선택** | `youtube_cache.cache_key` TEXT UNIQUE 단일 컬럼. 검색 캐시: `"search:" + normalized_query` (소문자+trim). 영상 상세: `"video:" + youtube_video_id`. 모든 흐름 설명, 인덱스, Drizzle 스키마 이 기준으로 통일. |
| **근거** | 단일 컬럼 + prefix 규칙이 단순하고 명확. 두 캐시 유형을 동일 테이블에서 구분 가능. 인덱스 1개(`cache_key_idx`)로 모든 캐시 조회 처리. |
| **영향** | tech-decision §3.2 스키마(query→cache_key), §3.3 인덱스 정책, §5.1 검색 흐름, §5.2 영상 상세 흐름, §5.3 캐시 키 명세 전체. |
| **후속 의존성** | Drizzle migration: `query` 컬럼 → `cache_key` 컬럼으로 rename (또는 신규 테이블 생성). |

---

## ALIGN 재실행 결정 (2026-05-03) — Apollo prd-writer rewind 후속

---

### L29 — PRD B1: §1.0 문제 발견 내러티브 신규 삽입

| 항목 | 내용 |
|------|------|
| ID | L29-ALIGN-RERUN |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD v0.2까지 §1.5 "핵심 인사이트"가 문제 발견 내러티브를 요약만 했을 뿐 사용자 경험이 단독 독해 가능한 수준으로 기술되지 않음. gap_signal로 등록. 사용자 명시 요청으로 PRD rewind(B1) 실행. |
| **대안** | (1) §1.5에 인라인 보충, (2) 신규 §1.0 섹션 삽입 |
| **선택** | §1.0 "문제 발견 내러티브" 신규 삽입. raw user input(사용자 본인 발화) blockquote 인용 + 발견 흐름 4단계(격주 반복 → 우회 수단 0 → 검색이 문제 아님 → 자기 귀인) + unmet need 귀인 명시. |
| **근거** | 사용자 명시 요청. PRD 단독 독해 시 "불편 → 발견 → 정의" 내러티브 완결성 보장 필요. problem-definition.md와의 정합성 유지. |
| **영향** | prd.md §1.0 신규 (L21~L34). problem-definition.md와 교차 확인 완료(의미 변질 없음). |
| **후속 의존성** | prd-review R1 재실행 PASS 확인. ALIGN 재실행 항목 9 검증 대상. |

---

### L30 — PRD B2: §2.3 페인 ↔ 기능 매핑 표 신규 삽입

| 항목 | 내용 |
|------|------|
| ID | L30-ALIGN-RERUN |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD §2 솔루션 개요에 "왜 이 기능들이 이 페인을 해소하는가"의 연결 근거 부재. prd-review에서 매핑 명시 요구. |
| **대안** | (1) 본문 서술로 연결 기술, (2) 표 형식 P-F 매핑 |
| **선택** | §2.3 "페인 ↔ 기능 매핑" 표 신규 삽입. P1~P5 ↔ §4.x 기능 ID 매트릭스 + 작동 방식 명시. |
| **근거** | 사용자 명시 요청. 기능-페인 연결의 명시적 근거 확보. ALIGN 검증 항목 10의 기준 문서화. |
| **영향** | prd.md §2.3 신규 (L75~L85). §4.x 기능 ID 정합 검증 완료(항목 10 PASS). |
| **후속 의존성** | 기능 섹션 번호 변경 시 §2.3 매핑 표 동기화 필수. |

---

### L31 — PRD B3: §9.5 Risk · Mitigation RM1~RM7 신규 삽입

| 항목 | 내용 |
|------|------|
| ID | L31-ALIGN-RERUN |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD §9 비-목표에 리스크 대응 분기가 부재. H1~H4 가정이 깨질 경우 어떤 분기로 진행할지 불명확. RM5(quota)·RM6(댓글 비활성화)·RM7(a11y)에 대한 분기 경로가 tech-decision에만 있고 PRD에 연결 없음. |
| **대안** | (1) ENGINEER 페이즈 문서에만 유지, (2) PRD §9.5로 명시적 연결 |
| **선택** | §9.5 "Risk · Mitigation" 신규 삽입. RM1~RM7 시나리오·시그널·완화·분기 명시. |
| **근거** | 사용자 명시 요청. 가설(H1~H4)과 리스크(RM1~RM7) 연결 고리를 PRD에서 확인 가능하도록. tech-decision 캐시 정책(U2), TC-18 폴백, R1 리스크와 교차 확인 완료(항목 11 PASS). |
| **영향** | prd.md §9.5 신규 (L262~L274). decision-log U2·R1과 정합. |
| **후속 의존성** | RM 시나리오 트리거 시 해당 분기 결정을 decision-log에 추가 기록. |

---

### L32 — PRD B4: 참고 문서 박스 신규 삽입

| 항목 | 내용 |
|------|------|
| ID | L32-ALIGN-RERUN |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD 헤더에 연관 산출물 위치 정보가 없어 단독 독해 시 다른 문서로의 진입점 부재. |
| **대안** | (1) README 참조 안내, (2) PRD 헤더 내 참고 문서 박스 |
| **선택** | PRD 헤더(L8~L16)에 참고 문서 박스 신규 삽입. 7개 산출물 경로 명시: problem-definition.md / design-decision.md / design-system.md / tech-decision.md / decision-log.md / design-notes-from-discover.md / harness-state.md. |
| **근거** | 사용자 명시 요청. ALIGN 검증 항목 12에서 7개 파일 모두 docs/nayo/ 하위 실재 확인 완료. |
| **영향** | prd.md L8~L16 신규. 파일 경로 변경 시 박스 동기화 필수. |
| **후속 의존성** | 신규 산출물 추가 시 참고 문서 박스 갱신. |

---

## Out of Scope (명시적 범위 외 항목)

| ID | 항목 | 제외 이유 | 재검토 시점 |
|----|------|----------|------------|
| OOS-1 | d-2차: LLM 요약 (description + 고정댓글 LLM 정리) | H1 가설 검증 후 결정. 원본 노출이 충분하면 불필요. | H1 검증 결과 후 |
| OOS-2 | f: 통계/그래프 (별점 시계열, 실력 향상 추적) | 기록 데이터 축적 후 의미 있음. 초기 릴리스에서 데이터 없음. | 6개월+ 운영 후 |
| OOS-3 | 유튜브 외 플랫폼 지원 (블로그, 앱 레시피) | JTBD 범위 외. 사용자 명시 비-목표. | 미정 |
| OOS-4 | 레시피 자동 추천 / 새 레시피 탐색 | 탐색은 페인이 아님. 사용자 명시. | 미정 |
| OOS-5 | 식단·칼로리 관리, 건강 목적 기능 | 도메인 외. 사용자 명시 비-목표. | 미정 |
| OOS-6 | 식재료 구매·재고 관리 | 도메인 외. 사용자 명시 비-목표. | 미정 |
| OOS-7 | 다중 사용자 공유·협업 | 단일 사용자 페르소나. 페르소나 차원과 섭취자 차원 분리. | 미정 |
| OOS-8 | floating-sticky-bar (빠른 기록 진입) | Phase 2 후보. 현재 미포함. design-decision 컴포넌트 목록에 Phase 2 표기. | Phase 2 |
| OOS-9 | h: 부분 검색 통합 결과 (한국어 형태소·동의어 처리) | 실사용 후 사용자가 부분 검색을 자주 사용하는지 모니터링 후 도입 검토. PRD §5.2 h, §9 비-목표 명시. | 실사용 후 결정 |

---

## 미결 사항 (Open Decisions)

| ID | 항목 | 현재 결정 | 후속 검토 시점 |
|----|------|----------|-------------|
| U1 | 한글 메뉴명 검색 인덱싱 정밀도 | MVP는 user_id btree 필터 + leading wildcard LIKE sequential scan 허용. 필요 시 pg_trgm 확장 후 GIN index 전환. | 실사용 후 검색 정확도 확인 |
| U2 | youtube_cache TTL | 24h 기본값. | API quota 소진율 모니터링 후 72h/7d 연장 검토 |
| U3 | Drizzle migration 자동화 | 수동(drizzle-kit migrate 수동 실행). | Vercel 배포 훅 연동 또는 별도 script 검토 |
| U4 | RLS 정책 세부 | Drizzle direct connection에서 RLS auth.uid() 미작동 확인. Drizzle WHERE user_id = 단일 보안 경계. RLS는 server 경로 미적용 (참고용 정의만 유지). | 다중 사용자 전환 시 재검토 |
| U5 | Playwright E2E 선택 여부 | "선택" 상태. | BottomSheet/Dialog 구현 완료 후 판단 |
| U6 | youtube_cache 만료 레코드 정리 | 수동 또는 Postgres cron. 처리 없으면 영구 누적. | 1개월 운영 후 row count 확인 |
| U7 | 자동완성 한국어 매칭 정확도 (OQ5) | `lower(name) LIKE lower('%query%')` 기본. 부정확 빈발 시 pg_trgm GIN index 도입 검토. 트리거 기준 미결. | 실사용 후 결정 |
| U8 | 유튜브 삭제 주기적 체크 | MVP 미포함 (lazy check만). 실사용 후 필요 시 Vercel Cron 주 1회 batch 검토. | 실사용 후 결정 |
| OQ6-resolved | Step.video_timestamp 영상 길이 초과 검증 | 0 이상 정수 또는 null만 허용(zod). 영상 길이 초과는 허용(사용자 기록 보존). 음수 거부(400). tech-decision §7.3. | RESOLVED — BUILD 페이즈 구현 반영 |

---

## 리스크 플래그 (ENGINEER 인계)

| ID | 리스크 | 현재 대응 | 후속 확인 |
|----|--------|----------|----------|
| R1 | 자체 구현 focus trap 브라우저별 동작 차이 | Vitest + @testing-library 단위 테스트(TC-09~TC-14)로 사전 검증 | BUILD 페이즈 구현 완료 후 크로스 브라우저 확인 |
| R2 | youtube_cache 만료 레코드 누적 | 현재 별도 정리 없음 | 1개월 운영 후 row count 확인(U6) |
| R3 | 한글 메뉴명 검색 정확도 | MVP LIKE sequential scan은 소량 Dish 기준 성능 허용이나, 한글 부분 매칭 정확도는 부족 가능 | 실사용 후 검색 정확도 확인(U1) |

---

## ALIGN 페이즈 doc-align 요약

### 1차 doc-align (2026-05-03, iteration 1) — Athena(align) 최초 실행

| 검증 항목 | 판정 | 비고 |
|----------|------|------|
| 데이터 모델 일관성 | PASS | thumbs varchar(4)+NULL = enum(up/down/미설정) 동일 의미 |
| MVP 스코프 일관성 | PASS | Minor: tech-decision API 명시적 목록 섹션 부재 (기능 커버리지는 일치) |
| 검색 정렬 로직 | PASS | 동률 처리(attemptCount DESC) tech 추가는 PRD 원칙 내 |
| 시도 기록 입력 UX | PASS(Minor 수정) | design-decision 합의 이력 "right drawer" → "dialog" 자동 수정 완료 |
| thumbs 상태 모델 | PASS | 완전 정합 |
| 영상 카드 메타 | PASS | AVG/COUNT/MAX 집계 3개 필드 완전 정합 |
| description/고정댓글 | PASS | "가공 없음" + 300자 더보기는 UI 처리이지 가공 아님. 폴백 정책 정합 |

1차 Critical 불일치: 0건 / Major 불일치: 0건 / Minor 자동 수정: 1건

### doc-align rewind 1차 (2026-05-03, iteration 2) — Codex 외부 검토 6건 정정

| 검증 항목 | 판정 | 비고 |
|----------|------|------|
| 데이터 모델 일관성 | PASS | 변동 없음 |
| MVP 스코프 일관성 | PASS | 변동 없음 |
| 검색 정렬 로직 | PASS | 변동 없음 |
| 시도 기록 입력 UX | PASS | Major 3 정정 완료 — design-decision 본문 전체 Dialog 기준으로 통일 |
| thumbs 상태 모델 | PASS | 변동 없음 |
| 영상 카드 메타 | PASS | 변동 없음 |
| description/상위 댓글 | PASS | Major 1 정정 완료 — 고정 댓글 보장 불가 → 상위 댓글 1개 best-effort로 PRD↔design-decision↔tech-decision 일치 |
| 보안 경계 | PASS | Major 4 정정 완료 — tech-decision↔decision-log 일치. Drizzle WHERE = 단일 경계 명시 |
| H2·H3 검증 방법 | PASS | Major 2 정정 완료 — PRD H2·H3 자기보고 회고로 갱신, 영역 분리 명시 추가 |
| 캐시 키 통일 | PASS | Minor 6 정정 완료 — cache_key 단일 컬럼 + prefix 규칙 일관 적용 |

rewind 1차 Critical 불일치: 0건 / Major 정정: 4건 / Minor 정정: 2건 (총 6건)

### ALIGN 재실행 (2026-05-03, iteration 3) — Apollo prd-writer rewind 후속

**검증 항목 및 판정:**

| 번호 | 검증 항목 | 판정 | 파일·위치 | 비고 |
|------|----------|------|----------|------|
| 1 | 데이터 모델 일관성 (Dish/Video/Attempt 3-tier) | PASS | prd.md §3 / tech-decision.md §3.2 / decision-log L3 | 변동 없음 |
| 2 | MVP 스코프 일관성 (a/b/c/d-1차/e + Phase 2 d-2차/f) | PASS | prd.md §5 / tech-decision.md TC 목록 / decision-log L4 | 변동 없음 |
| 3 | 검색 정렬 로직 일관성 | PASS | prd.md §4.2 / design-decision.md 검색 화면 / tech-decision.md §6.2 | 변동 없음 |
| 4 | 시도 기록 입력 UX (BottomSheet/Dialog) | PASS | design-decision.md §시도 기록 입력 UX / tech-decision.md §7.2 | 변동 없음 |
| 5 | thumbs 상태 모델 (up/down/미설정 3상태) | PASS | prd.md §3.2 / tech-decision.md §3.2 thumbs varchar(4) | 변동 없음 |
| 6 | 영상 카드 메타 (attempt_count·last_tried_at·average_rating) | PASS | prd.md §3.2 / design-decision.md 영상 카드 / tech-decision.md §3.4 | 변동 없음 |
| 7 | description / 상위 댓글 1개 (best-effort, 403 폴백) | PASS | prd.md §4.5 / design-decision.md 영상 상세 / tech-decision.md §5.2·TC-18 | 변동 없음 |
| 8 | 보안 경계 (Drizzle WHERE = 단일 경계, RLS server 미적용) | PASS | tech-decision.md §4.2 / decision-log L27·U4 | 변동 없음 |
| 9 | B1 §1.0 내러티브 ↔ problem-definition.md 정합 | PASS | prd.md L21~L34 / problem-definition.md 전체 | 의미 변질 없음. 격주·우회 수단 0·자기 귀인 일치 |
| 10 | B2 §2.3 매핑 표 ↔ §4.x 기능 ID 정합 | PASS | prd.md L75~L85 / prd.md §4.1~§4.6 / §7 | §4.3·§4.5·§4.2·§4.6·§4.4 ID 일치. M1~M3 연결 페인 일관 |
| 11 | B3 §9.5 RM1~RM7 ↔ 다른 문서 리스크 정합 | PASS | prd.md L262~L274 / tech-decision.md §5.2·§5.3·TC-18·§7.2·§9.1 / decision-log U2·R1 | RM5↔U2 TTL 24h 일치. RM6↔TC-18 폴백 일치. RM7↔R1 일치. RM1↔§5.2 d-2차 일치. RM2~RM4↔§6 H2~H4 자기보고 일치 |
| 12 | B4 참고 문서 박스 ↔ 실제 파일 존재 (7개) | PASS | prd.md L8~L16 / docs/nayo/ 디렉토리 | 7개 파일 전부 실재 확인 |

재실행 Critical 불일치: 0건 / Major 불일치: 0건 / Minor 자동 수정: 0건

---

## ALIGN 4차 재실행 결정 (2026-05-08) — Apollo PRD v0.4 + Aphrodite v1.1 + Hephaestus v2.0 보강 후속

---

### L33 — B1 자동완성: MVP 포함 / 부분 검색 Phase 2 분리 확정

| 항목 | 내용 |
|------|------|
| ID | L33-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | 외부 팀 리뷰에서 자동완성과 부분 검색(한국어 형태소·동의어)의 MVP 포함 여부가 분리되지 않아 범위 불명확 지적. |
| **대안** | (1) 자동완성 + 부분 검색 모두 MVP 포함, (2) 자동완성만 MVP + 부분 검색 Phase 2, (3) 둘 다 Phase 2 |
| **선택** | 자동완성(기존 Dish LIKE 매칭 dropdown) MVP 포함. 부분 검색 통합 결과(한국어 형태소·동의어) Phase 2. PRD §4.1 자동완성, §5.1 a 기능, §5.2 h 항목, §9 비-목표에 명시. |
| **근거** | 자동완성은 기존 Dish 목록 재활용이므로 구현 비용 낮음. 부분 검색(형태소·동의어)은 실사용 후 사용자 패턴 확인 후 도입이 적합. |
| **영향** | PRD §4.1, §5.1 a, §5.2 h, §9. design-decision Combobox/Autocomplete. tech-decision §9.1 LIKE 쿼리. OOS-9 추가. U7 미결. |
| **후속 의존성** | U7(자동완성 한국어 정확도 실사용 후 결정). OQ5 실사용 모니터링. |

---

### L34 — B2 영상 유튜브 접근불가 엣지: is_unavailable_on_youtube + lazy check + 시각 처리 확정

| 항목 | 내용 |
|------|------|
| ID | L34-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | 유튜브에서 정상 접근이 불가한 영상(삭제·비공개·removed 포함)의 처리 방식이 3문서에 걸쳐 미정이었음. 외부 팀 리뷰에서 지적. |
| **대안** | (1) 접근 불가 감지 시 Video 레코드 삭제, (2) is_unavailable_on_youtube 플래그 + 보존 정책 분리 |
| **선택** | `is_unavailable_on_youtube = true` 시: 검색 결과 비노출. 메인 화면 최근 시도·메뉴 페이지 노출(DeletedVideoAlert 표시). Attempt·Step 데이터 보존(P1·P4 페인 직결). lazy check(videos.list 빈 응답). 시각 처리: opacity 0.3 + grayscale + "사용할 수 없는 영상" 배지(thumbs down opacity 0.4와 구분). 컬럼명 is_unavailable_on_youtube — YouTube API는 삭제·비공개 구분 불가이므로 "정상 접근 불가" 의미로 통합. |
| **근거** | 누적 학습 보존(P1·P4)이 핵심 가치. 영상이 삭제되더라도 내가 쌓은 시도 기록은 보존 우선. lazy check는 API quota 보호와 구현 단순성 균형. |
| **영향** | PRD §3.2 is_unavailable_on_youtube, §4.2, §4.9. design-decision 영상 카드·영상 상세 DeletedVideoAlert. tech-decision §3.2 schema, §11 lazy check, §8.1 메인 화면 쿼리. |
| **후속 의존성** | U8(유튜브 삭제 주기적 체크 MVP 미포함, 실사용 후 결정). TC-26 테스트. |

---

### L35 — B4 Attempt 생성 트리거: "기록하기" CTA 단독 확정

| 항목 | 내용 |
|------|------|
| ID | L35-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | thumbs 변경이나 단순 영상 조회가 Attempt를 생성하는지 명시적 결정이 없었음. 외부 팀 리뷰에서 트리거 불명확 지적. |
| **대안** | (1) thumbs 변경 시 Attempt 자동 생성, (2) 영상 조회 시 Attempt 자동 생성, (3) 명시적 CTA만 |
| **선택** | 명시적 "기록하기" CTA 실행 시만 Attempt 레코드 생성. thumbs up/down은 Video 단위 상태 변경이며 Attempt 생성 안 함. 단순 영상 조회·진입 후 이탈 = Attempt 생성 안 함. |
| **근거** | M1(Attempt 생성 횟수)이 실제 요리 시도 의지를 반영해야 함. 자동 생성 시 M1 지표 오염. 사용자 명시적 의도 표현이 데이터 품질을 보장. |
| **영향** | PRD §3.3 생성 트리거, §4.3, §4.4. design-decision "기록하기" CTA. tech-decision API 분리(thumbs PATCH ≠ attempts POST). |
| **후속 의존성** | TC-05(Attempt 생성 정상), TC-13(thumbs 토글 Attempt 미생성 확인). |

---

### L36 — B5-β Step 엔티티 + YouTube IFrame timestamp 자동 캡처 확정

| 항목 | 내용 |
|------|------|
| ID | L36-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | 단계별 메모(Step)와 영상 재생 시점 자동 캡처가 B5-β로 외부 팀 리뷰에서 추가 합의. 데이터 모델·UX·구현 전체에 걸친 신규 결정. |
| **대안** | (1) Step 없이 Attempt.changes/improvement_note만, (2) Step 엔티티 + 수동 timestamp만, (3) Step + IFrame API 자동 캡처 |
| **선택** | Step 엔티티 신규(Attempt:Step = 1:N). 필드: id, attempt_id, note(not null), video_timestamp(int nullable 초 단위), created_at, deleted_at. YouTube IFrame Player API `getCurrentTime()` 자동 캡처. 임베드 차단 시 수동 mm:ss 입력 폴백 또는 null. Step 사후 edit·delete 가능. Attempt soft delete 중에는 함께 숨김·복구되고, Attempt hard delete 시 Step은 FK cascade. |
| **근거** | P4(커스텀 변형 망각) + P5(간 조절 실패) 해소를 위해 단계별 세부 메모 필요. IFrame timestamp 자동 캡처는 사용자 마찰 최소화. |
| **영향** | PRD §3.4 Step 신규, §4.3, §4.8 Step 삭제 정책, §7.2 M4, §9.5 RM8·RM9. design-decision StepInputRow, IFrame 연동, VQ 확장. tech-decision §3.2 steps 테이블, §7 IFrame API, §9.2 a11y, TC-21·TC-22. |
| **후속 의존성** | M4 Step 평균 개수 모니터링. RM9(Step 사용률 낮음 시 UX 단순화 검토). U8. |

---

### L37 — B6 삭제 정책: 엔티티별 전략 확정

| 항목 | 내용 |
|------|------|
| ID | L37-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | Attempt·Step·Video·Dish 각 엔티티의 삭제 전략이 외부 팀 리뷰에서 통합 결정 요청. soft delete vs hard delete 정책 혼재 정리 필요. |
| **대안** | 전체 hard delete / 전체 soft delete / 엔티티별 차등 정책 |
| **선택** | Attempt: soft delete(deleted_at) + 30일 휴지통 + Vercel Cron 자동 hard delete + 복구 가능. Step: Attempt soft delete 중 함께 숨김·복구, Attempt hard delete 시 FK cascade, 개별 edit·delete 가능. Video: Attempt ≥1이면 hard delete deny → is_hidden 토글(검색·메뉴 페이지 비노출). Attempt 0이면 hard delete 가능. Dish: Video 없으면 hard delete, Video 있으면 422 deny + "먼저 영상을 정리해주세요". |
| **근거** | 누적 학습 보존(P1·P4) 우선. Attempt는 실수로 삭제 가능성 있어 30일 복구 창 제공. Video는 시도 기록이 있으면 영구 삭제보다 숨김이 더 안전. Dish는 최상위 엔티티이므로 하위 데이터 존재 시 삭제 차단. |
| **영향** | PRD §3.3 Attempt deleted_at, §3.4 Step deleted_at, §4.8 삭제 정책 표. design-decision 삭제 UX 전체(Confirmation dialog, Toast, 휴지통, 숨김 토글). tech-decision §10 전체, TC-25. |
| **후속 의존성** | Vercel Cron 설정(L38). TC-25 삭제 정책 테스트. |

---

### L38 — B7-A 메인 화면 확정

| 항목 | 내용 |
|------|------|
| ID | L38-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | 앱 첫 진입점이 검색 화면이어서 최근 시도 영상으로 빠르게 재접근하는 경로가 없었음. P2(회상 비용) 직결. 외부 팀 리뷰에서 메인 화면 신규 추가 합의. |
| **대안** | (1) 첫 진입 = 검색 화면, (2) 별도 메인 화면(대시보드) 추가 |
| **선택** | 메인 화면 신규(화면 인벤토리 4→5). 검색바 + 최근 시도 영상 5개(tried_at DESC LIMIT 5) + 자주 만든 Dish Top 3(count DESC LIMIT 3). 신규 사용자(Attempt 0건) 빈 상태. /api/home 단일 엔드포인트, Promise.all 병렬 쿼리. |
| **근거** | P2(회상 비용): 마지막으로 시도한 영상에 즉시 재접근 가능. 기존 검색 화면은 메뉴명 입력이 전제되어 "이미 알고 있는 영상 재접근"에 비효율. |
| **영향** | PRD §2.3 P2 매핑, §4.7 신규, §5.1 g 추가. design-decision 화면 0 메인 화면. tech-decision §8 쿼리 명세, TC-24. |
| **후속 의존성** | /api/home 구현. attempts_user_id_idx + attempts_deleted_at_idx 인덱스 활용. |

---

### L39 — danger 컬러 Tailwind 토큰 등록 (D2 WARN 해소)

| 항목 | 내용 |
|------|------|
| ID | L39-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | design-decision D2 WARN: "영구 삭제" 버튼 danger 컬러(`rgba(220,38,38,1)`)가 Apple 단일 accent 원칙 예외이나 Tailwind 토큰 미등록 상태. tech-decision에서 토큰 등록 결정. |
| **대안** | (1) 기본 primary 컬러로 통일(destructive action 시각 구분 포기), (2) danger 컬러 토큰 등록(예외 명시) |
| **선택** | `tailwind.config.ts`에 `danger: rgb(220, 38, 38)`, `danger-foreground: #ffffff` 토큰 등록. 사용처: 영구 삭제 버튼 텍스트 한정(배경 사용 금지). Button 컴포넌트 danger variant 추가. |
| **근거** | Destructive action(영구 삭제)에 시각적 경고 필수. 텍스트 한정 사용으로 단일 accent 원칙 영향 최소화. D2 WARN 조건부 통과 근거 명시. |
| **영향** | tech-decision §13.1 tailwind.config.ts, §13.2 Button danger variant. design-decision 시스템 예외 섹션. D2 WARN → 조건부 PASS 전환. |
| **후속 의존성** | design-system.md 주석 추가 권장(tech-decision §18 기재). |

---

### L40 — YouTube IFrame Player API 통합 전략 확정

| 항목 | 내용 |
|------|------|
| ID | L40-ALIGN-4TH |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (4차 재실행) |
| 상태 | CONFIRMED |
| **컨텍스트** | Step.video_timestamp 자동 캡처를 위한 YouTube IFrame Player API 통합 방식, 임베드 차단 감지 방법, 폴백 전략이 미결이었음. |
| **대안** | (1) 수동 입력만, (2) IFrame API 자동 캡처 + 수동 폴백, (3) 서버 측 영상 길이 조회 후 검증 |
| **선택** | 클라이언트에서 YT.Player 동적 로드. `getCurrentTime()` → `Math.floor()` → 초 단위 정수 저장. 에러 코드 101·150 → setEmbedBlocked(true) → 버튼 비활성 + 수동 mm:ss 폴백. 서버 측 `status.embeddable === false` → IFrame 미시도 분기. items[] 빈 응답 → is_unavailable_on_youtube=true 갱신 병행. OQ6: 영상 길이 초과 허용(사용자 기록 보존), 음수 거부(400). |
| **근거** | IFrame API가 YouTube 공식 메서드로 가장 신뢰성 있음. 임베드 차단 영상은 전체 영상 클립의 일부이므로 수동 입력 폴백이 사용성 보장. |
| **영향** | PRD §3.4 video_timestamp, §4.3, §8 기술 제약, §9.5 RM8. tech-decision §7 전체. TC-21·TC-22. |
| **후속 의존성** | RM8(IFrame 차단율 모니터링). TC-21·TC-22 단위 테스트. |

---

### ALIGN 4차 재실행 doc-align 요약 (2026-05-08, iteration 4)

**검증 항목 및 판정:**

| 번호 | 검증 항목 | 판정 | 파일·위치 | 비고 |
|------|----------|------|----------|------|
| 1 | 데이터 모델 일관성 (Dish/Video/Attempt/Step 4-tier) | PASS | prd.md §3.1~3.4 / tech-decision.md §3.2 | steps.userId는 보안 경계 구현 세부사항, PRD 공개 계약과 정상 분리 |
| 2 | MVP 스코프 일관성 (a~e + g + 삭제정책 + 유튜브 접근불가) | PASS | prd.md §5 / design-decision.md 화면 인벤토리 5개 / tech-decision.md §12 API 21개 | 3문서 일치 |
| 3 | 검색 정렬 로직 일관성 | PASS | prd.md §4.2 / design-decision.md 검색 화면 / tech-decision.md §6.1·§6.2 | isHidden·isUnavailableOnYoutube 필터 3문서 일치 |
| 4 | 시도 기록 입력 UX (BottomSheet/Dialog + Step) | PASS | design-decision.md 시도 기록 입력 UX / tech-decision.md §7.1·§13.2 | 반응형 분기, IFrame 연동 3문서 일치 |
| 5 | thumbs 상태 모델 | PASS | prd.md §3.2·§4.4 / tech-decision.md §3.2 thumbs varchar(4) | 변동 없음 |
| 6 | 영상 카드 메타 (is_hidden·is_unavailable_on_youtube 포함) | PASS | prd.md §3.2 / design-decision.md 영상 카드 / tech-decision.md §3.4 | 파생 필드 + 접근불가 감지 시각 처리 정합 |
| 7 | description / 상위 댓글 1개 (best-effort) | PASS | prd.md §4.5 / design-decision.md 영상 상세 / tech-decision.md §5.2·TC-18 | 변동 없음 |
| 8 | 보안 경계 (신규 API 12개 포함 21개 전체) | PASS | tech-decision.md §4.2·§12 / decision-log L27 | requireAuth + WHERE user_id 21개 엔드포인트 전체 명시 |
| 9 | B1 §1.0 내러티브 ↔ problem-definition.md | PASS | prd.md §1.0 / problem-definition.md | 변동 없음 |
| 10 | B2 §2.3 매핑 표 ↔ §4.x (§4.7 포함) | PASS | prd.md §2.3 / prd.md §4.1~4.9 | P2 행에 §4.7 추가, P1 행에 steps 추가 확인 |
| 11 | B3 §9.5 RM8·RM9 ↔ tech-decision | PASS | prd.md §9.5 / tech-decision.md §7.3·TC-22 / prd.md §7.2 M4 | RM8↔TC-22·§7.3, RM9↔M4 연결 일관 |
| 12 | B4 참고 문서 박스 | PASS | prd.md 헤더 / docs/nayo/ | 변동 없음 |
| 13 | B1 자동완성 (LIKE + dropdown + 한국어 미적용) | PASS | prd.md §4.1 / design-decision.md 자동완성 dropdown UX / tech-decision.md §9.1 | DB 8개/화면 5개 의도적 분리 tech-decision §9.1 명시 |
| 14 | B2 영상 유튜브 접근불가 엣지 (시각 구분) | PASS | prd.md §4.9 / design-decision.md 영상 카드 is_unavailable_on_youtube / tech-decision.md §11 | thumbs down opacity 0.4 / 접근불가 영상 opacity 0.3+배지 구분 |
| 15 | B4 시도 기록 트리거 ("기록하기" CTA only) | PASS | prd.md §3.3·§4.3·§4.4 / design-decision.md CTA / tech-decision.md §12 | thumbs 변경 Attempt 생성 X 3문서 일치 |
| 16 | B5-β + timestamp (nullable·폴백 일관) | PASS | prd.md §3.4 / design-decision.md StepInputRow / tech-decision.md §3.2·§7·§7.3 | video_timestamp integer nullable 정합, OQ6 해소 |
| 17 | B6 삭제 정책 (30일 일관성) | PASS | prd.md §4.8 / design-decision.md 삭제 UX / tech-decision.md §10 | 30일 PRD·design·tech 3문서 일치 |
| 18 | B7-A 메인 화면 (빈 상태 포함) | PASS | prd.md §4.7 / design-decision.md 화면 0 / tech-decision.md §8 | 빈 배열 → EmptyState 구조적 정합 |
| 19 | danger 컬러 (D2 WARN 해소) | PASS | design-decision.md 시스템 예외 / tech-decision.md §13.1·§18 | Tailwind 토큰 등록, 텍스트 한정 사용 명시 |
| 20 | IFrame Player API 통합 | PASS | prd.md §8 / design-decision.md Step 입력 UX / tech-decision.md §7 | 에러 101·150, status.embeddable, 수동 폴백 3문서 일관 |

4차 재실행 Critical 불일치: 0건 / Major 불일치: 0건 / Minor 불일치: 0건 / 자동 수정: 0건

---

## ALIGN 5차 rewind 결정 (2026-05-03) — Codex 외부 검토 8건 정정

---

### L41 — API 개수 정합 정정 (19 → 21)

| 항목 | 내용 |
|------|------|
| ID | L41-ALIGN-5TH-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (5차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | 여러 문서에 API 개수 "19개"로 명시되어 있었고, 이후 휴지통 조회 `GET /api/attempts/trash`가 구현 명세에 있으나 API Contract 목록에서 빠진 상태가 확인됨. tech-decision §12 엔드포인트 목록을 직접 카운트하면 기존 9개 + 신규 12개 = 21개. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) 휴지통 조회를 기존 Attempt 목록 API의 query option으로 흡수, (2) `GET /api/attempts/trash`를 독립 엔드포인트로 API Contract에 추가하고 모든 문서를 21개로 정합 |
| **선택** | `GET /api/attempts/trash`를 독립 엔드포인트로 유지. 엔드포인트 목록 직접 카운트(21개)를 정본으로 확정. tech-decision §4.2, §12 본문, 합의 이력 / decision-log 항목 8 / harness-state / README 모두 21개로 통일. |
| **근거** | 실제 API 목록이 정본. 수치는 목록에서 파생되어야 하며, 수치를 위해 목록을 줄이는 것은 기능 범위 변경. |
| **영향** | tech-decision §4.2·§12. decision-log. harness-state. README.md. |
| **후속 의존성** | BUILD 페이즈에서 실제 Route 구현 시 21개 엔드포인트 전체 requireAuth() 확인. |

---

### L42 — Video 삭제 count 쿼리 정정 (휴지통 보호 + user_id 보안 경계)

| 항목 | 내용 |
|------|------|
| ID | L42-ALIGN-5TH-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (5차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | tech-decision §10.2 Video count 쿼리에 `deleted_at IS NULL` 조건이 포함되어 있어 휴지통(soft delete)에 있는 attempt가 카운트에서 제외됨 → Video hard delete 가능 판정 → cascade로 휴지통 attempt 삭제 → 30일 복구 정책 위반. 또한 user_id 필터 누락으로 보안 경계 미적용. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) 현행 유지 (복구 정책 위반 허용), (2) deleted_at 조건 제거 + user_id 추가 |
| **선택** | count 쿼리에서 `deleted_at IS NULL` 조건 제거 — 활성 + 휴지통 attempt 전체 카운트. `eq(attempts.userId, currentUser.id)` 추가 — 보안 경계 적용. count > 0이면 hard delete deny + is_hidden 토글만 허용. 휴지통 attempt 30일 자동 hard delete 시점에 Video 삭제 가능 조건 자연스럽게 충족. |
| **근거** | 30일 복구 정책 일관성. 보안 경계 누락은 잠재적 데이터 오염 위험. Dish count 쿼리도 동일하게 user_id 필터 추가. |
| **영향** | tech-decision §10.2·§10.3. |
| **후속 의존성** | TC-25 삭제 정책 테스트에서 휴지통 attempt 있는 Video hard delete deny 케이스 추가 권장. |

---

### L43 — Dish/Step 삭제 모델 PRD↔Tech 통일

| 항목 | 내용 |
|------|------|
| ID | L43-ALIGN-5TH-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (5차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD §3.1 Dish에 `deleted_at` 필드가 있었으나 삭제 정책은 hard delete only → 모순. Tech Drizzle 스키마에 Dish `deletedAt` 없음. PRD §3.4 Step에 `deleted_at` 없었으나 Tech Drizzle 스키마에 `deletedAt` 있고 decision-log L37에도 "개별 Step 삭제 가능" 기록. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) PRD를 Tech에 맞춤, (2) Tech를 PRD에 맞춤 |
| **선택** | PRD를 Tech에 맞춤 (PRD 우선순위 원칙 예외 — Tech/decision-log가 더 구체적으로 정의된 정본). Dish: PRD `deleted_at` 필드 제거 (hard delete only 정책 유지). Step: PRD에 `deleted_at` 필드 추가 (개별 Step 삭제 가능 — design-decision StepInputRow 삭제 버튼 명세와 정합). |
| **근거** | Tech Drizzle 스키마와 decision-log L37이 실제 구현 정의를 명시한 정본. PRD가 의도치 않게 충돌 필드를 가지고 있었던 것이므로 Tech 기준으로 통일. |
| **영향** | prd.md §3.1 Dish 모델 deleted_at 제거. prd.md §3.4 Step 모델 deleted_at 추가. |
| **후속 의존성** | 없음 (PRD·Tech·decision-log 3문서 정합 완료). |

---

### L44 — is_deleted_on_youtube → is_unavailable_on_youtube rename

| 항목 | 내용 |
|------|------|
| ID | L44-ALIGN-5TH-REWIND |
| 날짜 | 2026-05-03 |
| 페이즈 | ALIGN (5차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | YouTube IFrame API error 100 = "removed or private". YouTube search.list·videos.list 빈 응답도 삭제·비공개 구분 불가. "삭제된 영상"이라는 단정 표현은 기술적으로 부정확. Codex 외부 검토에서 Major 불일치로 지적. |
| **대안** | (1) 현행 유지 (기술적 부정확 허용), (2) 컬럼명·라벨 갱신, (3) enum 도입 (Phase 2) |
| **선택** | 컬럼명: `is_deleted_on_youtube` → `is_unavailable_on_youtube`. 의미: "유튜브에서 정상 접근 불가 (삭제 / 비공개 / removed 모두 포함)". 라벨: "삭제된 영상" → "사용할 수 없는 영상". aria-label·배지 텍스트·안내 문구 모두 갱신. enum 도입(삭제/비공개 세부 구분)은 Phase 2 Open Question으로 미결. |
| **근거** | 기술적 사실에 부합하는 필드명과 라벨. YouTube API 제약을 정직하게 표현. 사용자에게 "왜 사용할 수 없는지" 불필요한 혼란 방지. |
| **영향** | prd.md §3.2 Video 모델, §4.2, §4.9. design-decision.md 영상 카드, 영상 상세, 접근성 계획, DeletedVideoAlert. tech-decision.md Drizzle 스키마, lazy check, 검색 필터링, 메인 화면 쿼리. decision-log L34 갱신. |
| **후속 의존성** | Phase 2: enum 도입 검토 (삭제/비공개 세부 구분이 사용자에게 가치 있는지 실사용 후 결정). |

---

## ALIGN 6차 rewind 결정 (2026-05-08) — BUILD 후 갭 4건 확정

---

### L45 — Dish 레벨 활성 Attempts 통합 조회 API 신규 추가

| 항목 | 내용 |
|------|------|
| ID | L45-ALIGN-6TH-REWIND |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (6차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | 메뉴 페이지(Dish 단위 통합 뷰)에서 "내 시도 이력" 섹션이 EmptyState 하드코딩 상태로 방치됨. Dish 레벨에서 활성 Attempt 목록과 각 Attempt의 Video·Step 정보를 통합 조회하는 전용 엔드포인트가 없었음. 기존 `/api/dishes/{id}/videos`는 Video 목록만 반환하며 Attempt 이력을 포함하지 않음. |
| **대안** | (A) 신규 엔드포인트 `GET /api/dishes/{id}/attempts` 추가, (B) 기존 `/api/dishes/{id}/videos` 응답에 attempts 포함 확장 |
| **선택** | (A) 신규 엔드포인트 `GET /api/dishes/{id}/attempts` 추가. Dish 소유 검증 + isHidden=false + deletedAt IS NULL 조건. 응답: `{ attempts: Array<{ video, attempt, steps }> }` 형태. API 카운트 21 → 22. |
| **근거** | 단일 책임 원칙 — 기존 videos API와 관심사 분리. Dish 페이지의 "내 시도 이력" 섹션 기능 구현을 위한 최소 인터페이스. 기존 API 응답 구조 변경 없이 신규 추가. |
| **영향** | tech-decision §12 API 개수 21→22, §4.2 보안 원칙 문장 22개 갱신. app/api/dishes/[id]/attempts/route.ts 신규 생성. policy.test.ts 카운트 21→22. |
| **후속 의존성** | app/dish/[slug]/page.tsx에서 `useQuery(['dishes', dish.id, 'attempts'])` 추가. |

---

### L46 — videos 테이블 UNIQUE 제약 추가 (youtube_video_id, dish_id)

| 항목 | 내용 |
|------|------|
| ID | L46-ALIGN-6TH-REWIND |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (6차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | 동일 Dish에 동일 YouTube 영상이 중복 저장될 수 있는 경로가 존재함. VideoDetailClient에서 `upsertVideo()` 호출 시 conflict 없이 INSERT → 중복 레코드 생성 가능. 기존 `videos_youtube_video_id_dish_idx`는 일반 인덱스로 중복 방지 불가. |
| **대안** | (A) UNIQUE 제약 추가 + onConflictDoUpdate upsert 처리, (B) 애플리케이션 레이어에서 SELECT 후 분기 |
| **선택** | (A) `unique("videos_youtube_video_id_dish_unique").on(t.youtubeVideoId, t.dishId)` Drizzle UNIQUE 제약 추가. 기존 `videos_youtube_video_id_dish_idx` 일반 인덱스 제거(UNIQUE 제약이 자동 인덱스 생성). POST `/api/videos`에서 `onConflictDoUpdate({ target: [videos.youtubeVideoId, videos.dishId], set: { title, channel, thumbnailUrl, publishedAt } })` 처리. Drizzle migration 신규 생성. |
| **근거** | DB 레벨에서 중복 방지가 애플리케이션 레이어 분기보다 안전하고 일관성 있음. upsert 패턴으로 재진입 시 메타데이터(제목·채널·썸네일) 갱신 효과도 얻음. |
| **영향** | db/schema.ts videos 테이블 unique constraint 추가 + 기존 인덱스 제거. db/migrations/0001_*.sql 신규. app/api/videos/route.ts onConflictDoUpdate 교체. tech-decision §3.2 스키마, §3.3 인덱스 정책, §5 Video upsert 정책 명세. |
| **후속 의존성** | Drizzle migration 실행 필요(pnpm drizzle-kit generate → migrate). |

---

### L47 — 영상 카드 링크에 dish_id + video_id URL 파라미터 전달

| 항목 | 내용 |
|------|------|
| ID | L47-ALIGN-6TH-REWIND |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (6차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | 메인 화면·메뉴 페이지의 영상 카드 클릭 시 `/video/{youtubeVideoId}`로만 이동하여 dish_id 컨텍스트가 소실됨. VideoDetailClient는 `dish_id` URL param이 없으면 "기록하기" 기능을 사용할 수 없고(`upsertVideo()` 실패), video_id param도 없어 thumbs 실호출(L48) 대상을 특정할 수 없음. `/api/youtube/search` 응답에서 이미 저장된 영상의 video.id가 반환되지 않아 클라이언트가 UUID를 알 수 없었음. |
| **대안** | (A) URL에 `?dish_id={uuid}&video_id={uuid}` 포함, (B) VideoDetailClient에서 별도 API 조회로 video.id 획득 |
| **선택** | (A) 영상 카드 링크 href: `/video/{youtubeVideoId}?dish_id={dishId}&video_id={videoUuid}`. `/api/home` recentAttempts에서 `video.id`, `video.dishId` 포함(기존 `video: videos` select 유지로 이미 포함). `/api/youtube/search` 응답에서 저장된 영상에 한해 `video.id` 포함(byYoutubeId map에 id 추가). VideoCard에 optional `dishId`/`videoId` props 추가 후 링크 생성 시 사용. |
| **근거** | URL 파라미터 전달이 클라이언트 추가 API 호출 없이 컨텍스트를 유지하는 최소 비용 방법. 메인 화면과 메뉴 페이지에서 dish_id 없이 "기록하기" 불가 문제를 근본 해결. |
| **영향** | components/video/VideoCard.tsx props 확장. app/page.tsx VideoCard 호출부 dishId/videoId 전달. app/dish/[slug]/page.tsx VideoCard 호출부 동일. app/search/page.tsx toCard()에 video.id 반영. |
| **후속 의존성** | L48(thumbs 실호출) — video_id URL param 의존. |

---

### L48 — VideoDetailClient thumbs 토글 시 PATCH /api/videos/[id]/thumbs 실호출

| 항목 | 내용 |
|------|------|
| ID | L48-ALIGN-6TH-REWIND |
| 날짜 | 2026-05-08 |
| 페이즈 | ALIGN (6차 rewind) |
| 상태 | CONFIRMED |
| **컨텍스트** | VideoDetailClient에서 thumbs ToggleGroup이 로컬 state만 변경하고 실제 API 호출이 없었음. thumbs 변경이 DB에 반영되지 않아 다음 진입 시 초기화됨. L35 결정(thumbs 변경은 Attempt 생성과 무관)은 유지됨. |
| **대안** | (A) URL param video_id 수신 후 useMutation으로 PATCH 실호출 + 낙관적 업데이트 유지, (B) upsertVideo() 결과로 video.id 획득 후 호출 |
| **선택** | (A) URL search params에서 `video_id` 수신. thumbs 토글 시 `video_id` 있을 때만 `PATCH /api/videos/{video_id}/thumbs` useMutation 실호출. 낙관적 업데이트 유지(L35 결정 — Attempt 생성 트리거와 무관). video_id 없으면 로컬 상태만 변경(영상 상세 직접 진입 경우). |
| **근거** | thumbs 상태가 DB에 영구 저장되어야 검색 결과 정렬(§4.2)에 반영 가능. 낙관적 업데이트로 즉각적인 UI 피드백 유지. video_id 없는 경우(직접 URL 진입) 우아한 폴백 처리. |
| **영향** | app/video/[id]/VideoDetailClient.tsx: URL param video_id 수신 + thumbs useMutation 추가. design-decision.md thumbs 토글 동작 이행 명시 보강. |
| **후속 의존성** | L47(video_id URL param 전달) 선행 의존성. |

---

### ALIGN 6차 rewind doc-align 요약 (2026-05-08)

**갭 4건 — 옵션 A 전체 확정:**

| # | 분류 | 항목 | 선택 |
|---|------|------|------|
| 1 | Major | Dish Attempts API 부재 | `GET /api/dishes/{id}/attempts` 신규 (L45). API 21→22. |
| 2 | Major | videos UNIQUE 제약 누락 | UNIQUE(youtube_video_id, dish_id) + onConflictDoUpdate upsert (L46). |
| 3 | Major | 영상 카드 dish_id/video_id URL 소실 | URL 파라미터 `?dish_id={uuid}&video_id={uuid}` 전달 (L47). |
| 4 | Major | thumbs 토글 API 미연결 | PATCH `/api/videos/{video_id}/thumbs` useMutation + 낙관적 업데이트 (L48). |

6차 rewind Critical 불일치: 0건 / Major 확정: 4건 / Minor: 0건

---

### ALIGN 5차 rewind doc-align 요약 (2026-05-03)

**정정 항목:**

| # | 분류 | 항목 | 정정 내용 |
|---|------|------|---------|
| 1 | Major | API 개수 정합 | 19개 → 21개. `GET /api/attempts/trash` 포함, 엔드포인트 직접 카운트 기준. |
| 2 | Major | Video 삭제 SQL | deleted_at IS NULL 제거 (휴지통 보호) + user_id 보안 경계 추가. Dish count 쿼리도 user_id 추가. |
| 3 | Major | Dish/Step 삭제 모델 | PRD Dish deleted_at 제거 (hard delete only). PRD Step deleted_at 추가 (Tech·decision-log 일치). |
| 4 | Major | is_deleted_on_youtube rename | → is_unavailable_on_youtube. 라벨 "삭제된 영상" → "사용할 수 없는 영상". 3문서 전체 적용. |
| 5 | Minor | ARIA role combobox | 자동완성 dropdown 있는 검색 input = combobox. design-decision §aria 섹션·§자동완성 UX, tech-decision §9.2·§13.2 통일. aria-controls 추가. |
| 6 | Minor | 자동완성 인덱스 명세 | leading wildcard sequential scan 허용 근거 명시. dishes_user_id_idx btree만. Phase 2 pg_trgm GIN 조건 명시. tech-decision §9.1 추가. |
| 7 | Minor | PRD OQ 섹션 분리 | §10 → §10.1 Open Questions (OQ5만) + §10.2 Resolved Questions (OQ1·2·3·4·6 cross-link). |
| 8 | Minor | 메타데이터 정정 | prd.md 최종 갱신일 갱신. decision-log v1.3 → v1.4. README tech-decision 비고 v1.1 → v2.0. |

5차 rewind Critical 불일치: 0건 / Major 정정: 4건 / Minor 정정: 4건 (총 8건 모두 처리 완료)

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | decision-log 최초 작성 | ALIGN 페이즈 Athena(align) 산출. L1-L24 전체 결정 기록. |
| 2026-05-03 | doc-align 완료 (1차) | Critical 0 / Major 0 / Minor 1(자동 수정). ALIGN status: success. |
| 2026-05-03 | doc-align rewind 1차 | Codex 외부 검토 6건 정정. Major 4건(H2·H3 검증 방법, 고정 댓글→상위 댓글, Right Drawer→Dialog 본문, 보안 경계) + Minor 2건(PRD 메타, 캐시 키). L25~L28 신규 결정 추가. |
| 2026-05-03 | Apollo prd-writer rewind 흡수 | B1 §1.0 내러티브, B2 §2.3 매핑 표, B3 §9.5 RM1~RM7, B4 참고 문서 박스. review-loop 2R + prd-review R1~R4 PASS. L29~L32 신규 결정 추가. |
| 2026-05-03 | ALIGN 재실행 (iteration 3) | 12개 검증 항목 전항목 PASS. Critical 0 / Major 0 / Minor 0. status: success. BUILD 진입 대기. |
| 2026-05-08 | Apollo PRD v0.4 + Aphrodite v1.1 + Hephaestus v2.0 보강 흡수 | B1 자동완성 분리, B2 유튜브 삭제 엣지, B4 트리거, B5-β Step+timestamp, B6 삭제 정책, B7-A 메인 화면, danger 컬러, IFrame API. L33~L40 신규 결정 추가. OOS-9, U7, U8 추가. |
| 2026-05-08 | ALIGN 4차 재실행 (iteration 4) | 20개 검증 항목 전항목 PASS. Critical 0 / Major 0 / Minor 0. status: success. BUILD 진입 대기. |
| 2026-05-08 | ALIGN 5차 rewind — Codex 외부 검토 후 정합성 재정리 (rewind_count 증가 없음 — 사용자 명시 요청) | Major 4건: API 개수 19→21 정합(L41, Attempt trash API 포함), Video 삭제 SQL deleted_at 제거+user_id 추가(L42), Dish/Step 삭제 모델 PRD↔Tech 통일(L43), is_deleted_on_youtube→is_unavailable_on_youtube rename(L44). Minor 4건: ARIA combobox 통일, 자동완성 인덱스 명세 보강, PRD OQ 섹션 분리(§10.1/10.2), 메타데이터 정정. decision-log v1.4. |
| 2026-05-08 | ALIGN 6차 rewind — BUILD 후 갭 4건 확정 | L45: GET /api/dishes/{id}/attempts 신규(API 21→22). L46: videos UNIQUE(youtube_video_id, dish_id) + onConflictDoUpdate. L47: 영상 카드 링크 ?dish_id=&video_id= URL 파라미터 전달. L48: thumbs 토글 → PATCH /api/videos/{id}/thumbs 실호출 + 낙관적 업데이트. decision-log v1.5. |
| 2026-05-14 | v0.5 PIVOT 사이클 ALIGN 완료 (decision-log v2.0) | PRD v0.5 + Design v2.0 + Tech v3.0 4문서 cross-check. Critical 0 / Major 0 / Minor 5(자동 수정 2건). L49~L64 신규 결정 등재. Out of Scope 갱신. OQ9~OQ11 신설. L1~L48 v0.5 흡수 매핑 부록 확정. user_scope 종료 지점 도달. |

---

## v0.5 PIVOT 사이클 결정 (2026-05-14~)

---

### L49 — 제품 정체성 전환 (Recipe 중심 개인 레시피북)

| 항목 | 내용 |
|------|------|
| ID | L49-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | "영상 시도 기록 도구"로서의 v0.4 정체성이 핵심 페인(회상·실패반복·변형망각)을 영상 단위로 접근하여 "내 레시피"가 생기지 않는 근본 문제 미해결. 외부 피드백 8건 + Codex/ChatGPT 검토 후 정체성 전환 결정. |
| **대안** | (1) v0.4 정체성 유지 + 점진적 Recipe 레이어 추가, (2) Recipe 중심으로 전면 전환 |
| **선택** | "Recipe 중심 개인 레시피북"으로 정체성 전환. 출처(Source)를 흡수해 내 Recipe로 정규화·축적하는 것이 핵심 가치. |
| **근거** | 영상 단위로 기록을 쌓아도 "내 레시피"는 생기지 않는다. Recipe 1급 엔티티가 있어야 출처를 흡수할 수 있고 Customization·Attempt가 의미 있게 누적된다. |
| **영향** | PRD v0.5 전면 재작성. 데이터 모델 Recipe 중심 재설계. Design v2.0, Tech v3.0 후속 갱신. |
| **후속 의존성** | L50~L55 후속 결정 전체. DESIGN v2.0 → ENGINEER v3.0 → ALIGN v2.0 순서. |

---

### L50 — 데이터 모델 재설계 (Recipe 1급 엔티티 + 하위 4개 신규)

| 항목 | 내용 |
|------|------|
| ID | L50-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | v0.4의 Dish / Video / Attempt 3-tier에서 Video가 외부 출처에 종속되어 "내 레시피" 축적이 불가능. Recipe를 1급 엔티티로 승격하고 Video를 RecipeSource로 격하해야 함. |
| **대안** | (1) Video 엔티티에 Recipe 필드 추가, (2) Recipe 신규 1급 엔티티 + Video → RecipeSource 격하 |
| **선택** | Recipe 1급 엔티티(title, servings, description, archived_at). RecipeIngredient / RecipeStep / RecipeSource / RecipeCustomization 신설. Attempt FK: video_id → recipe_id (NOT CASCADE — Attempt 있으면 Recipe hard delete deny). Dish는 카테고리/검색 진입점으로 유지. |
| **근거** | Recipe 단위로 재료·단계·출처·조정이 모두 귀속되어야 "내 레시피" 축적이 완결됨. |
| **영향** | PRD §3 전체. Tech v3.0 §3.2 Drizzle 스키마 전면 재설계. Migration Plan 필요. |
| **후속 의존성** | L58 (archived_at 스키마), L59 (AttemptStepNote), L62 (Migration Plan). |

---

### L51 — Ingestion 전략 (규칙 기반 우선 + LLM fallback stub)

| 항목 | 내용 |
|------|------|
| ID | L51-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | 블로그·유튜브·텍스트 등 다양한 출처에서 Recipe Draft를 자동 생성하려면 파싱 전략이 필요. LLM 실호출은 비용·한도 리스크. |
| **대안** | (1) 전부 수동 입력, (2) LLM only, (3) 규칙 기반 우선 + LLM fallback |
| **선택** | 규칙 기반 파싱 우선(schema.org, 정규식). 실패/애매 시에만 LLM(Gemini API free tier 1순위) fallback. 검색·조회 단계 LLM 호출 금지. 실호출 구현은 다음 사이클(v0.6) — 이번 사이클(v0.5)은 스키마·엔드포인트·프롬프트 설계까지. |
| **근거** | H5 가설(규칙 파싱 충분성) 검증이 필요한 상태에서 LLM 실호출 선투자는 불필요. 규칙 파싱 실패율이 높을 때 LLM 우선순위 상향하는 분기 결정 트리 준비. |
| **영향** | PRD §4.3 Ingestion 흐름. Tech §7 Ingestion API 설계. LLM stub 인터페이스 정의. |
| **후속 의존성** | L64 (LLM stub + Gemini 어댑터 다음 사이클). U4 (LLM fallback threshold). |

---

### L52 — 홈 화면 v2 (쿨타임 1순위 + 날씨 카피만)

| 항목 | 내용 |
|------|------|
| ID | L52-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | v0.4 메인 화면은 최근 시도 영상 5개 + Dish Top 3. Recipe 중심으로 재설계 시 "내 레시피"를 중심에 두는 홈이 필요. |
| **대안** | (1) v0.4 구조 유지(최근 시도 중심), (2) 쿨타임 1순위 재설계, (3) 날씨 API 연동 포함 |
| **선택** | 1순위 "안 먹은 지 n일"(쿨타임), 2순위 최근 만든 레시피, 3순위 자주 만든 메뉴. 날씨 관련 메뉴 제안 카피만 정의 — API 실연동은 다음 사이클(OOS). |
| **근거** | H3·H7 가설 검증 목적. 회상 비용(P2) 직결. 날씨 API는 검증되지 않은 가치를 위한 구현 비용이 높아 카피로 선행 검증. |
| **영향** | PRD §4.8. Design §0 홈 화면 v2. Tech §15 홈 쿼리 명세. |
| **후속 의존성** | L57 (쿨타임 노출 3+7 결정 — Aphrodite). |

---

### L53 — 1인 사용자 유지 (가구/타인 평가 Phase 2)

| 항목 | 내용 |
|------|------|
| ID | L53-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | v0.4와 마찬가지로 1인 사용자 도구. v0.5 PIVOT에서 Recipe 중심 전환 후에도 가구/Household 도메인 도입 여부 결정 필요. |
| **대안** | (1) 즉시 가구 도메인 도입, (2) 1인 사용자 유지 + Phase 2 계획 |
| **선택** | 1인 사용자 페르소나 유지. 가구/Household 도메인, 타인 레시피 평가, 가구원 공유는 Phase 2로 명시적 Out of Scope. |
| **근거** | 싱글유저 반복 사용 검증 후 멀티유저 전환이 적절. 1인 도구에서 검증되지 않은 가구 도메인 추가는 스코프 크리프. |
| **영향** | PRD §9 비-목표. Out of Scope 목록 갱신. |
| **후속 의존성** | Phase 2 기획 시 L53 재검토 트리거. |

---

### L54 — RecipeCustomization 한 손 조작 UX 가설 (OQ8 → DESIGN 위임)

| 항목 | 내용 |
|------|------|
| ID | L54-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED (→ L56으로 DESIGN 결정 완료) |
| **컨텍스트** | RecipeCustomization 수치 ± 조정을 요리 중 한 손으로 가능하게 하는 UX 요건. 구체적 인터랙션은 OQ8로 DESIGN 페이즈에 위임. |
| **대안** | (1) 인라인 ± (옵션 A), (2) 별도 Sheet + 큰 버튼 (옵션 B) |
| **선택** | OQ8로 미결 등록 → DESIGN 페이즈(Aphrodite)에서 결정. 결과: 옵션 B 채택 (L56). |
| **근거** | 구체적 인터랙션 결정은 화면 구조 확정 후 가능. H6 가설(한 손 조작 충분성) 검증 전제. |
| **영향** | PRD §4.5 "구체적 인터랙션·터치 타겟 크기는 DESIGN 페이즈에서 결정 (OQ8)". |
| **후속 의존성** | L56 (Aphrodite OQ8 결정). |

---

### L55 — user_scope = decision-log (v0.5 사이클 종료 지점)

| 항목 | 내용 |
|------|------|
| ID | L55-PIVOT |
| 날짜 | 2026-05-14 |
| 페이즈 | DISCOVER (v0.5 PIVOT — Hermes 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | v0.5 사이클에서 무엇까지 완성할지 범위 결정 필요. 코드 마이그레이션 실행과 QA·Ship은 다음 사이클로 분리. |
| **대안** | (1) 코드 마이그레이션 실행까지 포함, (2) 설계 패키지(PRD+Design+Tech+decision-log) 완성까지 |
| **선택** | user_scope = "decision-log". PRD v0.5 + Design Decision v2.0 + Tech Decision v3.0 + Migration Plan + decision-log v2.0 완성까지. code-review/QA/ship/deploy/canary/retro는 다음 사이클. |
| **근거** | 코드 마이그레이션은 dry-run + snapshot 필수 — 설계 검증 없이 실행 불가. 설계 패키지 완성 후 다음 사이클에서 Migration TC-24 dry-run 선행. |
| **영향** | harness-state.md user_scope 필드. ALIGN 완료 후 자동 전환 중단. |
| **후속 의존성** | 다음 사이클 BUILD 진입 시 Migration Plan(L62) + API 32개(L63)가 첫 작업 기준. |

---

### L56 — RecipeCustomizationSheet 옵션 B 채택 (Aphrodite 결정)

| 항목 | 내용 |
|------|------|
| ID | L56-DESIGN |
| 날짜 | 2026-05-14 |
| 페이즈 | DESIGN (Aphrodite) |
| 상태 | CONFIRMED |
| **컨텍스트** | OQ8: RecipeCustomization 수치 ± 조정 UX 방식. 옵션 A(인라인 ±)와 옵션 B(별도 Sheet) 비교. |
| **대안** | 옵션 A: Recipe 상세 화면 내 인라인 ± 버튼. 옵션 B: 별도 "조정하기" RecipeCustomizationSheet (BottomSheet/Dialog). |
| **선택** | 옵션 B 채택. AmountStepper 56×56px 터치 타겟. 재료 ± + 단계 메모 한 Sheet에서 처리. |
| **근거** | 요리 중 한 손 조작 시 단일 Sheet + 큰 버튼이 분산 인라인 ± 대비 인지 부하 낮음. 56px 터치 타겟 확보가 Sheet에서 자연스러움. H6 가설 깨질 시 옵션 A 전환 (RM11). |
| **영향** | design-decision §4 RecipeCustomizationSheet 상세 명세. Tech §17 a11y 명세 반영. |
| **후속 의존성** | H6 가설 검증 후 RM11 트리거 시 옵션 A 전환 검토. |

---

### L57 — 쿨타임 노출 개수: 3개 고정 + 더보기 최대 7개 (Aphrodite 결정)

| 항목 | 내용 |
|------|------|
| ID | L57-DESIGN |
| 날짜 | 2026-05-14 |
| 페이즈 | DESIGN (Aphrodite) |
| 상태 | CONFIRMED |
| **컨텍스트** | 홈 화면 쿨타임 영역에 몇 개의 Recipe 카드를 기본 노출할지 결정 필요. |
| **대안** | (1) 5개 고정, (2) 3개 고정 + 더보기, (3) 사용자 설정 |
| **선택** | 3개 고정 기본 노출. "더보기" 인라인 확장으로 최대 7개. 7개 초과 시 검색으로 유도. 페이지네이션 없음. |
| **근거** | 격주 요리 빈도에서 "지금 뭐 해먹을까" 의사결정 해소에 3개가 최적. 7개 초과 시 선택 피로. H3 가설 검증 최소 노출수. |
| **영향** | design-decision §0 홈 화면. Tech §15.1 쿨타임 쿼리 LIMIT 7 (클라이언트 제어). |
| **후속 의존성** | H3·H7 가설 검증 결과에 따라 노출 개수 재검토 가능. |

---

### L58 — Recipe.archived 스키마: archived_at timestamptz nullable (Hephaestus 결정)

| 항목 | 내용 |
|------|------|
| ID | L58-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED |
| **컨텍스트** | Recipe 보관(archived) 상태를 스키마에서 어떻게 표현할지 결정. boolean vs timestamptz. |
| **대안** | 옵션 A: `archived boolean default false`. 옵션 B: `archived_at timestamptz nullable`. |
| **선택** | 옵션 B: `archived_at timestamptz nullable`. null = 활성. not null = 보관됨. |
| **근거** | archived 시점 추적 가능. Cron 자동 hard delete 30일 기준으로 활용 가능(`archived_at IS NOT NULL AND archived_at < NOW() - INTERVAL '30 days'`). 추후 복구 이력 분석 가능. |
| **영향** | Tech §3.4 결정 영역. PRD §3.2 archived_at 필드 추가(Minor 자동 수정 완료). design-decision §7 휴지통 화면 "보관된 레시피" 섹션. |
| **후속 의존성** | Tech §10.2 Recipe 보관 구현 코드. Migration STEP 1 CREATE TABLE recipes에 archived_at 포함. |

---

### L59 — 단계 메모 보존: AttemptStepNote 별도 테이블 (Hephaestus 결정)

| 항목 | 내용 |
|------|------|
| ID | L59-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED |
| **컨텍스트** | 시도 중 특정 RecipeStep에 대한 메모를 RecipeCustomization(diff_type=step_note)으로 통합할지, 별도 테이블(AttemptStepNote)로 분리할지 결정 필요. |
| **대안** | 옵션 A: AttemptStepNote 별도 테이블(attempt_id FK). 옵션 B: RecipeCustomization에 통합(diff_type=step_note). |
| **선택** | 옵션 A: AttemptStepNote 별도 테이블. attempt_id(FK) + recipe_step_id(nullable FK) + video_timestamp(int nullable) + note(not null). |
| **근거** | (1) RecipeCustomization = Recipe 자체에 영구 누적되는 내 버전. (2) AttemptStepNote = 특정 1회 시도의 일회성 메모. (3) 도메인 분리로 RM4·RM10 신호 독립 측정. (4) video_timestamp는 Attempt 단위 — Customization과 무관. |
| **영향** | Tech §3.5 결정 영역. Tech §3.2 AttemptStepNote 테이블 스키마. API: /api/attempts/{id}/step-notes/*. |
| **후속 의존성** | Migration STEP 6 steps → attempt_step_notes 데이터 이관. |

---

### L60 — AmountStepper ± 단위 정책 (Hephaestus 결정)

| 항목 | 내용 |
|------|------|
| ID | L60-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED |
| **컨텍스트** | RecipeCustomizationSheet의 AmountStepper에서 재료 단위별 ± 조작 단위를 얼마로 설정할지 결정 필요. |
| **대안** | (1) 단일 ±1 고정, (2) 단위별 차등 설정 |
| **선택** | g/ml: ±10, kg/l: ±0.1, 개/줌: ±1, 큰술/T/작은술/t/컵: ±0.5. 비수치(약간·적당량 등): ± 버튼 비활성 + "조정 사유 메모" 모드. |
| **근거** | 요리 현실에서 g는 10g 단위, 큰술은 0.5큰술 단위가 조정 최소 단위. 비수치 재료는 수치 조정이 의미 없으므로 메모 모드 대체. |
| **영향** | Tech §8 UNIT_STEP_MAP 구현. design-decision §4 AmountStepper 명세 일치. |
| **후속 의존성** | TC-09~TC-11 AmountStepper a11y 테스트. H6 가설 검증. |

---

### L61 — ConfidenceField threshold (Hephaestus 결정)

| 항목 | 내용 |
|------|------|
| ID | L61-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED |
| **컨텍스트** | Ingestion Draft 검수 화면에서 파싱 신뢰도(ConfidenceField)를 어떤 기준으로 low/med/high로 분류할지 결정 필요. |
| **대안** | (1) 재료·단계 개수 단순 기준, (2) 개수 + 패턴 매칭률 복합 기준 |
| **선택** | high = 재료 5개 이상 AND 단계 3개 이상 AND 패턴 매칭률 80% 이상. med = 재료 또는 단계 일부 추출(규칙 부분 매칭). low = 재료 0개 OR 단계 0개 OR 빈/매칭 실패. |
| **근거** | 재료 5+/단계 3+는 실용적 레시피 최소 구성. 패턴 매칭률 80%는 규칙 파싱 신뢰성 기준. low 시 LLM fallback 트리거. |
| **영향** | Tech §9 calcOverallConfidence() / calcFieldConfidence() 구현. design-decision §5-C ConfidenceField 시각 표현 일치. |
| **후속 의존성** | TC-12 ConfidenceField a11y 테스트. H5 가설 검증(LLM fallback 비율). |

---

### L62 — Migration Plan 8단계 SQL 명세 (Hephaestus 결정 — 다음 사이클 첫 작업)

| 항목 | 내용 |
|------|------|
| ID | L62-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED (실행은 다음 사이클) |
| **컨텍스트** | v0.4 스키마(dishes/videos/attempts/steps)에서 v0.5 스키마(recipes/recipe_ingredients/recipe_steps/recipe_sources/recipe_customizations/attempt_step_notes)로의 마이그레이션. |
| **대안** | (1) 신규 테이블 신규 배포(데이터 포기), (2) 8단계 SQL 트랜잭션 마이그레이션 |
| **선택** | 8단계 SQL 마이그레이션: STEP 1 신규 테이블 생성 → STEP 2 videos→recipe_sources 데이터 복사 → STEP 3 Dish별 placeholder Recipe 생성 → STEP 4 recipe_sources.recipe_id 갱신 → STEP 5 attempts.video_id→recipe_id 전환 → STEP 6 steps→attempt_step_notes 이관 → STEP 7 인덱스 생성 → STEP 8 구 테이블 DROP. |
| **근거** | 기존 사용자 데이터(Attempt·Step 이력) 보존 필수(P1·P4 페인 직결). dry-run(BEGIN→ROLLBACK) + Supabase snapshot 백업 선행 필수. |
| **영향** | Tech §13 Migration Plan SQL 스크립트 전체. 다음 사이클 BUILD 첫 작업. |
| **후속 의존성** | TC-24 dry-run 필수. Migration STEP 4 youtube_video_id 중복 row dry-run 검증. STEP 3 placeholder Recipe 사용자 수동 편집 필요 안내. |

---

### L63 — API 32개 Contract (v0.4 22개 폐기/유지/신규 매핑)

| 항목 | 내용 |
|------|------|
| ID | L63-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED |
| **컨텍스트** | v0.4의 22개 API (/api/videos/*, /api/attempts/{id}/steps/*, /api/dishes/{id}/attempts 등)를 v0.5 Recipe 기반으로 재설계. |
| **대안** | (1) v0.4 API 유지 + Recipe API 추가 병행, (2) v0.4 API 폐기 + v0.5 API 32개로 교체 |
| **선택** | v0.4 API 폐기: /api/videos/*, /api/attempts/{id}/steps/*, /api/dishes/{id}/attempts. v0.5 신규 32개: /api/recipes/ingest, /api/recipes (CRUD), /api/recipes/{id}/{ingredients|steps|customizations|sources}/*, /api/attempts/{id}/step-notes/*, /api/home (재설계), /api/youtube/search (Recipe 통합), /api/dishes/{id}/recipes (신규). |
| **근거** | v0.4 API는 Video 중심 — Recipe 중심 v0.5와 구조적 호환 불가. 32개 전체 requireAuth() + 소유권 체인 검증. |
| **영향** | Tech §12 API Contract 전체. 모든 API Route 구현 대상. |
| **후속 의존성** | 다음 사이클 BUILD에서 32개 Route 구현. TC-24·TC-25 schema 검증. |

---

### L64 — LLM stub 인터페이스 + Gemini 어댑터 다음 사이클

| 항목 | 내용 |
|------|------|
| ID | L64-ENGINEER |
| 날짜 | 2026-05-14 |
| 페이즈 | ENGINEER (Hephaestus) |
| 상태 | CONFIRMED (실호출 구현은 다음 사이클) |
| **컨텍스트** | LLM fallback(confidence=low 시 callLLMForIngestion())은 이번 사이클 OOS. 인터페이스만 정의. |
| **대안** | (1) 이번 사이클 실호출 구현, (2) stub 인터페이스만 정의 후 다음 사이클 |
| **선택** | callLLMForIngestion stub 함수 + LLMIngestionAdapter / GeminiIngestionAdapter 인터페이스 정의. 실호출 구현은 다음 사이클. Gemini API Key server-only(NEXT_PUBLIC_ prefix 금지). Gemini 무료 한도 실호출 직전 재확인 필수. |
| **근거** | H5 가설(규칙 파싱 충분성) 검증 전 LLM 실호출 투자 불필요. stub으로 Ingestion 흐름 전체를 이번 사이클에서 코드 수준 검증 가능. |
| **영향** | Tech §7.4 LLM Stub. lib/ingestion/llm-stub.ts. |
| **후속 의존성** | 다음 사이클: GEMINI_API_KEY 격리 검증 + Gemini free tier 한도 재확인 + GeminiIngestionAdapter 구현. |

---

## 다음 사이클 선행 결정 (2026-05-15) — PREB-1 / PREB-2

### L65 — OQ10 Recipe 영구 삭제 = Attempt CASCADE 삭제 (옵션 A)

| 항목 | 내용 |
|------|------|
| ID | L65-PREB-1 |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (사용자 직접 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | Tech v3.0 §10에서 Recipe.archived_at 상태까지는 명시했으나, archived Recipe의 영구 삭제(Cron 30일 자동 또는 사용자 명시 "영구 삭제") 시 연결된 Attempt 처리가 미명세. design-decision은 "ENGINEER 페이즈에서 플로우 최종 확정"으로 위임된 상태였음. |
| **대안** | (A) Attempt CASCADE — Recipe 삭제 시 Attempt·Customization·StepNote 모두 함께 영구 삭제. 2단계 확인 다이얼로그. (B) Attempt 보존(orphan) — recipe_id NULL 처리 + archived_recipe_title 스냅샷. 별도 "orphan attempts" 화면. (C) 사용자가 매번 라디오로 선택. |
| **선택** | **옵션 A (CASCADE)**. `attempts.recipe_id` FK를 `ON DELETE CASCADE`로 변경. 2단계 확인 다이얼로그 + danger 컬러 영구 삭제 텍스트. archived 30일 grace period가 실수 방어선. |
| **근거** | (1) v0.5 PIVOT 정체성 "Recipe 1급"과 정합 — Recipe 없는 Attempt는 어떤 재료/단계 기록인지 모름. (2) 데이터 모델 단순 — CASCADE 한 줄로 정합성 보장. (3) Cron 30일 자동 hard delete가 동일 흐름 — 별도 분기 코드 불필요. (4) M3·M6 지표 계산 단순 — 살아있는 Recipe만 대상. (5) 회상 욕구는 archived 상태에서 충족 가능. "영구 삭제"는 정말 지우는 행위. |
| **영향** | Tech §3.2 attempts FK 변경 (NOT CASCADE → CASCADE). Tech §10 삭제 정책 보강. PRD §4.9 Recipe 영구 삭제 항목 보강. Design v2.0 §휴지통 영역에 2단계 확인 UX 추가. Migration STEP 5에서 FK 제약 정의 시 CASCADE 명시. |
| **후속 의존성** | (1) 다음 사이클 BUILD에서 NAYO-A2 스키마 정의 시 CASCADE 반영. (2) NAYO-C2 휴지통 화면 영구 삭제 2단계 다이얼로그 구현. (3) Phase 2에 회상 보존 요구가 강하게 나오면 옵션 B(nullable + snapshot)로 단방향 마이그레이션 가능. |
| **Trade-off 인지** | 단점: "이 레시피는 이제 안 만들지만 과거 시도 기록은 남기고 싶다" 욕구 차단. 반론: archived 상태가 사실상 "보관함" — 진짜 안 만들 거면 archived로 충분. 영구 삭제는 진짜 지우고 싶을 때만. |

### L66 — OQ11 H3·H7 가설 통합 (옵션 A) → H3'

| 항목 | 내용 |
|------|------|
| ID | L66-PREB-2 |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (사용자 직접 결정) |
| 상태 | CONFIRMED |
| **컨텍스트** | PRD v0.5에서 H3(쿨타임 정성 자기보고)과 H7(쿨타임 정량 M6 측정)이 동일 측정 영역을 측정 방법만 달리해 분리 등재됨. doc-align에서 "동일 영역 중복 분리" 신호 OQ11로 미결 처리. |
| **대안** | (A) 통합 H3' — 측정 방법 2가지 병행(정성 + 정량). 가설 트리 H1~H6로 단순화. (B) 분리 유지 + 분리 사유 명시 — 행동·태도 신호 독립. (C) H3 폐기, H7만 유지. |
| **선택** | **옵션 A (통합 → H3')**. H3·H7을 H3'로 합치고, 측정 방법 2가지를 가설 본문에 명시. |
| **근거** | (1) 1인 사용 단계에서 가설 트리 단순화 가치 큼. (2) 통합해도 측정 방법 2가지 병행이라 정보 손실 없음. (3) 두 측정이 갈리면 그때 분리 (그 자체가 학습). (4) 회고 단계에서 "정성 vs 정량 갈림" 자체가 신호로 작동. |
| **새 H3' 정의** | "쿨타임 기반 홈 화면(`안 먹은 지 n일`)이 P2(회상 비용)을 줄인다. 측정: (a) 분기별 자기보고 회고 — '이전보다 회상 시간이 줄었나'. (b) M6 Recipe 재진입율 — 30일 내 동일 Recipe 재오픈 비율." |
| **영향** | PRD §6 가설 표에서 H3 → H3'로 갱신, H7 항목 폐기 (H3'로 흡수). 가설 트리 H1'·H2·H3'·H4·H5·H6 6개로 단순화. RM3 시그널 갱신(정성/정량 갈림 시 분리 검토 트리거 명시). M6 정의 유지. |
| **후속 의존성** | (1) 다음 사이클 BUILD 후 운영 단계 회고에서 정성/정량 갈림 발생 시 OQ12 신설 검토 (분리 재고). (2) Apollo friction_signal "H3·H7 분리 기준 모호" RESOLVED. |
| **Trade-off 인지** | 단점: 통합 후 한 가설 안에서 정성·정량 비교 무게 미정. 반론: 회고 시 양쪽 모두 보고 정성·정량 비중을 그때 결정 — 사전 정의 부담 회피. |

### L67 — 마이그레이션 폐기 → 신규 셋업 (office-hours 검토 후속)

| 항목 | 내용 |
|------|------|
| ID | L67-OFFICE-HOURS |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (office-hours Q2 검토 후속) |
| 상태 | CONFIRMED |
| **컨텍스트** | Tech v3.0.1 §13 Migration Plan 8단계 SQL이 v0.4 데이터 보존을 전제로 설계됨. office-hours 검토에서 마이그레이션 ROI 점검 — 사용자가 v0.4 BUILD 직전 단계 데이터를 보존 가치 없음으로 판단. |
| **대안** | (A) 마이그레이션 실행 (8단계 SQL + dry-run TC-24 + placeholder Recipe). (B) DB 리셋 + 신규 셋업 (drizzle-kit push 1단계). |
| **선택** | **옵션 B (리셋)**. v0.4 attempts/videos/dishes 전체 폐기. 다음 사이클 첫 작업 = `drizzle-kit push`로 v0.5 스키마 빈 DB 생성. |
| **근거** | (1) v0.4 BUILD 직전 단계 데이터 가치 < 마이그레이션 작업 비용. (2) STEP 4 youtube_video_id 중복 row 검증·STEP 5 placeholder Recipe 매핑·수동 후속 편집 → 전부 사라짐. (3) 다음 사이클 risk surface 대폭 감소. |
| **영향** | Tech v3.0.1 §13 Migration Plan **전체 폐기** (다음 사이클 jira plan에서 제거). NAYO-A1 (snapshot)·A3 (raw SQL은 신규 스키마에 포함되므로 유지)·A4 (8-step dry-run)·A5 (실행) → 단일 셋업 티켓으로 압축. |
| **후속 의존성** | F4-3 (Drizzle PARTIAL UNIQUE raw SQL) 잔존 — 신규 셋업에서도 raw SQL CREATE UNIQUE INDEX 추가 필수. |
| **Trade-off 인지** | 단점: v0.4 BUILD 직전 작성한 코드의 데이터 검증 이력 손실. 반론: 1인 사용자 + 검증 단계 데이터라 학습 가치 미미. v0.5 빈 DB에서 새로 검증 시작이 합리적. |

### L68 — H6 옵션 B 56px AmountStepper 확정 (paper test 미실시)

| 항목 | 내용 |
|------|------|
| ID | L68-OFFICE-HOURS |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (office-hours Q3 검토 후속) |
| 상태 | CONFIRMED (paper test 없이 사용자 확신 기반) |
| **컨텍스트** | office-hours에서 H6(한 손 조작 충분성) 검증을 코드 작성 전 paper test로 30분에 검증할 것을 권고. 사용자가 56px 충분하다고 확신, paper test 미실시 결정. |
| **대안** | (A) Paper test 30분 후 결정. (B) 본인 확신으로 옵션 B 56×56px 확정. |
| **선택** | **옵션 B (확정)**. RecipeCustomizationSheet AmountStepper 56×56px로 다음 사이클 진행. |
| **근거** | (1) 사용자 직접 사용자이자 설계자 — 본인 손 크기·요리 습관 직접 파악. (2) 종이 시뮬레이션과 실제 사용은 차이 있음. 실제 코드 + 실제 요리에서 검증이 더 정확. |
| **영향** | Design v2.0.1 §4 RecipeCustomizationSheet 변경 없음. tech-decision §15 AmountStepper a11y 변경 없음. |
| **후속 의존성** | RM11(H6 깨짐) 트리거 조건은 살아있음. 다음 사이클 BUILD 직후 첫 1주일간 본인이 직접 요리하며 한 손 조작 시뮬레이션 필수. M4'(Customization 평균 개수)가 0.5 미만이면 RM11 트리거 → 옵션 A(인라인 ±) 전환 검토 또는 72px 확대 실험. |
| **Trade-off 인지** | 사전 검증 30분 절약 vs 잘못된 결정 시 다음 사이클 §4.5 코드 폐기 리스크. 사용자 자기 사용자 신뢰로 후자 감수. |

### L69 — v0.5 스코프 좁힘 — Ingestion 우선 (office-hours 검토 후속)

| 항목 | 내용 |
|------|------|
| ID | L69-OFFICE-HOURS |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (office-hours Q5 검토 후속) |
| 상태 | CONFIRMED |
| **컨텍스트** | office-hours에서 v0.5 사이클이 동시 4개 신규 도입(Recipe 1급 + Ingestion + Customization + 홈 v2 쿨타임) → 학습 분리 불가 리스크 지적. 어느 가설(H5·H6·H3')이 깨졌는지 운영 신호로 분리 불가. |
| **대안** | (A) 좁힌 v0.5: 인프라(Recipe 1급) + Ingestion만. Customization·홈 v2는 다음 사이클로 분리. (B) 원안 유지. |
| **선택** | **옵션 A (좁힘)**. Ingestion 우선. Customization UX + 홈 v2 쿨타임은 다음 사이클로 분리. |
| **근거** | (1) Ingestion = 신규 사용자 행동 생성 기능 (P6 검증 핵심). H5 단독 검증 가능 구조. (2) Customization은 H6 가설 검증에 시간 필요. 분리해서 독립 사이클로 가야 학습 분리. (3) 홈 v2 쿨타임은 데이터 누적 후 효용 (Attempt 10건+ 이후). 초기 사이클에 단순 "최근 Recipe" 리스트로 대체. |
| **v0.5 좁힌 스코프 (IN)** | 신규 셋업(L67) / Recipe 1급 + Ingredient/Step/Source/Customization 스키마 / Ingestion 흐름 (§4.3) / Recipe CRUD (§4.4 — Ingestion 결과 편집) / 검색·자동완성 (§4.1) / 단순 메뉴 페이지 (§4.7 간소화 — Source 목록만) / 단순 시도 기록 (§4.6 단순화 — rating + memo) / 단순 홈 (검색바 + 최근 Recipe 5개) |
| **v0.6+ 분리 (OUT)** | RecipeCustomization UI 구현 (§4.5) — 스키마만 v0.5, UI는 다음 사이클 / 홈 v2 쿨타임 (§4.8 "안 먹은 지 n일") — 단순 "최근 Recipe" 리스트로 대체 / AttemptStepNote 단계별 메모 — 다음 사이클 / archived Recipe + 영구 삭제 2단계 다이얼로그 — 다음 사이클 / Source 접근 불가 lazy check (§4.10) — 다음 사이클 |
| **영향** | PRD §5.1 MVP 스코프 갱신 필요. next-cycle-jira-plan.md 좁힌 티켓 구조로 재작성. M5(Ingestion 성공률)와 H5 단독 검증 구조 확보. |
| **후속 의존성** | 다음 사이클 BUILD 후 H5 결과에 따라 v0.6 사이클 진입 결정. M5 ≥ 70%면 Customization 진행. M5 < 50%면 LLM 실호출(다음 사이클 OOS 해제) 우선. |
| **Trade-off 인지** | 단점: "Recipe 중심 레시피북" 정체성의 가장 매력적 기능(Customization)을 보류. v0.5 출시 시 v0.4와 사용자 관점에서 큰 차별점 = Ingestion만. 반론: Ingestion 자체가 P6 신규 페인 검증 + Recipe 1급 정체성을 사용자에게 보여주는 첫 진입점이라 정체성 약화 우려는 작음. |

### L70 — L69 부분 수정: AttemptStepNote v0.5 IN 복원 (P1 직접 해결)

| 항목 | 내용 |
|------|------|
| ID | L70-OFFICE-HOURS-2 |
| 날짜 | 2026-05-15 |
| 페이즈 | 다음 사이클 BUILD 선행 결정 (office-hours 2차 검토 후속) |
| 상태 | CONFIRMED |
| **컨텍스트** | L69에서 v0.5 스코프 좁히며 AttemptStepNote(단계별 메모)·Customization UI·쿨타임 홈을 모두 OOS로 분리. 사용자가 다시 "초기 페인포인트 직접 해결 기능은 반드시 필요"라며 재검토 요청. office-hours 2차 push 후 페인별 분리 결정. |
| **대안 검토** | (A) 풀 복원 — 셋 다 v0.5 IN. (B) StepNote만 — 나머지 둘 다음 사이클. (C) 시간 분할 v0.5a+v0.5b. |
| **선택** | **옵션 B — StepNote만 v0.5 IN 복원**. Customization UI·쿨타임 홈은 OOS 유지. |
| **사유** | (1) **AttemptStepNote**: P1(실패 반복) 직접 해결. RecipeStep과 연결된 단계 단위 메모는 자유 텍스트 `improvement_note`로 대체 불가. 작업량 전체의 5~10% (테이블 1 + API 3개 + UI 입력란). H6 같은 검증 리스크 없음. → IN. (2) **Customization UI**: 자유 텍스트 `Attempt.changes`로 1차 대응 가능. 1~2개월 사용 후 진짜 답답한지 자기 검증 → 다음 사이클에 도입 결정. + H6 paper test 미실시 상태에서 30% 작업은 리스크. → 다음 사이클. (3) **쿨타임**: L67 데이터 리셋으로 v0.5 출시 직후 Attempt 0건. 쿨타임 영역 = 빈 상태. 데이터 누적(Recipe 5+/Attempt 10+) = 격주 사용 페이스로 2~3개월 후. 코드 시점 < 효용 시점이라 다음 사이클이 합리적. → 다음 사이클. |
| **AttemptStepNote 명세 (v0.5)** | 테이블: `attempt_step_notes` (id, attempt_id CASCADE, recipe_step_id SET NULL, note TEXT NOT NULL, deleted_at, created_at). **video_timestamp는 v0.5 OOS** — YouTube IFrame Player API 추가 의존성 회피. API: POST/PATCH/DELETE /api/attempts/{id}/step-notes/{snId}. UI: Attempt BottomSheet/Dialog 안에 각 RecipeStep별 "메모 추가" 펼침 입력란. |
| **영향** | tech-decision §3.5 attempt_step_notes 테이블 v0.5 신규 셋업에 포함. PRD §5.1 e' 항목 갱신: 단순 시도 기록 → "rating + memo + 선택적 단계별 메모". OOS-5c **RESOLVED**. next-cycle-jira-plan F-0/F-5 갱신. |
| **후속 의존성** | StepNote video_timestamp 자동 캡처는 다음 사이클(YouTube IFrame Player API 의존성). M4'(현재 Customization 평균 개수)은 v0.5에는 측정 불가 (UI 없음) → "AttemptStepNote 평균 개수 per Attempt"로 대체 측정 검토. |
| **Trade-off 인지** | 단점: 페인 우선순위가 강한 Customization을 한 사이클 더 보류. 사용자 자기 페인 강도 신호 일부 무시. 반론: 1~2개월 자유 텍스트 사용 = 진짜 페인 강도 자기 검증 + H6(56px) 실제 사용 검증 시점 = 다음 사이클 Customization 의사결정 입력. 사용자 의지 무시가 아니라 *검증 기반 결정*으로 전환. |

---

## Out of Scope (v0.5 사이클 갱신)

| ID | 항목 | 제외 이유 | 재검토 시점 |
|----|------|----------|------------|
| OOS-1 | 가구/Household 도메인 + 가구원 공유 | 싱글유저 검증 후 결정 (L53) | 싱글유저 검증 완료 후 |
| OOS-2 | 타인 레시피 평가 | Phase 2 (L53) | Phase 2 |
| OOS-3 | 날씨 API 실연동 | 홈 카피로 선행 검증 후 결정 (L52) | 카피 반응 확인 후 |
| OOS-4 | LLM 실호출 구현 (Gemini API) | H5 가설 검증 후 결정 (L51, L64) | 다음 사이클 + H5 결과 |
| OOS-5 | 코드 마이그레이션 실행 (v0.4 → v0.5) | **WITHDRAWN (L67, 2026-05-15)** — 마이그레이션 자체 폐기. DB 리셋 + 신규 셋업으로 대체. Migration Plan(L62)도 비활성. |
| OOS-5a | RecipeCustomization UI 구현 (§4.5) | **신규 (L69, 2026-05-15)** — v0.5 스코프 좁힘. 스키마는 v0.5에 포함, UI는 다음 사이클. | H5 결과 + H6 paper test 실제 결과 확인 후 |
| OOS-5b | 홈 v2 쿨타임 ("안 먹은 지 n일") | **신규 (L69, 2026-05-15)** — v0.5는 단순 "최근 Recipe 5개" 리스트만. 쿨타임 UX는 Attempt 데이터 10건+ 축적 후 다음 사이클. | Attempt 누적 10건+ 시 |
| OOS-5c | ~~AttemptStepNote (단계별 메모)~~ | **RESOLVED (L70, 2026-05-15)** — v0.5 IN 복원. P1 직접 해결. video_timestamp 자동 캡처만 다음 사이클. | — |
| OOS-5d | archived Recipe + 영구 삭제 2단계 다이얼로그 | **신규 (L69, 2026-05-15)** — v0.5는 단순 hard delete만. archived 상태·휴지통 UX는 다음 사이클. | 다음 사이클 |
| OOS-5e | Source 접근 불가 lazy check (§4.10) | **신규 (L69, 2026-05-15)** — v0.5는 명시 감지 안 함. | 다음 사이클 |
| OOS-6 | RecipeCustomization swap/skip UX 구현 | H6 사용성 가설 먼저 검증. 이번 사이클 스키마까지 | 다음 사이클 |
| OOS-7 | 통계/그래프 (별점 시계열 등) | 기록 데이터 축적 후 의미 있음 | 6개월+ 운영 후 |
| OOS-8 | 부분 검색 통합 결과 (한국어 형태소·동의어) | 실사용 후 패턴 확인 후 도입 검토 | 실사용 후 결정 |
| OOS-9 | 음성 입력·제스처 폴백 (RecipeCustomization) | H6 가설 검증 후 필요 시 도입 | H6 깨질 시 트리거 |
| OOS-10 | 블로그 자동 수집 자동화 (URL → 텍스트 자동 추출) | 기술 복잡도. 규칙 기반 파싱 정확도 검증 후 | 다음 사이클 |

---

## 미결 사항 (Open Decisions)

| ID | 항목 | 현재 상태 | 후속 검토 시점 |
|----|------|----------|------------|
| OQ5 | 자동완성 한국어 매칭 정확도 | MVP: LIKE sequential scan. 부정확 빈발 시 pg_trgm GIN index 도입. 트리거 기준 미결. | 실사용 후 결정 |
| OQ7 | Ingestion 규칙 vs LLM fallback 비율 임계치 | 규칙 파싱 성공률이 어느 수준 이하일 때 LLM 기본 전환할지 미결. | ENGINEER + 다음 사이클 실사용 데이터 |
| OQ8 | RecipeCustomization 한 손 조작 디자인 | **RESOLVED** — 옵션 B(RecipeCustomizationSheet) 채택. L56. |
| OQ9 | H6 가설 검증 방법 (사용성 테스트) | 다음 사이클 사용성 테스트 계획 필요. "요리 중 조정 가능했나" 자기보고 + 사용성 테스트 병행 검토. | 다음 사이클 BUILD 완료 후 |
| OQ10 | Recipe 영구 삭제 플로우 | **RESOLVED (2026-05-15)** — 옵션 A(Attempt CASCADE) 채택. attempts FK ON DELETE CASCADE + 2단계 확인 다이얼로그. L65 참조. |
| OQ11 | H3·H7 분리 기준 (정성 vs 정량) | **RESOLVED (2026-05-15)** — 옵션 A(가설 통합 H3') 채택. H3·H7 → H3'로 통합, 측정 방법 2가지 병행. L66 참조. |

---

## v0.5 PIVOT 사이클 doc-align 요약 (2026-05-14)

### 검증 항목 및 판정

| 번호 | 검증 영역 | 판정 | 비고 |
|------|----------|------|------|
| A | 데이터 모델 일관성 (PRD §3 ↔ Tech §3.2) | PASS (Minor 2건 자동 수정) | Recipe/Ingredient/Step/Source/Customization/Attempt/AttemptStepNote 전체 일치. PRD §3.2 archived_at 추가(Minor 자동 수정). PRD §4.9 AttemptStepNote 삭제 정책 명시 부재(Minor — 다음 사이클 보강) |
| B | 화면 ↔ API 매핑 (Design 7화면 ↔ Tech 32개 API) | PASS | 홈 v2·검색·메뉴 페이지·Recipe 상세·CustomizationSheet·Ingestion·Attempt·휴지통 전체 일치 |
| C | 보안 경계 일관성 (32개 전 엔드포인트) | PASS | requireAuth() + WHERE user_id + 소유권 체인 전 문서 일치 |
| D | 외부 API 사실 검증 | PASS (Minor 1건) | Gemini 15RPM/1500req/day 일치. YouTube quota 일치. commentThreads.list v0.5 미사용 유산(Minor — 다음 사이클 정리) |
| E | 결정 영역 cross-check (L56~L61) | PASS | OQ8 옵션 B·쿨타임 3+7·archived_at·AttemptStepNote·AmountStepper 단위·ConfidenceField threshold 전체 3문서 일치 |
| F | 삭제 정책 일관성 | PASS (Minor 1건) | PRD §4.9 ↔ Tech §10 일치. AttemptStepNote 항목 PRD 명시 부재(Minor — 다음 사이클 보강) |
| G | 가설·지표 일관성 | PASS (OQ11 신설) | H1'~H7 ↔ M1~M6 매핑 일치. H3·H7 분리 기준 OQ11로 명확화 |
| H | 메타데이터 정합성 | PASS (Minor 1건 자동 수정) | decision-log 헤더 "모두의요리사" → "나만의요리사" 갱신(v2.0에서 처리) |

**v0.5 PIVOT 사이클 doc-align 최종: Critical 0건 / Major 0건 / Minor 5건 (자동 수정 2건, 다음 사이클 권장 3건)**

---

## 리스크 플래그 (다음 사이클 인계)

| ID | 리스크 | 현재 대응 | 후속 확인 |
|----|--------|----------|----------|
| R1 | LLM 실호출 OOS — stub만. Gemini API Key 격리 검증 필요 | stub 인터페이스 + 다음 사이클 GeminiIngestionAdapter | 다음 사이클 실호출 전 GEMINI_API_KEY 격리 grep 필수 |
| R2 | Migration STEP 5 attempts.video_id → recipe_id 매핑 충돌 | Dish 1개당 Recipe 1개 매핑. 중복 video_id 존재 시 dry-run에서 감지 | TC-24 dry-run에서 STEP 4·5 충돌 여부 검증 필수 |
| R3 | RecipeSource PARTIAL UNIQUE — Drizzle 자동 생성 불가 | Tech §3.2에 raw SQL 주석 병기. Migration STEP 1에 CREATE UNIQUE INDEX 명시 | 다음 사이클 BUILD에서 raw SQL migration 별도 실행 필수 |
| R4 | Gemini free tier 한도 실호출 직전 재확인 | 2026-05 기준 15RPM/1500req/day 명세. 실호출 전 공식 문서 재확인 필수 | 다음 사이클 LLM 실호출 구현 직전 |
| R5 | Migration STEP 3 placeholder Recipe — Dish 1개당 1 Recipe 매핑. 사용자 수동 편집 필요 | Migration Plan에 안내 포함. 사용자가 직접 Recipe 제목·재료·단계 편집해야 함 | 다음 사이클 BUILD 전 cross-check |
| R6 | Migration STEP 4 youtube_video_id 중복 row dry-run 검증 | dry-run TC-24 필수 명시 | 다음 사이클 BUILD 전 dry-run 실행 |

---

## 부록 — L1~L48 v0.5 흡수 매핑 요약

v0.4까지의 결정(L1~L48)이 v0.5 PIVOT에서 어떻게 처리되는지 요약. 상세 내용은 PRD v0.5 부록 B 참조.

| 결정 ID | 요약 | v0.5 처리 |
|---------|------|----------|
| L1 | 피처명 nayo | **유지** |
| L2 | JTBD + 핵심 페인 P1~P5 | **확장** — P6·P7 추가. JTBD Recipe 단위 수정 |
| L3 | Dish/Video/Attempt 3-tier | **재설계** — Recipe 1급 엔티티. Video → RecipeSource |
| L4~L5 | 검색 정렬 (thumbs 기반) | **재설계** — Recipe average_rating 기반 정렬 |
| L6 | 성공 지표 M1~M3 | **확장** — M4'·M5·M6 추가. M2 thumbs → M2' 평점 |
| L7 | 가설 H1~H4 | **갱신** — H1→H1'. H5·H6·H7 신설 |
| L8 | UI 분리 영구 가이드 | **유지** |
| L9~L16 | DESIGN 결정 (디자인 시스템·반응형·컴포넌트) | **Design v2.0으로 이관** |
| L17~L24 | ENGINEER 결정 (Drizzle·인증·캐시·정렬) | **Tech v3.0으로 이관 + 갱신** |
| L25~L32 | ALIGN rewind 1차 + prd-writer rewind 후속 | **이력 보존** |
| L33~L40 | ALIGN 4차 재실행 결정 (자동완성·접근불가·Step+timestamp·삭제 정책·메인 화면) | **v0.5에서 Recipe 기준 재설계로 흡수** |
| L41~L44 | ALIGN 5차 rewind (API 개수·SQL·삭제 모델·컬럼 rename) | **이력 보존** — v0.5 새 설계에서 재적용 |
| L45~L48 | ALIGN 6차 rewind (Dish Attempts API·UNIQUE·URL·thumbs) | **v0.5 폐기 API 포함** — L63에서 v0.5 API 32개로 교체 |
