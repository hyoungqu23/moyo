# PRD — nayo (모두의요리사)

> 버전: 0.4 (B1·B2·B4·B5β·B6·B7-A 보강 — prd-writer rewind 2차 사용자 명시 요청)
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-08 (ALIGN 6차 rewind — Video UNIQUE 제약 명시)
> 페이즈: DISCOVER · prd-review 재실행 완료 (R1~R4 PASS)

> 참고 문서 (`docs/nayo/`):
> - problem-definition.md — DISCOVER 단계 문제 정의 원본
> - design-decision.md — DESIGN 단계 화면·UX·a11y 결정
> - design-system.md — Apple Web Design System 차용 명세
> - tech-decision.md — ENGINEER 단계 스택·Drizzle 스키마·API 설계
> - decision-log.md — 전 페이즈 의사결정 종합 (L1~L40+)
> - design-notes-from-discover.md — DISCOVER 중 수집된 UI 노트 (참조용)
> - harness-state.md — PM Working Memory

---

## 1. 배경 및 문제 정의

### 1.0 문제 발견 내러티브

사용자 본인 발화:

> 내가 유튜브에서 '제육볶음', '부대찌개' 이렇게 메뉴명을 검색해서, 그 요리의 레시피를 확인하고 요리를 만드는데, 이전에 보고 따라했었는데, 맛이 어땠는지 조금 간이 세서 뭘 좀 덜 넣어야 더 좋은 레시피가 된다던지 메모를 남겨두고 싶은데 그렇게 하지 못해서 결국 무슨 영상의 레시피를 확인했고, 내가 따라했었고, 어땠는지 확인할 수 없어서 실패했던 레시피라도 똑같이 따라할 수 밖에 없게 됐어.

**발견 흐름 (4단계)**

1. 사용자는 동일 메뉴를 격주(2주 1회)로 만들며 매번 새로 검색한다. 시도할 때마다 이전 경험을 회상하는 데 시간과 에너지를 소모한다.
2. 어떤 우회 수단도 사용하지 않는다. 메모 앱·유튜브 좋아요·재생목록 중 어느 것도 도입하지 않았다. **현재 우회 수단 = 0** — 이는 사용자가 도구를 적극적으로 시도하지 않은 게 아니라 마땅한 도구가 없어 체념한 상태이며, unmet need가 강한 신호다.
3. 사용자 본인 발화: "검색 실패는 한 번도 없다. 거기 레시피가 얼마나 많은데." — **검색은 문제가 아니다.** 진짜 문제는 결과를 기억할 방법이 없어 실패한 영상을 또 따라가게 되는 것과, 본인이 변형한 이력이 사라지는 것이다.
4. 사용자 자기 귀인: **"내가 멍청한 게 아니라 도구 부재"** — 이 불편함을 시스템 문제로 명확히 인식하고 있다.

풍부한 콘텐츠 공급(YouTube)에 비해 빈약한 개인 메모리(회상·평가 누적·변형 이력 추적)가 갭의 본질이다. 사용자가 도구를 적극적으로 시도하지 않은 것이 아니라 마땅한 도구가 없어 체념한 상태이며, 이는 시스템 차원의 미충족 욕구다.

### 1.1 페르소나

유튜브 레시피 영상을 활용해 직접 요리하는 단일 사용자(본인).

### 1.2 JTBD (Job To Be Done)

> 유튜브에서 찾은 레시피를 따라 요리할 때, 이전의 실패 경험과 나만의 변형 이력을 기억하기 위해, 같은 실수를 반복하지 않고 매번 더 나은 결과를 만들고 싶다.

### 1.3 핵심 페인 포인트 (우선순위순)

| 순위 | 페인                       | 설명                                                                                               |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| P1   | 실패 반복 / 누적 학습 부재 | 이전 실수를 매번 처음부터 떠올려야 함. 같은 실패를 반복하게 됨.                                    |
| P2   | 회상 비용                  | 이전에 봤던 영상·결과·문제 지점을 기억해내는 데 시간·에너지를 과도하게 소모.                       |
| P3   | 저품질 영상 재선택         | 결과가 좋지 않았던 영상을 또 선택하게 됨. 영상 단위 평가가 누적되지 않음.                          |
| P4   | 커스텀 변형 망각           | "지난번엔 간장을 절반만 넣었었는데" 같은 본인의 조정 이력이 사라짐. 나만의 버전이 만들어지지 않음. |
| P5   | 간 조절 실패               | 어디서 어떻게 조정했는지 메모가 없어 개선 불가.                                                    |

