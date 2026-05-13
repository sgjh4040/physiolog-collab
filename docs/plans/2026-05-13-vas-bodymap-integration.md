# VAS ↔ BodyMap Intensity 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VAS 단일값을 BodyMap painMapping에서 자동 산출. VASInput 폐기, 입력 한 곳 통일, 그래프 자동 활성.

**Architecture:** Schema에서 `toggleVas` + vas refine 제거 → EvaluationForm submit wrapper에서 `vas = max(painMapping.intensity)` 자동 계산 → BodyMap 상단에 실시간 계산값 + '전신' 빠른 선택 버튼 → caller 페이지 2곳의 toggleVas 분기 정리 → VASInput.tsx 삭제. 카드/그래프/DetailSheet는 vas 필드를 그대로 읽으므로 무변경.

**Tech Stack:** Next.js 16 (App Router, --webpack build), React 19, TypeScript, Tailwind v4, shadcn/ui, react-hook-form + zod, Supabase, Playwright MCP (시각 검증)

**검증 모델:** 테스트 인프라 없는 프로젝트 (CLAUDE.md 룰). 각 task는 `npm run build` 통과 + UI 영향 있으면 Playwright 모바일/데스크톱 캡처로 검증.

**Spec 참조:** [docs/specs/2026-05-13-vas-bodymap-integration-design.md](../specs/2026-05-13-vas-bodymap-integration-design.md)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/features/evaluations/domain/schema.ts` | 수정 | `toggleVas` + 관련 refine 제거 |
| `src/features/evaluations/components/EvaluationForm.tsx` | 수정 | VAS 박스 제거. submit wrapper에서 vas 자동 산출. EMPTY_DEFAULTS 정리 |
| `src/features/evaluations/components/BodyMap.tsx` | 수정 | 상단에 자동 계산값 헤더 + '전신' 빠른 선택 버튼 |
| `src/features/evaluations/components/VASInput.tsx` | 삭제 | 더 이상 사용 안 함 |
| `src/app/patients/[id]/evaluations/new/page.tsx` | 수정 | `toggleVas` 분기 제거. `vas: values.vas` 그대로 |
| `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx` | 수정 | `toggleVas` 분기 제거 (submit + defaultValues) |

**무변경 파일** (자동 산출된 vas를 그대로 읽음): `EvaluationCard.tsx`, `EvaluationChart.tsx`, `EvaluationDetailSheet.tsx`, `types.ts`, Supabase CRUD.

---

## Task 1 — schema 정리

**Files:**
- Modify: `src/features/evaluations/domain/schema.ts`

- [ ] **Step 1: schema.ts에서 toggleVas 필드 + 두 refine 제거**

[src/features/evaluations/domain/schema.ts:39-71](../../src/features/evaluations/domain/schema.ts#L39-L71) 의 `evaluationFormSchema`를 다음으로 교체:

```ts
export const evaluationFormSchema = z
  .object({
    date: z.string().min(1, '날짜를 선택하세요'),
    vas: z.number().int().min(0).max(10).optional(),  // submit 시 자동 산출되어 채워짐
    toggleRom: z.boolean(),
    rom: z.array(romRecordSchema),
    toggleMmt: z.boolean(),
    mmt: z.array(mmtRecordSchema),
    toggleMeasurement: z.boolean(),
    measurement: z.array(bodyMeasurementSchema),
    togglePainMapping: z.boolean(),
    painMapping: z.array(painAreaSchema),
    toggleCustom: z.boolean(),
    custom: z.array(customEvalSchema),
  })
  .refine(
    (d) =>
      d.toggleRom ||
      d.toggleMmt ||
      d.toggleMeasurement ||
      d.togglePainMapping ||
      d.toggleCustom,
    {
      message: '측정한 항목을 1개 이상 켜세요',
      path: ['togglePainMapping'],
    },
  )
  .refine((d) => !d.toggleRom || d.rom.length > 0, {
    message: 'ROM 항목을 1개 이상 추가하세요',
    path: ['rom'],
  })
  .refine((d) => !d.toggleMmt || d.mmt.length > 0, {
    message: 'MMT 항목을 1개 이상 추가하세요',
    path: ['mmt'],
  })
  .refine((d) => !d.toggleMeasurement || d.measurement.length > 0, {
    message: '신체 계측 항목을 1개 이상 추가하세요',
    path: ['measurement'],
  })
  .refine((d) => !d.toggleCustom || d.custom.length > 0, {
    message: '커스텀 검사 항목을 1개 이상 추가하세요',
    path: ['custom'],
  })

