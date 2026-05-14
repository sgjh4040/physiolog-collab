# 2026-05-14 MVP Polish Batch — Design Spec

**Date:** 2026-05-14
**Author:** Claude + sgjh4040
**Status:** Design (waiting for plan)
**Related:** PRD.md, 2026-05-13 bodymap-library-migration

---

## Overview

5월 13일 BodyMap 라이브러리 마이그레이션 직후 사용자가 폰 검증 중 발견한 10개 항목을 한 번에 정리하는 배치 작업. 새 기능보다는 **MVP 사용성 마감(polish)** 성격이 강함. 친구 인계까지 약 1~2개월 윈도우 안에서 차팅 1인당 5분 목표를 흔드는 마찰들을 제거한다.

세 Sprint로 나누어 의존성 적은 것부터 처리. Sprint 1은 단일 PR 한 번에 묶고, Sprint 2는 검증이 먼저 필요한 항목 포함, Sprint 3는 새 컬럼·새 정적 자산 추가.

---

## Scope (10 items)

| # | 항목 | Sprint | 변경 종류 |
|---|------|--------|-----------|
| 1 | 환자 정보 수정 폼 grid가 모바일에서 2열 고정 → 압축됨 | 1 | UI |
| 2 | 폼 submit 중복 클릭 가능 + 로딩 피드백 없음 | 1 | UX |
| 6 | 치료 기록 같은 날짜 안정 정렬 부재 | 1 | 쿼리 |
| 7 + B | 시드 환자 다양화 + `pain_mapping` 채우기 | 1 | 도구 |
| 8 | "마지막 치료 날짜" 캐시 무효화 검증 | 2 | 검증 |
| 4 | 수정 페이지 ← 버튼 로딩 체감 | 2 | 검증 + UX |
| A | 헤더 재배치 (truncate + ⋮ 드롭다운) | 2 | UI |
| 3 | 운동치료에 시간(분) 측정 필드 추가 | 3 | 스키마 + UI |
| 5 | PWA cold start 흰 화면 → splash | 3 | manifest + layout |

순서: 1 → 2 → 3 (PR/배포 3회).

---

## Sprint 1 — 사용성 직격 (1 PR)

### S1-1. 폼 모바일 1열 grid (항목 1)

**현재**
[src/features/patients/components/PatientForm.tsx:92-130, 266-304](src/features/patients/components/PatientForm.tsx) 에서 세 행이 모두 고정 2열:

```tsx
<div className="grid grid-cols-2 gap-3">
  <FormField name="birthDate" .../>
  <FormField name="gender" .../>
</div>
```

폭 좁은 모바일(`<sm`)에서 input/select width 부족해 라벨·placeholder 잘려 보임.

**변경**
- 세 행 모두 `grid-cols-1 sm:grid-cols-2 gap-3`
- 같은 패턴이 PatientForm 외에 [TreatmentForm.tsx](src/features/treatments/components/TreatmentForm.tsx) / [EvaluationForm.tsx](src/features/evaluations/components/EvaluationForm.tsx) 에도 있으면 함께 수정
- 새로 작업 들어가기 전 grep으로 `grid-cols-2 gap-3` 전체 확인 후 한꺼번에 정리

**검증**
Playwright 모바일 viewport(390x844) 캡처 — 환자 편집/평가 입력/치료 입력 폼 모두 1열로 떨어졌는지

---

### S1-2. 더블 클릭 방지 + isSubmitting (항목 2)