### 1.4 빈도·심각도

- **빈도**: 동일 메뉴를 격주(2주 1회) 반복 시도. 시도할 때마다 발생.
- **심각도**: 높음. 시간 낭비(P2) + 결과 품질 저하(P1) + 동기 저하("또 실패할 것 같다") 세 가지가 복합 작용.

### 1.5 핵심 인사이트

검색은 문제가 아니다(§1.0 참조). 진짜 문제는 회상 + 누적 학습 부재이며, 현재 우회 수단이 0인 상태에서 시스템 차원의 미충족 욕구가 명확히 확인된다.

---

## 2. 솔루션 개요

### 2.1 제품 한 줄 정의

유튜브 레시피 영상으로 요리하는 사용자가 이전 실패와 변형 이력을 누적·참조하여 매번 더 나은 결과를 만들 수 있도록 돕는 개인 요리 학습 도구.

### 2.2 솔루션 접근

메뉴(Dish) 단위로 유튜브 영상을 검색·저장하고, 영상(Video)별로 시도(Attempt) 기록을 누적한다. Attempt는 단계별 메모(Step) 목록을 포함하여 영상 재생 시점과 연결된 세부 기록이 가능하다. 누적된 기록(평점, 변경 사항, 개선 메모, 단계별 메모)과 영상 단위 thumbs(up/down)를 바탕으로 검색 결과 정렬을 개인화하여 회상 비용과 저품질 영상 재선택을 방지한다.

### 2.3 페인 ↔ 기능 매핑

| 페인 ID | 페인명                     | 해소 기능 (§4.x)                           | 작동 방식                                                                         |
| ------- | -------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| P1      | 실패 반복 / 누적 학습 부재 | §4.3 시도 기록, §4.5 description 노출      | rating + improvement_note + steps 누적이 다음 시도에 참조됨                       |
| P2      | 회상 비용                  | §4.2 검색 결과 정렬, §4.6 메뉴 페이지 통합 뷰, §4.7 메인 화면 | thumbs up 우선 노출 + Dish 단위 시도 이력 통합 + 최근 시도 영상 즉시 접근       |
| P3      | 저품질 영상 재선택         | §4.2 디부스트, §4.4 thumbs                 | thumbs down 영상이 일반 영역에서 디부스트                                         |
| P4      | 커스텀 변형 망각           | §4.3 시도 기록 (changes, steps)            | 영상 레시피 대비 본인 변경 사항 영구 기록 + 단계별 메모로 세부 조정 이력 보존    |
| P5      | 간 조절 실패               | §4.3 시도 기록 (rating + improvement_note + steps) | 어떤 조정이 좋았는지·아쉬웠는지 단계별로 기록하여 다음 시도에 참조        |

---

## 3. 데이터 모델

### 3.1 Dish (메뉴)

사용자가 요리하려는 메뉴. 검색 진입점.

| 필드 | 타입   | 제약     | 설명                                             |
| ---- | ------ | -------- | ------------------------------------------------ |
| name | string | not null | 메뉴명 (예: "제육볶음"). 사용자가 입력한 검색어. |

**삭제 정책**: 연결된 Video가 없는 Dish만 hard delete 가능. Video가 존재하면 삭제 deny + 안내 ("먼저 영상을 정리해주세요"). Dish는 soft delete 없이 hard delete only — Tech(Drizzle 스키마)와 일치.

### 3.2 Video (영상)

Dish : Video = 1 : N. 유튜브 영상 1개에 해당.

| 필드                    | 타입     | 제약     | 설명                                |
| ----------------------- | -------- | -------- | ----------------------------------- |
| video_id                | string   | not null | 유튜브 video_id                     |
| title                   | string   | not null | 영상 제목                           |
| channel                 | string   | not null | 채널명                              |
| thumbnail_url           | string   | not null | 썸네일 URL                          |
| published_at            | datetime | nullable | 유튜브 publishedAt                  |
| thumbs                  | enum     | —        | up / down / 미설정 (초기값: 미설정) |
| is_hidden                    | boolean  | not null, default false | 사용자 숨김 토글. true면 검색 결과·메뉴 페이지에 노출 안 함. |
| is_unavailable_on_youtube    | boolean  | not null, default false | 유튜브에서 정상 접근 불가 (삭제 / 비공개 / removed 모두 포함) 감지 시 true. 시도 기록 보존. |

**파생 필드 (저장 아님, 런타임 계산)**

