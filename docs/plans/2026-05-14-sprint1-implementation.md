# Sprint 1 — 사용성 직격 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** physiolog 차팅 5분 목표를 흔드는 4개 마찰을 한 PR로 제거 — 폼 모바일 1열 / 더블클릭 방지 / 치료 안정정렬 / 시드 환자 10명 다양화 + painMapping.

**Architecture:** React 컴포넌트(react-hook-form) 4 파일 + Supabase 쿼리 1 파일 + 시드 스크립트 1 파일을 task별 분리 commit. UI 변경이라 unit test 대신 `npm run build` + Playwright 모바일 캡처 + 사용자 폰 prod 검증으로 verification.

**Tech Stack:** Next.js 16 App Router, React 19, react-hook-form, Tailwind v4, shadcn/ui, lucide-react, Supabase, react-muscle-highlighter v1.2.0

**Related spec:** [docs/specs/2026-05-14-mvp-polish-batch-design.md](../specs/2026-05-14-mvp-polish-batch-design.md) Sprint 1 섹션

---

## File Structure

**Modify:**
- `src/features/patients/components/PatientForm.tsx` — Task 1 + Task 2
- `src/features/treatments/components/TreatmentForm.tsx` — Task 2
- `src/features/evaluations/components/EvaluationForm.tsx` — Task 2
- `src/lib/supabase/treatments.ts` — Task 3
- `src/app/seed/seed-client.tsx` — Task 4

**No new files.** All changes are inline edits to existing files.

**커밋 단위:** 4개 task = 4 commit. 작업 도중 build/lint 깨지지 않게 task별 완결성 유지.

---

## Pre-flight: dev 환경 준비

- [ ] **Step 0.1: 현재 main 최신 동기화**

```bash
cd /Users/jeonghunsakong/Projects/physiolog-collab
git status                       # working tree clean 확인
git pull --ff-only origin main   # 최신 가져오기
git log --oneline -3             # 최신 commit: 1fcb90f (spec) / 7b7a1af (L/R fix)
```

Expected: clean working tree, head는 `1fcb90f` (spec commit) 또는 그 이후.

---

## Task 1: 환자 정보 폼 모바일 1열 grid

**Spec:** S1-1
**Files:**
- Modify: `src/features/patients/components/PatientForm.tsx:92, 266, 305`

세 곳 모두 `grid grid-cols-2 gap-3` → `grid grid-cols-1 sm:grid-cols-2 gap-3` 한 패턴 적용.

- [ ] **Step 1.1: PatientForm 92라인 — 생년월일/성별 행**

찾을 문자열 (한 번만 등장하도록 주변 컨텍스트 포함):

```tsx
        {/* 생년월일 + 성별 */}
        <div className="grid grid-cols-2 gap-3">
```

바꿀 문자열:

```tsx
        {/* 생년월일 + 성별 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

도구: `Edit` (file_path = src/features/patients/components/PatientForm.tsx)

- [ ] **Step 1.2: PatientForm 266라인 — 치료시작일/보험 행**

찾을 문자열:

```tsx
        {/* 치료 시작일 + 보험 */}
        <div className="grid grid-cols-2 gap-3">
```

바꿀 문자열:

```tsx
        {/* 치료 시작일 + 보험 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

- [ ] **Step 1.3: PatientForm 305라인 — 담당치료사/상태 행**

찾을 문자열:

```tsx
        {/* 담당 치료사 + 상태 */}
        <div className="grid grid-cols-2 gap-3">
