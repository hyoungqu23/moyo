# PRD — nayo (나만의요리사)

> 버전: 0.5.3 (L70 — AttemptStepNote v0.5 IN 부분 복원 반영)
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-15 (L70 — L69 부분 수정. StepNote v0.5 IN. Customization UI·쿨타임 홈은 OOS 유지.)
> 페이즈: DISCOVER · prd-review 완료 (R1~R4 PASS) + office-hours 2차 검토 후속 결정 확정

> 참고 문서 (`docs/nayo/`):
>
> - problem-definition.md — DISCOVER 단계 문제 정의 원본
> - design-decision.md — DESIGN 단계 화면·UX·a11y 결정 (v1.1 — v2.0으로 갱신 예정)
> - design-system.md — Apple Web Design System 차용 명세
> - tech-decision.md — ENGINEER 단계 스택·Drizzle 스키마·API 설계 (v2.1 — v3.0으로 갱신 예정)
> - decision-log.md — 전 페이즈 의사결정 종합 (L1~L55, v1.5 — v2.0으로 갱신 예정)
> - design-notes-from-discover.md — DISCOVER 중 수집된 UI 노트 (참조용)
> - harness-state.md — PM Working Memory
> - improvement-backlog.md — 개선 백로그

---

## 1. 배경 및 문제 정의

### 1.0 문제 발견 내러티브

사용자 본인 발화:

> 내가 유튜브에서 '제육볶음', '부대찌개' 이렇게 메뉴명을 검색해서, 그 요리의 레시피를 확인하고 요리를 만드는데, 이전에 보고 따라했었는데, 맛이 어땠는지 조금 간이 세서 뭘 좀 덜 넣어야 더 좋은 레시피가 된다던지 메모를 남겨두고 싶은데 그렇게 하지 못해서 결국 무슨 영상의 레시피를 확인했고, 내가 따라했었고, 어땠는지 확인할 수 없어서 실패했던 레시피라도 똑같이 따라할 수 밖에 없게 됐어.

**발견 흐름 (5단계)**

1. 사용자는 동일 메뉴를 격주(2주 1회)로 만들며 매번 새로 검색한다. 시도할 때마다 이전 경험을 회상하는 데 시간과 에너지를 소모한다.
2. 어떤 우회 수단도 사용하지 않는다. 메모 앱·유튜브 좋아요·재생목록 중 어느 것도 도입하지 않았다. **현재 우회 수단 = 0** — 이는 사용자가 도구를 적극적으로 시도하지 않은 게 아니라 마땅한 도구가 없어 체념한 상태이며, unmet need가 강한 신호다.
3. 사용자 본인 발화: "검색 실패는 한 번도 없다. 거기 레시피가 얼마나 많은데." — **검색은 문제가 아니다.** 진짜 문제는 결과를 기억할 방법이 없어 실패한 영상을 또 따라가게 되는 것과, 본인이 변형한 이력이 사라지는 것이다.
4. 사용자 자기 귀인: **"내가 멍청한 게 아니라 도구 부재"** — 이 불편함을 시스템 문제로 명확히 인식하고 있다.
5. **"내 레시피북" 페인**: 여러 시도를 통해 "내가 만든 최적 레시피"가 있어야 하는데, 유튜브 영상이나 블로그는 그 출처일 뿐 내 버전이 어디에도 존재하지 않는다. 영상 단위로 기록을 쌓아도 "내 레시피"는 생기지 않는다. 출처를 흡수해 내 버전으로 통합·영구화하는 도구가 없다.

풍부한 콘텐츠 공급(YouTube·블로그·텍스트)에 비해 빈약한 개인 메모리(회상·평가 누적·변형 이력 추적·내 버전 영구화)가 갭의 본질이다.

### 1.1 페르소나

직접 요리하는 단일 사용자(본인). 레시피 출처는 유튜브 영상에서 블로그·텍스트까지 다양하지만, 최종 목표는 출처를 흡수해 자기만의 레시피를 축적하는 것이다.

### 1.2 JTBD (Job To Be Done)

> 유튜브·블로그·텍스트 등 다양한 출처의 레시피를 참조해 요리할 때, 이전 실패 경험과 나만의 변형 이력을 Recipe 단위로 기억하기 위해, 같은 실수를 반복하지 않고 매번 더 나은 내 레시피를 만들고 싶다.

### 1.3 핵심 페인 포인트 (우선순위순)

| 순위 | 페인 | 설명 |
|------|------|------|
| P1 | 실패 반복 / 누적 학습 부재 | 이전 실수를 매번 처음부터 떠올려야 함. 같은 실패를 반복하게 됨. |
| P2 | 회상 비용 + 내 버전 영구화 부재 | 이전에 봤던 출처·결과·문제 지점을 기억해내는 데 시간·에너지를 과도하게 소모. 더 나아가 여러 시도를 통해 "내 최적 레시피"가 어딘가에 존재해야 하는데 영구화 수단이 없음. |
| P3 | 저품질 출처 재선택 | 결과가 좋지 않았던 영상·블로그를 또 선택하게 됨. 출처 단위 평가가 누적되지 않음. |
| P4 | 커스텀 변형 망각 | "지난번엔 간장을 절반만 넣었었는데" 같은 본인의 조정 이력이 사라짐. 나만의 버전이 만들어지지 않음. |
| P5 | 간 조절 실패 | 어디서 어떻게 조정했는지 메모가 없어 개선 불가. |
| P6 | 여러 출처에 흩어진 레시피 정보 — 내 버전으로 통합 불가 | 유튜브·블로그·텍스트에 흩어진 레시피 정보를 내 단일 Recipe로 합칠 수단이 없음. |
| P7 | 요리 중 실시간 조정 메모 불가능 | 손이 더럽거나 재료를 실시간으로 조정할 때 수치 메모 자체가 불가능. 터치 타겟이 너무 작거나 흐름이 끊김. |

### 1.4 빈도·심각도

- **빈도**: 동일 메뉴를 격주(2주 1회) 반복 시도. 시도할 때마다 발생.
- **심각도**: 높음. 시간 낭비(P2) + 결과 품질 저하(P1) + 동기 저하("또 실패할 것 같다") 세 가지가 복합 작용. P6는 출처 다양화 이후 추가 심화 예정.

### 1.5 핵심 인사이트

검색은 문제가 아니다(§1.0 참조). 진짜 문제는 회상 + 누적 학습 부재 + 내 버전 영구화 수단 없음이며, 현재 우회 수단이 0인 상태에서 시스템 차원의 미충족 욕구가 명확히 확인된다. v0.5 PIVOT의 핵심 인사이트: 영상 단위로 기록이 쌓여도 "내 레시피"는 생기지 않는다. Recipe를 1급 엔티티로 만들어 출처(Source)를 흡수해야 한다.

