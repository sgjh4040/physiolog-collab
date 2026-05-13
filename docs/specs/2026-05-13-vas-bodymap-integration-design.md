# Design — VAS ↔ BodyMap Intensity 통합

**Date:** 2026-05-13
**Status:** Draft (사용자 리뷰 대기)
**Author:** sakongjoenghun + Claude

---

## 동기 (Why)

평가(Evaluation) 데이터에 통증 점수가 두 곳에 분리되어 있고 같은 척도(1~10)를 공유함:

- `Evaluation.vas` — 단일 0~10, 전신 통증 한 숫자 (VASInput)
- `Evaluation.painMapping[].intensity` — 부위별 1~10 + 양상(sharp/tingling/...) (BodyMap)

### 문제

1. **정합성 불명확** — VAS=3인데 BodyMap에 어깨 intensity=8이면 어느 게 진실인가?
2. **그래프 부재** — 회복 그래프는 VAS만 추적. BodyMap만 입력한 환자는 그래프가 텅 빔.
3. **입력 중복** — 같은 척도를 두 곳에 입력. PRD의 "1인당 기록 5분 이내" 목표와 충돌.
4. **기본값 함정** — 현재 default는 `togglePainMapping: true / toggleVas: false`. BodyMap 입력해도 그래프 활성 안 됨.

---

## 결정 (Decisions)

### 1. BodyMap이 진실 소스(Single Source of Truth)

`vas` 필드는 유지하되, **저장 시점에 painMapping에서 자동 산출**:

```ts
const computedVas =
  painMapping.length > 0
    ? Math.max(...painMapping.map(p => p.intensity))
    : 0
```

산출 규칙: **max(intensity)** — 가장 아픈 부위의 강도. 임상적으로 환자가 회복을 인지하는 기준에 가장 가까움.

### 2. UI 변화

- **VASInput 컴포넌트 제거** (`src/features/evaluations/components/VASInput.tsx`)
- **VAS 토글 제거** (`EvaluationFormValues.toggleVas`, EvaluationForm 안의 VAS 섹션 통째로)
- **BodyMap 상단에 자동 계산값 실시간 표시**:
  ```
  현재 통증 점수 (자동 계산): 7 / 10
  ```
  사용자가 부위 추가/제거/강도 변경 시 즉시 갱신. "내가 짚은 강도가 그래프에 이렇게 반영되는구나" 투명성 확보.

### 3. '전신' 부위 옵션 추가

BodyMap 상단에 `[전신]` 빠른 선택 버튼 추가. 환자가 "그냥 전반적으로 아프다" 케이스 대응:

```ts
{
  id: 'general',
  label: '전신',
  pattern: 'sharp' | 'custom',  // 양상은 사용자 선택
  intensity: N,  // 슬라이더로
}
```

좌표 없음 (BodyMap SVG 도식 외부 버튼). 한 번에 하나만 존재 (중복 추가 차단).

### 4. Toggle 일관성 유지

`toggleVas` 제거. `togglePainMapping`만 남김. ROM/MMT/Measurement/Custom과 동일한 토글 패턴 유지.

---

## 데이터 모델 변화

### `types.ts`

변화 없음 — `vas` 필드, `painMapping` 배열 모두 그대로. 단지 입력 출처가 바뀔 뿐.

### `schema.ts` (zod)

`toggleVas`, `vas` 입력 검증 제거. `painMapping` 검증은 그대로.

### DB

스키마 변경 없음. `vas` 컬럼 유지, 산출된 값이 들어감.

---

## 마이그레이션 정책

기존 데이터는 **그대로 둠** — 침습적 일괄 갱신 없음.

| 케이스 | 처리 |
|---|---|
| 기존 vas만 있는 evaluation | DB의 `vas` 그대로 표시 (그래프 정상). `painMapping=[]` 그대로 |
| 기존 painMapping만 있는 evaluation | `vas`가 null이면 그래프 점 없음 → 사용자가 해당 evaluation 수정 시 자동 산출되어 채워짐 |
| 기존 둘 다 있는 evaluation | DB의 `vas` 그대로 (덮어쓰기 안 함). 수정 시 자동 산출로 갱신 |

**대안 검토:** 일괄 백필 SQL(`UPDATE evaluations SET vas = GREATEST(...painMapping)`)도 가능하지만 MVP 단계에서 risk 부담 크고, 자연 수정 시 점진 갱신으로 충분.

---

## UI 흐름

### Before (현재)

```
[평가 입력 폼]
  ☑ VAS         ──→ 슬라이더 0-10
  ☑ ROM         ──→ 관절별 입력
  ☑ MMT         ──→ 근육별 입력
  ☑ 신체계측    ──→ 부위별 cm 입력
  ☑ 통증 매핑   ──→ BodyMap (부위 클릭 + intensity)
  ☑ 커스텀      ──→ 자유 입력
```

