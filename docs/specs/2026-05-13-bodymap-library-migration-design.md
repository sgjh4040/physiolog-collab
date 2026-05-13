# Design — BodyMap을 react-muscle-highlighter로 교체

**Date:** 2026-05-13
**Status:** Draft (사용자 리뷰 대기)

---

## 동기

친구가 직접 그린 베지어 도형 SVG가 어색함 (어깨 부풀고 비례 안 맞음). [`react-muscle-highlighter`](https://www.npmjs.com/package/react-muscle-highlighter) v1.2.0 미리보기 검증 결과, 의료 해부도급 디자인 + 근육 단위 디테일 + 그라데이션. 친구(물리치료사) 어필도 ↑.

---

## 결정

### 1. 라이브러리 선택

**react-muscle-highlighter v1.2.0**
- MIT, React 19 호환, zero deps
- 23개 anatomical slug (deltoids, biceps, triceps, chest, abs, quadriceps, hamstring, ...)
- 앞/뒤 + 남/여 + intensity 그라데이션 + side(left/right) prop 지원
- 미리보기 캡처: `~/.claude/projects/.../screenshots/2026-05-13-vas-bodymap/preview_*.jpg` (3장)

### 2. 부위 ID 매핑 정책

**`PainArea.id` (string)에 새 인코딩으로 저장:** `{libSlug}_{side?}`

예시:
- `deltoids_l` = 좌측 삼각근 = 라이브러리 `slug: 'deltoids', side: 'left'`
- `chest` = 가슴 (좌우 없음)
- `quadriceps_r` = 우측 대퇴사두근

**호환성:** 기존 `shoulder_l`, `arm_up_r_back` 같은 ID도 매핑 테이블에서 그대로 인식. 시각화/표시는 옛 ID도 정상.

### 3. 매핑 테이블 (단방향, 옛 ID → 라이브러리)

| 우리 옛 ID | 라이브러리 slug | side | 비고 |
|---|---|---|---|
| `head`, `head_back` | head | - | |
| `neck`, `neck_back` | neck | - | |
| `shoulder_l/r` | deltoids | left/right | |
| `chest` | chest | - | |
| `abdomen` | abs | - | |
| `arm_up_l/r` (앞) | biceps | left/right | |
| `arm_up_l/r_back` | triceps | left/right | 뒷면 자동 |
| `forearm_l/r`, `forearm_l/r_back` | forearm | left/right | |
| `hand_l/r`, `hand_l/r_back` | hands | left/right | |
| `hip_l/r` | gluteal | left/right | 라이브러리에 hip 없음, gluteal로 fallback |
| `thigh_l/r` (앞) | quadriceps | left/right | |
| `hamstring_l/r` (뒤) | hamstring | left/right | |
| `knee_l/r` | knees | left/right | |
| `shin_l/r` (앞) | tibialis | left/right | |
| `calf_l/r` (뒤) | calves | left/right | |
| `foot_l/r`, `foot_l/r_back` | feet | left/right | |
| `back_up` | trapezius | - | 또는 upper-back |
| `back_low` | lower-back | - | |
| `glute_l/r` | gluteal | left/right | |
| `general` (전신) | - | - | 라이브러리 미사용, 별도 버튼 그대로 |

### 4. 유지 항목 (BodyMap 컴포넌트 안)

- ✅ Dialog: 강도 슬라이더 + 통증 양상 (이번 통합 작업으로 추가했던 것 그대로)
- ✅ '전신 통증으로 입력' 빠른 버튼 (라이브러리 외부)
- ✅ 자동 계산값 헤더 ("자동 계산된 통증 점수: N / 10")
- ✅ 앞/뒷면 토글 (라이브러리 `side` prop로 처리)
- ✅ 추가된 부위 태그 리스트 (라벨 + 양상 + X 버튼)

### 5. 제거 / 교체

- ❌ `BODY_PARTS` 배열 (베지어 path 70+개) → 라이브러리 컴포넌트로 대체
- ❌ `BodyMap.css` (의료영상 배경 효과 등) → 라이브러리 자체 스타일로 대체. 필요 시 wrapper에 background 유지
- ❌ 임시 prototype 페이지 `/bodymap-preview` → 삭제
- ❌ SVG path 직접 클릭 핸들러 → 라이브러리 `onBodyPartPress` 콜백으로 대체

### 6. 남/여 모델

`Patient.gender` 필드 이미 존재 ('male' | 'female') → BodyMap에 `patientGender` prop 받아 라이브러리 `gender` prop으로 전달. 미지정이면 'male' 기본.

---

## 데이터 흐름

```
사용자 → 라이브러리 onBodyPartPress({ slug: 'deltoids', side: 'left' })
       ↓
BodyMap handleLibClick → 우리 ID 생성 (deltoids_l)
       ↓
Dialog 열림 (강도 + 양상 입력) — 기존 동일
       ↓
PainArea 객체 만들기: { id: 'deltoids_l', label: '왼쪽 삼각근', intensity, pattern }
       ↓
onChange(painMapping) → form state 갱신
       ↓
EvaluationForm submit → vas 자동 산출 → DB 저장
       ↓ (표시 시)
BodyMap readOnly 모드 → painMapping → 라이브러리 data prop
       ↓ (매핑 어댑터 통과)
ExtendedBodyPart[] → 라이브러리가 시각화 (intensity 색상)
```

---

## 영향 파일

| 파일 | 변경 |
|---|---|
| `package.json` | `react-muscle-highlighter` 추가 (이미 설치됨) |
| `src/features/evaluations/components/BodyMap.tsx` | 통째 재작성 (~280 → ~150줄) |
| `src/features/evaluations/components/BodyMap.css` | 삭제 또는 wrapper background만 남김 |
| `src/features/evaluations/lib/bodymap-mapping.ts` | **신규** — 우리 ID ↔ 라이브러리 slug+side 매핑 + helper |
| `src/features/evaluations/components/EvaluationForm.tsx` | BodyMap에 `patientGender` prop 전달 (`patient.gender`) |
| `src/features/evaluations/components/EvaluationDetailSheet.tsx` | BodyMap readOnly 호출에 gender 추가 (선택) |
| `src/app/bodymap-preview/page.tsx` | 삭제 (임시 prototype) |

---

## 마이그레이션 / 호환성

- **기존 painMapping 데이터 (옛 ID)**: 표시 시점에 매핑 테이블로 라이브러리 slug+side로 변환 → 그대로 시각화. 사용자가 해당 evaluation을 수정하면 새 ID 체계로 저장 (자연 점진 갱신).
- **DB 스키마**: 무변경. `PainArea.id`가 string이라 새 ID도 그대로 들어감.
- **타입**: `PainArea` 그대로 유지. id 인코딩만 바뀜 (`{slug}_{side}` 또는 `{slug}` 형태).

---

## 위험 + 완화

| 위험 | 완화 |
|---|---|
| 우리 `hip` 부위가 라이브러리에 없음 | `gluteal`로 fallback. 또는 사용자에게 "엉덩이/고관절" 단일 부위로 명시 |
| 환자가 deltoid/trapezius 같은 근육 명칭 모름 | painMapping의 label에 한글 명시 ("좌측 어깨 (삼각근)" 식) — 라이브러리는 클릭 좌표만 처리 |
| 라이브러리 디자인이 baseline-test 사용 시 너무 anatomical | 폰 검증 후 사용자 결정. 별로면 옵션 2 (`react-body-map`) 로 fallback |
| `general` (전신) 부위 시각화 안 됨 | 라이브러리 외부 별도 표시 (예: "전신 통증" 태그). painMapping 태그 리스트에는 표시됨 |

---

## 검증 계획

- `npm run build` 통과 (TypeScript 0 errors)
- Playwright 모바일/데스크톱 캡처:
  - 새 평가 입력 시 라이브러리 렌더 정상
  - 부위 클릭 → Dialog 열림 → 강도/양상 입력 → 자동 계산값 헤더 갱신
  - 앞/뒷면 토글
  - 기존 평가(옛 ID)의 시각화 정상 (매핑 어댑터 동작)
- 사용자 폰 prod 검증

---

## Out of Scope

- 남/여 모델 자동 선택 (지금은 patient.gender 단순 전달, 추후 환자별 기본값)
- 라이브러리 자체 디자인 커스텀 (border, defaultFill 등 — MVP에선 기본값)
- 매핑 테이블에서 누락된 부위 추가 (필요 시 향후)