---

## 2. 솔루션 개요

### 2.1 제품 한 줄 정의

다양한 출처(유튜브·블로그·텍스트)의 레시피를 내 Recipe로 정규화·축적하여, 이전 실패와 변형 이력을 Recipe 단위로 누적·참조할 수 있도록 돕는 개인 레시피북.

### 2.2 솔루션 접근

메뉴(Dish) 안에서 여러 Source(영상/블로그/텍스트)를 흡수해 내 Recipe로 정규화·축적한다. Recipe는 재료(RecipeIngredient)·단계(RecipeStep)·출처(RecipeSource)·조정(RecipeCustomization)으로 구성되며, 시도(Attempt)는 이제 영상이 아닌 Recipe 단위로 누적된다. 축적된 Attempt와 Customization을 바탕으로 홈 화면은 "안 먹은 지 n일"(쿨타임) 중심으로 회상 비용을 낮추고, RecipeCustomization은 요리 중 한 손 조작이 가능한 수치 조정을 지원한다.

### 2.3 페인 ↔ 기능 매핑

| 페인 ID | 페인명 | 해소 기능 (§4.x) | 작동 방식 |
|---------|--------|-----------------|-----------|
| P1 | 실패 반복 / 누적 학습 부재 | §4.6 시도 기록, §4.4 Recipe 편집 | rating + improvement_note + Customization 누적이 다음 시도에 참조됨 |
| P2 | 회상 비용 + 내 버전 영구화 부재 | §4.8 메인 화면 v2, §4.1 Recipe 검색, §4.4 Recipe 편집 | 쿨타임 우선 노출 + Recipe 단위 내 버전 영구 보존 |
| P3 | 저품질 출처 재선택 | §4.2 검색 결과 정렬 (Recipe average_rating 기반) | 낮은 평점 Recipe의 노출 우선순위 하락 |
| P4 | 커스텀 변형 망각 | §4.5 RecipeCustomization | 수치 조정·재료 스왑·단계 메모가 Recipe에 영구 기록 |
| P5 | 간 조절 실패 | §4.5 RecipeCustomization, §4.6 시도 기록 | 조정 이력이 Customization에 diff 형태로 누적 |
| P6 | 여러 출처에 흩어진 레시피 정보 — 내 버전으로 통합 불가 | §4.3 Ingestion 흐름, §4.7 메뉴 페이지 (Source 목록) | 여러 Source를 Recipe 하나로 흡수·통합 |
| P7 | 요리 중 실시간 조정 메모 불가능 | §4.5 RecipeCustomization (한 손 조작·큰 터치 타겟·수치 ±) | 큰 터치 타겟 + 수치 ± 인터랙션으로 요리 중 조정 |

---

## 3. 데이터 모델

### 3.1 Dish (메뉴)

사용자가 요리하려는 메뉴. 카테고리·검색 진입점.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| user_id | uuid | FK, not null | 소유 사용자 |
| name | string | not null | 메뉴명 (예: "제육볶음"). 사용자가 입력한 검색어. |
| created_at | timestamp | not null | 생성 시각 |

**삭제 정책**: 연결된 Recipe가 없는 Dish만 hard delete 가능. Recipe가 존재하면 삭제 deny + 안내. Dish는 hard delete only (soft delete 없음).

### 3.2 Recipe (레시피) — v0.5 신규 1급 엔티티

Dish : Recipe = 1 : N. 사용자의 "내 레시피"를 표현하는 핵심 엔티티.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| dish_id | uuid | FK, not null | 상위 메뉴 |
| user_id | uuid | FK, not null | 소유 사용자 |
| title | string | not null | 레시피 제목 (예: "백종원식 제육볶음 — 간장 절반 버전") |
| servings | string | not null | 인분 (자유 표기 — "2인분", "1~2인분" 등) |
| description | text | nullable | 레시피 메모·설명 |
| archived_at | timestamp | nullable | 보관 시각. null = 활성. not null = 보관됨. Attempt ≥ 1건 시 hard delete 대신 archived_at 전환. (Tech v3.0 §3.4 옵션 B) |
| created_at | timestamp | not null | 생성 시각 |
| updated_at | timestamp | not null | 최종 수정 시각 |

**파생 필드 (저장 아님, 런타임 계산)**

| 필드 | 계산 방식 |
|------|-----------|
| average_rating | 연결된 Attempt의 rating 평균 (소수점 1자리) |
| attempt_count | 연결된 Attempt 레코드 수 |
| last_tried_at | 연결된 Attempt 중 tried_at 최신값 |
| days_since_last_tried | 오늘 — last_tried_at (홈 화면 쿨타임 계산) |

**삭제 정책**: Attempt가 1건 이상 존재하는 Recipe는 hard delete deny. 대신 archived 상태(숨김)로 전환. Attempt 없는 Recipe는 hard delete 가능.

### 3.3 RecipeIngredient (재료) — v0.5 신규

Recipe : RecipeIngredient = 1 : N.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| recipe_id | uuid | FK, not null | 상위 레시피 |
| name | string | not null | 재료명 (예: "돼지고기 앞다리살") |
| amount | string | not null | 양 (자유 표기 — "500g", "1큰술", "적당량" 등) |
| unit | string | nullable | 단위 별도 표기 (선택) |
| optional | boolean | not null, default false | 선택 재료 여부 |
| display_order | integer | not null | 노출 순서 |

### 3.4 RecipeStep (단계) — v0.5 신규

Recipe : RecipeStep = 1 : N. 조리 단계.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| recipe_id | uuid | FK, not null | 상위 레시피 |
| display_order | integer | not null | 단계 순서 |
| instruction | text | not null | 단계 조리 지시문 |
| timer_seconds | integer | nullable | 이 단계 소요 시간 (초). null이면 타이머 없음. |
| note | text | nullable | 단계별 팁·주의 사항 |

### 3.5 RecipeSource (출처) — v0.5 신규 (기존 Video 흡수)