```

바꿀 문자열:

```tsx
        {/* 담당 치료사 + 상태 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

**중요:** 주변 주석(`{/* ... */}`)을 함께 포함해서 매칭해야 다른 grid-cols-2와 헷갈리지 않음. 만약 주석이 다르면 Read로 실제 코드 확인 후 unique한 context를 잡아 Edit.

- [ ] **Step 1.4: 빌드 검증**

```bash
npm run build 2>&1 | tail -30
```

Expected: `Compiled successfully` 또는 `✓ Compiled` 출력. TypeScript 에러 0건.

- [ ] **Step 1.5: 모바일 캡처 (Playwright)**

dev 서버 띄우고 환자 편집 페이지 모바일 캡처:

```bash
# 사용자가 이미 dev 켜놨는지 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200이면 그대로 사용. 아니면 background로 npm run dev
```

dev 200 미응답일 때만:

```bash
npm run dev > /tmp/dev.log 2>&1 &
until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)" = "200" ]; do sleep 1; done
```

Playwright (mcp__plugin_ecc_playwright__*):
1. resize 390x844
2. navigate → `/login` 로그인 (`baseline-test@physiolog.local` / `Test1234!`)
3. navigate → `/patients/452bc962-c0b0-477b-a58b-89303b512b8f/edit` (테스트환자)
4. take_screenshot — fullPage jpg, `screenshot_after_form_mobile_grid.jpg`
5. 화면에서 모든 짝 필드가 **1열로 떨어졌는지** 시각 확인. 라벨/입력창 잘림 없음.

- [ ] **Step 1.6: 사용자 캡처 검토 요청**

스크린샷 보여주고 "OK"를 받은 뒤에만 다음 단계.

- [ ] **Step 1.7: 데스크톱 회귀 캡처**

```
resize 1440x900
같은 URL navigate
screenshot_after_form_desktop_grid.jpg
```

데스크톱에서 여전히 2열로 나오는지 확인. (sm:grid-cols-2 적용된 영역이 ≥640px)

- [ ] **Step 1.8: Task 1 commit**

```bash
git add src/features/patients/components/PatientForm.tsx
git commit -m "$(cat <<'EOF'
fix(patients): 환자 정보 폼 모바일에서 1열 grid로 — 좁은 폭에서 input 압축 해결

세 행(생년월일/성별, 치료시작일/보험, 담당치료사/상태)을 grid-cols-1 sm:grid-cols-2 로 변경.
sm(640px) 미만 모바일에서 라벨·입력창 잘림 없이 한 칸씩 배치.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 더블 클릭 방지 + 로딩 spinner

**Spec:** S1-2
**Files:**
- Modify: `src/features/patients/components/PatientForm.tsx` (button 영역 + form 구조 확인)
- Modify: `src/features/treatments/components/TreatmentForm.tsx` (button 영역)
- Modify: `src/features/evaluations/components/EvaluationForm.tsx` (button 영역)

세 폼 모두 동일 패턴 — react-hook-form의 `formState.isSubmitting`을 활용해 버튼 disabled + spinner.

### 패턴 정의 (세 파일 공통)

기존 form 정의 (이미 있음):

```tsx
const form = useForm<...>({ ... })
```

이걸 활용해서 `form.formState.isSubmitting`을 buttonprops에 적용. submit 핸들러가 async/await Promise를 반환하기만 하면 react-hook-form이 자동으로 isSubmitting 토글.

세 파일 모두 submit 버튼 영역은 비슷한 구조:

```tsx
<div className="flex gap-3 pt-4">
  <Button type="button" variant="outline" onClick={...}>취소</Button>  {/* 또는 Link */}
  <Button type="submit" className="flex-1">{submitLabel}</Button>
</div>
```

목표 패턴:

```tsx
<div className="flex gap-3 pt-4">
  <Button
    type="button"
    variant="outline"
    onClick={...}
    disabled={form.formState.isSubmitting}
  >
    취소
  </Button>
  <Button
    type="submit"
    className="flex-1"
    disabled={form.formState.isSubmitting}
  >
    {form.formState.isSubmitting ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        저장 중...
      </>
    ) : (
      submitLabel
    )}
  </Button>
</div>
```

`Loader2`는 lucide-react import에 추가.

### Task 2A: PatientForm

- [ ] **Step 2A.1: Loader2 import 추가**

`src/features/patients/components/PatientForm.tsx` 의 lucide-react import 라인 찾기.

Read로 PatientForm.tsx의 import 영역(1~30라인) 확인 후, 기존 lucide-react import 라인에 `Loader2` 추가. 예시:

기존:

```tsx
import { CalendarIcon } from 'lucide-react'
```

