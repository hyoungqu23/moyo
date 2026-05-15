# Design Decision — nayo (나만의요리사)

> 버전: 2.0.1
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-15 (L65 — 휴지통 §영구 삭제 2단계 확인 다이얼로그 UX 추가)
> 페이즈: DESIGN
> 기반: PRD v0.5 + design-notes-from-discover.md + design-system.md + design-dialogue 합의

---

## 참조 문서

- `docs/nayo/prd.md` — 데이터 모델 · 기능 요구사항 v0.5 (UI 묘사 없음)
- `docs/nayo/design-notes-from-discover.md` — DISCOVER 중 수집된 UI 노트
- `docs/nayo/design-system.md` — nayo 적용 Apple Web Design System 명세

---

## 디자인 시스템 선언

**Apple Web Design System 차용**. 별도 명세 `docs/nayo/design-system.md` 참조.

**핵심 원칙:**
- Photography-first: 유튜브 영상 썸네일 / 레시피 사진이 product render 자리를 대체. UI는 받침대.
- Single accent: `{colors.primary}` (#0066cc) Action Blue 하나. 두 번째 브랜드 컬러 없음.
- Low density: 콘텐츠와 여백이 경쟁하지 않음. 각 섹션은 명확한 하나의 목적만 가짐.
- Tile rhythm: light/parchment ↔ dark tile 교차. 색 변화 자체가 divider 역할.
- 단일 product-shadow: `rgba(0, 0, 0, 0.22) 3px 5px 30px` — 썸네일/영상에만 적용, 카드·버튼·텍스트에는 적용 안 함.
- **H6 가설 핵심 설계 원칙**: RecipeCustomization 한 손 조작 UX가 요리 중에도 가능한지 검증하는 것이 이번 사이클 디자인의 가장 큰 검증 가설(H6, P7 해소). 모든 RecipeCustomizationSheet 인터랙션 결정은 이 가설을 우선 기준으로 삼는다.

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
- 메뉴 페이지: `{typography.display-lg}` 40px/600 Dish명 헤더.
- Recipe 상세: `{typography.display-md}` 34px/600 Recipe title 헤더.
- Ingestion 진입/검수: `{typography.tagline}` 21px/600 단계 헤더.

### 브레드크럼

- 없음 (단순 SPA 구조, 네비게이션은 global-nav로 처리).
- Recipe 상세 화면에서 Dish 상위 명칭은 `{typography.caption}` 14px/400 `{colors.ink-muted-48}` 보조 텍스트로 표시 (링크 아님).

### SubTabs

- 없음 (명시적 탭 분류 불필요 — 섹션 구분은 surface 교차로 처리).
- 메뉴 페이지: "내 레시피" 영역 / "참고한 소스" 영역은 surface 교차(parchment ↔ light)로 구분.

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

- 터치 타겟 최소 44×44px. RecipeCustomizationSheet AmountStepper는 최소 56×56px (요리 중 조작 요건).

---

## 화면 인벤토리 (7개 화면)

### 0. 홈 화면 v2 (대규모 재설계)

**Surface:** `{colors.canvas-parchment}` 기본. 섹션 교차 시 `{colors.canvas}` white.

**구성:**

- **상단 검색바**: `{component.search-input}` (`{rounded.pill}`, 44px height, 검색 글리프 leading). 자동완성 dropdown 연결 (아래 "자동완성 dropdown UX" 참조).

- **1순위 영역 — 쿨타임 "안 먹은 지 N일"** (P2 회상 비용 직접 해소, H3·H7 핵심):
  - 섹션 헤더: "다시 만들어볼까요?" `{typography.tagline}` 21px/600.
  - **노출 개수 결정: 3개 고정** (기본), "더보기" 인라인 확장으로 최대 7개.
    - 선정 근거: 격주 요리 빈도에서 "지금 뭐 해먹을까" 의사결정 해소에 3개가 최적. 7개 초과 시 선택 피로 유발. H3 가설 검증 최소 노출수.
    - 페이지네이션 없음 — 7개 초과 시 "더보기" 인라인 확장, 그 이상은 별도 검색으로 유도.
  - **CooldownCard** 컴포넌트: `{component.store-utility-card}` 기반 변형.
    - 상단: Recipe thumbnail (source 중 첫 번째 RecipeSource.thumbnail_url, 없으면 placeholder). 16:9. `{rounded.sm}` 8px.
    - "안 먹은 지 **N일**" — N을 `{typography.body-strong}` 17px/600 `{colors.primary}`으로 강조. 나머지 텍스트 `{typography.body}` 17px/400.
    - Recipe title `{typography.body-strong}` 17px/600.
    - 마지막 평점 StarRating (별 아이콘 + average_rating 소수점 1자리). 없으면 "아직 평점 없음" `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.
    - 마지막 improvement_note 미리보기 최대 1줄 (있는 경우만) `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.
    - "다시 만들기" → Recipe 상세 화면 이동. `{component.button-secondary-pill}` 44px height.
  - Attempt 없는 Recipe (아직 시도 안 함): "아직 시도 안 함" `{typography.caption}` 뱃지 표시 + days_since_last_tried 대신 created_at 기준 날짜.
  - "더보기" 인라인 확장: `{component.button-secondary-pill}` "더보기" → 카드 4~7번째 인라인 확장.

- **2순위 영역 — 최근 만든 레시피** (`{colors.canvas}` white surface):
  - 섹션 헤더: "최근에 만든 레시피" `{typography.tagline}` 21px/600.
  - 최대 5개. Attempt JOIN Recipe ORDER BY tried_at DESC LIMIT 5.
  - RecipeCard 변형: title + last_tried_at + 마지막 improvement_note 1줄 미리보기.
  - 카드 탭 → Recipe 상세 화면.

- **3순위 영역 — 자주 만든 메뉴** (`{colors.canvas-parchment}` surface):
  - 섹션 헤더: "자주 만드는 메뉴" `{typography.tagline}` 21px/600.
  - Top 3 Dish 칩: `{component.configurator-option-chip}` 변형 (`{rounded.pill}`, padding 12px × 16px). 칩에 Dish.name + attempt_count 표시.
  - 칩 탭 → 해당 메뉴 페이지 이동.

- **보조 영역 — 날씨 카피** (세 섹션 하단, `{colors.canvas-parchment}`):
  - 날씨 카피 텍스트만. `{typography.body}` 17px/400 `{colors.ink-muted-48}`.
  - 예시: "오늘은 비가 오네요. 따뜻한 국물 어때요?" — API 실연동 OOS, 카피만.

- **신규 사용자 (Attempt 0, Recipe 0):**
  - 모든 섹션 대신 단일 EmptyState.
  - 헤드라인: "첫 레시피를 저장해볼까요?" `{typography.tagline}` 21px/600.
  - 보조: "유튜브 URL이나 레시피 텍스트를 붙여넣으면 시작할 수 있어요." `{typography.body}` 17px/400.
  - CTA: `{component.button-primary}` "레시피 가져오기" → Ingestion 화면.

- **신규 사용자 (Recipe 있으나 Attempt 0):**
  - 쿨타임 영역: Recipe는 표시(created_at 기준), "아직 시도 안 함" 뱃지.
  - 최근 만든 레시피 / 자주 만든 메뉴 영역: EmptyState (각각) 표시.

**Apple 토큰 매핑 (홈 화면):**
- 1순위 surface: `{colors.canvas-parchment}`
- 2순위 surface: `{colors.canvas}` white
- 3순위 surface: `{colors.canvas-parchment}`

---

### 1. 검색 화면 (Dish·Recipe 검색)

**Surface:** `{colors.canvas}` white 위주, 섹션 구분 시 `{colors.canvas-parchment}` 교차.

**구성:**
- 상단: `{component.sub-nav-frosted}` — frosted glass sticky.
- `{component.search-input}` — `{rounded.pill}`, 17px, 44px height, 검색 글리프 leading.
  - 사용자가 Dish명 또는 Recipe명 입력 → 검색 트리거.
  - 입력 중 자동완성 dropdown 표시 (아래 "자동완성 dropdown UX" 참조).

- **우선 노출 영역** (average_rating ≥ 4.0 또는 attempt_count ≥ 2인 Recipe가 1개 이상 존재 시에만 표시):
  - 헤더: "높은 평점 레시피" `{typography.tagline}` 21px/600.
  - Recipe 카드 최대 3개 (average_rating 내림차순).
  - `{component.button-secondary-pill}` "더보기" → **인라인 확장** (그 자리에서 아래로 펼쳐짐).
  - 조건 미충족: 이 섹션 전체 미표시.

- **divider**: `{colors.canvas}` → `{colors.canvas-parchment}` surface 교차.

- **일반 노출 영역** (`{colors.canvas-parchment}`):
  - 헤더: "전체 레시피" `{typography.tagline}` 21px/600.
  - created_at 내림차순 Recipe 카드 리스트.
  - archived Recipe는 미표시.

**RecipeCard 구성:**
- 배경: `{colors.canvas}` white, border: 1px solid `{colors.hairline}`, border-radius: `{rounded.lg}` 18px, padding: `{spacing.lg}` 24px.
- 썸네일 (RecipeSource 첫 번째 thumbnail_url 또는 placeholder). 16:9, `{rounded.sm}` 8px, product-shadow 적용.
- Recipe title `{typography.body-strong}` 17px/600.
- Dish name `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.
- average_rating (StarRating) + attempt_count + last_tried_at.
- **SourceBadge**: RecipeSource.type 라벨. "YouTube에서 가져온 레시피" / "블로그에서 가져온 레시피" / "텍스트로 저장한 레시피" — `{typography.caption}` 14px/400, `{colors.ink-muted-48}`, 썸네일 우하단 오버레이.

---

### 2. 메뉴 페이지 (Dish 단위 통합 뷰 — 재구성)

**Surface:** light `{colors.canvas}` ↔ parchment `{colors.canvas-parchment}` 교차.

**구성:**
1. **헤더** (`{colors.canvas}` light surface):
   - Dish명 `{typography.display-lg}` 40px/600.
   - "레시피 N개 · 총 M번 시도 · 마지막 시도: YYYY-MM-DD" `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.

2. **"내 레시피" 영역** (`{colors.canvas-parchment}` surface):
   - 섹션 헤더: "내 레시피" `{typography.tagline}` 21px/600.
   - Recipe 카드 목록 (average_rating · attempt_count · last_tried_at 표시).
   - archived Recipe: 기본 미노출. "숨긴 레시피 보기" 버튼(overflow 메뉴 내) → archived Recipe 목록 별도 표시 (opacity 60%, "보관됨" 뱃지).
   - 레시피 없음: EmptyState "아직 레시피가 없어요. 레시피를 가져와볼까요?" + "레시피 가져오기" CTA.

3. **divider**: parchment → light surface 교차.

4. **"참고한 소스" 영역** (`{colors.canvas}` light surface):
   - 섹션 헤더: "참고한 소스" `{typography.tagline}` 21px/600.
   - 각 Recipe의 RecipeSource 통합 목록.
   - **SourceCard** 컴포넌트: thumbnail (있으면 작게) + type 라벨(YouTube / 블로그 / 텍스트) + title + channel (youtube만) + url 축약 표시.
   - is_unavailable_on_source = true: opacity 60% + "접근 불가" 뱃지 (`{typography.caption-strong}` 14px/600, 배경 `rgba(0,0,0,0.6)`, 텍스트 white) + `aria-label="접근 불가 소스: {title}"`.
   - SourceCard 탭 → 외부 URL 열기 (is_unavailable_on_source = true이면 탭 불가, 뱃지 표시만).
   - 소스 없음: EmptyState "연결된 소스가 없어요".

---

### 3. Recipe 상세 / 편집 화면 (v0.5 핵심 신규)

**Surface:** `{colors.canvas}` → `{colors.canvas-parchment}` 섹션 교차.

**구성:**

1. **헤더 영역** (`{colors.canvas}` light):
   - Dish명 `{typography.caption}` 14px/400 `{colors.ink-muted-48}` (링크 아님).
   - Recipe title: `{typography.display-md}` 34px/600. 인라인 편집 탭 → textarea 전환.
   - servings: `{typography.body}` 17px/400. 인라인 편집.
   - description (있는 경우): 300자 노출 → `{component.button-secondary-pill}` "더보기" → 인라인 전체 확장. 인라인 편집 가능.
   - **파생 지표**: average_rating (StarRating) · attempt_count · last_tried_at. `{typography.caption}` 14px/400.
   - CTA 영역:
     - `{component.button-primary}` "조정하기" → RecipeCustomizationSheet 진입 (주 행동 — 요리 중 실시간 조정).
     - `{component.button-secondary-pill}` "기록하기" → Attempt BottomSheet/Dialog 진입 (보조 행동 — 사후 기록).

2. **재료 목록** (`{colors.canvas-parchment}` surface):
   - 섹션 헤더: "재료" `{typography.tagline}` 21px/600.
   - **IngredientRow** 컴포넌트 목록:
     - name `{typography.body}` 17px/400 + amount `{typography.body-strong}` 17px/600.
     - optional=true: "(선택)" 텍스트 `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.
     - drag handle 아이콘(reorder) + 편집/삭제 overflow.
   - "재료 추가" `{component.button-secondary-pill}` 44px height.
   - 재료 없음: "재료를 추가해보세요" `{typography.body}` 17px/400 `{colors.ink-muted-48}`.

3. **단계 목록** (`{colors.canvas}` light):
   - 섹션 헤더: "만드는 법" `{typography.tagline}` 21px/600.
   - **StepRow** 컴포넌트 목록:
     - 단계 번호 `{typography.tagline}` 21px/600 `{colors.primary}`.
     - instruction `{typography.body}` 17px/400. 인라인 편집.
     - timer_seconds (있는 경우): 시간 아이콘 + mm:ss 표시. `{typography.caption}` 14px/400.
     - note (있는 경우): 연한 배경 박스, `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.
     - drag handle + overflow.
   - "단계 추가" `{component.button-secondary-pill}` 44px height.

4. **Attempt 이력 영역** (`{colors.canvas-parchment}` surface):
   - 섹션 헤더: "내 시도 기록" `{typography.tagline}` 21px/600.
   - Attempt 카드 최근순. 각 카드: tried_at + rating + improvement_note 미리보기.
   - 없음: EmptyState "아직 시도 기록이 없어요" + "기록하기" CTA.

5. **Source 영역** (`{colors.canvas}` light):
   - 섹션 헤더: "참고한 소스" `{typography.tagline}` 21px/600.
   - SourceCard 목록 (메뉴 페이지와 동일 컴포넌트).

**편집 모드 전환:**
- 편집 가능한 필드(title, servings, description, IngredientRow, StepRow)는 탭 시 인라인 편집 전환.
- 수정 완료: "저장" `{component.button-primary}` 또는 자동 저장 (debounce 500ms).

---

### 4. RecipeCustomization 조정 UX (OQ8 결정 — H6 핵심 가설)

**[OQ8 결정 — L1 추천: 옵션 B 채택]**

**선택: 옵션 B — 별도 "조정하기" RecipeCustomizationSheet (BottomSheet/Dialog)**

**옵션 B 선택 근거:**
- 요리 중 시나리오(손이 더럽고 한 손으로 조작): 카드가 분산된 인라인 ± (옵션 A)는 스크롤 + 여러 위치 탭을 요구. 단일 Sheet에서 큰 버튼으로 모든 조정을 처리하는 것이 인지 부하가 낮음.
- 큰 터치 타겟(56×56px) 배치가 Sheet 레이아웃에서 자연스럽게 가능. 인라인 카드에서는 레이아웃 제약으로 56px 타겟 확보가 어려움.
- H6 가설 검증 후 옵션 A 전환 가능 (RM11 트리거 시).

**RecipeCustomizationSheet 명세:**

**진입:** Recipe 상세 화면 헤더의 "조정하기" `{component.button-primary}`.

**반응형 분기:**
- ≤833px (모바일): **BottomSheet** — 하단에서 올라오는 패널, 스와이프 다운 또는 backdrop 탭으로 닫힘.
- ≥834px (데스크톱): **Dialog** (centered modal) — focus trap, ESC 닫기, body scroll lock, backdrop 클릭 닫기.

**Sheet 내부 구성:**
- 헤더: "레시피 조정하기" `{typography.tagline}` 21px/600 + 닫기 버튼 `{component.button-icon-circular}` 44×44px.
- **재료 조정 섹션** (diff_type = amount_adjust, swap):
  - 각 RecipeIngredient 행: **AmountStepper** 컴포넌트.
    - 재료명 `{typography.body}` 17px/400.
    - 현재 amount `{typography.body-strong}` 17px/600 `{colors.primary}`.
    - **`[–]` [현재값] `[+]`** 버튼 레이아웃:
      - `[–]` / `[+]` 버튼: **56×56px** 터치 타겟 (요리 중 조작 요건 충족). 배경 `{colors.canvas-parchment}`, border `{colors.hairline}`, `{rounded.md}` 11px.
      - 현재값 표시: 64px 너비, 중앙 정렬, `{typography.body-strong}` 17px/600.
      - ± 1회 탭 시: amount 값 ± 조작 단위(RecipeIngredient.unit 기반 — g: ±10, 큰술: ±0.5, 개: ±1, 기타: ±1). diff_payload에 {"from": "원래값", "to": "조정값"} 기록.
      - 햅틱 피드백 (모바일): `navigator.vibrate(10)` (짧은 진동).
    - amount를 자유 텍스트로 직접 입력하려면 현재값 탭 → 인라인 text input 전환.
  - diff_type = swap (다음 사이클 구현, 이번 사이클 스키마만): 재료명 우측 "대체" 버튼 → Combobox 진입. 현재 그레이아웃 + "다음 버전에서 지원" 툴팁.

- **단계 메모 섹션** (diff_type = step_note, skip):
  - 각 RecipeStep 행:
    - 단계 번호 + instruction 첫 40자 요약.
    - "메모 추가" `{component.button-secondary-pill}` 44px → 탭 시 해당 단계 textarea 인라인 확장. 메모 입력 후 "저장" 탭 → diff_payload {"note": "…"}로 저장.
    - 기존 메모 있음: 메모 텍스트 표시 + "수정" / "삭제" overflow.
    - diff_type = skip (다음 사이클): "스킵" 토글. 현재 그레이아웃.

- **저장 CTA**: `{component.button-primary}` "조정 저장" — 하단 고정. 변경사항 없으면 비활성(disabled). 탭 시 Toast "조정이 저장됐습니다." 5초.

**Customization vs Attempt 구분 안내** (Sheet 내 보조 텍스트):
- "조정은 이 레시피에 영구 반영됩니다. 특정 날의 시도 기록은 '기록하기'를 사용하세요." `{typography.caption}` 14px/400 `{colors.ink-muted-48}`.

---

### 5. Ingestion 진입 / 검수 화면 (v0.5 핵심 신규)

#### 5-A. 입력 화면

**Surface:** `{colors.canvas}` light.

**진입점:** 홈 화면 EmptyState CTA / 검색 화면 상단 "새 레시피 가져오기" 버튼 / global-nav 메뉴.

**구성:**
- 헤더: "레시피 가져오기" `{typography.display-md}` 34px/600.
- Dish 연결 선택: "어떤 메뉴의 레시피인가요?" + Combobox (기존 Dish 자동완성 + "새 메뉴 만들기" 옵션).
- **입력 채널 ToggleGroup** (3개 탭):
  - "YouTube URL" / "블로그 URL" / "텍스트 붙여넣기"
  - `{component.configurator-option-chip}` 변형, ToggleGroup, `{rounded.pill}`.
- **URL 입력** (YouTube / 블로그 채널 선택 시):
  - `{component.search-input}` `{rounded.pill}` 44px height. placeholder "URL을 붙여넣어 주세요".
  - 붙여넣기 후 자동 채널 감지 (YouTube 도메인이면 youtube 채널로 자동 전환).
- **텍스트 붙여넣기** (텍스트 채널 선택 시):
  - textarea, 5줄 기본, auto-expand. placeholder "레시피 텍스트를 붙여넣어 주세요".
- `{component.button-primary}` "분석 시작" → 5-B 처리 중 화면.

#### 5-B. 처리 중 화면

**Surface:** `{colors.canvas}` light.

- 인디케이터: Skeleton 애니메이션 (3-10초 예상).
- 텍스트: "레시피를 분석하고 있어요..." `{typography.tagline}` 21px/600, 중앙 정렬.
- 보조: "잠깐이면 돼요." `{typography.body}` 17px/400 `{colors.ink-muted-48}`.
- 타임아웃(10초 초과) 시 Error 상태: "분석에 시간이 걸리고 있어요." + "텍스트로 직접 붙여넣기" CTA + "재시도" CTA.

#### 5-C. Draft 검수 화면

**Surface:** `{colors.canvas}` light + `{colors.canvas-parchment}` 섹션 교차.

**구성:**
- 헤더: "레시피를 확인해주세요" `{typography.display-md}` 34px/600.
- 보조: "내용을 수정한 뒤 저장하면 레시피가 만들어져요." `{typography.body}` 17px/400.

- **ConfidenceField** 컴포넌트 (신뢰도 낮은 필드에 적용):
  - 신뢰도 낮음: 노란 `border 2px solid #f59e0b` + 경고 아이콘 + "확인이 필요해요" 툴팁.
  - 신뢰도 보통: hairline border (기본).
  - 신뢰도 높음: 초록 `border 1px solid #16a34a` (subtle).
  - `aria-describedby="confidence-hint-{id}"` 로 각 필드에 신뢰도 안내 연결.

- **Draft 필드:**
  - Recipe title 인라인 편집 (ConfidenceField 적용).
  - servings 인라인 편집.
  - description textarea (있는 경우).

- **재료 초안 목록** (`{colors.canvas-parchment}`):
  - IngredientRow 편집 가능 버전 (add/edit/delete/reorder).
  - ConfidenceField 적용: 신뢰도 낮은 재료 행에 노란 테두리.

- **단계 초안 목록** (`{colors.canvas}` light):
  - StepRow 편집 가능 버전.
  - ConfidenceField 적용.

- **저장 CTA**: `{component.button-primary}` "레시피 저장" → Recipe + RecipeIngredient[] + RecipeStep[] + RecipeSource 생성 → Recipe 상세 화면 이동.
- **취소**: `{component.button-secondary-pill}` "처음으로" → 5-A 복귀.
- **실패 폴백 (파싱 완전 실패)**: "레시피를 자동으로 가져오지 못했어요. 텍스트를 직접 붙여넣어 주세요." EmptyState + 텍스트 입력으로 전환 CTA.

---

### 6. 시도 기록(Attempt) BottomSheet/Dialog (재구성 — recipe_id 기준)

**트리거:** Recipe 상세 화면 헤더의 "기록하기" `{component.button-primary}`.

**기본 입력 필드:**
| 필드 | 타입 | 제약 | 기본값 |
|------|------|------|--------|
| rating | StarRating | 0~5, 0.5 단위 | — |
| changes | textarea | nullable | — |
| improvement_note | textarea | nullable | — |
| tried_at | date picker | not null | today |

**단계별 메모 (선택):**
- "단계별 메모 추가 (선택)" 접기/펼치기 섹션.
- 해당 Recipe의 RecipeStep 목록을 참조해 단계 목록 표시.
- 각 단계 옆 textarea → 메모 입력 시 RecipeCustomization(diff_type=step_note)으로 기록 (tech-decision v3.0에서 최종 스키마 결정 예정, DESIGN은 UX만 명세).

**저장:** `{component.button-primary}` "저장".

**반응형 분기 (컨테이너):**
- **≤833px (모바일)**: **BottomSheet** — 하단에서 올라오는 패널, 스와이프 다운 또는 backdrop 탭으로 닫힘.
- **≥834px (데스크톱)**: **Dialog** (centered modal) — focus trap, ESC 닫기, body scroll lock, backdrop 클릭 닫기.

---

### 7. 휴지통 (/trash)

**Surface:** `{colors.canvas}`.

**구성:**
- Attempt 휴지통: 삭제된 Attempt 카드 리스트 (tried_at + Recipe title + 삭제일).
  - 각 카드: "복구" `{component.button-secondary-pill}` + "영구 삭제" `{component.button-primary}` danger variant.
- **Recipe 보관함 영역** (archived Recipe):
  - 섹션 헤더: "보관된 레시피" `{typography.tagline}` 21px/600 — "30일 후 자동 삭제" 메타 텍스트 병기.
  - archived Recipe 카드 (title + Dish명 + attempt_count + "n일 후 자동 삭제" 카운트다운).
  - "보관 해제" `{component.button-secondary-pill}` → `archived_at = null` 복원.
  - **"영구 삭제" 버튼 (L65, 2026-05-15 신규)** — danger 텍스트 색상 `rgb(220, 38, 38)`.

**영구 삭제 2단계 확인 다이얼로그 (L65, OQ10 옵션 A):**

archived Recipe 카드의 "영구 삭제" 버튼 → 2단계 확인 다이얼로그 진입.

- **1단계 Dialog:**
  - 제목: "이 레시피를 영구 삭제할까요?"
  - 본문: "시도 기록 N건 · 단계 메모 M건 · 조정 이력 K건이 함께 영구 삭제됩니다. 복구할 수 없어요."
  - CTA: `[취소]` (secondary-pill) / `[다음 단계]` (primary, danger 텍스트)
  - 접근성: `role="dialog"` + `aria-modal="true"` + focus trap. Escape 키 = 취소.
- **2단계 Dialog (최종 확인):**
  - 제목: "정말 영구 삭제할까요?"
  - 본문: "이 작업은 되돌릴 수 없습니다."
  - CTA: `[취소]` (secondary-pill, 기본 포커스 — 실수 방어) / `[영구 삭제]` (primary, danger 텍스트)
  - 사용자가 두 번 모두 명시 확인 시에만 DELETE 요청 (`?force=true`) 발송.
- **로딩 상태:** 영구 삭제 요청 중 다이얼로그는 닫지 않고 CTA disabled + Spinner. 응답 200 후 Toast "레시피가 영구 삭제되었어요" + 휴지통 카드 사라짐.
- **에러 상태:** 422 NOT_ARCHIVED 응답 시 Toast 에러 + 다이얼로그 닫음.

**Cron 자동 hard delete:** archived 30일 경과 시 동일 경로(`attempts` CASCADE 포함)로 자동 영구 삭제. 사용자 알림 없이 백그라운드 처리.

- 빈 상태: "삭제된 기록이 없어요" EmptyState.

---

## 자동완성 dropdown UX

Apple 패턴에 직접 명세 없음 → 자체 정의 컴포넌트 (Combobox).

**트리거 조건:** `{component.search-input}`에 1자 이상 입력 시 기존 저장된 Dish 이름 또는 Recipe title 중 LIKE 매칭 항목이 1개 이상일 때 dropdown 표시.

**스타일 명세:**
- 위치: search-input 바로 아래, 입력란과 좌우 폭 동일.
- 배경: `{colors.canvas}` white.
- 테두리: 1px hairline, `{colors.hairline}` #e0e0e0.
- border-radius: `{rounded.lg}` 18px.
- shadow: 없음 (Apple 원칙).
- 최대 노출 항목: 5개 (이하 스크롤 없이 표시, 초과 시 내부 스크롤).

**각 항목 구성:**
- 좌측: Dish 아이콘(16×16px) 또는 Recipe 아이콘 (구분용).
- 우측: Dish명 또는 Recipe title.
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
- search-input: `role="combobox"`, `aria-expanded="true/false"`, `aria-controls={listbox id}`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-activedescendant={활성 항목 id}`.
- dropdown 컨테이너: `role="listbox"`.
- 각 항목: `role="option"`, `id={고유 id}`, `aria-selected="true/false"`.

---

## 컴포넌트 목록

### Apple 디자인 시스템 기반 컴포넌트

| Apple 컴포넌트 | nayo 사용처 | variant | 근거 |
|---|---|---|---|
| `{component.global-nav}` | 상단 네비게이션 (홈/검색/메뉴 보관함) | 기본 | 전역 네비게이션 표준 |
| `{component.sub-nav-frosted}` | 검색 화면 카테고리 헤더 | frosted glass sticky | 스크롤 중 컨텍스트 유지 |
| `{component.button-primary}` | 모든 주요 액션 (저장, 기록하기, 조정하기, 분석 시작 등) | pill, 44px height | single accent 원칙 |
| `{component.button-secondary-pill}` | 보조 액션 (더보기, 취소, 복구, 메모 추가 등) | ghost pill | 주요 액션과 시각적 계층 분리 |
| `{component.search-input}` | 메뉴명·레시피명 검색 입력, URL 입력 | pill, 44px height | Apple 검색 표준 |
| `{component.store-utility-card}` (변형) | RecipeCard, CooldownCard | white bg, hairline border, rounded.lg | photography-first + 본인 기록 포함 |
| `{component.product-tile-light}` | 검색 결과/홈 light 섹션 | canvas white | light/dark 교차 리듬 |
| `{component.product-tile-parchment}` | 재료/메뉴 페이지 parchment 섹션 | canvas-parchment | surface 교차 divider |
| `{component.button-icon-circular}` | Sheet 닫기, 외부 URL 열기 | 44×44px, translucent chip | 사진 위 플로팅 컨트롤 |
| `{component.configurator-option-chip}` (변형) | 홈 화면 Dish 칩, Ingestion 채널 ToggleGroup | `{rounded.pill}`, 12×16px padding | Apple 칩 패턴 |

### 자체 구현 컴포넌트 (신규 v2.0)

| 컴포넌트 | 사용처 | 근거 | 접근성 |
|---|---|---|---|
| `Combobox` | 자동완성 dropdown, Ingestion Dish 연결 선택, 재료 swap | Apple 패턴 직접 명세 없음 → 자체 정의 | role=combobox, aria-expanded, aria-activedescendant 완비 |
| `BottomSheet` | 모바일(≤833px) Attempt 기록, RecipeCustomizationSheet | 라이브러리 금지 정책(Vaul 폐기) → 자체 구현 | focus trap, ESC 닫기, body scroll lock |
| `Dialog` | 데스크톱(≥834px) Attempt 기록, RecipeCustomizationSheet | Radix Dialog 금지 → 자체 구현 | focus trap, ESC 닫기, backdrop 클릭, aria-modal |
| `StarRating` | Attempt 평점 입력, Recipe 카드 평점 표시 | Apple 패턴 없음 → 자체 구현 | role=radiogroup, 각 별 role=radio + aria-label |
| `ToggleGroup` | Ingestion 채널 선택 | Apple 패턴 없음 → 자체 구현 | role=group, 각 버튼 aria-pressed |
| `IngredientRow` | Recipe 상세 재료 목록, Draft 검수 | v0.5 신규 엔티티 전용 구조 | drag handle aria-roledescription="재료" |
| `StepRow` | Recipe 상세 단계 목록, Draft 검수 | v0.5 신규 엔티티 전용 구조 | drag handle aria-roledescription="단계" |
| `AmountStepper` | RecipeCustomizationSheet 수치 ± 조정 | 56×56px 터치 타겟 요건 필수 | role="spinbutton", aria-valuenow/min/max, ArrowUp/Down 키 조작 |
| `ConfidenceField` | Ingestion Draft 검수 신뢰도 표시 | 신규 UX 패턴 — 자체 정의 | aria-describedby로 신뢰도 안내 연결 |
| `SourceBadge` | RecipeCard 썸네일 오버레이 출처 라벨 | SourceCard의 경량 변형 | aria-label="출처: {type}" |
| `SourceCard` | 메뉴 페이지/Recipe 상세 소스 목록 | 기존 VideoCard를 Source 추상화로 대체 | is_unavailable 시 aria-label="접근 불가 소스" |
| `CooldownCard` | 홈 화면 1순위 쿨타임 카드 | v0.5 핵심 신규 — CooldownCard 전용 | aria-label="안 먹은 지 {N}일: {Recipe title}" |
| `RecipeCustomizationSheet` | 조정하기 BottomSheet/Dialog | OQ8 결정 — 옵션 B 채택 | focus trap, Sheet 진입 시 첫 AmountStepper로 포커스 |
| `Toast` | 저장 완료, 삭제, 복구 알림 | 기존 유지 | role=status, aria-live=polite |
| `EmptyState` | 모든 빈 상태 | 기존 유지 확장 | role=region, aria-label 각 상황 명시 |
| `DeletedSourceAlert` | is_unavailable_on_source 안내 | 기존 DeletedVideoAlert 일반화 | aria-label="접근 불가 소스: {title}" |

**격하/변경:**
- `VideoCard` → **SourceCard**로 대체. 기존 VideoCard는 제거. SourceCard는 youtube/blog/text/manual 모든 Source.type 표현.
- `StepInputRow` (v1.1) → **StepRow** + **단계별 메모 섹션** (Attempt Sheet 내) 으로 역할 분리.
- `DeletedVideoAlert` → **DeletedSourceAlert**로 일반화 (youtube 한정 → 모든 Source.type).

---

## 색상 토큰 매핑

| UI 요소 | 토큰 | hex |
|---------|------|-----|
| 모든 주요 CTA, 링크, accent 강조 | `{colors.primary}` | #0066cc |
| 키보드 포커스 링 | `{colors.primary-focus}` | #0071e3 |
| dark tile 인라인 링크 | `{colors.primary-on-dark}` | #2997ff |
| 기본 캔버스 | `{colors.canvas}` | #ffffff |
| 교차 섹션 캔버스 | `{colors.canvas-parchment}` | #f5f5f7 |
| 글로벌 nav 배경 | `{colors.surface-black}` | #000000 |
| 모든 본문 텍스트 (light 배경) | `{colors.ink}` | #1d1d1f |
| 보조 텍스트 (light 배경) | `{colors.ink-muted-48}` | #7a7a7a |
| 카드 hairline border | `{colors.hairline}` | #e0e0e0 |
| 섹션 hairline divider | `{colors.hairline}` | #e0e0e0 |
| disabled 텍스트 | `{colors.ink-muted-48}` | #7a7a7a |
| 폼 입력 border | `rgba(0, 0, 0, 0.08)` | — |
| 접근 불가 배지 배경 | `rgba(0, 0, 0, 0.6)` | — (오버레이) |
| 자동완성 dropdown 배경 | `{colors.canvas}` | #ffffff |
| ConfidenceField 낮음 border | `#f59e0b` | — (예외 토큰 — Ingestion 검수 전용) |
| ConfidenceField 높음 border | `#16a34a` | — (예외 토큰 — Ingestion 검수 전용) |
| "영구 삭제" 버튼 텍스트 (예외) | `rgb(220, 38, 38)` | danger — 텍스트 한정 |
| AmountStepper 배경 | `{colors.canvas-parchment}` | #f5f5f7 |
| AmountStepper 현재값 강조 | `{colors.primary}` | #0066cc |

**danger 컬러 사용처 명시:**
- `rgb(220, 38, 38)` — 사용처: **"영구 삭제" 버튼 텍스트만** (휴지통 화면). 이외 모든 곳 사용 금지.
- Recipe archived 전환 버튼은 danger **아님** — 영구 삭제가 아니므로 `{colors.primary}` 또는 secondary-pill.
- Recipe hard delete (Attempt 없을 때)는 Confirmation dialog → "삭제" 버튼 텍스트에 danger 적용 가능.

---

## 상태 정의

### Loading 상태
- RecipeCard / CooldownCard 영역: Skeleton 카드 (동일 크기 회색 플레이스홀더). `{colors.canvas-parchment}` 배경으로 shimmer 효과.
- IngredientRow / StepRow 영역: Skeleton 리스트 아이템.
- description: Skeleton 텍스트 블록 3줄.
- Ingestion 처리 중: 별도 처리 중 화면 (5-B).
- 전역: `{component.global-nav}`는 항상 노출 유지.

### Error 상태
- API 오류: EmptyState + "문제가 생겼어요. 잠시 후 다시 시도해주세요." + "재시도" `{component.button-primary}`.
- Ingestion 실패: 5-C 폴백 안내 ("텍스트로 직접 붙여넣어 주세요") + CTA.
- is_unavailable_on_source = true: 카드 내 DeletedSourceAlert 인라인 표시. 데이터 보존 원칙 — Recipe/Attempt는 정상 표시.

### Empty 상태

모든 빈 상태 컴포넌트 공통 스타일:
- `{colors.canvas-parchment}` 배경.
- `{spacing.section}` 80px vertical padding.
- centered stack: 헤드라인 `{typography.tagline}` 21px/600 + 보조 텍스트 `{typography.body}` 17px/400 + 단일 CTA `{component.button-primary}`.

| 상황 | 헤드라인 | 보조 텍스트 | CTA |
|------|---------|------------|-----|
| 홈 신규 사용자 (Recipe 0) | "첫 레시피를 저장해볼까요?" | "유튜브 URL이나 레시피 텍스트를 붙여넣으면 시작할 수 있어요." | "레시피 가져오기" |
| 검색 결과 0개 | "이 메뉴의 레시피가 아직 없어요" | — | "레시피 가져오기" |
| Recipe 상세 재료 없음 | "재료를 추가해보세요" | — | "재료 추가" (인라인) |
| Recipe 상세 단계 없음 | "단계를 추가해보세요" | — | "단계 추가" (인라인) |
| Recipe 상세 Attempt 없음 | "아직 시도 기록이 없습니다" | "만들어 보세요" | "기록하기" |
| 메뉴 페이지 Recipe 없음 | "아직 레시피가 없어요" | "레시피를 가져와볼까요?" | "레시피 가져오기" |
| 메뉴 페이지 소스 없음 | "연결된 소스가 없어요" | — | — |
| 높은 평점 영역 조건 미충족 | (섹션 자체 미표시) | — | — |
| 쿨타임 영역 (홈, Recipe 있으나 쿨타임 데이터 없음) | (섹션 미표시) | — | — |
| 휴지통 Attempt 없음 | "삭제된 기록이 없어요" | — | — |
| Ingestion 파싱 완전 실패 | "레시피를 자동으로 가져오지 못했어요" | "텍스트를 직접 붙여넣어 주세요" | "텍스트로 입력하기" |

### Disabled 상태
- 비활성 버튼: 텍스트 `{colors.ink-muted-48}` #7a7a7a, 배경 opacity 0.5.
- AmountStepper 최솟값(0) 시: `[–]` 버튼 disabled (`aria-disabled="true"`, opacity 0.5).
- RecipeCustomizationSheet "조정 저장" 버튼: 변경 없으면 disabled.
- diff_type = swap / skip (다음 사이클): 버튼 disabled + "다음 버전에서 지원" Tooltip.
- archived Recipe 카드: opacity 60%.

---

## 접근성 계획

### 아이콘 전용 버튼
- `{component.button-icon-circular}` (Sheet 닫기): `aria-label="닫기"` + Tooltip.
- IngredientRow / StepRow drag handle: `aria-label="순서 변경"` + `aria-roledescription="재정렬 핸들"`.
- IngredientRow / StepRow 삭제 버튼: `aria-label="이 {재료/단계} 삭제"` + Tooltip.
- SourceCard 외부 링크 버튼: `aria-label="외부에서 열기"`.
- Attempt 카드 overflow 메뉴: `aria-label="더 많은 옵션"` + `aria-haspopup="menu"`.
- CooldownCard "다시 만들기": `aria-label="{Recipe title} 다시 만들기"`.

### AmountStepper 접근성
- `role="spinbutton"`, `aria-valuenow={현재값}`, `aria-valuemin={최솟값}`, `aria-valuemax={최댓값}`, `aria-label="{재료명} 수량"`.
- `[–]` 버튼: `aria-label="{재료명} 수량 줄이기"`. `[+]` 버튼: `aria-label="{재료명} 수량 늘리기"`.
- 키보드: ArrowUp → +1 단위, ArrowDown → -1 단위, Home → 최솟값, End → 최댓값.

### ConfidenceField 접근성
- `aria-describedby="confidence-hint-{fieldId}"` 연결.
- 힌트 텍스트: "신뢰도 낮음 — 내용을 확인해주세요" / "신뢰도 높음" (숨겨진 텍스트로 포함).
- 노란 테두리 외에 경고 아이콘(⚠) + 텍스트 병행 — 색상 단독 정보 전달 금지 준수.

### RecipeCustomizationSheet 접근성
- Sheet 진입 시: 첫 번째 AmountStepper로 포커스 이동. focus trap 적용.
- Sheet 닫힘: "조정하기" CTA 버튼으로 포커스 복귀.
- ESC 키: Sheet 즉시 닫기 + 포커스 복귀.

### 포커스 관리
- 포커스 링: 2px solid `{colors.primary-focus}` #0071e3.
- BottomSheet / Dialog 열릴 때: 첫 번째 입력 필드로 포커스 이동. focus trap 적용.
- BottomSheet / Dialog 닫힐 때: 트리거 버튼으로 포커스 복귀.
- ESC 키: BottomSheet / Dialog 닫기.
- Ingestion Draft 검수: 저장 후 Recipe 상세 화면으로 이동 — 헤더 title 필드로 포커스.

### 색상 단독 정보 전달 금지
- ConfidenceField: 노란/초록 테두리 + 아이콘(⚠/✓) + 텍스트 힌트 병행.
- archived Recipe: opacity + "보관됨" 텍스트 뱃지 병행.
- is_unavailable_on_source: opacity + "접근 불가" 텍스트 뱃지 병행.
- AmountStepper 최솟값 disabled: opacity + `aria-disabled` 병행.

### aria 속성 (검색 + 자동완성)
- `{component.search-input}`: `role="combobox"`, `aria-label="레시피 검색"`, `aria-expanded="true/false"`, `aria-controls={listbox id}`, `aria-autocomplete="list"`, `aria-activedescendant={활성 항목 id}`.
- 자동완성 dropdown: `role="listbox"`. 각 항목: `role="option"`, `aria-selected="true/false"`.
- 섹션 구분: `<section aria-labelledby>` 패턴.
- 재료/단계 리스트: `role="list"`, 각 항목 `role="listitem"`.
- Confirmation dialog (삭제): `role="alertdialog"`, `aria-labelledby` 제목, `aria-describedby` 본문.

### 필수 필드
- tried_at: `aria-required="true"`, 레이블에 필수 표시 (시각적 + aria 병행).
- Recipe title (Ingestion Draft): `aria-required="true"`.

---

## 시각 품질 계획 (VQ) — v2.0 전면 갱신

### VQ1 — 인터랙션 상태 (9개 요소 일관성 표)

| 요소 | Hover | Focus | Disabled | Active/Selected |
|------|-------|-------|----------|-----------------|
| `{component.button-primary}` | opacity 80% | 2px solid `{colors.primary-focus}` | opacity 50%, `{colors.ink-muted-48}` 텍스트 | `transform: scale(0.95)` |
| `{component.button-secondary-pill}` | 배경 `rgba(0, 102, 204, 0.08)` | 2px solid `{colors.primary-focus}` | opacity 50% | `transform: scale(0.95)` |
| `RecipeCard` / `CooldownCard` | hairline border 강화 (`rgba(0,0,0,0.16)`) | 2px solid `{colors.primary-focus}` | — | — |
| `IngredientRow` / `StepRow` | 배경 `{colors.canvas-parchment}` | 2px solid `{colors.primary-focus}` 인라인 | — | 편집 중: border 2px solid `{colors.primary}` |
| `AmountStepper [±]` 버튼 | 배경 `rgba(0, 0, 0, 0.06)` | 2px solid `{colors.primary-focus}` | opacity 50%, `aria-disabled="true"` | `transform: scale(0.95)` + 햅틱 피드백 |
| `{component.search-input}` | border 강화 (`rgba(0,0,0,0.16)`) | 2px solid `{colors.primary-focus}` | — | — |
| `Dish 칩` (configurator-option-chip) | border `{colors.primary}` 1px | 2px solid `{colors.primary-focus}` | opacity 50% | border 2px solid `{colors.primary-focus}` |
| 자동완성 dropdown 항목 | 배경 `{colors.canvas-parchment}` | 2px solid `{colors.primary-focus}` 인라인 | — | 배경 `{colors.canvas-parchment}` |
| `ConfidenceField` 입력 | border 강화 (`rgba(0,0,0,0.16)`) | 2px solid `{colors.primary-focus}` | — | 편집 중: border 2px solid `{colors.primary}` |

### VQ2 — 빈/로딩/에러 상태

- **Skeleton**: 카드와 동일 크기. `{colors.canvas-parchment}` 배경, shimmer animation (left-to-right gradient sweep, 1.5s infinite).
- **Empty**: 위 "Empty 상태" 섹션 스펙 그대로. `{component.button-primary}` 단일 CTA.
- **Error**: EmptyState와 동일 컴포넌트 구조. 에러 전용 아이콘(⚠) 추가.
- **Ingestion 처리 중**: Skeleton 애니메이션 전용 화면(5-B). IngredientRow·StepRow 형태의 Skeleton이 순차적으로 나타나는 애니메이션.

### VQ3 — 트랜지션

- BottomSheet: 하단에서 올라오는 슬라이드, `transition: transform 300ms ease-out`.
- Dialog (≥834px): fade + scale (centered modal), `transition: opacity 200ms, transform 200ms ease-out`.
- "더보기" 인라인 확장: `transition: max-height 250ms ease-in-out` + fade-in.
- 자동완성 dropdown 열림/닫힘: `transition: opacity 150ms ease-out, transform 100ms ease-out` (scale 0.98 → 1).
- AmountStepper 값 변경: 숫자 교체 시 `transition: opacity 80ms` (빠른 fade).
- AmountStepper 햅틱: `navigator.vibrate(10)` (10ms 짧은 진동, 모바일만).
- RecipeCustomizationSheet 저장 Toast: fade-in 150ms, 5초 후 fade-out 150ms.
- IngredientRow / StepRow drag reorder: `transition: transform 200ms ease` (드래그 중 다른 행 이동).
- 표준 타이밍: 150-300ms. 500ms 이상 금지.

### VQ4 — 레이아웃

- 페이지 좌우 여백: `{spacing.xl}` 32px (모바일), 더 넓은 뷰포트에서는 64px+.
- 섹션 vertical padding: `{spacing.section}` 80px.
- 카드 padding: `{spacing.lg}` 24px.
- 카드 간격(grid gutter): 20–24px.
- 썸네일: 16:9 비율 유지, lazy-loading 기본.
- 최대 콘텐츠 너비: 1440px (store grid 기준), 텍스트 섹션 980px.
- 홈 Dish 칩 행: flex-wrap, gap `{spacing.xs}` 8px.
- Dialog (≥834px): max-width 640px, centered. 폼 단일 컬럼.
- RecipeCustomizationSheet (≥834px): max-width 560px, centered.
- AmountStepper `[–]` / `[+]`: **56×56px** 터치 타겟. `[현재값]`: 64px 너비.
- IngredientRow / StepRow 행 최소 높이: 56px (터치 타겟 충족).
- ConfidenceField 경고 아이콘: 16×16px, 필드 우측 정렬.

### VQ5 — 포커스 관리

- **BottomSheet 열림**: 첫 번째 폼 필드(rating 선택기 또는 AmountStepper)로 포커스 이동. focus trap (Sheet 외부 포커스 차단).
- **BottomSheet 닫힘**: 트리거 버튼("기록하기" 또는 "조정하기")으로 포커스 복귀.
- **Dialog 열림 (≥834px)**: 첫 번째 폼 필드로 포커스 이동. focus trap. body scroll lock. backdrop 클릭 닫기.
- **Dialog 닫힘**: 트리거 버튼으로 포커스 복귀.
- **ESC 키**: BottomSheet / Dialog 즉시 닫기 + 포커스 복귀.
- **"더보기" 확장**: 포커스 이동 없음 (인라인 확장이므로). 확장된 콘텐츠는 tab 순서에 자연스럽게 포함.
- **자동완성 dropdown 열림**: 포커스는 search-input 유지. `aria-activedescendant`로 시각/aria 포커스만 이동.
- **Ingestion 저장 후**: Recipe 상세 화면으로 이동 — `<h1>` (Recipe title)으로 포커스.
- **Confirmation Dialog (삭제)**: "취소" 버튼으로 초기 포커스. focus trap. ESC = 취소.
- **RecipeCustomizationSheet 열림**: 첫 번째 AmountStepper `[–]` 버튼으로 포커스 이동.

---

## 삭제 UX

### Attempt 삭제
**진입점:** Attempt 카드의 overflow 메뉴(⋮) → "삭제".

**흐름:**
1. Confirmation dialog — `role="alertdialog"`.
   - 헤드라인: "시도 기록을 삭제하시겠어요?"
   - 보조: "삭제된 기록은 30일 동안 휴지통에 보관됩니다."
   - "취소" `{component.button-secondary-pill}` (초기 포커스) + "삭제" `{component.button-primary}`.
2. soft delete → 카드 즉시 제거 (낙관적 업데이트).
3. Toast: "시도 기록이 삭제됐습니다. [복구]" 5초.

### Recipe 삭제 / 보관
- **Attempt 0건 Recipe**: Confirmation dialog → hard delete.
- **Attempt ≥ 1건 Recipe**: 삭제 불가. "이 레시피는 시도 기록이 있어 삭제할 수 없어요. 보관함으로 이동하시겠어요?" → "보관하기" CTA (archived = true 전환). "보관하기" 버튼은 danger **아님** — `{component.button-primary}` 또는 secondary-pill.
- 보관된 Recipe: 메뉴 페이지 + 검색 결과에서 기본 미노출. 휴지통 화면에서 "보관 해제" 가능.

### Recipe 영구 삭제
- Recipe 자체 영구 삭제는 지원하지 않음 (Attempt ≥ 1건). Attempt를 모두 영구 삭제한 후에만 Recipe hard delete 가능 — ENGINEER 페이즈에서 플로우 최종 확정.

### RecipeSource 삭제
- SourceCard overflow → "소스 삭제" → Confirmation → soft delete. 연결된 Recipe/Attempt 보존 안내 포함.

### Dish 삭제
- **연결된 Recipe 없는 Dish**: Confirmation → hard delete.
- **연결된 Recipe 있는 Dish**: 삭제 deny. "레시피가 연결된 메뉴는 삭제할 수 없어요. 먼저 레시피를 정리해주세요." + "확인" 단일 버튼.

---

## PRD 오픈 질문 → DESIGN 결정

| PRD OQ | 결정 내용 |
|--------|---------|
| OQ1: description max length 정책 | **300자 즉시 노출 → "더보기" 토글 → 인라인 전체 확장.** (v1.1에서 유지) |
| OQ8: RecipeCustomization 한 손 조작 디자인 | **옵션 B 채택: 별도 RecipeCustomizationSheet BottomSheet/Dialog.** AmountStepper 56×56px. 재료 ± + 단계 메모 한 Sheet에서 처리. 사유: 요리 중 한 손 조작 시 단일 Sheet + 큰 버튼이 분산된 인라인 ± (옵션 A)보다 인지 부하 낮음. H6 가설 깨질 시 옵션 A 전환 검토 (RM11). |
| 쿨타임 노출 개수 (세션 신호) | **3개 고정, "더보기" → 최대 7개 인라인 확장.** 사유: 격주 요리 빈도에서 "지금 뭐 해먹을까" 해소에 3개 최적. 7개 초과 시 선택 피로. 페이지네이션 없음. |
| Recipe.archived 상태 표현 (세션 신호) | **archived = true: 메뉴 페이지 "숨긴 레시피 보기"에서만 노출(opacity 60% + "보관됨" 뱃지). 휴지통 화면 "보관된 레시피" 섹션에서 "보관 해제" 가능.** 스키마 필드(boolean)는 tech-decision v3.0에서 확정. |

---

## design-notes-from-discover.md 흡수 결과 (v2.0 갱신)

| DISCOVER 노트 | design-decision v2.0 반영 |
|---|---|
| 검색 결과 = 높은 평점 상위 + 더보기 + divider + 전체 | 그대로 채택 (thumbs → average_rating으로 대체). 더보기 = 인라인 확장 유지. |
| 영상 카드에 시도 횟수·마지막 시도일·별점 평균 직접 노출 | RecipeCard + CooldownCard에서 동일 패턴 유지. |
| thumbs down = "흐리게" | v0.5에서 thumbs 폐기. 낮은 평점 Recipe는 후순위 정렬 + 평점 표시로 대체. |
| "더보기" 인터랙션 미정 → 인라인 확장 | 유지. |
| description 노출 위치 미정 | Recipe 상세 헤더 영역에 인라인 300자 + 더보기 토글. |
| 메뉴 페이지 레이아웃 미정 | Dish명 헤더 → "내 레시피" (parchment) → "참고한 소스" (light) 재구성. |
| 시도 기록 입력 폼 미정 | 반응형 분기 유지 (모바일 BottomSheet, 데스크톱 Dialog). recipe_id 기준으로 변경. |

---

## PRD-UI 분리 원칙 (영구 가이드)

PRD(`prd.md`)에는 데이터 구조·로직·제약만 남긴다. UI 묘사·컴포넌트 결정·상태 처리·레이아웃은 모두 본 파일(`design-decision.md`)에 위치한다. PRD로의 UI 역침투 금지.

---

## 시스템 예외

| 항목 | 예외 내용 | 사유 |
|------|----------|------|
| "영구 삭제" 버튼 컬러 | `rgb(220,38,38)` danger 컬러 사용 (단일 accent 원칙 예외) | Destructive action 의미 전달 필수. 텍스트 한정, 배경·border·아이콘 확장 금지. D2 조건부 통과. |
| Combobox | Apple 디자인 시스템 직접 명세 없어 자체 구현 | MVP 자동완성(§4.1) + Ingestion(§4.3) 구현에 불가피. a11y 명세(WCAG keyboard nav, aria roles) 완비. |
| ConfidenceField 신뢰도 색상 | `#f59e0b`(낮음) / `#16a34a`(높음) — Ingestion 검수 전용 예외 토큰 2종 | Ingestion Draft 검수 UX의 신뢰도 시각화에 필수. 텍스트+아이콘 병행으로 색상 단독 전달 금지 준수. 아이콘+텍스트 힌트 병행 필수. |
| AmountStepper 터치 타겟 56×56px | 시스템 최소 44px 초과 | H6(P7 한 손 조작) 가설 검증 요건. 요리 중 조작 시나리오에서 44px는 오조작 리스크. |

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | 디자인 시스템 선택 | Apple Web Design System 차용 (사용자 명시, design-system.md 별도 명세) |
| 2026-05-03 | 반응형 전략 | 모바일 퍼스트, Apple breakpoint, 시도 기록 입력 반응형 분기 |
| 2026-05-03 | "더보기" 인터랙션 | 인라인 확장 |
| 2026-05-03 | description max length | 300자 + "더보기" 토글 → 인라인 전체 확장 |
| 2026-05-03 | 시도 기록 입력 UX | 모바일 BottomSheet / 데스크톱 Dialog (centered modal) |
| 2026-05-03 | design-dialogue rewind (PRD v0.4 후속) | v1.1 — 메인 화면 신규, 자동완성 dropdown, Step 입력 UX, 삭제 UX, VQ 전면 갱신. D1-D4 조건부 PASS. |
| 2026-05-08 | ALIGN 6차 rewind | thumbs PATCH 실호출 + URL 파라미터 (v1.1 최종). |
| 2026-05-14 | v2.0 PIVOT 재작성 | PRD v0.5 Recipe 중심 정체성 전환 후속. 화면 인벤토리 7개 재구성. 신규 컴포넌트 13종 추가. OQ8 결정(옵션 B — RecipeCustomizationSheet). 쿨타임 노출 3개 결정. archived 상태 표현 결정. D1-D4 재검증 PASS. |
