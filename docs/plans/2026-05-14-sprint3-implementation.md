# Sprint 3 — 새 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprint 1·2 마감 후 새 기능 3개 — 치료방법별 상세 메모(NEW, S3-1), 운동 시간(분) 측정(S3-2), PWA cold start splash(S3-3).

**Architecture:** S3-1은 Supabase `method_details JSONB` 컬럼 추가 + 6 파일 코드 변경(타입/스키마/UI/매핑/상세표시/시드). S3-2는 Exercise JSON 컬럼이라 DB 마이그레이션 없이 5 파일 코드 변경. S3-3은 manifest background 변경 + AuthGuard splash 이미 존재이므로 작은 변경.

**Tech Stack:** Next.js 16, React 19, Supabase JSONB, react-hook-form, zod, Tailwind v4, shadcn/ui, Lucide icons, framer-motion(splash), serwist PWA

**Related spec:** [docs/specs/2026-05-14-mvp-polish-batch-design.md](../specs/2026-05-14-mvp-polish-batch-design.md) Sprint 3 섹션

**Pre-existing context (Sprint 3 조사 결과):**
- treatments 테이블에 `method_details` 컬럼 **없음** → `ALTER TABLE ADD COLUMN` 필요 (S3-1)
- exercises는 이미 `jsonb` 컬럼 → `duration` 필드 추가는 자동 호환 (S3-2)
- AuthGuard에 splash UI 이미 존재 (`"정확한 평가는..."` 문구) → 흰 화면 문제는 manifest background_color('#ffffff' → 다크)로 해결
- 통계 페이지(`/statistics`)는 운동·치료 데이터 미사용 → duration/methodDetails 추가 영향 없음
- ICF는 evaluations + patient만 참조 → treatments 변경 영향 없음

**진행 전략 (사용자 결정):** **(a) S3-1 단독 push** 후 폰 검증 → S3-2 + S3-3 묶음 push. DB 마이그레이션이 있는 S3-1을 안전하게 격리.

---

## File Structure

**S3-1 (8 파일 + 1 SQL):**
- Modify: `src/features/treatments/domain/types.ts` — Treatment 타입 + methodDetails
- Modify: `src/features/treatments/domain/schema.ts` — zod methodDetails 추가
- Modify: `src/features/treatments/components/MethodSelector.tsx` — 선택된 메서드별 textarea
- Modify: `src/lib/supabase/treatments.ts` — dbToTreatment 변환 + insert/update에 method_details 전달
- Modify: `src/features/treatments/components/TreatmentDetailSheet.tsx` — 메서드 Badge 아래 상세 표시
- Modify: `src/app/patients/[id]/treatments/new/page.tsx` — handleSubmit에 methodDetails 전달
- Modify: `src/app/patients/[id]/treatments/[treatmentId]/edit/page.tsx` — handleSubmit에 methodDetails 전달
- Modify: `src/app/seed/seed-client.tsx` — fixture에 methodDetails 추가 (선택, 다양성)
- Manual: Supabase SQL editor에서 `ALTER TABLE` (사용자 직접 실행)

**S3-2 (4 파일):**
- Modify: `src/features/treatments/domain/types.ts` — Exercise.duration
- Modify: `src/features/treatments/domain/schema.ts` — duration zod
- Modify: `src/features/treatments/components/ExerciseSection.tsx` — 4열 grid + 시간(분) counter
- Modify: `src/features/treatments/components/TreatmentDetailSheet.tsx` — duration badge 표시

**S3-3 (3 파일):**
- Modify: `src/app/manifest.ts` — background_color 다크색
- Modify: `src/app/layout.tsx` — HTML 인라인 splash 추가 (initial-splash div)
- Create: `src/components/RemoveInitialSplash.tsx` — hydrate 시 splash div 제거

**커밋 단위:** Task 1 = 1~2 commit (마이그레이션 + 코드), Task 2 = 1 commit, Task 3 = 1 commit.

---

## Pre-flight

- [ ] **Step 0.1: 동기화**

```bash
cd /Users/jeonghunsakong/Projects/physiolog-collab
git status
git pull --ff-only origin main
git log --oneline -3
```

Expected: working tree clean, head = `696200f` (spec update) 또는 그 이후. Sprint 1·2 hotfix 모두 prod 반영 확인됨.

---

## Task 1: S3-1 치료방법별 상세 메모

### Subtask 1A: Supabase DB 마이그레이션 (사용자 수동)