변경:

```tsx
import { CalendarIcon, Loader2 } from 'lucide-react'
```

(실제 import 목록은 다를 수 있음 — Read 후 맞춰서 Edit. lucide-react import 라인이 없으면 새 import 추가)

- [ ] **Step 2A.2: 취소 버튼에 disabled 추가**

`PatientForm.tsx` 의 submit 버튼 영역(약 375~382라인) Read.

submitLabel 직전의 취소 버튼(Button or Link) 찾아 `disabled={form.formState.isSubmitting}` 추가. Link라면 `aria-disabled={form.formState.isSubmitting}` + `pointer-events-none opacity-50` 조건부 클래스로 처리.

(form은 useForm 결과 변수명. PatientForm에서 어떤 이름인지 확인 — `form`이 일반적이지만 다를 수 있음)

- [ ] **Step 2A.3: submit 버튼 spinner 처리**

찾을 문자열:

```tsx
<Button type="submit" className="flex-1">
  {submitLabel}
</Button>
```

바꿀 문자열:

```tsx
<Button
  type="submit"
  className="flex-1"
  disabled={form.formState.isSubmitting}
>
  {form.formState.isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      저장 중...
    </>
  ) : (
    submitLabel
  )}
</Button>
```

(form 변수명이 `form`이 아니면 그 이름으로 치환)

- [ ] **Step 2A.4: onSubmit이 Promise 반환하는지 확인**

PatientForm의 `handleSubmit` 호출부 Read. 다음 두 패턴 중 어느 쪽인지:

(a) `onSubmit={form.handleSubmit(async (values) => { await save(values) })}` ← Promise 반환 OK
(b) `onSubmit={form.handleSubmit((values) => { save(values) })}` ← 동기, isSubmitting 토글 안 됨

(b)면 함수에 `async` 추가 + `await` 적용. 외부에서 `onSubmit` prop으로 받는 형태면 호출부도 점검.

### Task 2B: TreatmentForm

- [ ] **Step 2B.1: Loader2 import 추가**

`src/features/treatments/components/TreatmentForm.tsx` 의 lucide-react import 라인에 `Loader2` 추가. (Step 2A.1과 동일 방식)

- [ ] **Step 2B.2: 취소 + submit 버튼 변경**

Step 2A.2 + 2A.3과 동일한 변경을 TreatmentForm.tsx:156 부근에 적용.

- [ ] **Step 2B.3: onSubmit Promise 확인**

Step 2A.4와 동일.

### Task 2C: EvaluationForm

- [ ] **Step 2C.1: Loader2 import 추가**

`src/features/evaluations/components/EvaluationForm.tsx` 의 lucide-react import 라인에 `Loader2` 추가.

- [ ] **Step 2C.2: 취소 + submit 버튼 변경**

Step 2A.2 + 2A.3과 동일한 변경을 EvaluationForm.tsx:158 부근에 적용.

- [ ] **Step 2C.3: onSubmit Promise 확인**

Step 2A.4와 동일.

### Task 2 검증

- [ ] **Step 2D.1: 빌드 검증**

```bash
npm run build 2>&1 | tail -30
```

Expected: 0 errors.

- [ ] **Step 2D.2: Playwright 더블 클릭 검증 — PatientForm**

(dev 서버 동작 중. Step 1.5의 dev 서버 그대로 사용)

1. resize 390x844
2. navigate `/patients/452bc962-c0b0-477b-a58b-89303b512b8f/edit`
3. 폼 내 input 한 칸 수정 (예: notes 마지막에 "test" 추가)
4. browser_evaluate로 저장 버튼을 빠르게 2번 클릭:
   ```js
   const btn = document.querySelector('button[type="submit"]')
   btn.click()
   btn.click()   // 즉시 두 번째 클릭
   ```
5. browser_network_requests 로 PATCH 요청 1건만 발생했는지 확인. 2건이면 실패.
6. screenshot — submit 버튼이 spinner 상태("저장 중...") 보여줬는지 확인 (저장 매우 빠르면 spinner 못 잡을 수 있음 — 그 경우 throttle 옵션 또는 supabase delay 시뮬)