Recipe : RecipeSource = 1 : N. 레시피를 참고한 출처. 기존 Video 엔티티를 일반화·흡수한다.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| recipe_id | uuid | FK, not null | 상위 레시피 |
| type | enum | not null | youtube \| blog \| text \| manual |
| url | string | nullable | 원본 URL (type=manual 또는 텍스트 직접 입력 시 null 가능) |
| raw_content | text | nullable | 텍스트 붙여넣기 또는 수집된 원문 내용 |
| youtube_video_id | string | nullable | type=youtube일 때 YouTube video_id |
| title | string | nullable | 출처 제목 (영상 제목, 블로그 포스트 제목 등) |
| channel | string | nullable | 채널명 (type=youtube일 때) |
| thumbnail_url | string | nullable | 썸네일 URL |
| published_at | datetime | nullable | 원본 발행일 |
| is_unavailable_on_source | boolean | not null, default false | 원본 소스에서 정상 접근 불가 (삭제·비공개·404 등) 감지 시 true. 연결된 Recipe·Attempt 보존. |
| fetched_at | timestamp | nullable | 콘텐츠 수집 시각 |
| deleted_at | timestamp | nullable | Source soft delete 시각. null = 활성. |

**UNIQUE 제약**: `(recipe_id, url)` — 동일 Recipe에 동일 URL 중복 등록 방지. URL이 null인 Source(텍스트 직접 입력 등)는 제약 제외.

**삭제 정책**: Source soft delete 시 연결된 Recipe·Attempt는 보존. Source를 삭제해도 Recipe 자체는 유지된다.

### 3.6 RecipeCustomization (조정 이력) — v0.5 신규

Recipe : RecipeCustomization = 1 : N. 사용자가 기본 레시피 대비 조정한 내역.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| recipe_id | uuid | FK, not null | 상위 레시피 |
| base_ingredient_id | uuid | FK, nullable | 조정 대상 RecipeIngredient (재료 관련 조정 시) |
| base_step_id | uuid | FK, nullable | 조정 대상 RecipeStep (단계 관련 조정 시) |
| diff_type | enum | not null | amount_adjust \| step_note \| swap \| skip |
| diff_payload | jsonb | not null | 조정 내용 (예: `{"from":"1큰술","to":"0.5큰술"}`, `{"note":"불 세기 강→중으로"}`) |
| created_at | timestamp | not null | 생성 시각 |
| updated_at | timestamp | not null | 최종 수정 시각 |

**diff_type 정의**:
- `amount_adjust`: 재료 수량 ± 조정 (RecipeIngredient 기준)
- `step_note`: 단계별 메모 추가 (RecipeStep 기준)
- `swap`: 재료 대체 (예: 고추장 → 고추가루 + 설탕)
- `skip`: 단계 또는 재료 스킵

### 3.7 Attempt (시도) — v0.5 변경: FK video_id → recipe_id

Recipe : Attempt = 1 : N. 한 번의 요리 시도.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| recipe_id | uuid | FK, not null | 상위 레시피 (v0.5 변경: 기존 video_id → recipe_id) |
| user_id | uuid | FK, not null | 소유 사용자 |
| rating | float | 0.0 ~ 5.0, 0.5 단위 | 시도 결과 평점 |
| changes | text | nullable | 레시피 대비 변경 사항 자유 기술 |
| improvement_note | text | nullable | 다음 시도를 위한 개선 메모 |
| tried_at | date | not null | 시도 날짜 |
| deleted_at | timestamp | nullable | soft delete 시각. null = 활성. 30일 후 자동 hard delete. |

**생성 트리거**: 명시적 "기록하기" CTA 실행 시만 생성. 단순 Recipe 조회·진입 후 이탈은 Attempt를 생성하지 않음.

**삭제 정책**: soft delete (deleted_at 기록). 30일 휴지통 후 자동 hard delete. 30일 내 복구 가능.

**편집**: 생성 후 사후 edit 가능.

**단계별 메모 보존 방식**: 시도 중 특정 RecipeStep에 대한 메모는 RecipeCustomization(diff_type=step_note)으로 기록한다. 시도별 단계 메모를 별도 테이블로 분리할지(attempt_step_notes 방식) 또는 Customization으로 통합할지는 ENGINEER 페이즈(tech-decision v3.0)에서 최종 결정한다. PRD는 "단계별 메모 보존"의 요구사항만 명시하며 구체 스키마는 tech-decision에 위임한다.

---

## 4. 기능 요구사항

### 4.1 메뉴(Dish) 검색 + Recipe 검색

- 사용자가 메뉴명을 입력하면 기존 저장된 Dish와 Recipe를 검색한다.
  - **Dish 검색**: `LOWER(name) LIKE LOWER('%query%')` LIKE 매칭. 한국어 형태소 분석 미적용 (MVP).
  - **Recipe 검색**: Recipe.title 및 RecipeIngredient.name에 대한 LIKE 매칭.
- **자동완성**: 사용자가 입력하는 도중 기존 저장된 Dish 이름 중 일치하는 항목을 드롭다운으로 제안한다. 화면 구성은 DESIGN 페이즈에서 결정.
- YouTube Data API v3 `search.list`는 신규 레시피 출처 탐색 시(Ingestion 흐름 §4.3 내)에만 호출한다. API quota 보호를 위해 캐시 및 디바운스를 적용한다. (구체적 캐시 정책은 ENGINEER 페이즈에서 결정)

### 4.2 검색 결과 정렬 로직 (Recipe 단위)

검색 결과는 Recipe 단위로 정렬된다.

**우선 노출 영역 (높은 평점 Recipe)**

- 조건: average_rating ≥ 4.0이거나 Attempt가 2건 이상인 Recipe가 1개 이상 존재할 때 표시.
- 내용: average_rating 내림차순 → attempt_count 내림차순으로 정렬.
- 조건 미충족 시 우선 노출 영역 자체를 표시하지 않는다.

**일반 노출 영역**

- 내용: 나머지 Recipe를 created_at 내림차순(최신 저장순)으로 노출.
- archived Recipe(숨김)는 노출하지 않는다.

### 4.3 Ingestion 흐름 (신규) — 출처 → Recipe Draft → 검수 → 저장

사용자가 레시피 출처를 입력하면 자동으로 Recipe 초안(Draft)을 생성하고 사용자 검수 후 저장한다.

**입력 채널 3가지**

| 채널 | 입력 방식 | Source.type |
|------|-----------|-------------|
| YouTube | YouTube 영상 URL 입력 | youtube |
| 블로그/웹 | 웹페이지 URL 입력 (텍스트 추출 제한 지원) | blog |
| 텍스트 | 레시피 텍스트 직접 붙여넣기 | text |

**Ingestion 처리 흐름**