export type EvaluationFormValues = z.infer<typeof evaluationFormSchema>
```

변경 요약:
- `toggleVas: z.boolean()` 줄 삭제
- "측정 항목 1개 이상" refine에서 `d.toggleVas ||` 제거. path도 `toggleVas`에서 `togglePainMapping`으로
- "VAS 점수 입력" refine 통째로 삭제 (line 68-71)

- [ ] **Step 2: 빌드 통과 확인**

```bash
npm run build
```

Expected: `Compiled successfully` + `Finished TypeScript`. caller(`new/page.tsx`, `edit/page.tsx`)에서 `values.toggleVas` 참조가 컴파일 에러로 잡힐 것 — Task 5에서 정리하지만 일단 여기서 확인만.

이번 step의 빌드는 깨질 수 있음 — 다음 task에서 동시 수정해야 함. **commit은 Task 2 이후에 합쳐서.**

---

## Task 2 — EvaluationForm 정리

**Files:**
- Modify: `src/features/evaluations/components/EvaluationForm.tsx`

- [ ] **Step 1: import에서 VASInput 제거**

`src/features/evaluations/components/EvaluationForm.tsx` line 10 (`import { VASInput } from './VASInput'`) 통째 삭제.

- [ ] **Step 2: ToggleName 타입에서 toggleVas 제거**

[EvaluationForm.tsx:22-28](../../src/features/evaluations/components/EvaluationForm.tsx#L22-L28):

```ts
type ToggleName =
  | 'toggleRom'
  | 'toggleMmt'
  | 'toggleMeasurement'
  | 'togglePainMapping'
  | 'toggleCustom'
```

`'toggleVas'` 한 줄 삭제.

- [ ] **Step 3: EMPTY_DEFAULTS에서 toggleVas + vas 제거**

[EvaluationForm.tsx:30-44](../../src/features/evaluations/components/EvaluationForm.tsx#L30-L44):

```ts
const EMPTY_DEFAULTS: EvaluationFormValues = {
  date: toISODate(),
  toggleRom: false,
  rom: [],
  toggleMmt: false,
  mmt: [],
  toggleMeasurement: false,
  measurement: [],
  togglePainMapping: true,
  painMapping: [],
  toggleCustom: false,
  custom: [],
}
```

`toggleVas: false` + `vas: undefined` 두 줄 삭제.

- [ ] **Step 4: 통증 섹션 안의 VAS 박스 제거**

[EvaluationForm.tsx:119-135](../../src/features/evaluations/components/EvaluationForm.tsx#L119-L135) 의 통증 ToggleSection을 다음으로 교체:

```tsx
        <ToggleSection
          title="통증"
          subtitle="통증 부위 및 양상 — VAS는 자동 산출"
          name="togglePainMapping"
          required
        >
          <BodyMap
            value={form.watch('painMapping')}
            onChange={(v) => form.setValue('painMapping', v, { shouldDirty: true })}
          />
        </ToggleSection>
```

변경:
- 안쪽 `<div className="rounded-lg border bg-muted/30 p-4">` VAS 박스 통째 삭제
- BodyMap 직접 자식으로
- subtitle "통증 부위 및 양상 (VAS 필수)" → "통증 부위 및 양상 — VAS는 자동 산출"

- [ ] **Step 5: toggleVas 에러 표시 블록 제거**

[EvaluationForm.tsx:137-141](../../src/features/evaluations/components/EvaluationForm.tsx#L137-L141):

```tsx
        {errors.toggleVas?.message && (
          <p className="text-sm text-destructive">
            {String(errors.toggleVas.message)}
          </p>
        )}
