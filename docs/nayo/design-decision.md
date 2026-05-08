# Design Decision — nayo (모두의요리사)

> 버전: 1.1
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-08 (ALIGN 5차 rewind — PRD v0.4 B1·B2·B5β·B6·B7-A 보강 정합)
> 페이즈: DESIGN
> 기반: PRD v0.4 + design-notes-from-discover.md + design-system.md + design-dialogue 합의

---

## 참조 문서

- `docs/nayo/prd.md` — 데이터 모델 · 기능 요구사항 (UI 묘사 없음)
- `docs/nayo/design-notes-from-discover.md` — DISCOVER 중 수집된 UI 노트
- `docs/nayo/design-system.md` — nayo 적용 Apple Web Design System 명세

---

## 디자인 시스템 선언

**Apple Web Design System 차용**. 별도 명세 `docs/nayo/design-system.md` 참조.

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

## 화면 인벤토리 (5개)

### 0. 메인 화면 (첫 진입점) — 신규 (B7-A)

**Surface:** `{colors.canvas-parchment}` 기본. 섹션 교차 시 `{colors.canvas}` white.

**구성:**

- **상단 검색바**: `{component.search-input}` (`{rounded.pill}`, 44px height, 검색 글리프 leading). 자동완성 dropdown 연결 (아래 "자동완성 dropdown UX" 참조).
- **"최근 시도한 영상" 섹션**:
  - 섹션 헤더: `{typography.tagline}` 21px/600.
  - `{component.store-utility-card}` 변형 카드 최대 5개. 각 카드에 attempt 미니 메타 포함: 마지막 시도일(last_tried_at) + 별점 평균(average_rating).
  - 카드 탭 → `/video/{youtubeVideoId}?dish_id={dishId}&video_id={videoUuid}` 이동 (L47 — ALIGN 6차 rewind).
- **"자주 만든 메뉴" 섹션**:
  - 섹션 헤더: `{typography.tagline}` 21px/600.
  - Top 3 Dish 칩: `{component.configurator-option-chip}` 변형 (`{rounded.pill}`, padding 12px × 16px). 칩에 메뉴명(Dish.name) 표시.
  - 칩 탭 → 해당 메뉴 페이지로 이동.
- **빈 상태 (신규 사용자, Attempt 0건)**:
  - "최근 시도한 영상" / "자주 만든 메뉴" 두 섹션 대신 단일 Empty 컴포넌트 표시.
  - centered stack, `{colors.canvas-parchment}` 배경, `{spacing.section}` 80px vertical padding.
  - 헤드라인: "메뉴를 검색해 시작해보세요" `{typography.tagline}` 21px/600.
  - 단일 CTA: `{component.button-primary}` "메뉴 검색하기" → 검색 화면으로 이동.

**Apple 토큰 매핑 (메인 화면):**
- 기본 surface: `{colors.canvas-parchment}` / `{colors.canvas}` 교차
- 섹션 헤더: `{typography.tagline}` 21px/600
- 카드: `{component.store-utility-card}` 변형 (기존 영상 카드와 동일 컴포넌트)
- Dish 칩: `{component.configurator-option-chip}` 변형 (`{rounded.pill}`)

---

### 1. 검색 화면 (메뉴명 검색 → 영상 리스트)

**Surface:** `{colors.canvas}` white 위주, 섹션 구분 시 `{colors.canvas-parchment}` 교차.

**구성:**
- 상단: `{component.sub-nav-frosted}` — frosted glass sticky.
- `{component.search-input}` — `{rounded.pill}`, 17px, 44px height, 검색 글리프 leading.
  - 사용자가 메뉴명 입력 → 검색 트리거.
  - 입력 중 자동완성 dropdown 표시 (아래 "자동완성 dropdown UX" 참조).
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

**thumbs down 영상:** 카드 전체 `opacity: 0.4` + `filter: grayscale(100%)`. (카드에 thumbs down 아이콘 표시 — 색상 단독 전달 금지 준수)