1. 사용자가 URL 또는 텍스트를 입력한다.
2. **규칙 기반 파싱** (1순위): 구조화된 HTML(schema.org Recipe 마크업, 목록 패턴 등)에서 재료·단계를 추출한다.
3. **LLM fallback** (규칙 기반 실패·애매 시에만): Gemini API free tier 1순위, OpenAI 저가 모델 2순위. 검색·조회 단계 LLM 호출 금지. 동일 URL 결과 캐시. — **실호출 구현은 다음 사이클**. 이번 사이클(v0.5)은 스키마·엔드포인트·프롬프트 설계까지.
4. **Recipe Draft 생성**: title·servings·ingredients[]·steps[] 초안 자동 채워짐. 사용자가 수정 가능.
5. **사용자 검수**: Draft를 사용자가 확인·수정 후 저장.
6. **저장**: Recipe + RecipeIngredient[] + RecipeStep[] + RecipeSource 레코드 생성.

**캐시 키**: `hash(sourceType + url|text)` — 동일 입력 재처리 방지.

**YouTube URL에서 video_id 추출**: URL에서 youtube_video_id 파싱. RecipeSource.youtube_video_id에 저장.

### 4.4 Recipe 편집

- Recipe의 title·servings·description을 인라인 편집할 수 있다.
- RecipeIngredient 추가·수정·삭제·순서 변경이 가능하다.
- RecipeStep 추가·수정·삭제·순서 변경이 가능하다.
- RecipeSource 추가·삭제가 가능하다.

### 4.5 RecipeCustomization (요리 중 조정) — v0.5 신규

사용자가 기본 레시피를 요리하면서 실시간으로 수치를 조정하거나 단계를 메모한다.

- **수치 ± 조정** (이번 사이클 MVP): 재료 수량을 ±로 조정한다. 조정 결과는 RecipeCustomization(diff_type=amount_adjust)으로 저장된다.
- **단계 메모** (이번 사이클 MVP): RecipeStep에 메모를 추가한다. RecipeCustomization(diff_type=step_note)으로 저장.
- **재료 스왑·단계 스킵**: 다음 사이클 구현. 이번 사이클은 스키마 설계까지.
- **조작 요건**: 한 손 조작 가능한 큰 터치 타겟. 요리 중 손이 더러운 상황에서도 동작 가능해야 한다는 제약이 디자인 요건임. 구체적 인터랙션·터치 타겟 크기는 DESIGN 페이즈에서 결정 (OQ8).
- 음성 입력·제스처 폴백은 Out of Scope.

### 4.6 시도 기록 (Attempt) — recipe_id 기준

- Attempt 생성 트리거: 사용자가 명시적으로 "기록하기" CTA를 실행할 때만 Attempt 레코드를 생성한다.
- 입력 항목: rating, changes, improvement_note, tried_at.
- 동일 Recipe에 대해 복수의 Attempt 생성이 가능하다.
- Attempt 생성 후 해당 Recipe의 average_rating, attempt_count, last_tried_at이 자동으로 재계산된다.
- Attempt 및 관련 RecipeCustomization은 사후 edit 가능하다.

### 4.7 메뉴 페이지 (Dish 단위 통합 뷰)

- Dish 단위로 묶인 모든 Recipe 목록과, 각 Recipe의 RecipeSource 목록을 분리하여 제공하는 데이터 구조를 갖는다.
- 포함 데이터:
  - Dish명
  - 연결된 Recipe 목록 (각 Recipe의 average_rating, attempt_count, last_tried_at 포함)
  - 각 Recipe의 RecipeSource 목록 (type, title, url, is_unavailable_on_source 포함)
  - 각 Recipe의 Attempt 이력 전체
- archived(숨김) Recipe는 메뉴 페이지에 기본 노출하지 않는다. (별도 "숨긴 레시피 보기" 진입점은 DESIGN 페이즈에서 결정)
- 화면 구성은 DESIGN 페이즈에서 결정한다.

### 4.8 메인 화면 v2 (홈)

메인 화면은 사용자가 앱에 처음 진입했을 때 보이는 화면이다. 데이터 구조만 정의하며 화면 구성·레이아웃은 DESIGN 페이즈에서 결정한다.

**데이터 구조 (우선순위순)**

1. **검색바**: 메뉴명·레시피명 입력 진입점 (§4.1 연결).
2. **안 먹은 지 n일 (쿨타임)** (1순위): 마지막 시도(last_tried_at)로부터 경과 일수가 가장 긴 Recipe를 상위 노출. `SELECT recipe_id, days_since_last_tried ORDER BY days_since_last_tried DESC`. Attempt가 없는 Recipe는 "아직 시도 안 함" 상태로 처리. P2(회상 비용 + 내 버전 영구화) 직결.
3. **최근 만든 레시피** (2순위): `Attempt JOIN Recipe ORDER BY tried_at DESC LIMIT 5`. 각 Recipe의 title, last_tried_at 포함. 빠른 재진입 지원.
4. **자주 만든 메뉴** (3순위): `Dish JOIN Attempt count ORDER BY count DESC LIMIT 3`. 각 Dish의 name, attempt_count 포함.
5. **날씨 보조 카피** (보조 영역): 날씨 관련 메뉴 제안 문구만 정의. API 실연동은 다음 사이클.

**신규 사용자 (Attempt 0건) 처리**: 쿨타임·최근 만든 레시피·자주 만든 메뉴 영역 대신 빈 상태 표시. 빈 상태 표현은 DESIGN 페이즈에서 결정.

### 4.9 삭제 정책

| 엔티티 | 정책 |
|--------|------|
| Attempt | soft delete (deleted_at 기록). 30일 휴지통 후 자동 hard delete. 30일 내 복구 가능. |
| AttemptStepNote | Attempt에 종속. Attempt soft delete 중 함께 숨김. Attempt hard delete 시 FK CASCADE. 개별 편집·삭제 가능. |
| RecipeCustomization | Recipe hard delete 시 cascade. Attempt 삭제와 독립. |
| Recipe | Attempt 0건이면 hard delete 가능. Attempt ≥ 1건이면 직접 hard delete deny + archived 상태로 전환 권고. archived Recipe는 30일 grace period 후 Cron 자동 hard delete. archived 상태에서 사용자가 명시적 "영구 삭제" 선택 시 또는 Cron 자동 hard delete 시 **연결된 Attempt·AttemptStepNote·RecipeCustomization·RecipeIngredient·RecipeStep·RecipeSource 전체가 FK CASCADE로 함께 영구 삭제된다** (L65, 2026-05-15). 영구 삭제 UI는 2단계 확인 다이얼로그로 보호 (design-decision v2.0 §휴지통 참조). |
| RecipeIngredient / RecipeStep | Recipe hard delete 시 cascade. 개별 편집·삭제 가능. |
| RecipeSource | soft delete 가능. 연결된 Recipe·Attempt 보존. Recipe hard delete 시 cascade. |
| Dish | 연결된 Recipe가 없는 경우만 hard delete 가능. Recipe 존재하면 deny + 안내. |