| 필드           | 계산 방식                                                     |
| -------------- | ------------------------------------------------------------- |
| average_rating | 해당 Video에 연결된 모든 Attempt의 rating 평균 (소수점 1자리) |
| attempt_count  | 해당 Video에 연결된 Attempt 레코드 수                         |
| last_tried_at  | 해당 Video에 연결된 Attempt 중 tried_at 최신값                |

**UNIQUE 제약**: `(youtube_video_id, dish_id)` — Dish 단위 동일 영상 중복 저장 방지. 동일 Dish에 동일 YouTube 영상을 재저장(upsert) 시 title·channel·thumbnailUrl·publishedAt 메타데이터만 갱신.

**삭제 정책**: Attempt(시도 기록)가 1건 이상 존재하는 Video는 hard delete deny. 대신 `is_hidden = true` 토글 제공(검색 결과·메뉴 페이지에서 비노출). Attempt 없는 Video는 hard delete 가능.

### 3.3 Attempt (시도)

Video : Attempt = 1 : N. 한 번의 요리 시도.

| 필드             | 타입      | 제약                | 설명                                 |
| ---------------- | --------- | ------------------- | ------------------------------------ |
| rating           | float     | 0.0 ~ 5.0, 0.5 단위 | 시도 결과 평점                       |
| changes          | text      | nullable            | 영상 레시피 대비 변경 사항 자유 기술 |
| improvement_note | text      | nullable            | 다음 시도를 위한 개선 메모           |
| tried_at         | date      | not null            | 시도 날짜                            |
| deleted_at       | timestamp | nullable            | soft delete 시각. null = 활성. 30일 후 자동 hard delete. |

**생성 트리거**: 명시적 "기록하기" CTA 실행 시만 생성. thumbs up/down 변경은 Video 단위 상태 변경이며 Attempt를 생성하지 않음. 단순 영상 조회·진입 후 이탈도 Attempt를 생성하지 않음.

**삭제 정책**: soft delete (deleted_at 기록). 30일 휴지통 유지 후 자동 hard delete. 30일 내 복구 가능. soft delete 중 하위 Step은 함께 숨김 처리되며 복구 시 함께 다시 노출된다. 30일 후 Attempt가 hard delete될 때 하위 Step은 FK cascade로 함께 hard delete된다.

**편집**: 생성 후 사후 edit 가능.

### 3.4 Step (단계별 기록)

Attempt : Step = 1 : N. 하나의 시도 안에서 단계별 메모.

| 필드            | 타입      | 제약              | 설명                                                              |
| --------------- | --------- | ----------------- | ----------------------------------------------------------------- |
| id              | uuid      | PK                | 식별자                                                            |
| attempt_id      | uuid      | FK, not null      | 상위 Attempt 참조                                                 |
| note            | text      | not null          | 단계별 메모 자유 입력                                             |
| video_timestamp | integer   | nullable, 초 단위 | 영상 재생 시점 (초). YouTube IFrame Player API `getCurrentTime()` 자동 캡처 또는 수동 입력. |
| deleted_at      | timestamp | nullable          | 개별 Step soft delete 시각. null = 활성. 상위 Attempt soft delete 중에는 함께 숨김 처리되며, Attempt hard delete 시 FK cascade로 삭제. |
| created_at      | timestamp | not null          | 생성 시각                                                         |

**video_timestamp 캡처 방식**:
- 영상이 IFrame 임베드 가능한 경우: YouTube IFrame Player API `player.getCurrentTime()` 호출로 자동 캡처. 사용자가 "지금 시간 기록" 트리거 시 현재 재생 초를 저장.
- 영상이 임베드 차단된 경우: IFrame 미제공 → 수동 입력 폴백 (mm:ss 직접 입력 또는 null 허용).

**삭제 정책**: 상위 Attempt soft delete 중에는 함께 숨김 처리. 상위 Attempt 복구 시 함께 다시 노출. 상위 Attempt hard delete 시 FK cascade로 삭제. 개별 Step 삭제·편집 가능.

---

## 4. 기능 요구사항

### 4.1 메뉴 검색

- 사용자가 메뉴명을 입력하면 유튜브 Data API v3 `search.list`를 호출하여 관련 영상 목록을 반환한다.
- 검색 결과는 4.2의 정렬 로직에 따라 노출한다.
- API quota 보호를 위해 캐시 및 디바운스를 적용한다. (구체적 캐시 정책은 ENGINEER 페이즈에서 결정)
- **자동완성**: 사용자가 메뉴명을 입력하는 도중 기존 저장된 Dish 이름 중 일치하는 항목을 dropdown으로 제안한다. 매칭 방식: `LOWER(name) LIKE LOWER('%query%')` LIKE 매칭. 한국어 형태소 분석 미적용 (MVP). 화면 구성(dropdown 표시 형태)은 DESIGN 페이즈에서 결정.