**is_unavailable_on_youtube = true 영상 (B2):** thumbs down 처리와 **다른** 시각 처리로 두 상태를 구분 가능하게 함.
- 카드 전체: `opacity: 0.3` + `filter: grayscale(100%)`.
- 배지: "사용할 수 없는 영상" 텍스트 배지 — card top-right corner, `{typography.caption-strong}` 14px/600, 배경 `rgba(0,0,0,0.6)`, 텍스트 white, `{rounded.xs}` 5px, padding 4px 8px.
- 카드 클릭 시: 영상 상세로 진입 가능 (시도 기록 조회 목적 보존). 임베드 영역 대신 "이 영상은 더 이상 유튜브에서 사용할 수 없습니다" 안내 + 시도 기록 영역만 표시.
- `aria-label` 에 "사용할 수 없는 영상: {영상 제목}" 포함 필수.

### 3. 영상 상세 화면

**Surface:** 상단 dark tile `{colors.surface-tile-1}` #272729 → 하단 light `{colors.canvas}`.

**구성:**
1. **상단 dark tile 영역:**
   - 영상 임베드 또는 썸네일 (임베드 차단 시 썸네일 + "유튜브에서 열기" `{component.button-icon-circular}` fallback).
   - `is_unavailable_on_youtube = true` 시: 임베드·썸네일 영역 대신 "이 영상은 더 이상 유튜브에서 사용할 수 없습니다" 안내 텍스트 (`{typography.body}` 17px, `{colors.body-muted}`). 시도 기록 영역은 정상 표시 (Attempt·Step 보존 원칙).
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
   - 영상 카드 탭 → `/video/{youtubeVideoId}?dish_id={dishId}&video_id={videoUuid}` 이동 (L47 — ALIGN 6차 rewind).

---

## 시도 기록 입력 UX (반응형 분기)

**트리거:**
- 영상 상세의 "기록하기" CTA.
- 메뉴 페이지 "내 시도 이력" 섹션 빠른 기록 CTA.

**기본 입력 필드:**
| 필드 | 타입 | 제약 | 기본값 |
|------|------|------|--------|
| rating | 별점 선택 | 0~5, 0.5 단위 | — |
| changes | textarea | nullable | — |
| improvement_note | textarea | nullable | — |
| tried_at | date picker | not null | today |

**Step 입력 영역 (B5-β 신규):**

기본 필드 하단에 "단계별 기록 (선택)" 섹션 추가. 동적으로 step 항목을 추가/삭제할 수 있다.

각 step 입력 행 구성:
- `note`: textarea (multi-line, `{typography.body}` 17px). 자유 기록.
- `video_timestamp` 표시 영역: mm:ss 형식.
  - 영상 IFrame 임베드 가능 상태: "지금 시간 기록" 버튼 활성 → 클릭 시 `player.getCurrentTime()` 호출 → mm:ss 변환 → 해당 step의 video_timestamp 채움.
  - 영상 임베드 차단 상태: "지금 시간 기록" 버튼 비활성(또는 숨김) → 수동 mm:ss 입력 필드 표시.
- 개별 step 삭제 버튼: 휴지통 아이콘, `aria-label="이 단계 삭제"`.
- "단계 추가" 버튼: `{component.button-secondary-pill}` "단계 추가" — 새 step 입력 행 append.

**"지금 시간 기록" 버튼 VQ:**
- 클릭 시 micro-interaction: `transform: scale(0.95)` 피드백.
- 캡처된 시간이 timestamp 필드에 fade-in (`opacity 0 → 1, 150ms ease-out`).
- `aria-label="현재 재생 시간 기록"`.

**Step 영역 진입 위치별 분기:**
- **영상 상세 화면에서 진입 (IFrame 가능):**
  - ≥834px (데스크톱): Dialog 좌측 영상 임베드 + 우측 step 입력 폼 2컬럼 레이아웃.
  - ≤833px (모바일): Bottom Sheet 위에 영상 임베드 미니 (16:9, 화면 너비 100%) + 아래 폼.