- [ ] **Step 2D.3: TreatmentForm 더블 클릭 검증**

같은 방식으로 `/patients/.../treatments/new` 페이지에서 검증.

- [ ] **Step 2D.4: EvaluationForm 더블 클릭 검증**

같은 방식으로 `/patients/.../evaluations/new` 페이지에서 검증.

- [ ] **Step 2D.5: 사용자 검토 요청**

세 폼 스크린샷 + 네트워크 요청 결과 보여주고 OK 받기.

- [ ] **Step 2D.6: Task 2 commit**

```bash
git add src/features/patients/components/PatientForm.tsx \
        src/features/treatments/components/TreatmentForm.tsx \
        src/features/evaluations/components/EvaluationForm.tsx
git commit -m "$(cat <<'EOF'
feat(forms): 저장 중 더블 클릭 방지 + 로딩 spinner — 세 폼 통일

PatientForm/TreatmentForm/EvaluationForm 모두 react-hook-form formState.isSubmitting
활용해 submit 중 버튼 disabled + Loader2 spinner + "저장 중..." 표시.
취소 버튼도 함께 disabled로 중복 액션 차단.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 치료 기록 안정 정렬

**Spec:** S1-3
**Files:**
- Modify: `src/lib/supabase/treatments.ts:30-37` (`getTreatments` 함수)

같은 날짜 여러 치료가 무작위 순서로 보이는 버그. `created_at` 보조 정렬 추가.

- [ ] **Step 3.1: getTreatments에 보조 정렬 추가**

찾을 문자열:

```ts
    .order('date', { ascending: false })
```

(파일 내 같은 패턴이 다른 함수에도 있을 수 있음 — Read로 30~50라인 + 180~220라인 영역 확인 후 `getTreatments` 함수 안의 한 곳만 정확히 매칭)

바꿀 문자열:

```ts
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
```

`Edit` 도구로 단일 변경. 만약 다른 함수에도 같은 패턴이 있고 변경 의도가 같다면 (예: `getLatestTreatmentDateMap`은 first-occurrence가 정확해야 하므로 동일 변경 필요), 그것도 함께 변경.

- [ ] **Step 3.2: getLatestTreatmentDateMap도 같은 변경 필요한지 확인**

Read `src/lib/supabase/treatments.ts:187-216` (`getLatestTreatmentDateMap`).

이 함수도 `.order('date', { ascending: false })`만 있으면, 같은 날짜 여러 건일 때 "어느 게 최신"인지 무작위. 같은 보정 적용:

```ts
.order('date', { ascending: false })
.order('created_at', { ascending: false })
```

- [ ] **Step 3.3: 빌드 검증**

```bash
npm run build 2>&1 | tail -30
```

Expected: 0 errors.

- [ ] **Step 3.4: 데이터 검증**

Playwright로 같은 날짜 치료 2건 만들고 순서 확인:

1. navigate `/patients/.../treatments/new`
2. 치료 입력 — date를 오늘로, comment "test-A"
3. submit
4. 다시 `/patients/.../treatments/new`
5. 같은 date, comment "test-B"
6. submit
7. `/patients/.../#treatments` 탭으로 이동
8. 리스트 상단에 "test-B" → "test-A" 순서로 표시되는지 확인 (나중 등록이 위)

- [ ] **Step 3.5: Task 3 commit**

```bash
git add src/lib/supabase/treatments.ts
git commit -m "$(cat <<'EOF'
fix(treatments): 같은 날짜 치료 안정 정렬 — date DESC + created_at DESC

getTreatments와 getLatestTreatmentDateMap에 created_at 보조 정렬 추가.
같은 날 여러 치료 등록 시 무작위 순서 → 나중 등록이 위로 일관됨.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 시드 환자 10명 다양화 + painMapping

**Spec:** S1-4 + 항목 B + 항목 7
**Files:**
- Modify: `src/app/seed/seed-client.tsx`

30명 → 10명. 진단명 1:1 매핑 (DISEASES 10개 그대로). 나이·성별·보험·상태 분산. painMapping 각 진단명별 자연스러운 부위 fixture 추가.

### Fixture 설계

다음 10명 fixture를 seed-client.tsx 상단에 상수로 정의:

```ts
import type { PainPattern } from '@/features/evaluations/domain/types'
import { libPartToId, buildLabel } from '@/features/evaluations/lib/bodymap-mapping'
import type { LibSlug, LibSide } from '@/features/evaluations/lib/bodymap-mapping'