### 4.2 검색 결과 정렬 로직

검색 결과는 두 영역으로 구성된다.

**우선 노출 영역 (thumbs up 영상)**

- 조건: 해당 Dish에서 사용자가 thumbs up 처리한 Video가 1개 이상 존재할 때만 표시.
- 내용: thumbs up Video를 average_rating 내림차순으로 정렬하여 노출.
- thumbs up이 0개이면 우선 노출 영역 자체를 표시하지 않는다.

**일반 노출 영역 (최신순 영상)**

- 내용: 우선 노출 영역에 포함되지 않은 나머지 영상을 published_at 내림차순(최신순)으로 노출.
- thumbs down Video는 이 영역에 포함되되, 디부스트 처리된다. (디부스트 표현 형태는 DESIGN 페이즈에서 결정)
- `is_hidden = true` Video는 검색 결과에 노출하지 않는다.
- `is_unavailable_on_youtube = true` Video는 검색 결과에 노출하지 않는다.

### 4.3 시도 기록 (Attempt)

- Attempt 생성 트리거: 사용자가 명시적으로 "기록하기" CTA를 실행할 때만 Attempt 레코드를 생성한다. thumbs 변경·단순 영상 조회는 Attempt를 생성하지 않는다.
- 입력 항목: rating, changes, improvement_note, tried_at.
- 시도 기록 입력 시 사용자는 Step을 여러 개 추가할 수 있다. 각 Step에 note(자유 메모)와 video_timestamp(재생 시점, 선택)를 기록한다.
- 동일 Video에 대해 복수의 Attempt 생성이 가능하다.
- Attempt 생성 후 해당 Video의 average_rating, attempt_count, last_tried_at이 자동으로 재계산된다.
- Attempt 및 하위 Step은 사후 edit 가능하다.
- **YouTube IFrame Player API 연동**: 영상이 IFrame 임베드 가능한 경우 `player.getCurrentTime()`으로 재생 시점을 자동 캡처하여 Step.video_timestamp에 저장. 임베드 차단 영상은 수동 입력 또는 null 허용.

### 4.4 thumbs (영상 평가)

- 사용자는 Video 단위로 thumbs 상태(up / down / 미설정)를 설정할 수 있다.
- thumbs 상태는 토글 방식으로 변경 가능하다. (up → 미설정, down → 미설정 포함)
- thumbs 변경은 즉시 검색 결과 정렬에 반영된다.
- thumbs 변경은 Attempt를 생성하지 않는다.

### 4.5 description · 상위 댓글 1개 노출 (d-1차)

- Video 상세 영역에서 유튜브 Data API v3를 통해 다음 두 가지를 가져와 원본 그대로 노출한다.
  - `videos.list`의 `snippet.description`
  - `commentThreads.list`의 **상위 댓글 1개 (best-effort, 고정 댓글 포함 가능성 있으나 API상 보장 X)**
- **가공 및 요약 없음.** 원문 텍스트를 그대로 노출하는 것이 이 기능의 요구사항이다.
- description 텍스트 길이에 대한 max length 처리 정책이 필요하다. (표시 형태는 DESIGN 페이즈에서 결정)
- **폴백**: 채널 소유자가 댓글을 비활성화한 영상은 `commentThreads.list` 접근 불가(403 `commentsDisabled`) → 댓글 영역 미표시, description만 노출.
- **영상 임베드 폴백**: 일부 영상은 외부 임베드 차단 → 유튜브 외부 링크로 fallback. 이 경우 `player.getCurrentTime()` 사용 불가 → Step.video_timestamp 수동 입력 또는 null.

### 4.6 메뉴 페이지 (Dish 단위 통합 뷰)

- Dish 단위로 묶인 모든 Video와 각 Video의 Attempt 이력을 통합하여 제공하는 데이터 구조를 갖는다.
- 포함 데이터: Dish명, 연결된 Video 목록(각 Video의 average_rating, attempt_count, last_tried_at 포함), Video별 Attempt 이력 전체(각 Attempt의 Step 목록 포함).
- 메뉴 페이지에서는 `is_hidden = false` Video만 노출한다.
- 화면 구성(레이아웃, 컴포넌트 배치 등)은 DESIGN 페이즈에서 결정한다.