- **영상 상세 화면에서 진입 (IFrame 차단):**
  - 폼만 표시. "지금 시간 기록" 버튼 비활성/숨김. 수동 mm:ss 입력.
- **메뉴 페이지에서 진입:**
  - 영상 임베드 없음. 폼만. "지금 시간 기록" 버튼 비활성/숨김. 수동 mm:ss 입력만.

**Step edit 정책:**
- Attempt edit 모드에서 step 목록도 추가/편집/삭제 가능.
- Attempt 휴지통에서 복구 시 하위 step도 함께 복구.

**저장:** `{component.button-primary}` "저장".

**반응형 분기 (컨테이너):**
- **≤833px (모바일/태블릿 portrait)**: **Bottom Sheet**
  - 스와이프 다운 또는 backdrop 탭으로 닫힘.
  - 화면 하단에서 올라오는 패널.
- **≥834px (태블릿 landscape 이상)**: **Dialog (centered modal)**
  - ENGINEER 페이즈에서 Right Drawer → Dialog로 최종 확정. (tech-decision.md §12 참조)
  - 포커스 관리: centered modal 기준, focus trap 적용, ESC 닫기, body scroll lock, backdrop 클릭 닫기.

---

## 컴포넌트 목록

| Apple 컴포넌트 | nayo 사용처 | variant | 근거 |
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
| `{component.configurator-option-chip}` (변형) | 메인 화면 "자주 만든 메뉴" Dish 칩 | `{rounded.pill}`, 12×16px padding | Apple 칩 패턴, 메뉴 퀵 이동 |

**자체 구현 컴포넌트 (Apple 디자인 시스템 직접 명세 없음):**

| 컴포넌트 | 사용처 | 근거 |
|---|---|---|
| `Combobox / Autocomplete` | search-input 아래 자동완성 dropdown | Apple 패턴에 직접 명세 없음 → 자체 정의 (스펙 아래 "자동완성 dropdown UX" 참조) |
| `StepInputRow` | 시도 기록 입력 폼의 step 입력 행 | note + timestamp + 삭제 버튼 조합 — 자체 구현 |
| `DeletedVideoAlert` | 삭제된 유튜브 영상 안내 영역 | "이 영상은 더 이상 유튜브에 없습니다" 인라인 안내 — 자체 구현 |

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
| 사용할 수 없는 영상 배지 배경 | `rgba(0, 0, 0, 0.6)` | — (오버레이) |
| 자동완성 dropdown border | `{colors.hairline}` | #e0e0e0 |
| 자동완성 dropdown 배경 | `{colors.canvas}` | #ffffff |

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
| 메인 화면 신규 사용자 (Attempt 0건) | "메뉴를 검색해 시작해보세요" | — | "메뉴 검색하기" |
| 휴지통 (삭제된 Attempt 없음) | "삭제된 기록이 없어요" | — | — |

### Disabled 상태
- 비활성 버튼: 텍스트 `{colors.ink-muted-48}` #7a7a7a, 배경 opacity 0.5.
- thumbs down 카드: `opacity: 0.4` + `filter: grayscale(100%)` (카드 전체).

---

## 접근성 계획

### 아이콘 전용 버튼
- `{component.button-icon-circular}` (외부 유튜브 열기): `aria-label="유튜브에서 열기"` + Tooltip.
- thumbs up/down 토글 버튼: `aria-label="좋아요"` / `aria-label="싫어요"` + `aria-pressed="true/false"` 상태 반영.
- step 삭제 버튼: `aria-label="이 단계 삭제"` + Tooltip.
- "지금 시간 기록" 버튼: `aria-label="현재 재생 시간 기록"`. 비활성 시 `aria-disabled="true"` + Tooltip "영상 임베드가 불가하여 시간을 자동 기록할 수 없습니다".
- Video 숨김 토글 버튼: `aria-label="이 영상 숨기기"` / `aria-label="이 영상 숨김 해제"` + `aria-pressed="true/false"`.
- 사용할 수 없는 영상 배지: `aria-label="사용할 수 없는 영상"` (시각 배지 + aria 병행).