type SeedPainArea = {
  slug: LibSlug
  side?: LibSide
  pattern: PainPattern
  intensity: number  // 1~10, 첫 평가 기준. 이후 평가에서 감소
}

type PatientFixture = {
  name: string
  age: number               // 2026년 기준
  gender: 'male' | 'female'
  diagnosis: string
  region: string            // BodyRegionId (치료 부위)
  methods: string[]
  exercises: string[]
  insurance: 'health' | 'industrial' | 'auto' | 'private' | 'medical' | 'self'
  status: 'new' | 'readmit' | 'hold' | 'discharged' | 'treating'  // 도메인 확인 필요
  painAreas: SeedPainArea[]
}

const PATIENT_FIXTURES: PatientFixture[] = [
  {
    name: '김철수', age: 67, gender: 'male',
    diagnosis: '뇌졸중 (Stroke)', region: 'cervical',
    methods: ['manual', 'task'], exercises: ['Balance Training', 'Gait Practice'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'deltoids', side: 'right', pattern: 'weakness', intensity: 6 },
      { slug: 'quadriceps', side: 'right', pattern: 'weakness', intensity: 5 },
    ],
  },
  {
    name: '이영희', age: 52, gender: 'female',
    diagnosis: '허리 디스크 (HLD)', region: 'lumbar',
    methods: ['manual', 'exercise'], exercises: ['Pelvic Tilt', 'Bird Dog'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'lower-back', pattern: 'radiating', intensity: 8 },
      { slug: 'hamstring', side: 'left', pattern: 'tingling', intensity: 4 },
    ],
  },
  {
    name: '박지민', age: 58, gender: 'female',
    diagnosis: '오십견 (Frozen Shoulder)', region: 'shoulder',
    methods: ['manual', 'thermal'], exercises: ['Codman Exercise', 'Wall Walk'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'deltoids', side: 'left', pattern: 'sharp', intensity: 7 },
    ],
  },
  {
    name: '최성훈', age: 72, gender: 'male',
    diagnosis: '파킨슨병 (Parkinson)', region: 'cervical',
    methods: ['task', 'exercise'], exercises: ['Big Movements', 'Step Training'],
    insurance: 'medical', status: 'treating',
    painAreas: [
      { slug: 'neck', pattern: 'weakness', intensity: 4 },
    ],
  },
  {
    name: '정다은', age: 65, gender: 'female',
    diagnosis: '퇴행성 관절염 (Knee OA)', region: 'knee',
    methods: ['manual', 'electric'], exercises: ['Quadriceps Setting', 'SLR Exercise'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'knees', side: 'right', pattern: 'sharp', intensity: 7 },
      { slug: 'knees', side: 'left', pattern: 'sharp', intensity: 4 },
    ],
  },
  {
    name: '강민호', age: 42, gender: 'male',
    diagnosis: '회전근개 파열 (Rotator Cuff Tear)', region: 'shoulder',
    methods: ['manual', 'exercise'], exercises: ['Internal Rotation', 'External Rotation'],
    insurance: 'industrial', status: 'treating',
    painAreas: [
      { slug: 'deltoids', side: 'right', pattern: 'sharp', intensity: 6 },
      { slug: 'trapezius', side: 'right', pattern: 'referred', intensity: 3 },
    ],
  },
  {
    name: '윤서연', age: 71, gender: 'female',
    diagnosis: '척추관 협착증 (Spinal Stenosis)', region: 'lumbar',
    methods: ['manual', 'thermal'], exercises: ['Knee to Chest', 'Cat-Camel'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'lower-back', pattern: 'radiating', intensity: 7 },
      { slug: 'calves', side: 'right', pattern: 'tingling', intensity: 5 },
      { slug: 'calves', side: 'left', pattern: 'tingling', intensity: 4 },
    ],
  },
  {
    name: '한지우', age: 38, gender: 'male',
    diagnosis: '테니스 엘보 (Lateral Epicondylitis)', region: 'elbow',
    methods: ['manual', 'ultrasound'], exercises: ['Wrist Extension', 'Eccentric Loading'],
    insurance: 'private', status: 'treating',
    painAreas: [
      { slug: 'forearm', side: 'right', pattern: 'sharp', intensity: 6 },
    ],
  },
  {
    name: '오세현', age: 28, gender: 'male',
    diagnosis: '발목 불안정성 (Ankle Instability)', region: 'ankle',
    methods: ['manual', 'exercise'], exercises: ['Balance Board', 'Heel Raise'],
    insurance: 'auto', status: 'treating',
    painAreas: [
      { slug: 'ankles', side: 'left', pattern: 'sharp', intensity: 5 },
    ],
  },
  {
    name: '임채원', age: 33, gender: 'female',
    diagnosis: '경추통 (Cervicalgia)', region: 'cervical',
    methods: ['manual', 'thermal'], exercises: ['Chin Tuck', 'Neck Isometric'],
    insurance: 'health', status: 'treating',
    painAreas: [
      { slug: 'neck', pattern: 'sharp', intensity: 6 },
      { slug: 'trapezius', side: 'right', pattern: 'referred', intensity: 4 },
    ],
  },
]
```

### 변경 단계

- [ ] **Step 4.1: 도메인 상수 확인**

```bash
grep -n "PatientStatus\|InsuranceType" src/features/patients/domain/types.ts
```

InsuranceType / PatientStatus enum 정확한 값 확인 후 fixture에 반영. spec과 다르면 도메인 우선.

(주의: spec 작성 시 `status: 'treating'`을 default라고 적었지만 PatientStatus enum에 'treating'이 정의돼 있는지 확인 필요. DB seed-client.tsx에서 이미 `'treating'`을 쓰고 있으니 그대로 두면 됨)

- [ ] **Step 4.2: seed-client.tsx 전면 재작성**

기존 30명 루프를 10명 fixture 루프로 교체. 다음 단계대로 진행:

**(a) Import 영역에 추가:**

```tsx
import type { PainPattern } from '@/features/evaluations/domain/types'
import { libPartToId, buildLabel } from '@/features/evaluations/lib/bodymap-mapping'
import type { LibSlug, LibSide } from '@/features/evaluations/lib/bodymap-mapping'
```

**(b) DISEASES / NAMES 상수를 삭제하고 그 자리에 `PatientFixture` 타입 + `PATIENT_FIXTURES` 배열 정의** (Fixture 설계 섹션의 전체 코드 그대로 붙여넣기).

**(c) generateData 함수 본문 교체:**

```tsx
  const generateData = async () => {
    setLoading(true)
    setError(null)
    setProgress(0)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const total = PATIENT_FIXTURES.length

      for (let i = 0; i < total; i++) {
        const fx = PATIENT_FIXTURES[i]
        setStatus(`환자 ${i + 1}/${total} 생성 중... (${fx.name})`)

        // 생년월일은 age를 기반으로 계산 (2026 기준)
        const birthYear = 2026 - fx.age
        const birthDate = `${birthYear}-01-01`

        // 1. Create Patient
        const { data: patient, error: pError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: `${fx.name}_${i + 1}`,
            birth_date: birthDate,
            gender: fx.gender,
            diagnosis: fx.diagnosis,
            treatment_start_date: '2026-01-01',
            insurance: fx.insurance,
            status: fx.status,
          })
          .select()
          .single()

        if (pError) throw pError

        // 2. Create Evaluations — 월간 5건, painMapping 시간 흐름에 따라 intensity 감소
        const evalDates = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01']
        const evals = evalDates.map((date, idx) => {
          const decay = idx * 1.5  // 5개월간 강도 감소
          const painMapping = fx.painAreas.map((pa) => ({
            id: libPartToId(pa.slug, pa.side),
            label: buildLabel(pa.slug, pa.side),
            pattern: pa.pattern,
            intensity: Math.max(1, Math.round(pa.intensity - decay)),
          }))
          // VAS = painMapping intensity의 최대값
          const vas = painMapping.reduce((max, p) => Math.max(max, p.intensity), 0)
          return {
            user_id: user.id,
            patient_id: patient.id,
            date,
            vas,
            rom: [],
            mmt: [],
            body_measurement: [],
            pain_mapping: painMapping,
            custom: [],
          }
        })
        await supabase.from('evaluations').insert(evals)

        // 3. Create Treatments — 주 2~3회, 2026-01-01~05-11
        const treatments: any[] = []
        const currentDate = new Date('2026-01-01')
        const endDate = new Date('2026-05-11')
        const sessionDays = Math.random() > 0.5 ? [1, 3, 5] : [2, 4]

        while (currentDate <= endDate) {
          if (sessionDays.includes(currentDate.getDay())) {
            treatments.push({
              user_id: user.id,
              patient_id: patient.id,
              date: currentDate.toISOString().split('T')[0],
              body_parts: [{ region: fx.region, side: Math.random() > 0.5 ? 'right' : 'left', muscles: [] }],
              methods: fx.methods,
              exercise_concept: 'recovery',
              exercises: fx.exercises.map((ex) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ex,
                sets: Math.floor(Math.random() * 3) + 2,
                reps: Math.floor(Math.random() * 5) + 10,
              })),
              comment: `${fx.diagnosis} 치료 ${treatments.length + 1}회차 진행. ${['통증 완화 중', '가동범위 개선 중', '근력 향상 관찰됨', '보행 패턴 안정화'][Math.floor(Math.random() * 4)]}.`,
            })
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }

        for (let j = 0; j < treatments.length; j += 20) {
          await supabase.from('treatments').insert(treatments.slice(j, j + 20))
        }

        setProgress(Math.round(((i + 1) / total) * 100))
      }

      setStatus('모든 데이터 생성 완료!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
```

**(d) UI 문구 갱신:**

찾을 문자열:

```tsx
              <li>30명의 환자 명단</li>
```

바꿀 문자열:

```tsx
              <li>10명의 환자 명단 (진단명·연령·통증 부위 다양)</li>
```

찾을 문자열:

```tsx
              '환자 30명 데이터 추가하기'
```

바꿀 문자열:

```tsx
              '환자 10명 데이터 추가하기'
```

**중요:** `any[]` 타입은 도메인 정의 안 됨 (DB row 그대로 raw insert). 프로젝트 룰 "any 금지"와 충돌하면 `Array<Record<string, unknown>>` 또는 supabase의 InsertDto 타입으로 좁히기. 다만 기존 seed-client.tsx도 `treatments = []`에 타입 없이 push 중이라 이 영역은 raw insert 그대로 유지하되 ESLint warning 안 나오는지 확인.

- [ ] **Step 4.3: 빌드 검증**

```bash
npm run build 2>&1 | tail -40
```

Expected: 0 errors. lucide-react import 누락이나 PainPattern 타입 미스매치 잡힘.

만약 `'treating'` status가 PatientStatus 도메인에 없다고 에러 나면, 도메인 타입 확인 후 fixture status 값 수정 (예: 'new' / 'readmit' / 'hold' / 'discharged' 중에서 — Step 4.1 결과 따라).

- [ ] **Step 4.4: 시드 실행 검증**

dev 서버 활용:

1. supabase에서 dev 테스트 계정으로 기존 데이터 청소 (선택):
   - SQL: `DELETE FROM treatments WHERE user_id = '<test_user_id>'`
   - `DELETE FROM evaluations WHERE user_id = '<test_user_id>'`
   - `DELETE FROM patients WHERE user_id = '<test_user_id>'`
   - (또는 그냥 추가 — 10명 늘어남)
2. Playwright login → navigate `/seed`
3. "환자 10명 데이터 추가하기" 클릭
4. 진행률 100% + "모든 데이터 생성 완료!" 확인
5. navigate `/` → 환자 리스트에 10명 표시 (이름·진단명 다양함)
6. 아무 환자 클릭 → 평가 탭 → 평가 한 건 클릭 → BodyMap에 색칠 표시 (painMapping 채워져 있으므로)

- [ ] **Step 4.5: 스크린샷 + 사용자 fixture 검수**

캡처:
- 환자 리스트 (10명 표시)
- 환자 1명의 평가 상세 (BodyMap에 색칠 — 어느 환자든)

사용자에게 fixture 표(10명 진단명 + 통증 부위) 보여주고 **임상적으로 자연스러운지 검수** 받기. 예:
- "허리 디스크 → 허리 + 햄스트링 저림" → OK?
- "퇴행성 관절염 → 양 무릎 sharp" → OK?

검수 OK 받기 전 commit X.

- [ ] **Step 4.6: Task 4 commit**

```bash
git add src/app/seed/seed-client.tsx
git commit -m "$(cat <<'EOF'
feat(seed): 시드 환자 30명 → 10명 다양화 + painMapping 임상 fixture

PATIENT_FIXTURES 상수로 10명 명시(이름·나이·성별·진단·보험·상태·통증부위).
각 진단명별로 임상적으로 자연스러운 painMapping(부위·양상·강도) 추가.
- 평가 5건이 시간 흐름에 따라 intensity 감소 (개선 시각화)
- VAS는 painMapping max intensity로 자동 산출

BodyMap 라이브러리에 색칠 정상 표시 (이전 pain_mapping=[]로 빈 SVG 문제 해결).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] **Step F.1: 전체 빌드**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step F.2: lint (선택, fast check)**