### 4.10 Source 접근 불가 감지

기존 §4.9 "영상 유튜브 접근불가 감지"를 Source 추상화로 일반화한다.

- 원본 Source에 정상 접근이 불가한 경우 (유튜브 삭제·비공개·블로그 404·URL 만료 등) RecipeSource.is_unavailable_on_source = true로 설정한다.
- **YouTube**: YouTube API videos.list에서 items[] 빈 응답 시 감지 (lazy check — 상세 조회 시점). YouTube IFrame API error 100도 동일 처리.
- **블로그/URL**: HTTP 404·410 응답 감지 (lazy check).
- is_unavailable_on_source = true인 Source는 검색 결과에 노출하지 않는다. 메뉴 페이지에는 노출하되 "접근 불가" 표시. (시각 처리 형태는 DESIGN 페이즈에서 결정)
- **Recipe·Attempt 보존**: Source가 접근 불가 상태가 되더라도 연결된 Recipe·RecipeIngredient·RecipeStep·Attempt 데이터는 삭제하지 않는다. P1·P4 페인 직결 — 누적 학습 보존 우선.

---

## 5. MVP 스코프

### 5.1 v0.5 이번 사이클 포함 기능 (L69 좁힘, 2026-05-15 갱신)

L69 결정에 따라 v0.5 스코프를 **Ingestion 우선**으로 좁힌다. Customization UI + 홈 v2 쿨타임은 다음 사이클로 분리.

| ID | 기능 | 연결 섹션 | 비고 |
|----|------|-----------|------|
| a | 메뉴(Dish) 검색 + Recipe 검색 + 자동완성 | 4.1 | — |
| b | **Ingestion 흐름** (메인) — YouTube URL → 규칙 기반 파싱 → Draft → 검수 → 저장. 블로그·텍스트는 수동 붙여넣기 지원. | 4.3 | **이번 사이클 핵심 (H5 검증)** |
| c | Recipe CRUD (title·servings·재료·단계 인라인 편집) — Ingestion 결과 편집 + 사후 편집 | 4.4 | — |
| e' | 시도 기록 (Attempt) — rating + changes(자유 텍스트, P4·P5 1차 대응) + improvement_note + tried_at + **선택적 단계별 메모 (AttemptStepNote — L70)** | 4.6 | StepNote는 L70로 v0.5 IN 복원. video_timestamp 자동 캡처는 다음 사이클. |
| f' | **단순 메뉴 페이지** — Recipe 목록 + Source 목록 분리. (archived 영역은 다음 사이클) | 4.7 | 단순화 |
| g' | **단순 홈** — 검색바 + 최근 만든 Recipe 5개. (쿨타임 영역·자주 만든 메뉴는 다음 사이클) | 4.8 | 단순화 |
| h | 검색 결과 정렬 (Recipe average_rating 기반) | 4.2 | — |
| — | 단순 삭제 정책 (Attempt soft delete / Recipe hard delete / Dish 빈 것만 삭제) | 4.9 | archived + 영구 삭제 2단계 다이얼로그는 다음 사이클 |
| — | RecipeCustomization **스키마만** (UI는 다음 사이클) | 4.5 | DB 구조 미리 잡아두고, UI는 H5 결과 + H6 paper test 후 |

**v0.5 스코프 제외 (다음 사이클로 분리, L69 + L70 갱신)**:
- RecipeCustomization UI 구현 (스키마는 포함, UI는 OOS-5a) — Attempt.changes 자유 텍스트로 1차 대응
- 홈 v2 쿨타임 "안 먹은 지 n일" UX (OOS-5b) — 데이터 누적 후 효용
- ~~AttemptStepNote~~ → **L70로 v0.5 IN 복원**. video_timestamp 자동 캡처만 다음 사이클.
- archived Recipe + 영구 삭제 2단계 다이얼로그 (OOS-5d)
- Source 접근 불가 lazy check (OOS-5e)

**v0.5 설계 스코프 명시 (이번 사이클은 코드까지)**:
- Ingestion LLM fallback: 스키마·엔드포인트·프롬프트 설계까지. 실호출 구현은 다음 사이클.
- ~~코드 마이그레이션(v0.4 스키마 → v0.5 스키마)~~ **WITHDRAWN (L67)** — DB 리셋 + 신규 셋업으로 대체.

### 5.2 다음 사이클 (v0.6)

| ID | 기능 | 이번 사이클 제외 이유 |
|----|------|----------------------|
| i | LLM 실호출 구현 (Gemini API free tier) | H5 가설 검증 후 결정, 비용 리스크 |
| j | 블로그 자동 수집 (URL → 텍스트 추출 자동화) | 기술 복잡도, 규칙 기반 파싱 정확도 검증 후 |
| k | RecipeCustomization UI 구현 (수치 ± + 단계 메모) | H5 결과 + H6 실제 사용 검증 후 (L69) |
| l | 홈 v2 쿨타임 "안 먹은 지 n일" | Attempt 누적 10건+ 후 효용 검증 (L69) |
| m | ~~AttemptStepNote (단계별 메모)~~ → **L70로 v0.5 IN 복원** | — |
| m' | AttemptStepNote.video_timestamp 자동 캡처 (YouTube IFrame Player API) | YouTube IFrame 의존성 + StepNote 사용 빈도 검증 후 |
| n | archived Recipe + 영구 삭제 2단계 다이얼로그 | 단순 hard delete만 v0.5 (L69) |

### 5.3 Phase 2 백로그

| ID | 기능 | 제외 이유 |
|----|------|----------|
| m | 가구/Household 도메인 + 가구원 공유 | 싱글유저 검증 후 결정 (L53) |
| n | 타인 레시피 평가 | Phase 2 (L53) |
| o | 날씨 API 실연동 | 홈 카피로 선행 검증 후 결정 (L52) |
| p | 통계/그래프 (별점 시계열 등) | 기록 데이터 축적 후 유의미 |
| q | 부분 검색 통합 (한국어 형태소·동의어) | 실사용 후 사용자 부분 검색 빈도 확인 후 |

---

## 6. 검증 가설

MVP에서 검증할 핵심 가설. 각 가설의 결과가 다음 사이클 기능 및 방향을 결정한다.