- [ ] **Step 1A.1: 사용자에게 SQL 실행 요청**

사용자에게 다음 SQL을 Supabase Dashboard → SQL Editor에서 실행하도록 안내:

```sql
ALTER TABLE public.treatments
  ADD COLUMN method_details jsonb DEFAULT '{}'::jsonb;
```

검증:
```sql
-- 컬럼 추가 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'treatments' AND column_name = 'method_details';
-- 결과 1행: method_details / jsonb / '{}'::jsonb

-- 옛 row가 자동으로 채워졌는지 확인
SELECT id, methods, other_treatment_method, method_details
FROM treatments LIMIT 3;
-- method_details 컬럼이 {} 로 채워져 있어야 함
```

**중요:** 이 SQL은 파괴적 아님 (`ADD COLUMN`만, DROP/RENAME 없음). 옛 데이터는 그대로.

사용자 OK 확인 후 다음 단계.

### Subtask 1B: 도메인 타입 + zod schema

- [ ] **Step 1B.1: Treatment 타입에 methodDetails 추가**

찾을 문자열 (`src/features/treatments/domain/types.ts`):

```ts
export type Treatment = {
  id: string
  patientId: string
  date: string                 // ISO yyyy-mm-dd
  bodyParts: BodyPart[]        // 다중
  methods: TreatmentMethod[]   // 다중
  otherTreatmentMethod?: string // 기타 치료방법 (텍스트)
  exerciseConcept?: ExerciseConcept
  exercises?: Exercise[]
  homework?: string            // 숙제 (과제·운동 등)
  comment?: string             // 당일 코멘트 (환자 반응·특이사항)
  flags?: string[]             // 델타 기록법: 오늘 특이사항 플래그
  createdAt: string
}
```

바꿀 문자열:

```ts
export type Treatment = {
  id: string
  patientId: string
  date: string                 // ISO yyyy-mm-dd
  bodyParts: BodyPart[]        // 다중
  methods: TreatmentMethod[]   // 다중
  otherTreatmentMethod?: string // 기타 치료방법 (텍스트, legacy — methodDetails.other 로 점진 마이그레이션 예정)
  /**
   * 메서드별 상세 메모. 'exercise'는 운동 카드로 자세 입력하므로 키에 포함 안 함.
   * 예: { manual: "우측 어깨 강도 중", ultrasound: "5분 1MHz" }
   */
  methodDetails?: Partial<Record<TreatmentMethod, string>>
  exerciseConcept?: ExerciseConcept
  exercises?: Exercise[]
  homework?: string            // 숙제 (과제·운동 등)
  comment?: string             // 당일 코멘트 (환자 반응·특이사항)
  flags?: string[]             // 델타 기록법: 오늘 특이사항 플래그
  createdAt: string
}
```

- [ ] **Step 1B.2: schema.ts에 methodDetails 추가**

`src/features/treatments/domain/schema.ts` Read 후 `treatmentFormSchema`의 `otherTreatmentMethod: z.string().trim().optional(),` 라인 바로 다음에 추가:

```ts
    methodDetails: z
      .record(treatmentMethodEnum, z.string().trim())
      .optional(),
```

`treatmentMethodEnum`은 같은 파일에 정의돼 있음 (Read 후 정확한 변수명 확인 — 보통 `treatmentMethodEnum` 또는 `treatmentMethodSchema`). 만약 enum이 별도 schema 변수가 아니면 inline 사용:

```ts
    methodDetails: z
      .record(z.enum(['manual', 'electric', 'ultrasound', 'thermal', 'task', 'exercise', 'other']), z.string().trim())
      .optional(),
```

### Subtask 1C: Supabase 변환 로직

- [ ] **Step 1C.1: TreatmentRow 타입에 method_details 추가**

`src/lib/supabase/treatments.ts` Read해서 TreatmentRow type 위치 확인 후 필드 추가:

```ts
type TreatmentRow = {
  id: string
  user_id: string
  patient_id: string
  date: string
  body_parts: BodyPart[] | null
  methods: TreatmentMethod[] | null
  other_treatment_method: string | null
  method_details: Partial<Record<TreatmentMethod, string>> | null  // ← NEW
  exercise_concept: ExerciseConcept | null
  exercises: Exercise[] | null
  homework: string | null
  comment: string | null
  flags: string[] | null
  created_at: string
}
```