**현재**
- [PatientForm.tsx:379](src/features/patients/components/PatientForm.tsx#L379)
- [TreatmentForm.tsx:156](src/features/treatments/components/TreatmentForm.tsx#L156)
- [EvaluationForm.tsx:158](src/features/evaluations/components/EvaluationForm.tsx#L158)

세 폼 모두 `<Button type="submit">{submitLabel}</Button>` — `disabled` 없음, 스피너 없음.

**변경**

각 폼에서 react-hook-form의 `formState: { isSubmitting }`를 꺼내 동일 패턴 적용:

```tsx
const { handleSubmit, formState: { isSubmitting } } = form
// ...
<Button type="submit" disabled={isSubmitting} className="flex-1">
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      저장 중...
    </>
  ) : (
    submitLabel
  )}
</Button>
```

- 취소 버튼도 같이 `disabled={isSubmitting}` (저장 중 취소 못 함)
- onSubmit이 throw할 수 있으므로 try/catch는 폼 호출부에 이미 있음 (확인하고 없으면 추가)
- Loader2는 lucide-react 이미 dep

**왜 useTransition이 아니라 isSubmitting?**
- react-hook-form은 onSubmit 핸들러가 Promise를 반환하면 자동으로 isSubmitting을 토글. 추가 state 없이 동작
- handler 안에서 router.push 호출하므로 useTransition도 가능하지만, 한 군데에서 두 패턴 섞을 필요 없음 — 모든 폼에 동일하게 적용

**검증**
- 폼 빠르게 두 번 탭 → toast 한 번만 뜸 / 네트워크 요청 1건
- 저장 중 버튼에 spinner + "저장 중..." 텍스트

---

### S1-3. 치료 기록 안정 정렬 (항목 6)

**현재**
[src/lib/supabase/treatments.ts:30-37](src/lib/supabase/treatments.ts#L30-L37)

```ts
.order('date', { ascending: false })
```

같은 날짜 여러 건 → DB 임의 순서.

**변경**

```ts
.order('date', { ascending: false })
.order('created_at', { ascending: false })
```

`treatments` 테이블에 `created_at` 컬럼 존재 확인 후 (다른 supabase 쿼리에서 사용 중인지 grep). 없으면 SQL 마이그레이션은 항목 8과 함께 정리.

**검증**
같은 날짜 2건 등록 → 나중에 만든 것이 위에 표시

---

### S1-4. 시드 다양화 + painMapping (항목 B + 7)

**현재**
[src/app/seed/seed-client.tsx](src/app/seed/seed-client.tsx) — 30명, `pain_mapping: []`.

**변경**

요청대로 **30명 → 10명**으로 줄이고 다양성 ↑:

| 다양화 축 | 패턴 |
|---|---|
| 나이 | 20대~70대 분산 (birth_date 연도 다양) |
| 성별 | 5:5 또는 4:6 |
| 진단명 | DISEASES 10개 매핑 1:1 (한 명에 한 진단) |
| 보험 | health/auto/industrial/private/self 분산 |
| 상태 | new/readmit/treating(default)/discharged 분산 |
| 평가 painMapping | 진단명 기반으로 자연스러운 부위 1~3개. intensity 진단 심한 정도와 매칭 |
| 양상(pattern) | painMapping마다 `dull` / `radiating` / `numbness` 등 다양 |

painMapping 예시:
```ts
// "무릎 ACL 손상" 환자 → painMapping
[
  { id: 'knees_l', intensity: 7, pattern: 'sharp', sensation: 'pain' }
]
// "허리 디스크" → 
[
  { id: 'lower-back', intensity: 8, pattern: 'radiating', sensation: 'pain' },
  { id: 'hamstrings_l', intensity: 4, pattern: 'numbness', sensation: 'tingling' }
]
```

**시드 데이터 정의 분리**

`seed-client.tsx` 안에 `PATIENT_FIXTURES: Array<{name, diagnosis, painMapping}>` 상수 추가 — 10명 명시. 향후 fixture 추가 쉽게.

**검증**
- `/seed` 클릭 → 환자 리스트에 10명 다양한 진단명
- 아무 환자 평가 입력 → BodyMap에 색칠 표시됨
- 진단명-부위 매칭이 임상적으로 자연스러움 (사용자가 검수)

---

## Sprint 2 — 보강 (1 PR)

### S2-1. "마지막 치료 날짜" 캐시 무효화 검증 + 보완 (항목 8)

**현재**
- [src/app/page.tsx:20-25](src/app/page.tsx#L20-L25) — server prefetch
- [src/lib/supabase/treatments.ts:187-216](src/lib/supabase/treatments.ts#L187-L216) — `getLatestTreatmentDateMap`
- Patient.updated_at 미사용. 치료 추가/수정/삭제 후 환자 리스트로 돌아오면 stale value 가능

**조사 과제 (코드만으로)**
- 치료 create/update/delete 액션에서 `revalidatePath('/')` 또는 `revalidateTag` 호출 여부
- 환자 상세 페이지에서 `revalidatePath` 호출 여부

**변경 (조사 결과에 따라)**

| 발견 | 조치 |
|---|---|
| 모든 mutation에 `revalidatePath('/')`가 이미 있음 | 변경 없음, 검증 영상만 첨부 |
| 일부 누락 | 누락된 server action에 `revalidatePath('/')` 추가 |
| server action이 아닌 client mutation | server action으로 전환 또는 `router.refresh()` 호출 |

**검증**
1. 환자 A 치료 새로 입력 → 저장 → ← 버튼으로 환자 리스트
2. 환자 A 카드의 "마지막 치료" 가 방금 입력한 날짜로 표시

---

### S2-2. 수정 페이지 ← 로딩 체감 (항목 4)

**현재**
세 수정 페이지 모두 `<Link href="...">`, root `loading.tsx`는 존재 → 이론상 LoadingScreen 떠야 함. 사용자 체감상 "안 보인다".

**조사 과제 (폰 검증)**
1. 사용자 폰에서 ← 누르고 본문이 바뀌기까지 몇 초인지
2. 그 동안 loading screen이 보이는지 / 흰화면인지 / 이전 페이지가 잔존하는지
3. Vercel prod 환경에서만 그런지 dev에서도 그런지

**변경 후보 (조사 결과별)**

| 증상 | 조치 |
|---|---|
| loading.tsx가 안 뜸 (이전 페이지 잔존) | useTransition + isPending 으로 ← 버튼에 즉시 spinner overlay |
| loading.tsx는 뜨는데 너무 빨라서 사용자가 인지 못 함 | 그대로 둠 |
| loading.tsx가 늦게 뜸 (300ms 이상) | router.prefetch 또는 server data 캐시 검토 |

**검증**
Playwright Slow 3G throttle로 ← 클릭 → 1초 미만에 LoadingScreen 표시 확인

---

### S2-3. 헤더 재배치 (항목 A)

**현재**
[PatientList.tsx:238-294](src/features/patients/components/PatientList.tsx#L238-L294) — 헤더가 환자 리스트 컴포넌트 안. 좌측 이름·직업·소속 줄바꿈 없음, 우측 아이콘 5개.

**변경**

레이아웃:
```
┌──────────────────────────────────────────────┐
│ [이름 직업·············소속배지]  [선택✓] [⋮]│
└──────────────────────────────────────────────┘
```

- 좌측: `flex items-center gap-2 min-w-0` + `이름 직업`은 `truncate` 적용. 소속 배지는 `shrink-0`
- 우측: 선택 모드 아이콘 + ⋮ 드롭다운(shadcn DropdownMenu) 하나
- ⋮ 메뉴 안에: 프로필 / 통계 / 데이터생성(dev only) / 로그아웃

**왜 글로벌 layout으로 안 뺄까?**
현재 헤더는 PatientList 안에만 있고, 환자 상세 페이지는 다른 헤더 사용 중. **이번 작업은 PatientList 헤더만 손봄.** 글로벌 layout 추출은 별개 작업(scope 외).

**검증**
- 데스크톱 + 모바일 캡처
- 긴 이름(20자) / 긴 소속명(15자) 테스트 fixture로 truncate 확인
- ⋮ 메뉴 항목들 동일 동작 (페이지 이동, 로그아웃)

---

## Sprint 3 — 새 기능 (1 PR)

### S3-1. 치료방법별 상세 메모 (항목 추가, Sprint 2 검증 중 사용자 요청)

**Spec:** 사용자 prod 검증 중 추가 요청 — "전기/초음파/냉온/과제훈련/도수치료도 기타 누른 것처럼 상세 입력 가능했으면. 안 써도 되고 써도 되고"

**현재**
- 도메인 `Treatment.methods: TreatmentMethod[]` + `otherTreatmentMethod?: string` (오직 'other'만 텍스트)
- [src/features/treatments/components/MethodSelector.tsx](src/features/treatments/components/MethodSelector.tsx) — '기타' 체크 시 textarea 노출

**변경**

**도메인** ([src/features/treatments/domain/types.ts](src/features/treatments/domain/types.ts)):
```ts
export type Treatment = {
  ...
  methods: TreatmentMethod[]
  otherTreatmentMethod?: string                                  // legacy, 점진 마이그레이션
  methodDetails?: Partial<Record<TreatmentMethod, string>>       // NEW — 메서드별 optional 상세
  ...
}
```

**DB 마이그레이션** (Supabase SQL editor에서 사용자가 실행):
```sql
ALTER TABLE treatments
  ADD COLUMN method_details JSONB DEFAULT '{}'::jsonb;
```
파괴적 아님 (`ADD COLUMN` + default). 옛 row는 자동으로 `{}` 채워짐.

**Schema** ([src/features/treatments/domain/schema.ts](src/features/treatments/domain/schema.ts)):
- `methodDetails: z.record(z.string()).optional()` (TreatmentMethod 키, 값 자유 텍스트)
- 또는 명시적: `z.object({ manual: z.string().optional(), electric: z.string().optional(), ... }).partial().optional()`

**UI** ([MethodSelector.tsx](src/features/treatments/components/MethodSelector.tsx)):
- 6 메서드(manual/electric/ultrasound/thermal/task/other) 체크박스 + 체크된 항목 아래에 textarea 표시
- 운동치료(`exercise`)는 운동 카드로 자세 입력하므로 details 텍스트박스 **표시 안 함**
- placeholder: "상세 메모 (선택)" / 또는 메서드별 힌트 ("예: TENS 15분 / 우측 어깨 강도 중")
- '기타' textarea는 기존 위치 유지하되 새 `methodDetails.other`로 저장

**Supabase 매핑** ([src/lib/supabase/treatments.ts](src/lib/supabase/treatments.ts)):
- `dbToTreatment`: `method_details` → `methodDetails`
- `treatmentToDb`(또는 인라인 insert): `methodDetails` → `method_details`
- 호환: `methodDetails?.other ?? otherTreatmentMethod` 폴백 표시
  (옛 데이터는 `other_treatment_method` 컬럼에, 새 입력은 `method_details.other`에 저장)

**표시** ([TreatmentCard.tsx](src/features/treatments/components/TreatmentCard.tsx), [TreatmentDetailSheet.tsx](src/features/treatments/components/TreatmentDetailSheet.tsx)):
- 카드 미리보기: 변경 없음 (메서드 이름만 표시)
- 상세 sheet: 각 메서드 아래에 `methodDetails[method]` 텍스트 표시 (있으면)

**검증**
- 새 치료 입력: 도수치료+초음파 선택 후 각각 상세 메모 입력 → 저장 → 상세 sheet에 표시
- 옛 치료(기존 시드 데이터): `other_treatment_method` 있는 row 진입 → "기타" 상세 그대로 표시
- DB row 직접 확인: `method_details` 컬럼에 `{"manual": "...", "ultrasound": "..."}` JSONB 저장

---

### S3-2. 운동 시간 측정 필드 (항목 3)

**현재**
[src/features/treatments/domain/types.ts:37-44](src/features/treatments/domain/types.ts#L37-L44)

```ts
Exercise = {
  id: string
  name: string
  intensity?: string
  sets?: number
  reps?: number
  weight?: number
}
```

ExerciseSection UI: 3 counter (세트/횟수/무게) + 자유 Textarea.

**변경 (선택안: 모든 운동에 duration 추가)**

도메인 타입:
```ts
Exercise = {
  ...
  duration?: number  // 분 단위, 소수 허용 (1.5 = 1분 30초)
}
```

DB 마이그레이션: `treatments` 테이블의 `exercises` JSON 컬럼이므로 SQL 변경 불요. 기존 데이터는 duration undefined로 그대로.

UI:
- 모바일: counter 2x2 grid (세트/횟수/무게/분)
- 데스크톱: 4열 grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
  <CounterField label="세트" .../>
  <CounterField label="횟수" .../>
  <CounterField label="무게(kg)" .../>
  <CounterField label="시간(분)" step={0.5} .../>
</div>
```

zod schema의 Exercise에도 `duration: z.number().optional()` 추가.

**검증**
- 운동 추가 → 시간만 채우고 저장 → 다시 열면 시간 값 그대로
- 기존 운동(시간 없음) 수정 → 다른 필드만 채우고 저장 → 정상

**Out of scope**
- type 분기(strength/cardio/time-based) — Sprint 3에서 제외. 모든 운동이 4 counter 동일 표시
- 운동별 자주 쓰는 단위 자동 추천 (에르고미터 → duration prefill) — Phase 2

---

### S3-3. PWA cold start splash (항목 5)

**현재**
- [src/app/manifest.ts](src/app/manifest.ts) — `background_color`/`theme_color` 확인 필요
- PWA 첫 frame이 흰색
- React hydrate 후에야 [AuthGuard.tsx:34-56](src/components/AuthGuard.tsx#L34-L56) splash 표시

**변경 (2층)**

**Layer 1: manifest background_color**
```ts
// manifest.ts
{
  ...
  background_color: '#1c1c1c',   // 다크
  theme_color: '#1c1c1c'
}
```
PWA 시스템 splash가 흰 대신 다크 배경.

**Layer 2: HTML 인라인 splash**

`src/app/layout.tsx`의 `<body>` 첫 자식에 정적 splash div:

```tsx
<body>
  <div
    id="initial-splash"
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
  >
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <p className="mt-6 text-lg font-medium italic break-keep text-foreground text-center px-6">
      &ldquo;정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다.&rdquo;
    </p>
  </div>
  {children}
</body>
```

그리고 클라이언트 진입 시 제거하는 작은 컴포넌트:
```tsx
// src/components/RemoveInitialSplash.tsx
'use client'
import { useEffect } from 'react'
export function RemoveInitialSplash() {
  useEffect(() => {
    document.getElementById('initial-splash')?.remove()
  }, [])
  return null
}
```
layout에서 `<RemoveInitialSplash />`를 children 위에 둠. AuthGuard splash와 충돌하지 않도록 — AuthGuard는 verified 상태 결정 후에만 splash 표시하므로 시간차로 자연스럽게 인계됨.

**위험**
- inline splash가 SSR 결과에 항상 포함됨 → 초기 HTML 크기 약간 증가 (수십 바이트)
- JS 비활성 환경: splash 안 사라짐 → 무해 (어차피 React 의존 앱)

**검증**
- iOS PWA cold start: 다크 배경 → splash 문구 → 본문 (흰 frame 없음)
- 안드로이드 Chrome PWA: 같음
- 일반 브라우저 첫 진입: 동일 흐름

---

## Out of Scope (Phase 2+)

- 글로벌 layout으로 헤더 추출
- 운동 type 분기 UI
- 친구 repo(Habae6134/physiolog) sync
- `.claude/` `.gitignore` 추가 (별개 1줄 PR)
- PWA Service Worker update 알림 UI
- EvaluationDetailSheet readOnly 모드에 patient.gender prop 체인
- 운동 자주 쓰는 단위 추천 (에르고미터 → duration prefill)
- **`other_treatment_method` 컬럼 정리 (Phase 2)** — S3-1 적용 후 옛 데이터를 `method_details.other`로 일괄 이전하고 옛 컬럼 drop. 트리거: 사용자가 dev/prod 데이터 청소하는 시점.
  ```sql
  UPDATE treatments
  SET method_details = jsonb_set(coalesce(method_details, '{}'::jsonb), '{other}', to_jsonb(other_treatment_method))
  WHERE other_treatment_method IS NOT NULL AND other_treatment_method != '';
  ALTER TABLE treatments DROP COLUMN other_treatment_method;
  ```
  이후 코드에서 `otherTreatmentMethod` 필드와 fallback 로직 제거 가능.

---

## Risks & Open Questions

| Risk | 완화책 |
|---|---|
| Sprint 1을 한 PR로 묶으면 diff가 커짐 | 4개 sub-task 모두 작은 변경 (총 ~200줄 이내 예상). 커밋은 sub-task별로 분리 |
| painMapping 시드 데이터가 임상적으로 어색 | 사용자(물치학과)에게 PR 전 fixture 검수 요청 |
| Exercise.duration JSON 컬럼이므로 마이그레이션 불요인데, 그래프나 통계 페이지가 sets×reps×weight 만 가정 | Sprint 3에서 통계 페이지 영향 확인. 영향 있으면 spec 보완 |
| HTML 인라인 splash가 다른 layout 변경과 충돌 | layout.tsx 변경은 작은 diff. 검증으로 SSR 안 깨지는지 확인 |
| 헤더 ⋮ 메뉴 추가 시 shadcn DropdownMenu 미설치 | shadcn add 필요. 기존 ui/ 디렉토리에 있는지 확인 |

---

## Verification Checklist (전체 종료 시)

- [ ] 모든 폼 모바일 1열 (S1-1)
- [ ] 빠른 더블 탭에 중복 저장 없음 (S1-2)
- [ ] 같은 날짜 치료 2건 안정 정렬 (S1-3)
- [ ] /seed → 10명 + painMapping 채워짐 (S1-4)
- [ ] 치료 추가 후 환자 리스트 "마지막 치료" 즉시 갱신 (S2-1)
- [ ] 수정창 ← 클릭 → 1초 미만 loading screen (S2-2)
- [ ] 헤더 긴 이름·소속 truncate, ⋮ 메뉴 동작 (S2-3)
- [ ] 치료방법(도수/전기/초음파/냉온/과제/기타)에 선택적 상세 메모 입력·저장·표시 (S3-1)
- [ ] 운동 시간(분) 입력·저장·재표시 (S3-2)
- [ ] PWA cold start 흰 화면 없음 (S3-3)
- [ ] `npm run build` 0 errors
- [ ] 사용자 폰 prod 검증 OK