### 포커스 관리
- 포커스 링: 2px solid `{colors.primary-focus}` #0071e3.
- Bottom Sheet / Dialog 열릴 때: 첫 번째 입력 필드로 포커스 이동. focus trap 적용.
- Bottom Sheet / Dialog 닫힐 때: 트리거 버튼으로 포커스 복귀.
- ESC 키: Bottom Sheet / Dialog 닫기.

### 색상 단독 정보 전달 금지
- thumbs 상태: 아이콘 모양(엄지 방향) + 색상(Action Blue) 병행. 색상만으로 상태 전달하지 않음.
- thumbs down 카드: grayscale + opacity 처리 외에 시각적 구분 아이콘/텍스트 병행 (카드에 thumbs down 아이콘 표시).

### aria 속성
- `{component.search-input}` (자동완성 dropdown 첨부 시): `role="combobox"`, `aria-label="메뉴 검색"`, `aria-expanded="true/false"`, `aria-controls={listbox id}`, `aria-autocomplete="list"`, `aria-activedescendant={활성 항목 id}`.
- 자동완성 dropdown 컨테이너: `role="listbox"`. 각 항목: `role="option"`, `aria-selected="true/false"`.
- 자동완성 없는 단독 검색 input: `role="searchbox"`, `aria-label="메뉴 검색"`.
- 섹션 구분: `<section aria-labelledby>` 패턴 사용.
- 시도 기록 리스트: `role="list"`, 각 항목 `role="listitem"`.
- step 입력 행 리스트: `role="list"`, 각 행 `role="listitem"`.
- 삭제 confirmation dialog: `role="alertdialog"`, `aria-labelledby` 제목 연결, `aria-describedby` 본문 설명 연결.

### 필수 필드
- tried_at: `aria-required="true"`, 레이블에 필수 표시 (시각적 + aria 병행).

---

## 시각 품질 계획 (VQ)

### VQ1 — 인터랙션 상태 (5개 화면 전체 토큰 매핑 일관성 포함)

| 요소 | Hover | Focus | Disabled | Selected/Active |
|------|-------|-------|----------|-----------------|
| `{component.button-primary}` | opacity 80% | 2px solid `{colors.primary-focus}` | opacity 50%, `{colors.ink-muted-48}` 텍스트 | `transform: scale(0.95)` |
| `{component.button-secondary-pill}` | 배경 `rgba(0, 102, 204, 0.08)` | 2px solid `{colors.primary-focus}` | opacity 50% | `transform: scale(0.95)` |
| thumbs 토글 버튼 | `{colors.primary}` 40% tint | 2px solid `{colors.primary-focus}` | `{colors.ink-muted-48}` | 활성: `{colors.primary}` + `transform: scale(0.95)` |
| 영상 카드 | 미세 elevation (hairline border 강화) | 2px solid `{colors.primary-focus}` | — | — |
| `{component.search-input}` | border 강화 (`rgba(0,0,0,0.16)`) | 2px solid `{colors.primary-focus}` | — | — |
| Dish 칩 (`configurator-option-chip` 변형) | border `{colors.primary}` 1px | 2px solid `{colors.primary-focus}` | opacity 50% | border 2px solid `{colors.primary-focus}` |
| 자동완성 dropdown 항목 | 배경 `{colors.canvas-parchment}` | 2px solid `{colors.primary-focus}` 인라인 | — | 배경 `{colors.canvas-parchment}` |
| Video 숨김 토글 버튼 | `{colors.primary}` 40% tint | 2px solid `{colors.primary-focus}` | — | `aria-pressed="true"` + `{colors.primary}` |
| "지금 시간 기록" 버튼 | opacity 80% | 2px solid `{colors.primary-focus}` | `aria-disabled="true"` + opacity 50% | `transform: scale(0.95)` + timestamp fade-in |