### 4.7 메인 화면 (첫 진입점)

메인 화면은 사용자가 앱에 처음 진입했을 때 보이는 화면이다. 데이터 영역만 정의하며 화면 구성·레이아웃은 DESIGN 페이즈에서 결정한다.

**데이터 구조**:
- 검색바: 메뉴명 입력 진입점 (§4.1 연결).
- 최근 시도 영상 5개: `Attempt JOIN Video ORDER BY tried_at DESC LIMIT 5`. 각 Video의 title, thumbnail_url, last_tried_at 포함. P2(회상 비용) 직결 — 마지막으로 시도한 영상에 빠르게 재접근 가능.
- 자주 만든 Dish Top 3: `Dish JOIN Attempt count ORDER BY count DESC LIMIT 3`. 각 Dish의 name, attempt_count 포함.

**신규 사용자 (Attempt 0건) 처리**: 최근 시도 영상·자주 만든 Dish 영역 대신 빈 상태 표시. 빈 상태 구체적 표현은 DESIGN 페이즈에서 결정.

### 4.8 삭제 정책

| 엔티티  | 정책                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| Attempt | soft delete (deleted_at 기록). 30일 휴지통 후 자동 hard delete. 30일 내 복구 가능. soft delete 중 하위 Step 숨김, hard delete 시 하위 Step FK cascade. |
| Step    | 상위 Attempt에 종속. Attempt soft delete 중 숨김·복구 연동, Attempt hard delete 시 cascade. 개별 Step 삭제·편집 독립적으로 가능. |
| Video   | Attempt ≥1건이면 hard delete deny. 대신 `is_hidden = true` 토글 제공 (검색 결과·메뉴 페이지 비노출). Attempt 0건이면 hard delete 가능. |
| Dish    | 연결된 Video가 없는 경우만 hard delete 가능. Video 존재하면 deny + 안내 ("먼저 영상을 정리해주세요").       |

### 4.9 영상 유튜브 접근 불가 감지

- 유튜브에서 영상에 정상 접근이 불가한 경우 (삭제·비공개·removed 모두 포함) Video 레코드의 `is_unavailable_on_youtube = true`로 설정한다.
- 감지 시점: YouTube API videos.list에서 items[] 빈 응답 시 감지 (lazy check — 상세 조회 시점). YouTube IFrame API error 100도 동일 처리 (삭제 또는 비공개로 구분 불가).
- 참고: YouTube API는 삭제와 비공개를 구분하지 않음 — "사용할 수 없는 영상"으로 통합 처리.
- `is_unavailable_on_youtube = true` Video는 검색 결과에 노출하지 않는다. 메인 화면 "최근 시도" 및 메뉴 페이지에는 노출하되 사용자가 인지할 수 있도록 "사용할 수 없는 영상" 표시로 처리한다. (시각 처리 형태는 DESIGN 페이즈에서 결정)
- **시도 기록(Attempt) 및 Step 보존**: 영상이 유튜브에서 접근 불가 상태가 되더라도 해당 Video에 연결된 모든 Attempt·Step 데이터는 삭제하지 않는다. P1·P4 페인 직결 — 누적 학습 보존 우선.

---

## 5. MVP 스코프

### 5.1 1차 릴리스 포함 기능

| ID    | 기능                                                                                    | 연결 섹션       |
| ----- | --------------------------------------------------------------------------------------- | --------------- |
| a     | 메뉴 검색 + 영상 리스트 + **자동완성** (기존 Dish LIKE 매칭 dropdown 제안)              | 4.1, 4.2        |
| b     | 시도 기록 (rating / changes / improvement_note / tried_at) + **steps 단계별 기록 + YouTube IFrame timestamp 자동 캡처** | 4.3 |
| c     | thumbs up/down + 검색 정렬 (디부스트 / 우선 노출 로직)                                  | 4.4, 4.2        |
| d-1차 | description + 상위 댓글 1개 (best-effort) 원본 통과 노출                                | 4.5             |
| e     | 메뉴 페이지 (Dish 단위 통합 뷰)                                                         | 4.6             |
| g     | 메인 화면 (최근 시도 영상 5개 + 자주 만든 Dish Top 3)                                   | 4.7             |
| —     | 삭제 정책 (Attempt soft delete / Video 숨김 / Dish 빈 것만 삭제)                        | 4.8             |
| —     | 영상 유튜브 접근불가 감지 + is_unavailable_on_youtube 처리                               | 4.9             |

