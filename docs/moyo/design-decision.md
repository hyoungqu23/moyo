# Design Decision — moyo (모두의요리사)

> 버전: 1.0
> 작성일: 2026-05-03
> 페이즈: DESIGN
> 기반: PRD v0.2 + design-notes-from-discover.md + design-system.md + design-dialogue 합의

---

## 참조 문서

- `docs/moyo/prd.md` — 데이터 모델 · 기능 요구사항 (UI 묘사 없음)
- `docs/moyo/design-notes-from-discover.md` — DISCOVER 중 수집된 UI 노트
- `docs/moyo/design-system.md` — moyo 적용 Apple Web Design System 명세

---

## 디자인 시스템 선언

**Apple Web Design System 차용**. 별도 명세 `docs/moyo/design-system.md` 참조.

**핵심 원칙:**
- Photography-first: 유튜브 영상 썸네일이 product render 자리를 대체. UI는 받침대.
- Single accent: `{colors.primary}` (#0066cc) Action Blue 하나. 두 번째 브랜드 컬러 없음.
- Low density: 콘텐츠와 여백이 경쟁하지 않음. 각 섹션은 명확한 하나의 목적만 가짐.
- Tile rhythm: light/parchment ↔ dark tile 교차. 색 변화 자체가 divider 역할.
- 단일 product-shadow: `rgba(0, 0, 0, 0.22) 3px 5px 30px` — 썸네일/영상에만 적용, 카드·버튼·텍스트에는 적용 안 함.

**구현 방식:** Tailwind CSS 토큰 매핑. shadcn/ui default 컴포넌트 미사용 (제거).

**폰트 스택:** `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif`. Apple device가 아닐 때 Inter fallback.

---

## 레이아웃 결정

### 전역 네비게이션

- `{component.global-nav}`: 상단 고정, 배경 `{colors.surface-black}`, 44px height.
- 항목: 홈 / 검색 / 메뉴 보관함 (3개).
- 모바일(≤833px): 햄버거 + 로고 중앙.
- 텍스트: `{typography.nav-link}` 12px/400/-0.12px.

### 헤더 유형

- 검색 화면: 별도 페이지 헤더 없음. `{component.sub-nav-frosted}` (frosted glass, 52px) 사용.
- 메뉴 페이지: `{typography.display-lg}` 40px/600 메뉴명 헤더.
- 영상 상세: 별도 헤더 없음. 썸네일/임베드 영역이 상단 점유.

### 브레드크럼

- 없음 (단순 3-depth SPA 구조, 네비게이션은 global-nav로 처리).

### SubTabs

- 없음 (명시적 탭 분류 불필요 — 섹션 구분은 surface 교차로 처리).

### 반응형 / 기기 우선순위

- **모바일 퍼스트 + 반응형**.
- Apple breakpoint 그대로 차용:

| 이름 | 너비 | 주요 변화 |
|------|------|-----------|
| Small phone | ≤419px | 1컬럼, 서브네비 축소, 헤더 타이포 28px |
| Phone | 420–640px | 1컬럼, 제품 렌더 80% 스케일 |
| Large phone | 641–735px | 타이트 패딩(48px vertical) |
| Tablet portrait | 736–833px | 햄버거 전환 |
| Tablet landscape | 834–1023px | 전체 nav 복귀, 2컬럼 그리드 |
| Small desktop | 1024–1068px | 좌우 여백 생김 |
| Desktop | 1069–1440px | 풀 레이아웃, 최대 4컬럼 |
| Wide desktop | ≥1441px | 1440px lock |

- 터치 타겟 최소 44×44px.

---

## 화면 인벤토리 (4개)

### 1. 검색 화면 (메뉴명 검색 → 영상 리스트)

**Surface:** `{colors.canvas}` white 위주, 섹션 구분 시 `{colors.canvas-parchment}` 교차.

**구성:**
- 상단: `{component.sub-nav-frosted}` — frosted glass sticky.
- `{component.search-input}` — `{rounded.pill}`, 17px, 44px height, 검색 글리프 leading.
  - 사용자가 메뉴명 입력 → 검색 트리거.
- **우선 노출 영역** (thumbs up ≥1개인 경우에만 표시):
  - 헤더: "내가 좋아한 영상" `{typography.tagline}` 21px/600.
  - 영상 카드 3개 (average_rating 내림차순).
  - `{component.button-secondary-pill}` "더 보기" → **인라인 확장** (그 자리에서 아래로 펼쳐짐).
  - thumbs up 0개: 이 섹션 전체 미표시.
- **divider**: `{colors.canvas}` → `{colors.canvas-parchment}` surface 교차 (색 변화 = divider).
- **일반 노출 영역**:
  - 헤더: "최신순" `{typography.tagline}` 21px/600.
  - publishedAt 내림차순 영상 카드 리스트.
  - thumbs down 영상: **opacity 40% + grayscale** 처리되어 포함 (완전 숨김 아님 — "이미 별로였음" 인지).

### 2. 영상 카드

**컴포넌트 기반:** `{component.store-utility-card}` 변형.

**스펙:**
- 배경: `{colors.canvas}` white.
- border: 1px solid `{colors.hairline}`.
- border-radius: `{rounded.lg}` 18px.
- padding: `{spacing.lg}` 24px.

**내부 구성:**
1. 영상 썸네일 — 16:9 비율, `{rounded.sm}` 8px inner radius. product-shadow 적용.
2. 영상 제목 — `{typography.body-strong}` 17px/600.
3. 채널명 — `{typography.caption}` 14px/400.
4. **본인 기록** (탭 안 해도 카드에 직접 노출):
   - 시도 횟수 (attempt_count 파생 필드)
   - 마지막 시도일 (last_tried_at 파생 필드)
   - 별점 평균 (average_rating 파생 필드, 소수점 1자리)
5. thumbs up/down 토글 아이콘:
   - 활성: `{colors.primary}` #0066cc.
   - 비활성: `{colors.body-muted}` #cccccc.
   - `{component.button-primary}` 미니 변형 (44×44px 터치 타겟 준수).

**thumbs down 영상:** 카드 전체 `opacity: 0.4` + `filter: grayscale(100%)`.

### 3. 영상 상세 화면

**Surface:** 상단 dark tile `{colors.surface-tile-1}` #272729 → 하단 light `{colors.canvas}`.

**구성:**
1. **상단 dark tile 영역:**
   - 영상 임베드 또는 썸네일 (임베드 차단 시 썸네일 + "유튜브에서 열기" `{component.button-icon-circular}` fallback).
   - 영상 메타: 제목 `{typography.body-strong}` 17px/600, 채널 `{typography.caption}` 14px, publishedAt `{typography.caption}`.
   - thumbs up/down 토글 (영상 카드와 동일 패턴, 더 큰 사이즈).

2. **light tile 영역:**
   - **description 노출**: 300자 표시 → `{component.button-secondary-pill}` "더 보기" 토글 → **인라인 확장**. description 없으면 이 영역 미표시.
   - **상위 댓글 1개 노출 (best-effort)**: description 하단 별도 영역. 원본 텍스트 그대로 (가공 없음). 고정 댓글 포함 가능성 있으나 API상 보장 X. 댓글 비활성화 영상(403 `commentsDisabled`)은 이 영역 미표시.

3. **시도 기록 영역:**
   - 헤더: "내 시도 기록" `{typography.tagline}` 21px/600.
   - Attempt 이력 리스트 (최근순).
   - `{component.button-primary}` "기록하기" CTA.

### 4. 메뉴 페이지 (Dish 단위 통합 뷰)

**Surface:** light `{colors.canvas}` ↔ parchment `{colors.canvas-parchment}` 교차.

**구성:**
1. **헤더**: 메뉴명 `{typography.display-lg}` 40px/600. light surface.
2. **섹션 1 — "내 시도 이력"** (parchment surface):
   - Attempt 카드 리스트, 최근순.
   - 카드 구성: 영상 썸네일 + 별점 + 시도일 + 영상 제목 + changes/improvement_note 짧은 미리보기.
3. **divider**: parchment → light surface 교차.
4. **섹션 2 — "이 메뉴의 영상"** (light surface):
   - 검색 화면과 동일 구조 (thumbs up 우선 + 최신순).

---

## 시도 기록 입력 UX (반응형 분기)

**트리거:**
- 영상 상세의 "기록하기" CTA.
- 메뉴 페이지 "내 시도 이력" 섹션 빠른 기록 CTA.

**입력 필드:**
| 필드 | 타입 | 제약 | 기본값 |
|------|------|------|--------|
| rating | 별점 선택 | 0~5, 0.5 단위 | — |
| changes | textarea | nullable | — |
| improvement_note | textarea | nullable | — |
| tried_at | date picker | not null | today |

**저장:** `{component.button-primary}` "저장".

**반응형 분기:**
- **≤833px (모바일/태블릿 portrait)**: **Bottom Sheet**
  - 스와이프 다운 또는 backdrop 탭으로 닫힘.
  - 화면 하단에서 올라오는 패널.
- **≥834px (태블릿 landscape 이상)**: **Dialog (centered modal)**
  - ENGINEER 페이즈에서 Right Drawer → Dialog로 최종 확정. (tech-decision.md §12 참조)
  - 포커스 관리: centered modal 기준, focus trap 적용, ESC 닫기, body scroll lock, backdrop 클릭 닫기.

---

## 컴포넌트 목록

| Apple 컴포넌트 | moyo 사용처 | variant | 근거 |
|---|---|---|---|
| `{component.global-nav}` | 상단 네비게이션 (홈/검색/메뉴 보관함) | 기본 | 전역 네비게이션 표준 |
| `{component.sub-nav-frosted}` | 검색 화면/메뉴 페이지 카테고리 헤더 | frosted glass sticky | 스크롤 중 컨텍스트 유지 |
| `{component.button-primary}` | 모든 주요 액션 (검색, 기록 저장, thumbs 등) | pill, 44px height | single accent 원칙 |
| `{component.button-secondary-pill}` | 보조 액션 (더 보기) | ghost pill | 주요 액션과 시각적 계층 분리 |
| `{component.search-input}` | 메뉴명 검색 입력 | pill, 44px height | Apple 검색 표준 |
| `{component.store-utility-card}` (변형) | 영상 카드 | white bg, hairline border, rounded.lg | photography-first + 본인 기록 포함 |
| `{component.product-tile-light}` | 검색 결과/메뉴 페이지 light 섹션 | canvas white | light/dark 교차 리듬 |
| `{component.product-tile-parchment}` | 메뉴 페이지 parchment 섹션 | canvas-parchment | surface 교차 divider |
| `{component.product-tile-dark}` | 영상 상세 상단 | surface-tile-1 #272729 | 영상 몰입감 |
| `{component.button-icon-circular}` | 영상 상세 외부 유튜브 열기 | 44×44px, translucent chip | 사진 위 플로팅 컨트롤 |
| `{component.floating-sticky-bar}` | Phase 2 후보 — 빠른 기록 진입 | backdrop blur | 현재 미포함 |

---

## 색상 토큰 매핑

| UI 요소 | 토큰 | hex |
|---------|------|-----|
| 모든 주요 CTA, 링크, thumbs 활성 | `{colors.primary}` | #0066cc |
| 키보드 포커스 링 | `{colors.primary-focus}` | #0071e3 |
| dark tile 인라인 링크 | `{colors.primary-on-dark}` | #2997ff |
| 기본 캔버스 | `{colors.canvas}` | #ffffff |
| 교차 섹션 캔버스 | `{colors.canvas-parchment}` | #f5f5f7 |
| 영상 상세 dark tile | `{colors.surface-tile-1}` | #272729 |
| 글로벌 nav 배경 | `{colors.surface-black}` | #000000 |
| 모든 본문 텍스트 (light 배경) | `{colors.ink}` | #1d1d1f |
| dark tile 텍스트 | `{colors.body-on-dark}` | #ffffff |
| dark tile 보조 텍스트 | `{colors.body-muted}` | #cccccc |
| thumbs 비활성 아이콘 | `{colors.body-muted}` | #cccccc |
| 영상 카드 hairline border | `{colors.hairline}` | #e0e0e0 |
| 섹션 hairline divider | `{colors.hairline}` | #e0e0e0 |
| disabled 텍스트 | `{colors.ink-muted-48}` | #7a7a7a |
| 폼 입력 border | `rgba(0, 0, 0, 0.08)` | — |

---

## 상태 정의

### Loading 상태
- 영상 카드 영역: Skeleton 카드 (동일 크기 회색 플레이스홀더). `{colors.canvas-parchment}` 배경으로 shimmer 효과.
- 시도 기록 영역: Skeleton 리스트 아이템.
- description/상위 댓글: Skeleton 텍스트 블록.
- 전역: `{component.global-nav}`는 항상 노출 유지.

### Error 상태
- YouTube API quota 초과: 빈 상태 컴포넌트 표시 — "잠시 후 다시 시도해주세요" + `{component.button-primary}` "재시도".
- 네트워크 에러: 동일 패턴. "연결을 확인해주세요" + "재시도".

### Empty 상태

모든 빈 상태 컴포넌트 공통 스타일:
- `{colors.canvas-parchment}` 배경.
- `{spacing.section}` 80px vertical padding.
- centered stack: 헤드라인 `{typography.tagline}` 21px/600 + 보조 텍스트 `{typography.body}` 17px/400 + 단일 CTA `{component.button-primary}`.

| 상황 | 헤드라인 | 보조 텍스트 | CTA |
|------|---------|------------|-----|
| 검색 결과 0개 | "이 메뉴는 아직 유튜브 결과가 없어요" | — | "다른 메뉴 검색하기" |
| 시도 기록 0개 (영상 상세) | "아직 시도 기록이 없습니다" | "만들어 보세요" | "기록하기" |
| 시도 기록 0개 (메뉴 페이지) | "이 메뉴는 아직 시도 이력이 없어요" | — | "이 메뉴의 영상 보기" |
| thumbs up 0개 (검색) | (섹션 자체 미표시) | — | — |
| 영상 임베드 차단 | (썸네일 + "유튜브에서 보기" fallback) | — | "유튜브에서 열기" |
| description 없음 | (해당 영역 미표시) | — | — |
| 상위 댓글 없음 (비활성화) | (해당 영역 미표시) | — | — |
| YouTube API quota 초과 | "잠시 후 다시 시도해주세요" | — | "재시도" |

### Disabled 상태
- 비활성 버튼: 텍스트 `{colors.ink-muted-48}` #7a7a7a, 배경 opacity 0.5.
- thumbs down 카드: `opacity: 0.4` + `filter: grayscale(100%)` (카드 전체).

---

## 접근성 계획

### 아이콘 전용 버튼
- `{component.button-icon-circular}` (외부 유튜브 열기): `aria-label="유튜브에서 열기"` + Tooltip.
- thumbs up/down 토글 버튼: `aria-label="좋아요"` / `aria-label="싫어요"` + `aria-pressed="true/false"` 상태 반영.

### 포커스 관리
- 포커스 링: 2px solid `{colors.primary-focus}` #0071e3.
- Bottom Sheet / Dialog 열릴 때: 첫 번째 입력 필드로 포커스 이동. focus trap 적용.
- Bottom Sheet / Dialog 닫힐 때: 트리거 버튼으로 포커스 복귀.
- ESC 키: Bottom Sheet / Dialog 닫기.

### 색상 단독 정보 전달 금지
- thumbs 상태: 아이콘 모양(엄지 방향) + 색상(Action Blue) 병행. 색상만으로 상태 전달하지 않음.
- thumbs down 카드: grayscale + opacity 처리 외에 시각적 구분 아이콘/텍스트 병행 (카드에 thumbs down 아이콘 표시).

### aria 속성
- `{component.search-input}`: `aria-label="메뉴 검색"`, `role="searchbox"`.
- 섹션 구분: `<section aria-labelledby>` 패턴 사용.
- 시도 기록 리스트: `role="list"`, 각 항목 `role="listitem"`.

### 필수 필드
- tried_at: `aria-required="true"`, 레이블에 필수 표시 (시각적 + aria 병행).

---

## 시각 품질 계획 (VQ)

### VQ1 — 인터랙션 상태

| 요소 | Hover | Focus | Disabled | Selected/Active |
|------|-------|-------|----------|-----------------|
| `{component.button-primary}` | opacity 80% | 2px solid `{colors.primary-focus}` | opacity 50%, `{colors.ink-muted-48}` 텍스트 | `transform: scale(0.95)` |
| `{component.button-secondary-pill}` | 배경 `rgba(0, 102, 204, 0.08)` | 2px solid `{colors.primary-focus}` | opacity 50% | `transform: scale(0.95)` |
| thumbs 토글 버튼 | `{colors.primary}` 40% tint | 2px solid `{colors.primary-focus}` | `{colors.ink-muted-48}` | 활성: `{colors.primary}` + `transform: scale(0.95)` |
| 영상 카드 | 미세 elevation (hairline border 강화) | 2px solid `{colors.primary-focus}` | — | — |
| `{component.search-input}` | border 강화 (`rgba(0,0,0,0.16)`) | 2px solid `{colors.primary-focus}` | — | — |

### VQ2 — 빈/로딩/에러 상태

- **Skeleton**: 카드와 동일 크기. `{colors.canvas-parchment}` 배경, shimmer animation (left-to-right gradient sweep, 1.5s infinite).
- **Empty**: 위 "Empty 상태" 섹션 스펙 그대로. `{component.button-primary}` 단일 CTA.
- **Error**: Empty와 동일 컴포넌트 구조. 에러 전용 아이콘(경고) 추가.

### VQ3 — 트랜지션

- Bottom Sheet: 하단에서 올라오는 슬라이드, `transition: transform 300ms ease-out`.
- Dialog (데스크톱 ≥834px): fade + scale (centered modal), `transition: opacity 200ms, transform 200ms ease-out`.
- "더 보기" 인라인 확장: `transition: max-height 250ms ease-in-out` + fade-in.
- description "더 보기" 토글: `transition: max-height 200ms ease-in-out`.
- 기타 모달 없음 (Apple 원칙상 전환은 간결하게).
- 표준 타이밍: 200-300ms. 500ms 이상 금지.

### VQ4 — 레이아웃

- 페이지 좌우 여백: `{spacing.xl}` 32px (모바일), 더 넓은 뷰포트에서는 64px+.
- 섹션 vertical padding: `{spacing.section}` 80px.
- 카드 padding: `{spacing.lg}` 24px.
- 카드 간격(grid gutter): 20–24px.
- 영상 썸네일: 16:9 비율 유지, lazy-loading 기본.
- 최대 콘텐츠 너비: 1440px (store grid 기준), 텍스트 섹션 980px.

### VQ5 — 포커스 관리

- **Bottom Sheet 열림**: 첫 번째 폼 필드(rating 선택기)로 포커스 이동. focus trap 적용 (Sheet 외부 요소 포커스 차단).
- **Bottom Sheet 닫힘**: 트리거 버튼("기록하기")으로 포커스 복귀.
- **Dialog 열림 (≥834px)**: 첫 번째 폼 필드(rating 선택기)로 포커스 이동. focus trap 적용 (Dialog 외부 요소 포커스 차단). body scroll lock 적용. backdrop 클릭으로 닫기 지원.
- **Dialog 닫힘**: 트리거 버튼("기록하기")으로 포커스 복귀.
- **ESC 키**: Bottom Sheet / Dialog 즉시 닫기 + 포커스 복귀.
- **"더 보기" 확장**: 포커스 이동 없음 (인라인 확장이므로). 확장된 콘텐츠는 순서상 자연스럽게 tab 순서에 포함.

---

## thumbs up/down 토글 동작

- **위치**: 영상 카드 + 영상 상세 양쪽.
- **상태 3종**: up / down / 미설정. 초기값: 미설정.
- **토글 방식**: 탭 1회 → 해당 상태 활성 (up 또는 down). 같은 상태 다시 탭 → 미설정으로 해제. up 활성 중 down 탭 → down으로 전환 (up 자동 해제).
- **활성 색**: `{colors.primary}` #0066cc.
- **비활성 색**: `{colors.body-muted}` #cccccc.
- **즉시 반영**: 다음 검색 결과부터 정렬 반영 (현재 화면은 낙관적 업데이트로 즉시 UI 반영).

---

## PRD 오픈 질문 → DESIGN 결정 이관 처리

| PRD OQ | 결정 내용 |
|--------|---------|
| OQ1: description max length 정책 | **300자 즉시 노출 → "더 보기" 토글 → 인라인 전체 확장.** 짤림 없이 전체 원문 접근 가능 보장. |
| OQ2: thumbs up 0개 처리 | **섹션 자체 미표시** (PRD 로직 확정). 0개 상태의 별도 Empty UI 없음 (섹션이 사라질 뿐). |

---

## design-notes-from-discover.md 흡수 결과

| DISCOVER 노트 | design-decision 반영 |
|---|---|
| 검색 결과 = thumbs up 상위 + 더보기 + divider + 최신순 | 그대로 채택. 더보기 = 인라인 확장으로 구체화. |
| 영상 카드에 시도 횟수·마지막 시도일·별점 평균 직접 노출 | 그대로 채택. `{component.store-utility-card}` 변형으로 구현. |
| thumbs down = "흐리게" | opacity 40% + grayscale(100%)으로 구체화. |
| "더보기" 인터랙션 미정 | 인라인 확장으로 결정. |
| description 노출 위치 미정 | 영상 상세 화면 내, dark tile 하단 light 영역에 노출. 300자 + "더 보기" 토글. |
| 메뉴 페이지 레이아웃 미정 | 메뉴명 헤더 → "내 시도 이력" (parchment) → divider → "이 메뉴의 영상" (light) 구조 결정. |
| 시도 기록 입력 폼 미정 | 반응형 분기 — 모바일 bottom sheet, 데스크톱 dialog (centered modal). |

---

## PRD-UI 분리 원칙 (영구 가이드)

PRD(`prd.md`)에는 데이터 구조·로직·제약만 남긴다. UI 묘사·컴포넌트 결정·상태 처리·레이아웃은 모두 본 파일(`design-decision.md`)에 위치한다. PRD로의 UI 역침투 금지.

---

## 시스템 예외

해당 없음.

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | 디자인 시스템 선택 | Apple Web Design System 차용 (사용자 명시, design-system.md 별도 명세) |
| 2026-05-03 | 반응형 전략 | 모바일 퍼스트, Apple breakpoint, 시도 기록 입력 반응형 분기 |
| 2026-05-03 | 영상 카드 구성 | store-utility-card 변형 + 본인 기록 직접 노출 |
| 2026-05-03 | thumbs down 시각 처리 | opacity 40% + grayscale (인라인 확인 완료) |
| 2026-05-03 | "더보기" 인터랙션 | 인라인 확장 |
| 2026-05-03 | description max length | 300자 + "더 보기" 토글 → 인라인 전체 확장 |
| 2026-05-03 | 메뉴 페이지 레이아웃 | 헤더 → 시도 이력(parchment) → 영상 목록(light) 구조 |
| 2026-05-03 | 시도 기록 입력 UX | 모바일 bottom sheet / 데스크톱 dialog (ENGINEER 페이즈에서 Right Drawer → Dialog로 최종 확정. tech-decision.md §12 참조) |
