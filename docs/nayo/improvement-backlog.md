# improvement-backlog.md — nayo 세션 (2026-05-03 ~ 2026-05-14)

> session-wrap 압축 모드. Hermes가 누적된 friction_signals를 직접 정리.
> 4-agent (Hera·Zeus·Demeter·Hestia) skip — 사용자 피로 강.

---

## 누적 신호 요약

### v0.4 사이클 (2026-05-03 ~ 2026-05-08)
- **gap_signals**: 0건 (전부 RESOLVED — DESIGN-GAP-1·2, H2·H3 클릭 이벤트, OQ6 등)
- **friction_signals**: 5건 (개선 입력)

### v0.5 PIVOT 사이클 (2026-05-14)
- **gap_signals**: 0건 (ALIGN v0.5 완료 — Critical 0 / Major 0 / Minor 5 auto-fixed)
- **friction_signals**: 4건 신규 (하단 F4-1~F4-4 참조)

---

## L1 — Quick Fix (즉시 적용 가능)

### F1-1. doc-align 체크리스트에 count 쿼리 user_id 필터 항목 추가
- **신호 출처**: ALIGN 5차 (Codex 8건 정정 #2)
- **사유**: ALIGN 4차까지 Video/Dish count 쿼리 user_id 누락이 미발견. 보안 경계 체크리스트 누락이 원인.
- **개선**: doc-align 스킬의 보안 경계 검증 항목에 "모든 count/aggregate 쿼리에 user_id 필터 적용 여부" 명시적 grep 추가.
- **L1 적용 대상**: `skills/doc-align/SKILL.md` 또는 보안 경계 체크리스트 영역.
- **v0.5 사이클 처리 상태**: 자동 적용 완료 — ALIGN v0.5 doc-align 보안 경계 검증(domain 3) 8개 엔드포인트 requireAuth() + ownership chain 전수 확인. 이번 사이클은 수동 적용 기준.

### F1-2. doc-align 외부 API 사실 검증 체크리스트
- **신호 출처**: ALIGN rewind 1차 (Codex Major 1: commentThreads.list pinned 보장 X), ALIGN 5차 (Codex Major 4: YouTube 삭제 단정성)
- **사유**: 외부 API 명세를 체크하지 않고 기능 명세를 통과시킴. PRD/tech의 외부 API 호출부가 공식 문서와 어긋나는 케이스가 두 번 발생.
- **개선**: doc-align 스킬에 "외부 API 호출 명세는 공식 문서 cross-check 필수" 항목 추가.
- **v0.5 사이클 처리 상태**: 자동 적용 완료 — v0.5 PIVOT에서 외부 API 의존성 변경(YouTube Data API v3 usage 축소, Gemini API 신규 추가). ALIGN v0.5 domain 4(외부 API)에서 Gemini API 한도 cross-check 완료. LLM 실호출 OOS — 다음 사이클 재검증 필요.

---

## L2 — Enhancement (기획·승인 후 적용)

### F2-1. prd-writer 기본 출력에 §1.0 문제 발견 내러티브 default 포함
- **신호 출처**: 사용자 검토 (Q26 — "사용자 불편→문제 발견→문제 정의" 부재 지적)
- **사유**: PRD가 단독으로 읽혔을 때 "왜 만드는지"의 살아있는 컨텍스트 부족. 표준 PRD 골격은 갖췄으나 발견 내러티브가 약함. 본 세션에서 prd-writer rewind로 보강했으나, 기본 출력에 포함되어 있었으면 회피 가능했음.
- **개선**: prd-writer SKILL의 출력 템플릿에 §1.0 "문제 발견 내러티브" 섹션 default 포함 (raw user input 인용 + 발견 흐름 + unmet need 결론).
- **v0.5 사이클 처리 상태**: 자연 해소 — PRD v0.5는 §1 문제 정의 섹션에 발견 내러티브가 통합되어 작성됨. 스킬 템플릿 자체 수정은 미이행 (다음 사이클 스킬 개선 시 반영).

### F2-2. prd-review R1 기준에 "단독 독해 내러티브 완결성" 항목 추가
- **신호 출처**: 위와 동일
- **사유**: prd-review R1(문제 정의 명확성)이 "단독 독해 시 불편→발견→정의 흐름이 살아있는가"를 명시적으로 검증하지 않음. R1 통과한 PRD에서도 사용자가 "내러티브 약함" 지적 → 기준 자체가 누락.
- **개선**: prd-review SKILL R1 체크리스트에 본 항목 추가.
- **v0.5 사이클 처리 상태**: 자연 해소 — prd-review R1이 §1 내러티브를 암묵적으로 검증하여 PASS. 스킬 체크리스트 명시적 항목 추가는 미이행 (다음 사이클 스킬 개선 시 반영).

---

## L3 — Structural (별도 세션 필요)

### F3-1. doc-align 본문 grep 강제
- **신호 출처**: ALIGN rewind 1차 (Codex Major 3: Right Drawer 본문 미반영)
- **사유**: ALIGN 1차에서 합의 이력만 minor 수정하고 본문 178/307/326 라인은 그대로 잔존. 본문 grep을 강제하지 않은 워크플로우 문제.
- **개선**: doc-align 스킬에 "결정 사항 변경 시 해당 키워드(이전 표현/현 표현 모두) 본문 전체 grep 후 결과 검증" 강제 단계 도입.
- **v0.5 사이클 처리 상태**: 미변경 유지 — v0.5 PIVOT에서 전체 재작성으로 구 표현 잔존 문제가 없었음. 스킬 레벨 구조 변경은 미이행 (별도 세션 필요).

### F3-2. 외부 팀 리뷰 단계 구조적 도입 검토
- **신호 출처**: 사용자 검토 (팀 리뷰 6건 결정 영역 발굴 — B1·B2·B4·B5β·B6·B7-A)
- **사유**: 본 세션에서 doc-align 4차 통과 후 외부 팀 리뷰(석영·예진·용헌·민정)에서 6개 결정 영역이 추가 발굴됨. 하네스 내부 검증으로는 발견 불가능했던 영역.
- **개선**: 하네스에 "외부 팀 리뷰 단계"를 ALIGN 이전 또는 prd-writer 완료 직후에 구조적으로 도입 검토. 단, 1인 사이드 프로젝트와 조직 사용을 구분해 옵셔널 처리.
- **v0.5 사이클 처리 상태**: 미변경 유지 — v0.5 PIVOT은 user_scope=decision-log로 설계 패키지 완성에 집중. 별도 세션 의제로 이월.

---

## L4 — v0.5 PIVOT 신규 friction (2026-05-14 추가)

### F4-1. PRD 스키마와 삭제 정책 동기화 체크리스트 누락
- **신호 출처**: ALIGN v0.5 doc-align (Minor 불일치 — PRD §3.2 Recipe 스키마에 archived_at 필드 누락)
- **사유**: PRD v0.5 §3.2 Recipe 스키마 표에 archived_at 컬럼이 없었으나, §3.7 삭제 정책에서는 "archived 상태로 전환" 정책이 명시되어 있었음. Tier 1 자동 수정으로 해소했으나, PRD 작성 단계에서 "삭제 정책 ↔ 스키마 필드 1:1 매핑 확인" 체크리스트가 있었으면 사전 방지 가능.
- **개선 대상**: prd-writer SKILL 또는 prd-review 체크리스트에 "삭제 정책에 등장하는 상태 값(archived, deleted_at 등)이 스키마 표 컬럼에 모두 매핑되었는가" 검증 항목 추가.
- **분류**: L2 (기획·승인 후 적용)

### F4-2. DESIGN 페이즈가 archived 표현을 먼저 결정 후 tech로 역인계한 순서 역전
- **신호 출처**: ALIGN v0.5 domain 1 cross-check (Design archived_at → Tech 후속 결정 순서)
- **사유**: design-decision.md v2.0에서 "숨긴 레시피 보기" / "보관된 레시피" 섹션을 먼저 결정하고 tech-decision v3.0에서 archived_at timestamptz 스키마를 정의하는 순서가 역전됨. 이상적으로는 Tech가 데이터 모델을 먼저 정의하고 DESIGN이 UI 표현을 파생해야 하나, 현 사이클은 DESIGN이 먼저 진행되어 Tech가 역으로 맞추는 형태가 됨.
- **개선 대상**: 하네스 페이즈 순서 재검토 또는 DESIGN 페이즈에서 신규 상태 필드 도입 시 Tech에게 선확인 단계 도입 권장.
- **분류**: L3 (Structural — 하네스 워크플로우 영향)

### F4-3. Drizzle PARTIAL UNIQUE index 자동 생성 불가 → raw SQL 수동 필요
- **신호 출처**: ALIGN v0.5 domain 1 (RecipeSource PARTIAL UNIQUE — Hephaestus friction)
- **사유**: `(recipe_id, url) WHERE url IS NOT NULL` 부분 인덱스는 Drizzle ORM의 `unique()` 헬퍼로 생성 불가. raw SQL migration이 필요하고 이는 tech-decision §13 Migration STEP 1에 명시되어 있으나, Drizzle 사용자가 사전에 알지 못하면 마이그레이션 후 런타임 에러를 유발할 수 있음.
- **개선 대상**: tech-writer SKILL 또는 doc-align 체크리스트에 "PARTIAL UNIQUE index 사용 시 Drizzle 자동 생성 불가 여부 확인 + 수동 SQL 명세 필수" 항목 추가.
- **분류**: L1 (Quick Fix — 다음 사이클 마이그레이션 실행 전 확인 필수)

### F4-4. H3·H7 정성/정량 분리 기준 모호 — **RESOLVED (2026-05-15, L66)**
- **신호 출처**: ALIGN v0.5 domain 7 (Apollo signal OQ11)
- **사유**: H3(회상 비용 감소 — 정성적 자기보고)와 H7(쿨타임 기능 재진입률 M6 측정 — 정량)이 동일한 "쿨타임 효과" 영역을 중복 다루고 있음. 측정 방법 차이만으로 별도 가설을 등재하는 것이 과연 유의미한지 판단 기준이 없어, OQ11로 미결 처리함.
- **해소**: L66에서 옵션 A(가설 통합) 채택. H3·H7 → H3'로 통합하고 측정 방법 2가지(정성 자기보고 + 정량 M6)를 한 가설에 병행 명시. 신호 갈림 시 OQ12 신설로 분리 재고 트리거.
- **개선 대상 (스킬 보강은 유효)**: prd-writer SKILL 또는 가설 등재 기준에 "동일 인과 경로 가설이 측정 방법만 다를 경우 별도 등재 vs 통합 등재 판단 기준" 명시 권장은 유지 (다음 스킬 진화 입력).
- **분류**: L2 (Enhancement — 가설 체계 명확화)

---

## 세션 통계

### v0.4 사이클
| 지표 | 값 |
|------|-----|
| 페이즈 진행 | DISCOVER → DESIGN → ENGINEER → ALIGN |
| rewind 횟수 (사용자 명시) | 5회 (PRD 1차, ALIGN 4차) |
| rewind_count (자동 재시도) | 0 |
| 산출물 | 11종 (problem-definition / prd v0.4 / design-decision v1.1 / design-system / design-notes-from-discover / tech-decision v2.0 / decision-log v1.4 / harness-state / README / session-transcript / improvement-backlog) |
| 게이트 PASS | review-loop 3R / prd-review R1~R4 / D1~D4 / T1~T5 / doc-align 5차 |
| 의사결정 로그 | L1~L44 |
| 외부 검토 사이클 | 2회 (Codex 6건 + Codex 8건) |
| 팀 리뷰 발굴 결정 | 6건 (B1·B2·B4·B5β·B6·B7-A) |

### v0.5 PIVOT 사이클
| 지표 | 값 |
|------|-----|
| 페이즈 진행 | DISCOVER(rewind) → DESIGN → ENGINEER → ALIGN |
| rewind 횟수 (사용자 명시) | prd-writer rewind 3차 (정체성 전환) |
| rewind_count (자동 재시도) | 0 |
| 산출물 | 4종 신규/갱신 (prd v0.5 / design-decision v2.0 / tech-decision v3.0 / decision-log v2.0) + harness-state 갱신 |
| 게이트 PASS | prd-review R1~R4 / D1~D4 / T1~T6 / doc-align ALIGN |
| 의사결정 로그 신규 | L49~L64 (16개) |
| doc-align 결과 | Critical 0 / Major 0 / Minor 5 (2 auto-fixed, 3 next-cycle) |
| user_scope | decision-log (🏁 종료 지점) |

---

## 다음 세션 Apply Mode 가이드

다음 세션 시작 시 Hermes가 본 파일을 읽고:

### 이월 항목 (즉시 처리)
1. **F4-3 (L1)**: Drizzle PARTIAL UNIQUE raw SQL — 마이그레이션 실행 전 반드시 확인. RecipeSource STEP 1 SQL 확인.
2. **F1-1, F1-2 (L1)**: v0.4 carry-over — 다음 사이클 doc-align 시 수동 체크리스트로 적용.

### 승인 후 처리 항목
3. **F4-1 (L2)**: PRD 스키마-삭제정책 동기화 — prd-writer/prd-review 스킬 개선 시 반영.
4. **F4-4 (L2)**: H3·H7 가설 분리 기준 — prd-writer 가설 등재 기준 보강 시 반영.
5. **F2-1, F2-2 (L2)**: v0.4 carry-over — 스킬 템플릿 개선 시 반영.

### 별도 세션 필요
6. **F4-2 (L3)**: DESIGN↔Tech 데이터 모델 순서 — 하네스 워크플로우 구조 변경 의제.
7. **F3-1, F3-2 (L3)**: v0.4 carry-over — 별도 스킬 개선 세션.

L1은 `skills/{스킬명}/SKILL.md` 편집 대상. L2는 사용자 확인 후 적용. L3는 워크플로우 영향이 크므로 사용자 깊은 합의 후 진행.
