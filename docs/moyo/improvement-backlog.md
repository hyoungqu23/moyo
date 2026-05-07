# improvement-backlog.md — moyo 세션 (2026-05-03 ~ 2026-05-07)

> session-wrap 압축 모드. Hermes가 누적된 friction_signals를 직접 정리.
> 4-agent (Hera·Zeus·Demeter·Hestia) skip — 사용자 피로 강.

---

## 누적 신호 요약

- **gap_signals**: 0건 (전부 RESOLVED — DESIGN-GAP-1·2, H2·H3 클릭 이벤트, OQ6 등)
- **friction_signals**: 5건 (개선 입력)

---

## L1 — Quick Fix (즉시 적용 가능)

### F1-1. doc-align 체크리스트에 count 쿼리 user_id 필터 항목 추가
- **신호 출처**: ALIGN 5차 (Codex 8건 정정 #2)
- **사유**: ALIGN 4차까지 Video/Dish count 쿼리 user_id 누락이 미발견. 보안 경계 체크리스트 누락이 원인.
- **개선**: doc-align 스킬의 보안 경계 검증 항목에 "모든 count/aggregate 쿼리에 user_id 필터 적용 여부" 명시적 grep 추가.
- **L1 적용 대상**: `skills/doc-align/SKILL.md` 또는 보안 경계 체크리스트 영역.

### F1-2. doc-align 외부 API 사실 검증 체크리스트
- **신호 출처**: ALIGN rewind 1차 (Codex Major 1: commentThreads.list pinned 보장 X), ALIGN 5차 (Codex Major 4: YouTube 삭제 단정성)
- **사유**: 외부 API 명세를 체크하지 않고 기능 명세를 통과시킴. PRD/tech의 외부 API 호출부가 공식 문서와 어긋나는 케이스가 두 번 발생.
- **개선**: doc-align 스킬에 "외부 API 호출 명세는 공식 문서 cross-check 필수" 항목 추가.

---

## L2 — Enhancement (기획·승인 후 적용)

### F2-1. prd-writer 기본 출력에 §1.0 문제 발견 내러티브 default 포함
- **신호 출처**: 사용자 검토 (Q26 — "사용자 불편→문제 발견→문제 정의" 부재 지적)
- **사유**: PRD가 단독으로 읽혔을 때 "왜 만드는지"의 살아있는 컨텍스트 부족. 표준 PRD 골격은 갖췄으나 발견 내러티브가 약함. 본 세션에서 prd-writer rewind로 보강했으나, 기본 출력에 포함되어 있었으면 회피 가능했음.
- **개선**: prd-writer SKILL의 출력 템플릿에 §1.0 "문제 발견 내러티브" 섹션 default 포함 (raw user input 인용 + 발견 흐름 + unmet need 결론).

### F2-2. prd-review R1 기준에 "단독 독해 내러티브 완결성" 항목 추가
- **신호 출처**: 위와 동일
- **사유**: prd-review R1(문제 정의 명확성)이 "단독 독해 시 불편→발견→정의 흐름이 살아있는가"를 명시적으로 검증하지 않음. R1 통과한 PRD에서도 사용자가 "내러티브 약함" 지적 → 기준 자체가 누락.
- **개선**: prd-review SKILL R1 체크리스트에 본 항목 추가.

---

## L3 — Structural (별도 세션 필요)

### F3-1. doc-align 본문 grep 강제
- **신호 출처**: ALIGN rewind 1차 (Codex Major 3: Right Drawer 본문 미반영)
- **사유**: ALIGN 1차에서 합의 이력만 minor 수정하고 본문 178/307/326 라인은 그대로 잔존. 본문 grep을 강제하지 않은 워크플로우 문제.
- **개선**: doc-align 스킬에 "결정 사항 변경 시 해당 키워드(이전 표현/현 표현 모두) 본문 전체 grep 후 결과 검증" 강제 단계 도입.

### F3-2. 외부 팀 리뷰 단계 구조적 도입 검토
- **신호 출처**: 사용자 검토 (팀 리뷰 6건 결정 영역 발굴 — B1·B2·B4·B5β·B6·B7-A)
- **사유**: 본 세션에서 doc-align 4차 통과 후 외부 팀 리뷰(석영·예진·용헌·민정)에서 6개 결정 영역이 추가 발굴됨. 하네스 내부 검증으로는 발견 불가능했던 영역.
- **개선**: 하네스에 "외부 팀 리뷰 단계"를 ALIGN 이전 또는 prd-writer 완료 직후에 구조적으로 도입 검토. 단, 1인 사이드 프로젝트와 조직 사용을 구분해 옵셔널 처리.

---

## 세션 통계

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

---

## 다음 세션 Apply Mode 가이드

다음 세션 시작 시 Hermes가 본 파일을 읽고:
1. **L1 (F1-1, F1-2)**: 자동 적용 → "2개 항목 자동 반영했습니다" 고지
2. **L2 (F2-1, F2-2)**: 1줄 요약 보고 → 사용자 확인 → 적용
3. **L3 (F3-1, F3-2)**: 명시적 승인 요청 → 별도 세션에서 실행

L1·L2는 `skills/{스킬명}/SKILL.md` 편집 대상. L3는 워크플로우 영향이 크므로 사용자 깊은 합의 후 진행.