### 5.2 Phase 2 백로그 (1차 릴리스 제외)

| ID    | 기능                                                                                    | 1차 제외 이유              |
| ----- | --------------------------------------------------------------------------------------- | -------------------------- |
| d-2차 | LLM 요약 — description + 상위 댓글 1개를 LLM으로 정리해 깔끔한 레시피로 노출           | H1 가설 검증 후 결정       |
| f     | 통계 / 그래프 — 별점 시계열 등 실력 향상 추적                                          | 기록 데이터 축적 후 유의미 |
| h     | 부분 검색 통합 결과 — "제육"으로 "제육볶음 / 제육덮밥 / 고추장 제육" 등 묶음 표시. 한국어 형태소·동의어 처리 포함. | 실사용 후 사용자가 부분 검색을 자주 사용하는지 모니터링 후 도입 검토. |

---

## 6. 검증 가설

MVP에서 검증할 핵심 가설. 각 가설의 결과가 Phase 2 기능 및 방향을 결정한다.

| ID  | 가설                                                                                                                                               | 검증 방법                                                                                                         | 연결 페인  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| H1  | description + 상위 댓글 1개 **원본 노출만으로** 사용자가 영상에 적힌 레시피 정보를 충분히 얻을 수 있다.                                            | d-2차(LLM 요약) 도입 필요성을 사용자가 직접 요청하는지 여부                                                       | —          |
| H2  | thumbs down 디부스트가 저품질 영상 재선택(P3)을 실제로 줄인다.                                                                                     | thumbs down 디부스트 도입 후 사용자 자기보고로 "저품질 영상에 다시 들어가는 일이 줄었나" 회고 (분기별)            | P3         |
| H3  | 별점 평균 높은 순으로 thumbs up 영상을 우선 노출하는 정렬 방식이 회상 비용(P2)을 실제로 줄인다.                                                    | thumbs up 정렬 도입 후 사용자 자기보고로 "회상 시간이 줄었나" 회고 (분기별)                                       | P2         |
| H4  | Attempt 단위 기록(rating + changes + improvement_note + **단계별 steps**)이 다음 시도에 실제로 참조되어 실패 반복(P1)·커스텀 변형 망각(P4)·간 조절 실패(P5)를 줄인다. | 동일 Video 2회 이상 시도 시 rating 상승 추이. 추가 차원: 단계별 기록(steps)이 다음 시도에 참조되는지 자기보고 회고. | P1, P4, P5 |

> **성공 지표(M1~M4)와 가설 검증(H1~H4)의 영역 구분**
>
> - **성공 지표(M1~M4)**: DB에서 직접 측정 가능한 행동 데이터. 운영 측정 목적.
> - **가설 검증(H1~H4)**: 운영 측정 외 정성 신호 포함 가능 (자기보고 회고 허용). 가정 검증 목적.
>
> 두 영역은 서로 다른 목적을 가진다. 성공 지표는 제품이 사용되는지 측정하고, 가설 검증은 사용이 실제 페인을 해소하는지 확인한다.

---

## 7. 성공 지표

### 7.1 지표 선택 근거

성공 지표는 **S2 행동 지표** 기준으로 설정한다. 사용자가 실제로 도구를 사용하는 행동 데이터에서 직접 측정 가능한 지표만 포함한다.

### 7.2 1차 릴리스 성공 지표

| 지표 ID | 지표명                  | 정의                                                                                                                      | 연결 페인  |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| M1      | Attempt 생성 횟수       | 사용자가 생성한 Attempt 레코드 총 수                                                                                      | P1, P4, P5 |
| M2      | thumbs 등록 누적 수     | thumbs up + thumbs down 처리된 Video의 총 수 (미설정 제외)                                                                | P3         |
| M3      | 재시도 영상 비율        | 동일 Video에 Attempt가 2건 이상 발생한 Video 수 / 시도된 전체 Video 수. P1 "실패 반복" 개선 여부의 직접 신호.            | P1         |
| M4      | Step 평균 개수 per Attempt | 생성된 Attempt당 평균 Step 수. 사용자가 단계별 기록을 적극적으로 활용하는지 신호. 낮으면 UX 단순화 또는 Step 폐지 검토. | P1, P4     |

---

## 8. 기술 제약