```

이 5줄 통째 삭제. 같은 효과의 에러는 Task 1의 `togglePainMapping` path refine에 위임됨.

- [ ] **Step 6: submit 핸들러 wrapper로 vas 자동 산출**

[EvaluationForm.tsx:69-71](../../src/features/evaluations/components/EvaluationForm.tsx#L69-L71) 의 `<form onSubmit={form.handleSubmit(onSubmit)}>`를 다음으로 변경:

```tsx
  // 통증 부위가 1개 이상이면 가장 아픈 강도(max)를 vas로 자동 산출.
  // 빈 배열이면 0 (통증 없음).
  const submitWithVas = (values: EvaluationFormValues) => {
    const computedVas =
      values.painMapping.length > 0
        ? Math.max(...values.painMapping.map((p) => p.intensity))
        : 0
    return onSubmit({ ...values, vas: computedVas })
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submitWithVas)}
        className="flex flex-col gap-5 pb-24"
      >
```

기존 `onSubmit={form.handleSubmit(onSubmit)}`을 `submitWithVas` wrapper로 교체. wrapper 정의는 `useForm` 호출 직후 form 변수 다음 줄에 추가.

---

## Task 3 — BodyMap에 자동 계산값 헤더 + '전신' 빠른 선택 버튼

**Files:**
- Modify: `src/features/evaluations/components/BodyMap.tsx`

- [ ] **Step 1: 자동 계산값 useMemo + GENERAL_PART 상수 추가**

[BodyMap.tsx:70](../../src/features/evaluations/components/BodyMap.tsx#L70) 의 `export function BodyMap` 직후 (handlePartClick 위)에 추가:

```tsx
  // 자동 산출되는 VAS 값 (저장 시점에 form에서 동일 식으로 계산 → DB 저장)
  const computedVas = React.useMemo(
    () => (value.length > 0 ? Math.max(...value.map((p) => p.intensity)) : 0),
    [value]
  )

  // '전신' 빠른 선택 — SVG 좌표 없이 별도 버튼으로 추가
  const GENERAL_PART = {
    id: 'general',
    label: '전신',
    side: 'front' as const,
    d: '',
  }
```

- [ ] **Step 2: 헤더에 자동 계산값 표시**

[BodyMap.tsx:123-141](../../src/features/evaluations/components/BodyMap.tsx#L123-L141) 의 앞면/뒷면 토글 위에 자동 계산값 표시 + 전신 버튼 추가. 다음 블록으로 교체:

```tsx
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* 자동 계산값 + 전신 빠른 선택 */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">자동 계산된 통증 점수</span>
          <span className="text-2xl font-semibold text-primary">{computedVas}</span>
          <span className="text-sm text-muted-foreground">/ 10</span>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePartClick(GENERAL_PART)}
            className="text-xs"
          >
            전신 통증으로 입력
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={view === 'front' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('front')}
        >
          앞면
        </Button>
        <Button
          type="button"
          variant={view === 'back' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('back')}
        >
          뒷면
        </Button>
      </div>
```

- [ ] **Step 3: intensity 슬라이더가 Dialog에 있는지 확인 + 강도 명시화**

[BodyMap.tsx:194-227](../../src/features/evaluations/components/BodyMap.tsx#L194-L227) 의 Dialog 안에서 intensity 슬라이더가 누락되어 있음 — 현재 코드에 `setIntensity` state는 있지만 UI 슬라이더가 안 보임. 다음 블록을 통증 양상 grid 위(line 195의 `<div className="grid gap-3">` 안 첫 자식)로 추가:

```tsx
            <div className="grid gap-3">
              <Label className="text-sm font-medium">통증 강도 (1~10)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-center text-sm font-semibold text-primary">{intensity}</span>
              </div>
            </div>
```

이 블록을 line 195의 통증 양상 grid 바로 **위**에 삽입. 결과적으로 Dialog 내용 순서: 강도 → 양상 → custom 라벨 → 삭제/확인 버튼.

(참고: 현재 코드는 `setIntensity`만 호출되고 슬라이더 UI가 없어 사용자가 강도를 못 바꾸는 버그성 상태. 이번 통합과 함께 정리.)

- [ ] **Step 4: 빌드 통과 확인 (UI 변경 시작점)**

```bash
npm run build
```

Expected: 0 errors. Task 1 + Task 2 + Task 3 합쳐서 schema 변경에 따른 모든 EvaluationForm 코드가 정합 상태.

---

## Task 4 — VASInput.tsx 삭제

**Files:**
- Delete: `src/features/evaluations/components/VASInput.tsx`

- [ ] **Step 1: 파일 삭제**

```bash
rm src/features/evaluations/components/VASInput.tsx
```

- [ ] **Step 2: 다른 import 잔재 검색**

```bash
grep -rn "VASInput" src/
```

Expected: 0건. EvaluationForm에서 Task 2 Step 1로 이미 제거됨.

---

## Task 5 — Caller 페이지 정리 (new + edit)

**Files:**
- Modify: `src/app/patients/[id]/evaluations/new/page.tsx`
- Modify: `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx`

- [ ] **Step 1: new/page.tsx의 vas 분기 단순화**

[src/app/patients/[id]/evaluations/new/page.tsx:35](../../src/app/patients/[id]/evaluations/new/page.tsx#L35) 의:

```ts
      vas: values.toggleVas || values.togglePainMapping ? values.vas : undefined,