| ID | 가설 | 검증 방법 | 연결 페인 |
|----|------|-----------|-----------|
| H1' | Recipe 정규화(재료·단계 구조화)로 description/댓글 원본을 보지 않고도 사용자가 충분히 요리할 수 있다. | LLM 요약(d-2차) 없이도 "원본 보러 가야 했다"는 자기보고 빈도가 낮은지 분기별 회고 | — |
| H2 | 낮은 평점 Recipe가 검색 결과에서 후순위로 내려가는 정렬이 저품질 레시피 재선택(P3)을 실제로 줄인다. | 정렬 도입 후 "별로였던 레시피 또 들어갔다" 자기보고 빈도 회고 (분기별) | P3 |
| H3' | 쿨타임("안 먹은 지 n일") 중심 홈이 회상 비용(P2)을 영상 우선 정렬보다 더 줄인다. (v0.5: L66에서 기존 H3·H7 통합) | (a) 정성 — 홈 v2 도입 후 "어떤 레시피로 요리할지 고민 시간이 줄었나" 자기보고 회고 (분기별). (b) 정량 — M6(Recipe 재진입률) 30일 내 동일 Recipe 재오픈 비율 추이. 두 신호 갈림 시 OQ12 신설 트리거. | P2 |
| H4 | Attempt 단위 기록(rating + changes + improvement_note + Customization)이 다음 시도에 실제로 참조되어 실패 반복(P1)·커스텀 변형 망각(P4)·간 조절 실패(P5)를 줄인다. | 동일 Recipe 2회 이상 시도 시 rating 상승 추이. Customization 이력이 다음 시도에 참조되는지 자기보고 회고. | P1, P4, P5 |
| H5 | Ingestion 규칙 기반 파싱만으로도 사용자가 Draft를 기꺼이 검수하고 저장한다. (LLM 실호출 없이도 충분) | M5(Ingestion 성공률) 측정. 검수 후 저장 완료 비율. 검수 화면 이탈 빈도. — 낮으면 LLM fallback 실호출 우선순위 상향(다음 사이클 결정 트리거) | P6 |
| H6 | RecipeCustomization 수치 ± UX가 요리 중에도 가능하다 (한 손 조작 충분성). | 실사용 후 "요리 중 조정할 수 있었나" 자기보고. 사용성 테스트 (다음 사이클 수행). — 깨지면 음성/제스처 폴백 검토. | P7 |