| 항목                            | 제약 내용                                                       | 대응 방향                                                               |
| ------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| YouTube Data API v3 quota       | 기본 10,000 units/day. `search.list` = 100 units/call로 무거움. | 검색 결과 캐시 + 디바운스 적용. 구체적 정책은 ENGINEER 페이즈에서 결정. |
| `commentThreads.list` 접근 제한 | 채널 소유자가 댓글 비활성화한 영상은 상위 댓글을 가져올 수 없음 (403 `commentsDisabled`). | 폴백: 댓글 영역 미표시, description만 노출.                            |
| 영상 임베드 제한                | 일부 영상은 외부 임베드 차단.                                   | 폴백: 유튜브 외부 링크로 연결. YouTube IFrame Player API `getCurrentTime()` 사용 불가 → Step.video_timestamp 수동 입력 또는 null. |
| description 텍스트 길이         | 길이 무제한. 매우 긴 description 존재 가능.                     | max length 처리 정책 필요. 표시 형태는 DESIGN 페이즈에서 결정.          |
| YouTube IFrame Player API       | `getCurrentTime()` 메서드로 현재 재생 시점(초) 반환. IFrame 임베드가 가능한 영상에서만 동작. 임베드 차단 영상은 IFrame 자체가 미제공 → `getCurrentTime()` 호출 불가. | 임베드 차단 영상: 수동 timestamp 입력 폴백 (mm:ss 직접 입력 또는 null 허용). |

---

## 9. 비-목표

명시적으로 이 제품의 범위 밖인 항목.

- 레시피 자동 추천 / 새 레시피 탐색 (탐색은 페인이 아님 — 사용자 명시)
- 유튜브 외 플랫폼 지원 (블로그, 앱 레시피 등)
- 식단·칼로리 관리, 건강 목적 기능
- 식재료 구매·재고 관리
- 부분 검색 통합 결과 (한국어 형태소·동의어 처리) — Phase 2 (§5.2 h 항목)

### 9.5 Risk · Mitigation

| 리스크 ID | 시나리오 (가정이 깨질 때)                                                    | 시그널                                                                                              | 완화·분기                                                                                                                  |
| --------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| RM1       | H1 깨짐 — description + 상위 댓글 1개만으론 레시피 정보 부족                 | 사용자가 LLM 요약을 자발적으로 요청 / 영상 본편으로 직접 이동 빈도 높음                            | d-2차(LLM 요약, Phase 2) 즉시 진입 트리거                                                                                 |
| RM2       | H2 효과 약함 — thumbs down 디부스트가 P3(저품질 영상 재선택) 미해소          | 분기별 자기보고 회고에서 "여전히 별로였던 영상에 또 들어간다" 부정 신호                            | 정렬 알고리즘 재설계 — 디부스트 강도 증가, 또는 thumbs down 영상을 별도 하단 섹션으로 격리                                |
| RM3       | H3 효과 약함 — thumbs up 정렬이 P2(회상 비용) 미해소                        | 분기별 자기보고 회고에서 "여전히 회상에 시간 쓴다" 부정 신호                                       | 정렬 기준 재검토 — average_rating DESC → last_tried_at DESC 또는 attempt_count DESC 등으로 변경 실험                      |
| RM4       | H4 효과 약함 — Attempt 기록이 다음 시도에 미참조                             | M3(재시도 영상 비율)에서 동일 Video 2회+ 시도의 rating 상승 추이 부재                              | 시도 기록 노출 위치·시점 UX 재검토. 영상 카드에 "지난 시도 메모" 미리보기 강화 등 (DESIGN 페이즈에서 결정)                |
| RM5       | YouTube Data API quota 초과                                                  | M2 정상이나 검색 실패 빈발, OQ4 트리거                                                              | 캐시 TTL 24h → 72h/7d 연장, 또는 quota 증액 신청                                                                          |
| RM6       | commentThreads 비활성화율 높음                                               | 영상 상세에서 댓글 영역 미표시 빈도 추적                                                            | description만으로 충분한지 사용자 확인 후 d-2차 우선순위 상향 검토                                                        |
| RM7       | 자체 구현 컴포넌트 a11y 회귀                                                 | Vitest a11y 테스트 FAIL, 사용자 키보드 navigation 불편 보고                                         | Radix Dialog/Vaul 도입 검토 — 자체 구현 → headless 위임 전환                                                              |
| RM8       | IFrame Player API 차단율 높음 — `getCurrentTime()` 사용 불가 영상 다수       | Step.video_timestamp null 비율 높음 (M4 세부 분석 시 확인 가능)                                    | 수동 timestamp 입력 폴백으로 대응 OK인지 자기보고 회고. 불편하면 timestamp 기능 자체 비중 축소 검토.                       |
| RM9       | Step 사용률 낮음 — M4(Step 평균 개수) 지속 낮음                              | M4 값이 1.0 미만 (Attempt당 Step 거의 미사용)                                                      | UX 단순화 — Step 입력 진입점 개선. 또는 Step 기능 자체 비중 축소 혹은 Phase 2로 이전 검토.                                |