```bash
npm run lint 2>&1 | tail -20
```

Expected: 새로 추가한 코드에 에러/경고 없음.

- [ ] **Step F.3: dev 정리**

```bash
pkill -f "next-server|next dev" 2>/dev/null
pkill -f "playwright-mcp|mcp-chrome" 2>/dev/null
```

- [ ] **Step F.4: push to origin/main**

```bash
git log --oneline origin/main..main   # 4 commit 보이는지
git push origin main
```

- [ ] **Step F.5: Vercel 배포 확인**

`mcp__claude_ai_Vercel__list_deployments` 호출 → 가장 최근 deployment id 가져오기 → `get_deployment` 로 READY 확인.

- [ ] **Step F.6: 사용자 폰 prod 검증 안내**

prod URL: `https://physiolog-collab.vercel.app`

검증 체크리스트 텍스트로 사용자에게:
1. 환자 편집 진입 → 모바일에서 모든 필드 1열로 보임 (S1-1)
2. 환자/치료/평가 저장 빠르게 2번 탭 → 중복 저장 X, spinner 보임 (S1-2)
3. 같은 날짜 치료 2건 만들고 리스트 → 나중 게 위 (S1-3)
4. `/seed` 진입 → 10명 생성 → 환자 평가 BodyMap에 색칠 표시 (S1-4)

사용자가 폰 검증 OK 받은 후 Sprint 1 종료, Sprint 2 plan 작성 단계로.

---

## Rollback Plan

문제 발생 시 task별 커밋이라 부분 rollback 가능:

```bash
# 특정 task만 되돌리기 (예: Task 2)
git revert <Task 2 commit SHA>

# Sprint 1 전체 되돌리기
git revert <Task 4>..<Task 1>   # 역순 revert
```

prod에서 발견된 critical 버그는 즉시 revert + 재배포. 메모리 `fork_workflow.md` 룰에 따라 fork main 직접 push이므로 PR 머지 대기 없음.

---

## Out of Scope (Sprint 2 이후로 미룸)

- `revalidatePath` 호출 검증 (S2-1)
- 뒤로가기 로딩 체감 (S2-2)
- 헤더 ⋮ 드롭다운 (S2-3)
- 운동 시간 필드 (Sprint 3)
- PWA cold start splash (Sprint 3)