### VQ2 — 빈/로딩/에러 상태

- **Skeleton**: 카드와 동일 크기. `{colors.canvas-parchment}` 배경, shimmer animation (left-to-right gradient sweep, 1.5s infinite).
- **Empty**: 위 "Empty 상태" 섹션 스펙 그대로. `{component.button-primary}` 단일 CTA.
- **Error**: Empty와 동일 컴포넌트 구조. 에러 전용 아이콘(경고) 추가.

### VQ3 — 트랜지션

- Bottom Sheet: 하단에서 올라오는 슬라이드, `transition: transform 300ms ease-out`.
- Dialog (데스크톱 ≥834px): fade + scale (centered modal), `transition: opacity 200ms, transform 200ms ease-out`.
- "더 보기" 인라인 확장: `transition: max-height 250ms ease-in-out` + fade-in.
- description "더 보기" 토글: `transition: max-height 200ms ease-in-out`.
- 자동완성 dropdown 열림/닫힘: `transition: opacity 150ms ease-out, transform 100ms ease-out` (scale 0.98 → 1).
- "지금 시간 기록" 클릭 → 타임스탬프 나타남: `opacity 0 → 1, 150ms ease-out` (fade-in).
- 기타 모달 없음 (Apple 원칙상 전환은 간결하게).
- 표준 타이밍: 150-300ms. 500ms 이상 금지.

### VQ4 — 레이아웃

- 페이지 좌우 여백: `{spacing.xl}` 32px (모바일), 더 넓은 뷰포트에서는 64px+.
- 섹션 vertical padding: `{spacing.section}` 80px.
- 카드 padding: `{spacing.lg}` 24px.
- 카드 간격(grid gutter): 20–24px.
- 영상 썸네일: 16:9 비율 유지, lazy-loading 기본.
- 최대 콘텐츠 너비: 1440px (store grid 기준), 텍스트 섹션 980px.
- 메인 화면 Dish 칩 행: flex-wrap, gap `{spacing.xs}` 8px.
- Dialog 2컬럼 레이아웃 (≥834px, IFrame 가능): 영상 임베드 영역 60% / 폼 영역 40% 분할. 폼 최소 너비 320px.

### VQ5 — 포커스 관리

- **Bottom Sheet 열림**: 첫 번째 폼 필드(rating 선택기)로 포커스 이동. focus trap 적용 (Sheet 외부 요소 포커스 차단).
- **Bottom Sheet 닫힘**: 트리거 버튼("기록하기")으로 포커스 복귀.
- **Dialog 열림 (≥834px)**: 첫 번째 폼 필드(rating 선택기)로 포커스 이동. focus trap 적용 (Dialog 외부 요소 포커스 차단). body scroll lock 적용. backdrop 클릭으로 닫기 지원.
- **Dialog 닫힘**: 트리거 버튼("기록하기")으로 포커스 복귀.
- **ESC 키**: Bottom Sheet / Dialog 즉시 닫기 + 포커스 복귀.
- **"더 보기" 확장**: 포커스 이동 없음 (인라인 확장이므로). 확장된 콘텐츠는 순서상 자연스럽게 tab 순서에 포함.
- **자동완성 dropdown 열림**: 포커스는 search-input 유지. dropdown 항목은 `aria-activedescendant`로 시각/aria 포커스만 이동 (실제 DOM 포커스는 input 유지).
- **자동완성 dropdown 닫힘 (ESC / Tab)**: search-input 포커스 유지 또는 Tab 다음 요소로 이동.
- **Confirmation Dialog (삭제)**: dialog 열릴 때 "취소" 버튼으로 초기 포커스. focus trap 적용. ESC = 취소(닫힘).

---

## thumbs up/down 토글 동작