> **성공 지표(M1~M6)와 가설 검증(H1'~H6)의 영역 구분**
>
> - **성공 지표(M1~M6)**: DB에서 직접 측정 가능한 행동 데이터. 운영 측정 목적.
> - **가설 검증(H1'~H6)**: 운영 측정 외 정성 신호 포함 가능 (자기보고 회고 허용). 가정 검증 목적.
> - **v0.5 PIVOT 갱신 (L66, 2026-05-15)**: H3와 H7이 동일 쿨타임 효과 영역을 측정 방법만 달리해 분리 등재되어 있었으나, H3'로 통합하고 정성(자기보고) + 정량(M6) 두 측정을 한 가설에 병행 명시. 측정 간 신호가 갈리면 OQ12 신설로 분리 재고.

---

## 7. 성공 지표

### 7.1 지표 선택 근거

성공 지표는 **S2 행동 지표** 기준으로 설정한다. 사용자가 실제로 도구를 사용하는 행동 데이터에서 직접 측정 가능한 지표만 포함한다.

### 7.2 성공 지표

| 지표 ID | 지표명 | 정의 | 연결 페인 |
|---------|--------|------|-----------|
| M1 | Attempt 생성 횟수 | 사용자가 생성한 Attempt 레코드 총 수 (recipe_id 기준 집계) | P1, P4, P5 |
| M2' | Recipe 평점 등록 누적 수 | rating이 입력된 Attempt의 총 수. (thumbs는 Source 단위 보조 지표로 격하) | P3 |
| M3 | 재시도 비율 | 동일 Recipe에 Attempt가 2건 이상 발생한 Recipe 수 / 시도된 전체 Recipe 수. P1 "실패 반복" 개선 여부의 직접 신호. | P1 |
| M4' | Recipe당 Customization 평균 개수 | 생성된 Recipe당 평균 RecipeCustomization 수. 사용자가 수치 조정·단계 메모를 적극 활용하는지 신호. 낮으면 UX 단순화 또는 Customization 폐지 검토. | P4, P7 |
| M5 | Ingestion 성공률 | 저장 완료된 Recipe 수 / Ingestion 시도(URL·텍스트 입력) 수. H5 검증 핵심 지표. | P6 |
| M6 | Recipe 재진입률 | 동일 Recipe를 30일 내 재오픈한 비율. 홈 v2(쿨타임) 핵심 지표. H3' 정량 측정 (L66). | P2 |

---

## 8. 기술 제약

| 항목 | 제약 내용 | 대응 방향 |
|------|-----------|-----------|
| YouTube Data API v3 quota | 기본 10,000 units/day. `search.list` = 100 units/call로 무거움. | 검색 결과 캐시 + 디바운스 적용. Ingestion 시점에만 호출. 구체적 정책은 ENGINEER 페이즈에서 결정. |
| Gemini API free tier 제약 | Gemini API free tier는 월별 요청 한도 존재. 응답 지연 가능성. | LLM 호출은 ingest 단계 1회만. 검색·조회 단계 호출 금지. 동일 URL 결과 캐시. 실호출 구현은 다음 사이클 — 이번 사이클은 설계까지. |
| 블로그 텍스트 추출 제한 | 일부 블로그는 JavaScript 렌더링 필요 또는 크롤링 차단. | MVP: 텍스트 직접 붙여넣기 폴백. 자동 추출은 다음 사이클. |
| YouTube IFrame 임베드 제한 | 일부 영상은 외부 임베드 차단. | 폴백: 유튜브 외부 링크로 연결. |
| description 텍스트 길이 | 길이 무제한. 매우 긴 description 존재 가능. | max length 처리 정책 필요. 표시 형태는 DESIGN 페이즈에서 결정. |
| v0.4 → v0.5 스키마 마이그레이션 | Video → RecipeSource, Step → RecipeStep·RecipeCustomization, Attempt FK 변경. 기존 데이터 보존 필요. | Migration Plan 작성 (이번 사이클). dry-run + snapshot 의무화 후 실행 (다음 사이클). |

---

## 9. 비-목표

명시적으로 이 제품의 범위 밖인 항목.

- 레시피 자동 추천 / 새 레시피 탐색 (탐색은 페인이 아님 — 사용자 명시)
- 식단·칼로리 관리, 건강 목적 기능
- 식재료 구매·재고 관리
- **가구/Household 도메인 + 가구원 공유** — Phase 2 (L53)
- **타인 레시피 평가** — Phase 2 (L53)
- **날씨 API 실연동** — 홈 카피 정의까지만. 실연동은 다음 사이클 이후 (L52)
- **LLM 실호출 구현** — 이번 사이클 OOS. 스키마·엔드포인트·프롬프트 설계까지 (L51)
- **코드 마이그레이션 실행** — Migration Plan 작성까지. 실행은 다음 사이클 (L55)
- 음성 입력·제스처 폴백 (RecipeCustomization) — OOS
- 부분 검색 통합 결과 (한국어 형태소·동의어 처리) — Phase 2

### 9.5 Risk · Mitigation

| 리스크 ID | 시나리오 (가정이 깨질 때) | 시그널 | 완화·분기 |
|-----------|--------------------------|--------|-----------|
| RM1 | H1' 깨짐 — Recipe 정규화만으로는 레시피 정보 부족 | 사용자가 원본 출처로 직접 이동하는 빈도 높음 | LLM 요약(다음 사이클) 즉시 진입 트리거 |
| RM2 | H2 효과 약함 — 낮은 평점 Recipe 후순위 정렬이 P3 미해소 | "별로였던 레시피 또 들어갔다" 자기보고 지속 | 정렬 알고리즘 재설계 — 후순위 강도 증가 또는 archived 처리 |
| RM3 | H3 효과 약함 — 쿨타임 홈이 P2 미해소 | "어떤 레시피로 요리할지 여전히 고민" 자기보고 | 홈 정렬 기준 재검토 — 쿨타임 → last_tried_at 또는 attempt_count 실험 |
| RM4 | H4 효과 약함 — Attempt 기록이 다음 시도에 미참조 | M3(재시도 비율)에서 rating 상승 추이 부재 | 기록 노출 위치·시점 UX 재검토. Recipe 카드에 "지난 시도 메모" 미리보기 강화. |
| RM5 | YouTube Data API quota 초과 | 검색 실패 빈발 | 캐시 TTL 연장, quota 증액 신청 |
| RM6 | 블로그 텍스트 추출 실패율 높음 | M5(Ingestion 성공률) 낮음, 사용자 수동 입력 전환 빈발 | 텍스트 붙여넣기 폴백으로 대응. 자동 추출 개선 우선순위 상향. |
| RM7 | 자체 구현 컴포넌트 a11y 회귀 | Vitest a11y 테스트 FAIL, 키보드 내비게이션 불편 보고 | Radix Dialog/Vaul 도입 검토 |
| RM8 | YouTube IFrame 임베드 차단율 높음 | Source 접근 시 외부 링크 전환 빈발 | 외부 링크 폴백으로 대응 OK인지 자기보고 회고 |
| RM9 | Customization 사용률 낮음 — M4'(Customization 평균 개수) 지속 낮음 | M4' 값이 0.5 미만 | UX 단순화 또는 Customization 기능 비중 축소 검토 |
| RM10 | H5 깨짐 — Ingestion 규칙 파싱 정확도 낮아 Draft 품질 저하 | M5(Ingestion 성공률) 낮음. 검수 화면 이탈 빈발. LLM fallback 비율 급증. | 검수 화면 강화(사용자 전체 수동 입력 지원). LLM fallback 실호출 우선순위 상향 트리거. |
| RM11 | H6 깨짐 — RecipeCustomization 한 손 조작 UX가 요리 중 불가능 | 자기보고 "요리 중 조정 못 했다" 빈발. M4' 낮음. | 다중 모달(음성·제스처) 검토. 터치 타겟 크기 재설계. (DESIGN 페이즈 즉시 재진입 트리거) |
| RM12 | 마이그레이션 데이터 손실 — v0.4 → v0.5 스키마 전환 중 기존 데이터 유실 | 마이그레이션 dry-run 실패 또는 record count 불일치 | 다음 사이클에 dry-run + snapshot 의무화. 롤백 절차 Migration Plan에 명시. |

---

## 10. 열린 질문

### 10.1 Open Questions (미결)

| ID | 질문 | 결정 시점 |
|----|------|-----------|
| OQ5 | 자동완성 한국어 매칭 정확도 — 실사용 후 부정확 빈발 시 `pg_trgm` GIN index 도입 검토. 트리거 기준 미결. | 실사용 후 결정 |
| OQ7 | Ingestion 규칙 기반 파싱 vs LLM fallback 비율 임계치 — 파싱 성공률이 어느 수준 이하일 때 LLM fallback을 기본으로 전환할 것인가. | ENGINEER 페이즈 + 다음 사이클 실사용 데이터 기반 결정 |
| OQ8 | RecipeCustomization 한 손 조작 디자인 — 터치 타겟 최소 크기, ± 버튼 배치, 수치 표시 방식. | DESIGN 페이즈 (v2.0)에서 결정 |

### 10.2 Resolved Questions (해소 완료)

| ID | 질문 | 해소 내용 |
|----|------|-----------|
| OQ1 | description max length 정책 — 어느 길이까지 바로 노출하고 어디서 접을 것인가. | 300자 즉시 노출 → "더 보기" 토글 → 인라인 전체 확장. → design-decision §description 노출 항목 |
| OQ2 | thumbs up(v0.4) 영상이 0~2개일 때 우선 노출 영역 처리. | 0개 시 섹션 자체 미표시. v0.5에서 평점 기반 정렬로 대체됨. |
| OQ3 | 캐시 정책 구체화 — TTL, 캐시 키 설계 등. | 24h TTL, cache_key TEXT UNIQUE 단일 컬럼. "search:"+normalized_query / "video:"+youtube_video_id prefix 규칙. → tech-decision §5.3 |
| OQ4 | YouTube Data API quota 초과 시 사용자 경험 처리. | 429 → 클라이언트 "잠시 후 다시 시도해주세요" Empty 상태 + 재시도 CTA. → design-decision RM5 / tech-decision §5.3 |
| OQ6 | Step.video_timestamp 영상 실제 길이 초과 검증 (v0.4 기준). | v0.5에서 RecipeStep으로 대체됨. RecipeStep.timer_seconds는 null 또는 양의 정수. 0 이상 정수 또는 null 허용, 음수 거부(400). → tech-decision v3.0에서 갱신 예정. |

---

## 부록 A — 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | 문제 정의 합의 | JTBD, 페르소나, 핵심 페인 5종, 비-목표 4종 확정 |
| 2026-05-03 | 데이터 모델 합의 | Dish / Video / Attempt 3-tier 구조 확정 (v0.4) |
| 2026-05-03 | 동작 로직 합의 | 검색 정렬, thumbs, description/고정댓글, 메뉴 페이지 로직 확정 |
| 2026-05-03 | MVP 스코프 합의 | a, b, c, d-1차, e 포함 / d-2차, f는 Phase 2 (v0.4) |
| 2026-05-03 | 가설 합의 | H1 ~ H4 확정 (v0.4) |
| 2026-05-03 | 성공 지표 합의 | S2 행동 지표 기준 M1 ~ M4 확정 (v0.4) |
| 2026-05-03 | UI 분리 원칙 | PRD에 UI 묘사 포함 금지 — 영구 가이드 (사용자 명시) |
| 2026-05-03 | prd-writer rewind 1차 | B1 §1.0 문제 발견 내러티브, B2 §2.3 페인↔기능 매핑, B3 §9.5 Risk·Mitigation, B4 참고 문서 박스 추가. |
| 2026-05-03 | prd-writer rewind 2차 | B1 자동완성 MVP, B2 영상 유튜브 삭제 엣지, B4 Attempt 생성 트리거, B5β Step 엔티티 + YouTube IFrame timestamp, B6 삭제 정책, B7-A 메인 화면. PRD v0.4 확정. |
| 2026-05-08 | ALIGN 6차 rewind | §3.2 Video UNIQUE 제약(youtube_video_id, dish_id) 명시. L45~L48 결정 반영. |
| 2026-05-14 | v0.5 PIVOT | 정체성 전환: "영상 시도 기록 도구" → "Recipe 중심 개인 레시피북". Recipe 1급 엔티티 신설. L49~L55 결정 반영. PRD v0.5 확정. |
| 2026-05-15 | 다음 사이클 선행 결정 (PREB) | L65 OQ10 Recipe 영구 삭제 = Attempt CASCADE 옵션 A 확정 (§4.9 갱신). L66 OQ11 H3·H7 → H3' 가설 통합 옵션 A 확정 (§6 갱신). PRD v0.5.1. |
| 2026-05-15 | office-hours 검토 후속 결정 | L67 마이그레이션 폐기 → DB 리셋 + 신규 셋업. L68 H6 56px 확정 (paper test 미실시, 사용자 확신). L69 v0.5 스코프 좁힘 — Ingestion 우선, Customization UI + 쿨타임 홈은 다음 사이클로 분리. §5.1 좁힌 스코프 갱신. PRD v0.5.2. |
| 2026-05-15 | office-hours 2차 검토 (L69 부분 수정) | L70 — AttemptStepNote v0.5 IN 복원 (P1 직접 해결). Customization UI는 OOS 유지 (Attempt.changes 자유 텍스트로 1차 대응). 쿨타임은 OOS 유지 (데이터 누적 후 효용). §5.1 e' 항목 갱신. PRD v0.5.3. |

---

## 부록 B — L1~L48 결정의 v0.5 흡수·이관 매핑

v0.4까지의 결정(L1~L48)이 v0.5 PIVOT에서 어떻게 처리되는지 명시한다.

| 결정 ID | 내용 요약 | v0.5 처리 |
|---------|-----------|-----------|
| L1 | 피처명 `nayo` | **유지** — 동일 |
| L2 | JTBD + 핵심 페인 P1~P5 | **확장 흡수** — P6·P7 추가. JTBD "Recipe 단위" 수정. |
| L3 | 데이터 모델 Dish/Video/Attempt 3-tier | **재설계** — Video → RecipeSource로 격하. Recipe 1급 엔티티 신설. Attempt FK video_id → recipe_id. |
| L4 | 검색 정렬 로직 (thumbs up 우선) | **재설계** — Recipe average_rating 기반 정렬로 대체. thumbs는 Source 단위 보조 지표로 격하. |
| L5 | 성공 지표 M1~M3 | **확장 갱신** — M2 thumbs → M2' Recipe 평점. M4 Step → M4' Customization. M5·M6 신설. |
| L6 | 가설 H1~H4 | **갱신** — H1 → H1'. H2~H4 Recipe 기준 변환. H5·H6·H7 신설. |
| L7 | UI 분리 영구 가이드 | **유지** — PRD UI 묘사 금지 동일 |
| L8~L10 | prd-writer·review 1차 완료 | **이력 보존** — v0.4 달성 이력 |
| L11~L22 | DESIGN·ENGINEER 결정 (디자인 시스템·컴포넌트·스키마·API) | **DESIGN v2.0 / ENGINEER v3.0으로 이관** — v0.5 PIVOT 후속 페이즈에서 갱신 |
| L23~L28 | ALIGN 결정 (doc-align, decision-log, Codex 정정) | **이력 보존** — v0.4 기반. decision-log v2.0에서 갱신 예정 |
| L29~L34 | prd-writer rewind 1차 보강 (내러티브·매핑·RM·참고 문서) | **v0.5에 흡수** — §1.0 내러티브 5단계로 확장. §2.3 P6·P7 추가. §9.5 RM 확장. |
| L35 | 자동완성 MVP / 부분 검색 Phase 2 | **유지** — §4.1에 동일 정책 |
| L36 | is_unavailable_on_youtube 처리 | **일반화 흡수** — is_unavailable_on_source로 일반화. §3.5·§4.10. |
| L37 | Attempt 생성 트리거 (명시적 CTA만) | **유지** — §4.6에 동일 정책 |
| L38 | Step 엔티티 + YouTube IFrame timestamp | **재설계** — Step 엔티티 폐지. RecipeStep(조리 단계) + RecipeCustomization(diff)으로 분리. timestamp는 Source 수준으로 이동. |
| L39 | 삭제 정책 (Attempt/Step/Video/Dish) | **갱신** — §4.9. Video → Recipe·RecipeSource로 대체. Step → RecipeIngredient·RecipeStep cascade. |
| L40 | 메인 화면 v1 (최근 시도 5개 + Dish Top 3) | **재설계** — 메인 화면 v2: 쿨타임 1순위. §4.8. |
| L41~L44 | review-loop·prd-review 재실행 | **이력 보존** — v0.4 달성 이력 |
| L45 | GET /api/dishes/{id}/attempts API 신규 | **갱신 예정** — tech-decision v3.0에서 recipe_id 기준 재설계 |
| L46 | Video UNIQUE(youtube_video_id, dish_id) | **재설계** — RecipeSource UNIQUE(recipe_id, url)로 대체. §3.5. |
| L47 | 영상 카드 URL 파라미터 (dish_id + video_id) | **갱신 예정** — Recipe 단위 URL 파라미터로 재설계. tech-decision v3.0. |
| L48 | thumbs 토글 PATCH API | **격하** — thumbs는 Source 단위 보조 지표. Source에 rating 필드 추가 여부는 tech-decision v3.0에서 결정. |
| L49~L55 | v0.5 PIVOT 결정 | **v0.5 PRD에 직접 반영** — 정체성 전환·데이터 모델·Ingestion·홈 v2·사용자 모델·Customization UX·user_scope. |