(실제 TreatmentRow 정의 위치/들여쓰기는 Read로 확인 후 정확히 매칭)

- [ ] **Step 1C.2: dbToTreatment 매핑 추가**

찾을 문자열:

```ts
    otherTreatmentMethod: dbRecord.other_treatment_method ?? undefined,
```

바꿀 문자열:

```ts
    otherTreatmentMethod: dbRecord.other_treatment_method ?? undefined,
    methodDetails: dbRecord.method_details ?? undefined,
```

- [ ] **Step 1C.3: createTreatment / updateTreatment insert에 추가**

`src/lib/supabase/treatments.ts`의 `createTreatment` / `updateTreatment` 함수에서 supabase insert/update 객체에 `method_details: input.methodDetails ?? null` 추가.

먼저 Read로 두 함수의 insert/update 호출 위치 확인:

```bash
grep -n "supabase.from('treatments').insert\|supabase.from('treatments').update" src/lib/supabase/treatments.ts
```

각 호출 객체에서 `other_treatment_method: input.otherTreatmentMethod ?? null,` 라인 바로 다음에 추가:

```ts
      other_treatment_method: input.otherTreatmentMethod ?? null,
      method_details: input.methodDetails ?? null,
```

(insert와 update 두 곳 모두 추가)

- [ ] **Step 1C.4: TreatmentInput 타입에 methodDetails 추가**

`src/lib/supabase/treatments.ts`에 `TreatmentInput` 또는 `CreateTreatmentInput` 같은 입력 타입 있는지 확인. 있으면 거기에 `methodDetails?: Partial<Record<TreatmentMethod, string>>` 추가.

만약 인라인 타입(객체 매개변수)이면 함수 시그니처 수정.

### Subtask 1D: MethodSelector UI

- [ ] **Step 1D.1: 현재 컴포넌트 Read**

전체 Read (~80라인) 후 메서드 그리드 + other textarea 영역 파악.

- [ ] **Step 1D.2: 선택된 메서드별 textarea 추가**

기존 패턴: `{isOtherOn && <Input ... {...register('otherTreatmentMethod')} />}` 가 있음.

확장 방향: 선택된 모든 메서드(`exercise` 제외)에 대해 textarea 표시.

찾을 문자열 (정확한 영역은 Read 후 확인):

```tsx
    {isOtherOn && (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otherTreatmentMethod" className="text-xs text-muted-foreground">기타 치료방법 상세</Label>
        <Input
          id="otherTreatmentMethod"
          placeholder="직접 입력"
          {...register('otherTreatmentMethod')}
        />
      </div>
    )}
```

바꿀 문자열:

```tsx
    {/* 선택된 메서드(운동 제외)에 대해 상세 메모 textarea — 안 써도 OK */}
    {selected
      .filter((m) => m !== 'exercise')
      .map((m) => {
        const fieldName = m === 'other' ? 'otherTreatmentMethod' : `methodDetails.${m}` as const
        const placeholder = METHOD_DETAIL_PLACEHOLDER[m] ?? '상세 메모 (선택)'
        return (
          <div key={m} className="flex flex-col gap-1.5">
            <Label htmlFor={`detail-${m}`} className="text-xs text-muted-foreground">
              {TREATMENT_METHOD_LABEL[m]} 상세
            </Label>
            <Input
              id={`detail-${m}`}
              placeholder={placeholder}
              {...register(fieldName)}
            />
          </div>
        )
      })}
```

이 코드는 새 상수 `METHOD_DETAIL_PLACEHOLDER` 및 `TREATMENT_METHOD_LABEL` 사용. 후자는 이미 [src/data/treatment-options.ts](src/data/treatment-options.ts) 같은 곳에 있을 가능성. 없으면 inline 매핑:

```ts
const TREATMENT_METHOD_LABEL: Record<TreatmentMethod, string> = {
  manual: '도수치료',
  electric: '전기',
  ultrasound: '초음파',
  thermal: '냉-온치료',
  task: '과제 훈련',
  exercise: '운동치료',
  other: '기타',
}

const METHOD_DETAIL_PLACEHOLDER: Partial<Record<TreatmentMethod, string>> = {
  manual: '예: 우측 어깨 강도 중',
  electric: '예: TENS 15분',
  ultrasound: '예: 5분 1MHz',
  thermal: '예: 온찜질 10분',
  task: '예: 보행 30보 × 3세트',
  other: '직접 입력',
}
```