---

## 10. 열린 질문

### 10.1 Open Questions (미결)

| ID  | 질문                                                                                                    | 결정 시점      |
| --- | ------------------------------------------------------------------------------------------------------- | -------------- |
| OQ5 | 자동완성 한국어 매칭 정확도 — 실사용 후 부정확 빈발 시 `pg_trgm` GIN index 도입 검토. 트리거 기준 미결. | 실사용 후 결정 |

### 10.2 Resolved Questions (해소 완료)

| ID  | 질문                                                                                     | 해소 내용                                                                                      |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| OQ1 | description max length 정책 — 어느 길이까지 바로 노출하고 어디서 접을 것인가.           | 300자 즉시 노출 → "더 보기" 토글 → 인라인 전체 확장. → design-decision §description 노출 항목  |
| OQ2 | thumbs up 영상이 0~2개일 때 우선 노출 영역 처리.                                         | 0개 시 섹션 자체 미표시 (별도 Empty UI 없음). → §4.2 로직 및 design-decision §Empty 상태       |
| OQ3 | 캐시 정책 구체화 — TTL, 캐시 키 설계 등.                                                 | 24h TTL, cache_key prefix 규칙 (`search:` / `video:`). → tech-decision §5.3                    |
| OQ4 | YouTube Data API quota 초과 시 사용자 경험 처리.                                         | 429 → 클라이언트 "잠시 후 다시 시도해주세요" Empty 상태 + 재시도 CTA. → design-decision RM5 / tech-decision §5.3 |
| OQ6 | Step.video_timestamp가 영상 실제 길이를 초과한 경우 검증 정책 (허용 여부).               | 0 이상 정수 또는 null만 허용(zod). 영상 길이 초과 허용(사용자 기록 보존). 음수 거부(400). → tech-decision §7.3 |

---

## 부록 — 합의 이력

| 날짜       | 항목             | 내용                                                           |
| ---------- | ---------------- | -------------------------------------------------------------- |
| 2026-05-03 | 문제 정의 합의   | JTBD, 페르소나, 핵심 페인 5종, 비-목표 4종 확정                |
| 2026-05-03 | 데이터 모델 합의 | Dish / Video / Attempt 3-tier 구조 확정                        |
| 2026-05-03 | 동작 로직 합의   | 검색 정렬, thumbs, description/고정댓글, 메뉴 페이지 로직 확정 |
| 2026-05-03 | MVP 스코프 합의  | a, b, c, d-1차, e 포함 / d-2차, f는 Phase 2                    |
| 2026-05-03 | 가설 합의        | H1 ~ H4 확정                                                   |
| 2026-05-03 | 성공 지표 합의   | S2 행동 지표 기준 M1 ~ M3 확정                                 |
| 2026-05-03 | UI 분리 원칙     | PRD에 UI 묘사 포함 금지 — 영구 가이드 (사용자 명시)            |
| 2026-05-03 | prd-writer rewind 1차 | 사용자 명시 요청 — B1 §1.0 문제 발견 내러티브, B2 §2.3 페인↔기능 매핑, B3 §9.5 Risk·Mitigation, B4 참고 문서 박스 추가. review-loop 2R + prd-review 재실행. |
| 2026-05-03 | prd-writer rewind 2차 | 사용자 명시 요청 (외부 팀 리뷰 + 본인 코멘트 6개 결정 영역) — B1 자동완성 MVP / 부분 검색 Phase 2, B2 영상 유튜브 삭제 엣지, B4 Attempt 생성 트리거, B5β Step 엔티티 + YouTube IFrame timestamp, B6 삭제 정책, B7-A 메인 화면. §3 Step 신규, §3.1~3.2 필드 확장, §4.1 자동완성, §4.3 트리거·Steps·timestamp, §4.7~4.9 신규, §5 g·h 항목, §6 H4 보강, §7 M4 추가, §8 IFrame 제약, §9 비-목표 확장, §9.5 RM8·RM9 신규, §10 OQ5·OQ6 신규. review-loop 1R + prd-review 재실행. |
| 2026-05-08 | ALIGN 6차 rewind | §3.2 Video UNIQUE 제약(youtube_video_id, dish_id) 명시 추가. L45~L48 결정 반영. |