- **위치**: 영상 카드 + 영상 상세 양쪽.
- **상태 3종**: up / down / 미설정. 초기값: 미설정.
- **토글 방식**: 탭 1회 → 해당 상태 활성 (up 또는 down). 같은 상태 다시 탭 → 미설정으로 해제. up 활성 중 down 탭 → down으로 전환 (up 자동 해제).
- **활성 색**: `{colors.primary}` #0066cc.
- **비활성 색**: `{colors.body-muted}` #cccccc.
- **즉시 반영**: 다음 검색 결과부터 정렬 반영 (현재 화면은 낙관적 업데이트로 즉시 UI 반영).
- **API 이행 (L48 — ALIGN 6차 rewind)**: VideoDetailClient에서 thumbs 토글 시 `PATCH /api/videos/{video_id}/thumbs` 실호출 + 낙관적 업데이트. video_id는 URL search params(`?video_id=`)로 수신. video_id 없는 경우(직접 URL 진입)는 로컬 상태만 변경. Attempt 생성 트리거와 무관 (L35 결정 유지).

---

## 자동완성 dropdown UX (B1 신규)

Apple 패턴에 직접 명세 없음 → 자체 정의 컴포넌트 (Combobox / Autocomplete).

**트리거 조건:** `{component.search-input}`에 1자 이상 입력 시 기존 저장된 Dish 이름 중 LIKE 매칭 항목이 1개 이상일 때 dropdown 표시.

**스타일 명세:**
- 위치: search-input 바로 아래, 입력란과 좌우 폭 동일.
- 배경: `{colors.canvas}` white.
- 테두리: 1px hairline, `{colors.hairline}` #e0e0e0.
- border-radius: `{rounded.lg}` 18px.
- shadow: 없음 (Apple 원칙 — 카드에 shadow 미적용).
- 최대 노출 항목: 5개 (이하 스크롤 없이 표시, 초과 시 내부 스크롤).

**각 항목 구성:**
- 레이아웃: 좌측 dish thumbnail/아이콘(16×16px) + 우측 메뉴명.
- 텍스트: `{typography.body}` 17px/400.
- 매칭 부분 강조: `{typography.body-strong}` 17px/600.
- padding: `{spacing.sm}` 12px vertical, `{spacing.lg}` 24px horizontal.

**키보드 네비게이션:**
| 키 | 동작 |
|----|------|
| ↓ | 다음 항목으로 aria-activedescendant 이동 |
| ↑ | 이전 항목으로 aria-activedescendant 이동 |
| Enter | 현재 포커스된 항목 선택 → 검색 트리거 |
| ESC | dropdown 닫기. search-input 포커스 유지. |
| Tab | dropdown 닫기. 다음 focusable 요소로 이동. |