(실제 옵션 파일 있으면 import해서 사용)

**중요:** `register('methodDetails.manual')` 같은 dot notation을 react-hook-form이 지원. 단, 타입이 `Partial<Record<...>>`라 키 자동완성 안 될 수도. 그 경우 `register('methodDetails.manual' as never)` 또는 `register('methodDetails.manual' as Path<TreatmentFormValues>)`. 빌드 에러 나면 그 시점에 정정.

- [ ] **Step 1D.3: defaultValues에 methodDetails 빈 객체 추가 (필요시)**

MethodSelector는 react-hook-form의 useFormContext를 사용. 부모 폼(TreatmentForm.tsx)에서 defaultValues에 `methodDetails: {}` 추가 필요한지 확인. 보통 optional이라 안 해도 OK.

### Subtask 1E: TreatmentDetailSheet 표시

- [ ] **Step 1E.1: 메서드 Badge 영역에 상세 표시 추가**

찾을 문자열 (`src/features/treatments/components/TreatmentDetailSheet.tsx`):

```tsx
<Section title="치료 방법">
  <div className="flex flex-wrap gap-1.5 mt-1">
    {treatment.methods?.map((m) => (
      <Badge key={m} variant="secondary" className="px-2 py-1">
        {TREATMENT_METHOD_LABEL[m]}
      </Badge>
    ))}
    {treatment.otherTreatmentMethod && (
      <Badge variant="outline">{treatment.otherTreatmentMethod}</Badge>
    )}
  </div>
</Section>
```

바꿀 문자열:

```tsx
<Section title="치료 방법">
  <div className="flex flex-col gap-2 mt-1">
    {treatment.methods?.map((m) => {
      // 'other'는 옛 컬럼 otherTreatmentMethod 와 새 컬럼 methodDetails.other 둘 다 호환
      const detail =
        m === 'other'
          ? (treatment.methodDetails?.other ?? treatment.otherTreatmentMethod)
          : treatment.methodDetails?.[m]
      return (
        <div key={m} className="flex flex-col gap-0.5">
          <Badge variant="secondary" className="self-start px-2 py-1">
            {TREATMENT_METHOD_LABEL[m]}
          </Badge>
          {detail && (
            <p className="ml-2 text-xs text-muted-foreground italic">
              &ldquo;{detail}&rdquo;
            </p>
          )}
        </div>
      )
    })}
  </div>
</Section>
```

(옛 데이터에서 `other_treatment_method`만 있고 `methods`에 'other' 없는 경우는 거의 없음. 만약 있다면 별도 fallback 필요하지만 dev 데이터 청소 예정이라 무시 OK)

### Subtask 1F: 페이지 handleSubmit에 methodDetails 전달

- [ ] **Step 1F.1: treatments/new/page.tsx**

`src/app/patients/[id]/treatments/new/page.tsx`의 `createTreatment` 호출 객체에 추가:

찾을 문자열(`Read`로 정확히 확인):

```ts
    const result = await createTreatment({
      patientId,
      date: values.date,
      bodyParts: values.bodyParts,
      methods: values.methods,
      exerciseConcept: values.exerciseConcept,
      exercises: values.exercises,
      homework: values.homework,
      comment: values.comment,
      flags: values.flags,
    })
```

바꿀 문자열:

```ts
    const result = await createTreatment({
      patientId,
      date: values.date,
      bodyParts: values.bodyParts,
      methods: values.methods,
      otherTreatmentMethod: values.otherTreatmentMethod,
      methodDetails: values.methodDetails,
      exerciseConcept: values.exerciseConcept,
      exercises: values.exercises,
      homework: values.homework,
      comment: values.comment,
      flags: values.flags,
    })
```

(`otherTreatmentMethod`이 이미 전달되고 있는지 확인. 위 grep 결과상 누락된 경우 함께 추가)

- [ ] **Step 1F.2: treatments/[treatmentId]/edit/page.tsx**

`src/app/patients/[id]/treatments/[treatmentId]/edit/page.tsx`의 `updateTreatment` 호출에 동일하게 `methodDetails: values.methodDetails` 추가.

### Subtask 1G: 시드 데이터에 methodDetails 추가 (선택)

- [ ] **Step 1G.1: 시드 fixture에 일부 methodDetails 추가**

`src/app/seed/seed-client.tsx`의 treatments push 객체에 추가:

```ts
treatments.push({
  user_id: user.id,
  patient_id: patient.id,
  date: currentDate.toISOString().split('T')[0],
  body_parts: [...],
  methods: fx.methods,
  method_details: {},  // 시드는 빈 객체. 사용자 직접 입력 케이스 테스트는 새 치료 작성으로
  exercise_concept: 'recovery',
  exercises: [...],
  comment: '...',
})
```

(시드를 풍부하게 하려면 각 fixture에 methodDetails 샘플 추가 가능. 일단 `{}`로 두고 사용자가 실제 입력 테스트)

### Subtask 1H: 빌드 + 검증 + commit

- [ ] **Step 1H.1: 빌드 검증**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors. 만약 zod의 `z.record(treatmentMethodEnum, ...)` 타입 에러 나면 inline enum 사용 패턴으로 교체.

- [ ] **Step 1H.2: dev 서버 준비**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200 아니면 npm run dev background
```

- [ ] **Step 1H.3: Playwright 모바일 검증**

1. resize 390x844
2. navigate `/patients/452bc962-c0b0-477b-a58b-89303b512b8f/treatments/new`
3. 치료방법 체크박스 클릭: 도수치료 + 초음파 + 기타 (3개)
4. 각 textarea에 텍스트 입력:
   - 도수치료: "우측 어깨 강도 중"
   - 초음파: "5분 1MHz"
   - 기타: "맞춤 치료"
5. 본문 다른 필수 필드 채움 (날짜·부위)
6. 저장 → toast "치료 저장됨"
7. 환자 상세 → 치료 탭 → 방금 만든 카드 클릭 → DetailSheet 열림
8. screenshot — 메서드 Badge 3개 + 각 아래에 상세 메모 표시되는지

- [ ] **Step 1H.4: 사용자 검토 요청**

캡처 보여주고 OK 받은 후 commit.

- [ ] **Step 1H.5: Task 1 commit**

```bash
git add src/features/treatments/domain/types.ts \
        src/features/treatments/domain/schema.ts \
        src/features/treatments/components/MethodSelector.tsx \
        src/features/treatments/components/TreatmentDetailSheet.tsx \
        src/lib/supabase/treatments.ts \
        src/app/patients/\[id\]/treatments/new/page.tsx \
        src/app/patients/\[id\]/treatments/\[treatmentId\]/edit/page.tsx \
        src/app/seed/seed-client.tsx
git commit -m "$(cat <<'EOF'
feat(treatments): 치료방법별 상세 메모 — methodDetails JSONB

사용자 요청: "전기/초음파/냉온/과제훈련/도수치료도 기타 누른 것처럼
상세 입력 가능했으면. 안 써도 되고 써도 되고"

변경:
- 도메인 Treatment.methodDetails?: Partial<Record<TreatmentMethod, string>>
  · 각 메서드별 optional 상세 텍스트
  · 'exercise'는 운동 카드로 자세 입력하므로 키에서 제외
- zod schema methodDetails 필드 (optional)
- MethodSelector: 선택된 메서드(운동 제외) 아래에 textarea 자동 노출
  · placeholder 메서드별 힌트 ("예: TENS 15분", "예: 우측 어깨 강도 중")
- TreatmentDetailSheet: Badge 아래 상세 메모 italic 표시
  · 옛 other_treatment_method 컬럼 fallback 호환
- Supabase treatments.ts: TreatmentRow 타입 + dbToTreatment + insert/update
- new/edit 페이지: methodDetails 폼값 supabase에 전달
- 시드: 빈 method_details 객체 추가 (사용자 직접 입력으로 검증)

DB 마이그레이션 (수동 실행):
  ALTER TABLE treatments ADD COLUMN method_details jsonb DEFAULT '{}'::jsonb;

호환: 옛 row의 method_details는 PostgreSQL default '{}' 로 자동 채워짐.
옛 other_treatment_method 값은 그대로 DB에 있고 UI fallback으로 표시.

검증:
- npm run build (TypeScript 0 errors)
- Playwright: 3 메서드 선택 → 각각 텍스트 입력 → 저장 → DetailSheet에 표시

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 1H.6: push + Vercel + 폰 검증 안내**

```bash
git push origin main
```

Vercel 배포 확인 → 사용자 폰 검증 안내:
1. 치료 작성 → 도수치료 + 초음파 선택 → 각 상세 메모 입력 → 저장
2. 치료 상세 클릭 → 메서드 Badge 아래에 상세 표시 확인
3. 옛 치료(시드 데이터) 진입 시 깨지지 않는지