### After (통합)

```
[평가 입력 폼]
  ☑ ROM         ──→ (그대로)
  ☑ MMT         ──→ (그대로)
  ☑ 신체계측    ──→ (그대로)
  ☑ 통증 매핑   ──→ ┌──────────────────────────────┐
                    │  현재 통증 점수 (자동): 7/10 │  ← 실시간 표시
                    ├──────────────────────────────┤
                    │  [전신]  ← 빠른 선택 버튼     │
                    │                              │
                    │  [SVG 인체 도식, 앞면/뒷면]  │
                    │                              │
                    │  추가된 부위:                │
                    │  · 어깨 (좌) / 7 / sharp   ✕ │
                    │  · 무릎 (우) / 4 / tingling✕ │
                    └──────────────────────────────┘
  ☑ 커스텀      ──→ (그대로)
```

---

## 영향 받는 파일

| 파일 | 변경 종류 | 비고 |
|---|---|---|
| `src/features/evaluations/components/VASInput.tsx` | **삭제** | 더 이상 사용 안 함 |
| `src/features/evaluations/components/BodyMap.tsx` | 수정 | 자동 계산값 헤더 + 전신 버튼 |
| `src/features/evaluations/components/EvaluationForm.tsx` | 수정 | VAS 섹션 제거. submit 시 vas 자동 산출 |
| `src/features/evaluations/components/EvaluationDetailSheet.tsx` | 무변경 | vas 표시는 그대로 — vas 필드 자체는 DB에 존재 |
| `src/features/evaluations/components/EvaluationCard.tsx` | 무변경 | 카드의 vas 뱃지(VAS 7) 그대로 — 자동 산출된 값이 그냥 표시될 뿐 |
| `src/features/evaluations/components/EvaluationChart.tsx` | 무변경 | 그래프는 vas 필드를 그대로 읽음 — 자동 산출이라는 사실 모름 |
| `src/features/evaluations/domain/schema.ts` | 수정 | `toggleVas` 필드 + 관련 refine 제거. `vas`는 optional 유지(자동 산출되어 채워짐) |
| `src/features/evaluations/domain/types.ts` | 무변경 | `PainArea.id`가 `string`이므로 `'general'`도 자연스럽게 수용 |
| `src/data/body-parts.ts` | 무변경 | BodyMap의 SVG 부위 리스트는 `BodyMap.tsx` 내부 상수. `body-parts.ts`는 치료 기록의 부위 구분용 (별도 도메인) |
| `src/app/patients/[id]/evaluations/new/page.tsx` | 수정 | submit 콜백의 `toggleVas` 분기 제거 |
| `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx` | 수정 | submit + defaultValues에서 `toggleVas` 분기 제거 |

---

## 엣지 케이스

| 케이스 | 동작 |
|---|---|
| BodyMap에 부위 0개 + 통증 매핑 토글 ON | `vas = 0`, 그래프에 0점 (회복 완료 표현) |
| BodyMap에 부위 0개 + 통증 매핑 토글 OFF | `vas = undefined`, 그래프에 점 없음 |
| '전신' + 다른 부위 같이 추가 | 모두 painMapping에 들어감. `vas = max(전체)` |
| 같은 부위(어깨_좌) 중복 추가 시도 | 기존 BodyMap 동작 그대로 — 기존 항목 갱신 (중복 추가 X) |
| 수정 시 painMapping 비웠는데 저장 | `vas = 0`로 자동 갱신 (이전 값 덮어씀) |

---

## 검증 계획

### 빌드
- `npm run build` 통과 (TypeScript 0 errors)
- VAS 토글 제거로 인한 기존 폼 default 호환성 체크

### UI (Playwright)
- 모바일(390x844) 평가 입력 페이지 진입
  - VAS 섹션 사라진 것 확인
  - BodyMap 헤더에 "0 / 10" 자동 표시
  - 부위 추가 → 헤더 숫자 갱신
- 데스크톱(1440x900) 동일 검증

### 데이터
- 새 평가 입력 → DB의 vas 컬럼이 max(intensity)와 일치 확인
- 기존 vas-only 평가 그래프에 표시 정상 확인 (마이그레이션 호환)

### 사용자
- 폰 prod 검증 — 입력 시간 측정 (5분 목표 검증)

---

## Out of Scope

- BodyMap 디자인 자체 개선 (현재 SVG 그대로 유지)
- `painMapping[].pattern` 양상 종류 추가
- 그래프 표시 방식 변경 (vas 자동 산출로 그대로 작동)
- 일괄 백필 SQL (마이그레이션 정책에서 명시적 제외)