```

다음으로 교체:

```ts
      vas: values.vas,
```

`values.vas`는 EvaluationForm submitWithVas wrapper가 항상 자동 산출해서 채움 (Task 2 Step 6).

- [ ] **Step 2: edit/page.tsx의 vas 분기 단순화**

[src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx:35](../../src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx#L35) — Step 1과 동일하게 교체.

- [ ] **Step 3: edit/page.tsx defaultValues의 toggleVas 제거**

[src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx:65-68](../../src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx#L65-L68):

```ts
  const defaultValues: Partial<EvaluationFormValues> = {
    toggleVas: evaluation.vas != null,
    vas: evaluation.vas ?? undefined,
```

`toggleVas: evaluation.vas != null,` 한 줄 삭제. `vas: evaluation.vas ?? undefined,` 줄은 유지 (수정 시점에 기존 vas 표시용으로 form에 들어가지만, 사용자가 다시 저장하면 자동 산출로 덮어씀).

- [ ] **Step 4: 빌드 + 잔재 grep**

```bash
npm run build && grep -rn "toggleVas" src/
```

Expected: build 통과 + grep 0건.

- [ ] **Step 5: Commit (Task 1~5 한 번에)**

```bash
git add src/features/evaluations/domain/schema.ts \
        src/features/evaluations/components/EvaluationForm.tsx \
        src/features/evaluations/components/BodyMap.tsx \
        src/app/patients/[id]/evaluations/new/page.tsx \
        src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx
git rm src/features/evaluations/components/VASInput.tsx
git commit -m "feat(evaluations): VAS ↔ BodyMap intensity 통합 — BodyMap이 진실 소스

- schema: toggleVas + vas 강제 입력 refine 제거. vas는 optional 유지(자동 산출)
- EvaluationForm: VAS 박스 UI 제거. submit wrapper에서 vas = max(painMapping.intensity)
  자동 계산. EMPTY_DEFAULTS 정리
- BodyMap: 상단에 자동 계산값 헤더 ('자동 계산된 통증 점수: N / 10') +
  '전신 통증으로 입력' 빠른 선택 버튼. 누락됐던 intensity 슬라이더 UI 추가
- VASInput.tsx 삭제
- new/edit 페이지의 toggleVas 분기 정리

마이그레이션: 기존 vas-only evaluation은 그대로 표시. painMapping 입력해서
저장하는 시점에 자동 산출로 vas 갱신.

검증: npm run build (tsc 0 errors), Playwright 모바일/데스크톱.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Playwright 시각 검증

**Files:** (캡처 저장)
- `screenshot_after_vas_bodymap_mobile.jpg`
- `screenshot_after_vas_bodymap_desktop.jpg`
- 정리 후 이동: `~/.claude/projects/.../memory/screenshots/2026-05-13-vas-bodymap/`

- [ ] **Step 1: dev 서버 띄우기**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || npm run dev &
```

dev 서버가 이미 떠 있으면 그대로, 아니면 background로 시작. `npm run build` 끝난 직후라면 dev 캐시도 정합.

- [ ] **Step 2: 모바일 캡처 — 평가 입력 폼**

테스트 환자(`452bc962-c0b0-477b-a58b-89303b512b8f` — '테스트환자')의 평가 입력 페이지 진입:

1. `mcp__plugin_ecc_playwright__browser_resize` 390x844
2. `browser_navigate` → `http://localhost:3000/patients/452bc962-c0b0-477b-a58b-89303b512b8f/evaluations/new`
3. 로그인 화면이면 baseline-test 계정으로 자동 로그인
4. 통증 섹션 토글 ON 상태 확인 → BodyMap 상단에 "자동 계산된 통증 점수: 0 / 10" + "전신 통증으로 입력" 버튼 보임 확인
5. `browser_take_screenshot` (jpeg, fullPage) → `screenshot_after_vas_bodymap_mobile.jpg`

- [ ] **Step 3: 통증 입력 + 자동 갱신 확인**

1. SVG에서 어깨_좌 클릭 → Dialog 열림
2. 강도 슬라이더 7로 이동
3. 양상 "sharp" 선택
4. 확인 클릭
5. BodyMap 헤더 숫자가 "7 / 10"로 갱신 확인 (`browser_evaluate`로 텍스트 추출 검증)
6. 무릎_우 클릭 → 강도 4 → 확인
7. 헤더 "7 / 10" 그대로 (max=7) 확인

- [ ] **Step 4: 전신 버튼 동작 확인**

1. "전신 통증으로 입력" 버튼 클릭 → Dialog 열림 (title이 "전신")
2. 강도 6 선택 + 양상 referred + 확인
3. 헤더 "7 / 10" 그대로 (어깨 7이 max)
4. 어깨 항목 X 버튼 클릭 → 제거 → 헤더 "6 / 10" 갱신 확인

- [ ] **Step 5: 저장 후 DB의 vas 확인**

1. 저장 버튼 클릭 → 환자 상세 → 검사 탭으로 이동 확인
2. 새 평가 카드의 VAS 뱃지에 "VAS 6" 보임 확인 (max=6: 무릎4, 전신6)
3. 회복 그래프에 점 추가됨 확인

- [ ] **Step 6: 데스크톱 캡처**

1. `browser_resize` 1440x900
2. 같은 평가 입력 페이지에서 `browser_take_screenshot` (jpeg, viewport)
3. → `screenshot_after_vas_bodymap_desktop.jpg`

- [ ] **Step 7: 정리 + 캡처 이동**

```bash
mkdir -p ~/.claude/projects/-Users-jeonghunsakong-Projects-physiolog-collab/memory/screenshots/2026-05-13-vas-bodymap
mv screenshot_after_vas_bodymap_*.jpg ~/.claude/projects/-Users-jeonghunsakong-Projects-physiolog-collab/memory/screenshots/2026-05-13-vas-bodymap/
pkill -f "next-server|next dev" 2>/dev/null
pkill -f "playwright-mcp|mcp-chrome" 2>/dev/null
```

`browser_close`도 호출.

- [ ] **Step 8: 사용자 폰 검증 요청**

사용자에게 prod URL(`physiolog-collab.vercel.app`) 폰에서 직접 검증 요청:
- 평가 입력 페이지 진입
- 통증 섹션의 자동 계산값 표시 확인
- 부위 추가 시 값 즉시 갱신
- '전신' 버튼 → Dialog → 강도 입력 → 자동값 갱신
- 저장 후 회복 그래프에 점 추가

---

## Task 7 — Push + Vercel 배포 확인

- [ ] **Step 1: push**

```bash
git push origin main
```

Expected: hook 통과 (메모리 정리됨). 실패 시 사용자가 직접 push.

- [ ] **Step 2: Vercel 배포 상태**

`mcp__claude_ai_Vercel__list_deployments` (projectId: prj_V4fp6A6gHuXF44ymc0BmkAtWZzeM, teamId: team_1UrWvoXl21gJ5kv2o9fdQha1)로 새 배포가 `state: READY`인지 확인.

- [ ] **Step 3: 사용자에게 prod 검증 안내**

> "Vercel 배포 READY. `physiolog-collab.vercel.app` 폰에서 PWA 새로고침 후 평가 입력 페이지 진입해서 자동 계산값 동작 확인 부탁."

---

## Done Criteria

- [ ] `npm run build` 0 errors (TypeScript + ESLint)
- [ ] `grep -rn "toggleVas\|VASInput" src/` 0건
- [ ] Playwright 모바일/데스크톱 캡처 정상 (자동 계산값 표시 + 부위 추가 갱신 + 전신 버튼)
- [ ] 새 평가 저장 후 DB vas = max(intensity) 정합
- [ ] 기존 vas-only evaluation 카드/그래프 표시 정상 (마이그레이션 호환)
- [ ] Vercel prod 배포 READY
- [ ] 사용자 폰 검증 통과