**OK 받은 후 Task 2 시작.**

---

## Task 2: S3-2 운동 시간(분) 측정

### Subtask 2A: 도메인 + schema

- [ ] **Step 2A.1: Exercise 타입에 duration 추가**

찾을 문자열 (`src/features/treatments/domain/types.ts`):

```ts
export type Exercise = {
  id: string
  name: string
  intensity?: string  // 기존 자유 입력 유지
  sets?: number       // 델타 기록용 수치
  reps?: number
  weight?: number
}
```

바꿀 문자열:

```ts
export type Exercise = {
  id: string
  name: string
  intensity?: string  // 기존 자유 입력 유지
  sets?: number       // 델타 기록용 수치
  reps?: number
  weight?: number
  duration?: number   // 분 단위 (소수 OK, 예: 1.5 = 1분 30초). 에르고미터·유산소 등 시간 기반
}
```

- [ ] **Step 2A.2: exerciseSchema에 duration 추가**

`src/features/treatments/domain/schema.ts` 찾을 문자열:

```ts
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, '운동명을 입력하세요'),
  intensity: z.string().trim().optional(),
  sets: z.coerce.number().min(0).optional(),
  reps: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
})
```

바꿀 문자열:

```ts
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, '운동명을 입력하세요'),
  intensity: z.string().trim().optional(),
  sets: z.coerce.number().min(0).optional(),
  reps: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().min(0).optional(),
})
```

### Subtask 2B: ExerciseSection UI

- [ ] **Step 2B.1: 4열 grid (모바일 2x2) + 시간 counter 추가**

찾을 문자열 (`src/features/treatments/components/ExerciseSection.tsx`):

```tsx
<div className="grid grid-cols-3 gap-2">
  <CounterField
    label="세트"
    value={watch(`exercises.${idx}.sets`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.sets`, v)}
  />
  <CounterField
    label="횟수"
    value={watch(`exercises.${idx}.reps`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.reps`, v)}
  />
  <CounterField
    label="무게(kg)"
    value={watch(`exercises.${idx}.weight`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.weight`, v)}
  />
</div>
```

바꿀 문자열:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
  <CounterField
    label="세트"
    value={watch(`exercises.${idx}.sets`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.sets`, v)}
  />
  <CounterField
    label="횟수"
    value={watch(`exercises.${idx}.reps`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.reps`, v)}
  />
  <CounterField
    label="무게(kg)"
    value={watch(`exercises.${idx}.weight`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.weight`, v)}
  />
  <CounterField
    label="시간(분)"
    value={watch(`exercises.${idx}.duration`) ?? 0}
    onChange={(v) => setValue(`exercises.${idx}.duration`, v)}
  />
</div>
```

(CounterField가 정수 step만 지원하면 소수 입력 불가. 그 경우 step prop 추가 필요. CounterField Read해서 확인 — 정수만 받으면 일단 1분 단위, 나중에 소수 step 추가)

### Subtask 2C: DetailSheet 표시

- [ ] **Step 2C.1: duration badge 표시 추가**

찾을 문자열 (`src/features/treatments/components/TreatmentDetailSheet.tsx`):

```tsx
<div className="flex gap-3 text-xs font-black text-slate-900">
  {e.sets && <span>{e.sets} SET</span>}
  {e.reps && <span>{e.reps} REP</span>}
  {e.weight && <span>{e.weight} kg</span>}
</div>
```

바꿀 문자열:

```tsx
<div className="flex gap-3 text-xs font-black text-slate-900">
  {e.sets ? <span>{e.sets} SET</span> : null}
  {e.reps ? <span>{e.reps} REP</span> : null}
  {e.weight ? <span>{e.weight} kg</span> : null}
  {e.duration ? <span>{e.duration} 분</span> : null}
