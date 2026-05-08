# nayo (모두의요리사)

유튜브 레시피를 따라 요리하는 1인 사용자가 **이전 실패와 변형 이력을 기억**하여 같은 실수를 반복하지 않고 매번 더 나은 결과를 만들도록 돕는 도구.

> 시작일: 2026-05-03
> appetite: **Standard** (Hermes 자율 결정, 2026-05-04)

---

## 산출물 진행도

| # | 페이즈 | 산출물 / 게이트 | 상태 | 일시 | 비고 |
|---|--------|-----------------|------|------|------|
| 1 | DISCOVER | problem-definition.md | ✅ | 2026-05-03 | 합의 완료 |
| 2 | DISCOVER | prd.md | ✅ | 2026-05-03 | v0.4 — B1·B2·B4·B5β·B6·B7-A 보강 |
| 3 | DISCOVER | review-loop (1R) | ✅ | 2026-05-03 | 3R 완료 (1R: UI 묘사 제거 / 2R: B1~B4 보강 후 재실행 / 3R: B1·B2·B4·B5β·B6·B7-A 보강 후 재실행) |
| 4 | DISCOVER | prd-review (R1-R4) | ✅ | 2026-05-03 | 재실행 통과 (R1~R4 PASS) |
| 5 | DESIGN | design-decision.md | ✅ | 2026-05-03 | design-dialogue rewind 1차 — B1·B2·B5β·B6·B7-A 보강 (PRD v0.4 후속) |
| 6 | DESIGN | design-system-gate (D1-D4) | ✅ | 2026-05-03 | 재실행 통과 — FAIL 0 · WARN 1(영구 삭제 danger 컬러 예외, 조건부 통과) · Comment 1(Combobox 자체 구현) |
| 7 | ENGINEER | tech-decision.md | ✅ | 2026-05-08 | v2.0 — B1·B2·B5β·B6·B7-A 보강 (Step 스키마, IFrame API, 메인 화면 쿼리, 자동완성, 삭제 정책, 유튜브 접근불가 감지, API 21개, TC-26). ALIGN 5차 rewind: is_unavailable_on_youtube rename, Video/Dish count 쿼리 user_id 보안 경계, Attempt 휴지통 API, 자동완성 인덱스 명세, combobox ARIA 통일. |
| 8 | ENGINEER | dev-gate (T1-T5) | ✅ | 2026-05-03 | 재실행 통과 — T1 PASS · T2 PASS · T3 PASS · T4 PASS · T5 PASS |
| 9 | ALIGN | doc-align (1차) | ✅ | 2026-05-03 | Critical 0 / Major 0 / Minor 1(자동 수정) |
| 10 | ALIGN | decision-log.md | ✅ | 2026-05-08 | v1.4 — L1~L44 전체 결정 기록. Out of Scope 9종. 미결 9종. ALIGN 5차 rewind 정합성 재정리. |
| 9-R | ALIGN | doc-align rewind 1차 | ✅ | 2026-05-03 | Codex 외부 검토 6건 정정. Major 4 + Minor 2. L25~L28 추가. |
| 2-R | DISCOVER | prd-writer rewind 1차 | ✅ | 2026-05-03 | 사용자 명시 요청. B1 §1.0 문제 발견 내러티브, B2 §2.3 페인↔기능 매핑, B3 §9.5 Risk·Mitigation, B4 참고 문서 박스. review-loop 2R + prd-review 재실행 PASS. |
| 9-RR | ALIGN | doc-align 재실행 (보강 후) | ✅ | 2026-05-03 | 12개 항목 전항목 PASS. Critical 0 / Major 0 / Minor 0. decision-log v1.2. BUILD 진입 대기. |
| 2-RR | DISCOVER | prd-writer rewind 2차 | ✅ | 2026-05-03 | 사용자 명시 요청 (외부 팀 리뷰 + 본인 코멘트). B1 자동완성·부분검색 분리, B2 유튜브 삭제 엣지, B4 Attempt 트리거, B5β Step+timestamp, B6 삭제 정책, B7-A 메인 화면. review-loop 3R + prd-review 재실행 PASS. |
| 9-RRR | ALIGN | doc-align 재실행 4차 (팀리뷰+본인 보강 후) | ✅ | 2026-05-08 | 20개 항목 전항목 PASS. Critical 0 / Major 0 / Minor 0. decision-log v1.3. BUILD 진입 대기. |
| 9-RRRR | ALIGN | doc-align rewind 6차 (BUILD 후 갭 발견) | ✅ | 2026-05-08 | L45~L48 신규. API 21→22. Video UNIQUE 제약. URL 설계 정비. thumbs 실호출 이행. |
| 10-R | ALIGN | decision-log v1.5 갱신 | ✅ | 2026-05-08 | L45~L48 추가, 합의 이력 4row 보강 |
| 11 | BUILD | code-review (C1-C5) | ⬜ | — | — |
| 12 | VERIFY | qa-harness | ⬜ | — | — |
| 13 | VERIFY | security-audit | ⬜ | — | — |
| 14 | SHIP | ship-harness → deploy → canary | ⬜ | — | — |
| 15 | REFLECT | retro-harness | ⬜ | — | — |

상태 범례: ✅ 완료 · ▶ 현재 진입 · ⬜ 미완 · 🔴 FAIL · ⏭️ 건너뜀 · 🏁 사용자 지정 종료 지점

## 게이트 건너뛰기 이력
- 없음

## 산출물 위치
- `harness-state.md` — PM Working Memory
- `problem-definition.md` — 문제 정의 (DISCOVER · initiative-keeper 산출)
- `prd.md` — PRD 초안 (DISCOVER · prd-writer 산출)
- `design-notes-from-discover.md` — DISCOVER 중 수집된 UI 노트 (DESIGN 페이즈 핸드오프용)
- `design-decision.md` — 디자인 결정 문서 (DESIGN · design-dialogue + D1-D4 게이트 통과)
- `tech-decision.md` — 기술 결정 문서 (ENGINEER · dev-dialogue + T1-T5 게이트 통과)
- `decision-log.md` — 전 페이즈 의사결정 종합 기록 (ALIGN · Athena(align) 산출)
