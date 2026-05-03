# Decision Log — moyo (모두의요리사)

> 버전: 1.2
> 작성일: 2026-05-03
> 갱신일: 2026-05-03
> 페이즈: ALIGN (ALIGN 재실행 — Apollo prd-writer rewind 후속)
> 기반: PRD v0.3 (B1·B2·B3·B4 보강) + Design Decision Doc v1.0 + Tech Decision Doc v1.0 + harness-state.md

---

## 개요

본 문서는 moyo(모두의요리사) 피처의 DISCOVER → DESIGN → ENGINEER 전 페이즈에 걸쳐 확정된 의사결정을 종합한 단일 기록이다. 각 결정에는 컨텍스트·대안·선택·근거·영향·후속 의존성을 명시한다. ALIGN 페이즈 이후 BUILD(구현) 페이즈의 팀 결정 추출 근거로 활용된다.

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
| **대안** | `recipe-tracker` (임시명), `moyo` (사용자 제안) |
| **선택** | `moyo` — "모두의요리사"의 줄임말. |
| **근거** | 사용자 명시 지정. 도메인과 페르소나를 함축하는 이름. |
| **영향** | 모든 파일 경로, 문서 헤더, harness-state 피처명 통일. |
| **후속 의존성** | docs/moyo/ 디렉토리 구조, README.md 피처명. |

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
| **컨텍스트** | Apple Web Design System 컴포넌트를 moyo 각 화면에 어떻게 매핑할지 결정 필요. |
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
| **근거** | 사용자 명시 요청. ALIGN 검증 항목 12에서 7개 파일 모두 docs/moyo/ 하위 실재 확인 완료. |
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

---

## 미결 사항 (Open Decisions)

| ID | 항목 | 현재 결정 | 후속 검토 시점 |
|----|------|----------|-------------|
| U1 | 한글 메뉴명 검색 인덱싱 정밀도 | lower(name) btree index 기본. trigram 필요 시 pg_trgm 확장 후 GIN index 전환. | 실사용 후 검색 정확도 확인 |
| U2 | youtube_cache TTL | 24h 기본값. | API quota 소진율 모니터링 후 72h/7d 연장 검토 |
| U3 | Drizzle migration 자동화 | 수동(drizzle-kit migrate 수동 실행). | Vercel 배포 훅 연동 또는 별도 script 검토 |
| U4 | RLS 정책 세부 | Drizzle direct connection에서 RLS auth.uid() 미작동 확인. Drizzle WHERE user_id = 단일 보안 경계. RLS는 server 경로 미적용 (참고용 정의만 유지). | 다중 사용자 전환 시 재검토 |
| U5 | Playwright E2E 선택 여부 | "선택" 상태. | BottomSheet/Dialog 구현 완료 후 판단 |
| U6 | youtube_cache 만료 레코드 정리 | 수동 또는 Postgres cron. 처리 없으면 영구 누적. | 1개월 운영 후 row count 확인 |

---

## 리스크 플래그 (ENGINEER 인계)

| ID | 리스크 | 현재 대응 | 후속 확인 |
|----|--------|----------|----------|
| R1 | 자체 구현 focus trap 브라우저별 동작 차이 | Vitest + @testing-library 단위 테스트(TC-09~TC-14)로 사전 검증 | BUILD 페이즈 구현 완료 후 크로스 브라우저 확인 |
| R2 | youtube_cache 만료 레코드 누적 | 현재 별도 정리 없음 | 1개월 운영 후 row count 확인(U6) |
| R3 | 한글 메뉴명 검색 정확도 | pg_trgm 없이 lower(name) btree만으로 부족 가능 | 실사용 후 검색 정확도 확인(U1) |

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
| 12 | B4 참고 문서 박스 ↔ 실제 파일 존재 (7개) | PASS | prd.md L8~L16 / docs/moyo/ 디렉토리 | 7개 파일 전부 실재 확인 |

재실행 Critical 불일치: 0건 / Major 불일치: 0건 / Minor 자동 수정: 0건

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | decision-log 최초 작성 | ALIGN 페이즈 Athena(align) 산출. L1-L24 전체 결정 기록. |
| 2026-05-03 | doc-align 완료 (1차) | Critical 0 / Major 0 / Minor 1(자동 수정). ALIGN status: success. |
| 2026-05-03 | doc-align rewind 1차 | Codex 외부 검토 6건 정정. Major 4건(H2·H3 검증 방법, 고정 댓글→상위 댓글, Right Drawer→Dialog 본문, 보안 경계) + Minor 2건(PRD 메타, 캐시 키). L25~L28 신규 결정 추가. |
| 2026-05-03 | Apollo prd-writer rewind 흡수 | B1 §1.0 내러티브, B2 §2.3 매핑 표, B3 §9.5 RM1~RM7, B4 참고 문서 박스. review-loop 2R + prd-review R1~R4 PASS. L29~L32 신규 결정 추가. |
| 2026-05-03 | ALIGN 재실행 (iteration 3) | 12개 검증 항목 전항목 PASS. Critical 0 / Major 0 / Minor 0. status: success. BUILD 진입 대기. |