</div>
```

(`{e.sets &&` 패턴은 0일 때도 false라 표시 안 됨 → `?` ternary로 명시. 그래도 0인 값은 표시 안 함)

### Subtask 2D: 빌드 + 검증 + commit

- [ ] **Step 2D.1: 빌드**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 2D.2: Playwright 검증**

1. 치료 새로 작성 페이지 진입
2. 운동치료 체크 → 운동 추가 → "에르고미터" 입력
3. 시간(분) 입력 (예: 20)
4. 저장 → DetailSheet 확인 → "20 분" 표시

- [ ] **Step 2D.3: Task 2 commit**

```bash
git add src/features/treatments/domain/types.ts \
        src/features/treatments/domain/schema.ts \
        src/features/treatments/components/ExerciseSection.tsx \
        src/features/treatments/components/TreatmentDetailSheet.tsx
git commit -m "$(cat <<'EOF'
feat(treatments): 운동 시간(분) 측정 필드 — duration optional 추가

사용자 요청: "운동치료 작성시 세트/횟수/무게도 있지만 에르고미터와
같은 것은 시간으로 측정이 필요할듯한데"

변경:
- 도메인 Exercise.duration?: number (분 단위, 소수 OK)
- zod exerciseSchema duration optional
- ExerciseSection: 3열 → 4열 grid (모바일 2x2)
  세트 / 횟수 / 무게(kg) / 시간(분)
- TreatmentDetailSheet 운동 카드에 "N 분" badge 추가

DB 마이그레이션 불필요: exercises가 jsonb 컬럼이라 키 추가만으로 호환.
옛 운동 데이터는 duration undefined로 무해 (표시 안 됨).

검증:
- npm run build (TypeScript 0 errors)
- Playwright: 운동 시간만 입력 → 저장 → DetailSheet에 "N 분" 표시

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: S3-3 PWA Cold Start Splash

### Subtask 3A: Manifest background_color 변경

- [ ] **Step 3A.1: manifest.ts 변경**

찾을 문자열 (`src/app/manifest.ts`):

```ts
    background_color: "#ffffff",
    theme_color: "#1c1c1c",
```

바꿀 문자열:

```ts
    background_color: "#1c1c1c",  // theme_color와 일치 — PWA cold start splash 다크
    theme_color: "#1c1c1c",
```

### Subtask 3B: HTML 인라인 splash

- [ ] **Step 3B.1: RemoveInitialSplash 컴포넌트 생성**

`src/components/RemoveInitialSplash.tsx` 신규 파일:

```tsx
'use client'

import { useEffect } from 'react'

/**
 * Hydrate 직후 layout.tsx에 박힌 `<div id="initial-splash">`를 제거.
 * SSR 단계에서는 splash가 화면을 덮고 있고, React가 mount된 직후 사라짐.
 * PWA cold start 흰 frame을 메우는 용도.
 */
export function RemoveInitialSplash() {
  useEffect(() => {
    const el = document.getElementById('initial-splash')
    if (el) el.remove()
  }, [])
  return null
}
```

- [ ] **Step 3B.2: layout.tsx의 body 첫 자식에 splash + RemoveInitialSplash 추가**

`src/app/layout.tsx` Read 후 body 영역 확인. 찾을 문자열 (정확한 형태는 Read 후 확인):

```tsx
    <body className="min-h-full flex flex-col bg-background text-foreground">
      <AuthGuard>
        <ConfirmDialogProvider>
          {children}
        </ConfirmDialogProvider>
      </AuthGuard>
      <Toaster /* ... */ />
    </body>
```

바꿀 문자열:

```tsx
    <body className="min-h-full flex flex-col bg-background text-foreground">
      {/* PWA cold start 흰 frame 메우기 — RemoveInitialSplash가 hydrate 후 제거 */}
      <div
        id="initial-splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background text-foreground px-6"
        style={{ contain: 'strict' }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-lg font-medium italic text-center max-w-sm leading-relaxed break-keep">
          &ldquo;정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다.&rdquo;
        </p>
      </div>
      <RemoveInitialSplash />
      <AuthGuard>
        <ConfirmDialogProvider>
          {children}
        </ConfirmDialogProvider>
      </AuthGuard>
      <Toaster /* ... */ />
    </body>
```

그리고 layout.tsx 상단에 import 추가:

```tsx
import { RemoveInitialSplash } from '@/components/RemoveInitialSplash'
```

(Toaster 이하 props는 그대로 유지. 정확한 import는 Read 후 매칭)

### Subtask 3C: 빌드 + 검증 + commit

- [ ] **Step 3C.1: 빌드**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3C.2: Playwright 검증 (dev)**

dev 환경에서는 PWA가 비활성화돼 cold start 시뮬은 어려움. 대신:
1. navigate `/` 새 탭
2. 페이지 로드 직후 (1~2초) DOM 확인:
   ```js
   () => ({ splash: !!document.getElementById('initial-splash'), bg: getComputedStyle(document.body).backgroundColor })
   ```
3. Hydrate 후 splash 제거됐는지 확인 (1초 후 다시 query):
   ```js
   () => !!document.getElementById('initial-splash')
   // → false (제거됨)
   ```

- [ ] **Step 3C.3: 사용자 폰 검증 안내**

dev로는 PWA cold start 완전 검증 불가. 사용자 폰에서:
1. 앱 종료 (PWA 강제 종료)
2. 홈 아이콘 다시 탭
3. **흰 화면 없이 바로 다크 배경 + 문구 + spinner 표시**되는지

- [ ] **Step 3C.4: Task 3 commit**

```bash
git add src/app/manifest.ts \
        src/app/layout.tsx \
        src/components/RemoveInitialSplash.tsx
git commit -m "$(cat <<'EOF'
feat(pwa): cold start 흰 화면 → 다크 splash + 인용구

사용자 요청: "홈에서 앱 들어갈 때 흰화면 구간 뒤에 잠시 나오는 로딩을
처음부터 보여주게는 못하나"

원인 (2층):
1. manifest background_color: '#ffffff' — PWA system splash가 흰색
2. SSR HTML이 비어 있어 React hydrate 전까지 brief white frame

Fix:
- manifest.ts background_color: #1c1c1c (theme_color와 일치, 다크)
  → PWA system splash가 다크 배경으로 시작
- layout.tsx의 body 첫 자식에 #initial-splash div (SSR에 포함)
  · 다크 배경 + spinner + "정확한 평가는..." 문구 정적 노출
  · z-[9999] fixed inset-0으로 화면 덮음
- src/components/RemoveInitialSplash.tsx 신규 (useEffect로 hydrate 후
  document.getElementById('initial-splash').remove())

결과: cold start → 다크 splash → React mount → splash 제거 → 본문
흰 frame 0초.

JS 비활성 환경: splash 안 사라짐 (무해, 어차피 React 의존 앱)

검증:
- npm run build (TypeScript 0 errors)
- Playwright dev: splash DOM 존재 → hydrate 후 제거 확인
- 사용자 폰 PWA cold start 검증

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification (Task 2 + 3 합본 push)

- [ ] **Step F.1: 통합 빌드 + lint**

```bash
npm run build 2>&1 | tail -10
npm run lint 2>&1 | tail -10
```

- [ ] **Step F.2: dev 정리**

```bash
pkill -f "next-server|next dev" 2>/dev/null
pkill -f "playwright-mcp|mcp-chrome" 2>/dev/null
```

- [ ] **Step F.3: push (Task 2 + Task 3)**

```bash
git log --oneline origin/main..main   # Task 2 + Task 3 commit 보이는지
git push origin main
```

- [ ] **Step F.4: Vercel 배포 확인**

`mcp__claude_ai_Vercel__list_deployments` → 최신 deployment id → READY 확인.

- [ ] **Step F.5: 사용자 폰 prod 검증 안내**

prod URL: `https://physiolog-collab.vercel.app`

체크리스트:
1. **S3-1 (이미 prod 반영)**: 치료방법 여러 개 선택 → 각 상세 메모 입력 → 저장 → DetailSheet 표시
2. **S3-2**: 운동치료 → 시간(분) 필드에 입력 → 저장 → DetailSheet에 "N 분" 표시
3. **S3-3**: 앱 종료 → 홈 아이콘 → **흰 화면 없이 다크 splash** 즉시 표시

---

## Rollback Plan

Task 단위 부분 rollback:

```bash
# Task 3만
git revert <Task 3 commit SHA>

# Task 2 + 3
git revert <Task 3 commit SHA>..<Task 2 commit SHA>

# Sprint 3 전체 (DB는 별개 — 컬럼 drop 안 함)
git revert <Task 3>..<Task 1>
```

DB `method_details` 컬럼은 코드 revert해도 그대로 둠 (파괴 없음). 나중에 재시도 시 그대로 사용.

---

## Out of Scope (Phase 2+)

- 옛 `other_treatment_method` 컬럼 → `method_details.other`로 마이그레이션 + drop (사용자 데이터 청소 시점)
- 운동 type 분기(strength/cardio/time-based) UI
- 메서드별 자주 쓰는 메모 자동완성
- splash 이미지 PWA `apple-touch-startup-image` (iOS 전용 splash 정적 PNG)
- splash 애니메이션 (현재는 정적 spinner)