**aria 속성:**
- search-input: `role="combobox"`, `aria-expanded="true/false"`, `aria-controls={listbox 컨테이너 id}`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-activedescendant={활성 항목 id}`.
- dropdown 컨테이너: `role="listbox"`.
- 각 항목: `role="option"`, `id={고유 id}`, `aria-selected="true/false"`.

**항목 선택 → 동작:**
- 선택된 Dish명이 search-input에 채워짐.
- dropdown 닫힘.
- 검색 자동 트리거 (Enter 없이도 선택 즉시 실행).

---

## 삭제 UX (B6 신규)

### Attempt 삭제

**진입점:** Attempt 카드의 overflow 메뉴 (⋮) → "삭제" 항목 탭.

**흐름:**
1. Confirmation dialog 표시 — `role="alertdialog"`.
   - 헤드라인: "시도 기록을 삭제하시겠어요?" `{typography.body-strong}` 17px/600.
   - 보조 텍스트: "삭제된 기록은 30일 동안 휴지통에 보관됩니다." `{typography.body}` 17px/400.
   - "취소" `{component.button-secondary-pill}` (초기 포커스) + "삭제" `{component.button-primary}`.
2. "삭제" 확인 → soft delete (deleted_at 기록) → 카드 목록에서 즉시 제거 (낙관적 업데이트).
3. Toast 알림: "시도 기록이 삭제됐습니다. [복구]" (5초 유지, [복구] 탭 → 즉시 복구).

**휴지통 진입점:**
- 메뉴 페이지 또는 메인 화면 overflow 메뉴 → "휴지통" 항목.

**휴지통 화면:**
- Surface: `{colors.canvas}`.
- 삭제된 Attempt 카드 리스트 (tried_at + 영상명 + 삭제일 표시).
- 각 카드에 "복구" `{component.button-secondary-pill}` + "영구 삭제" `{component.button-primary}` (danger variant — 텍스트 `{colors.primary}` 대신 `rgba(220, 38, 38, 1)` 예외 사용).
- 빈 상태: "삭제된 기록이 없어요" Empty 컴포넌트.

### Video 숨김 토글

**진입점:** 영상 카드 또는 영상 상세의 overflow 메뉴 → "이 영상 숨기기".

**동작:**
- `is_hidden = true` → 해당 카드 즉시 비노출 (검색 결과 + 메뉴 페이지).
- 낙관적 업데이트. 오류 시 롤백.

**숨긴 영상 복구 진입점:**
- 메뉴 페이지 overflow 메뉴 → "숨긴 영상 보기" → is_hidden=true 영상 목록 표시.
- 각 항목에 `aria-pressed="true"` 토글 버튼 "숨김 해제" → `is_hidden = false`.

### Dish 삭제

**연결된 Video 없는 Dish:**
- Confirmation dialog → 즉시 hard delete.
- dialog 헤드라인: "이 메뉴를 삭제하시겠어요?" `role="alertdialog"`.

**연결된 Video 있는 Dish:**
- 삭제 버튼 비활성 (disabled) 또는 클릭 시 안내 dialog.
- 안내 dialog: "영상이 연결된 메뉴는 삭제할 수 없어요. 먼저 영상을 정리해주세요." + "확인" 단일 버튼.

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

| 항목 | 예외 내용 | 사유 |
|------|----------|------|
| "영구 삭제" 버튼 컬러 | `rgba(220,38,38,1)` danger 컬러 사용 (단일 accent 원칙 예외) | Destructive action 의미 전달 필수. 텍스트 한정 사용, 별도 배경 없음. D2 WARN 조건부 통과. |
| Combobox/Autocomplete | Apple 디자인 시스템 직접 명세 없어 자체 구현 | MVP 자동완성(§4.1) 구현에 불가피. a11y 명세(WCAG keyboard nav, aria roles) 완비. RM7 리스크 유지. |

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
| 2026-05-03 | design-dialogue rewind (PRD v0.4 후속) | 사용자 명시 요청 — rewind_count 증가 없음. B7-A 메인 화면 신규(화면 인벤토리 4→5), B1 자동완성 dropdown UX 명세, B5β Step 입력 UX(반응형 분기+IFrame 연동+timestamp capture), B2 영상 삭제 엣지 시각 처리(opacity 30%+grayscale+배지, thumbs down과 구분), B6 삭제 UX 전체(Attempt soft delete+휴지통, Video 숨김 토글, Dish 삭제 정책), VQ 전면 갱신(VQ1 5개 화면 일관성, VQ3 신규 마이크로 인터랙션, VQ4 신규 치수), 컴포넌트 목록에 Combobox/Autocomplete 추가, 접근성 계획 확장(keyboard navigation, aria-expanded, aria-activedescendant, aria-pressed, alertdialog). D1-D4 재검증 통과. |
| 2026-05-08 | ALIGN 6차 rewind | thumbs 토글 동작에 PATCH `/api/videos/{id}/thumbs` 실호출 + 낙관적 업데이트 이행 명시 (L48). 메인 화면·메뉴 페이지 영상 카드 링크에 `?dish_id=&video_id=` URL 파라미터 전달 명시 (L47). |
