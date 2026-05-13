# BodyMap 라이브러리 마이그레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 친구가 직접 그린 BodyMap SVG를 react-muscle-highlighter 라이브러리로 통째 교체. 디자인 품질 의료 해부도급으로 ↑.

**Architecture:** 매핑 어댑터(`bodymap-mapping.ts`) 신규로 우리 옛 ID(`shoulder_l`)와 라이브러리 slug(`deltoids`+side='left')를 양방향 변환. BodyMap.tsx는 통째로 재작성하되 외부 인터페이스(`PainArea[]` value/onChange/readOnly)는 그대로 유지 → caller(EvaluationForm/DetailSheet) 변화 최소. Dialog/전신 버튼/자동 계산값 헤더는 유지.

**Tech Stack:** Next.js 16 (App Router, --webpack build), React 19, TypeScript, react-muscle-highlighter v1.2.0, shadcn/ui, Playwright (검증)

**검증 모델:** 테스트 인프라 없는 프로젝트. `npm run build` 통과 + Playwright 모바일/데스크톱 캡처로 검증.

**Spec 참조:** [docs/specs/2026-05-13-bodymap-library-migration-design.md](../specs/2026-05-13-bodymap-library-migration-design.md)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/features/evaluations/lib/bodymap-mapping.ts` | **신규** | 옛 ID + 새 ID → 라이브러리 slug+side 매핑. label 생성 helper. |
| `src/features/evaluations/components/BodyMap.tsx` | 재작성 | 라이브러리 사용. Dialog/전신/자동 계산값 헤더는 기존 패턴 유지 |
| `src/features/evaluations/components/BodyMap.css` | 삭제 | 라이브러리가 자체 스타일 처리. wrapper background는 Tailwind로 |
| `src/features/evaluations/components/EvaluationForm.tsx` | 수정 | BodyMap에 `gender` prop 전달 (Patient.gender 필요 → caller에서 받음) |
| `src/app/patients/[id]/evaluations/new/page.tsx` | 수정 | EvaluationForm에 `patientGender` prop 전달 |
| `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx` | 수정 | 동일 |
| `src/app/bodymap-preview/page.tsx` | 삭제 | 임시 prototype 페이지 |

**무변경 파일:** `EvaluationDetailSheet.tsx` (readOnly 모드는 기본 gender='male' 그대로), `types.ts`, schema, Supabase CRUD.

---

## Task 1 — 매핑 어댑터 파일 신규

**Files:**
- Create: `src/features/evaluations/lib/bodymap-mapping.ts`

- [ ] **Step 1: 파일 생성**

```ts
/**
 * BodyMap ID ↔ react-muscle-highlighter slug 매핑.
 *
 * 우리 PainArea.id는 string. 두 가지 형태 모두 지원:
 *   1) 옛 형태 (친구 SVG): 'shoulder_l', 'arm_up_r_back', 'glute_l' 등
 *   2) 새 형태 (라이브러리 시대): '{slug}_{l|r}' 또는 '{slug}' (예: 'deltoids_l', 'chest')
 *
 * 이 파일 한 곳에서 양방향 변환 + 한글 label 생성.
 */

// 라이브러리 export 타입과 동일하게 좁힌 slug 유니온
export type LibSlug =
  | 'head' | 'neck' | 'trapezius' | 'upper-back' | 'lower-back'
  | 'chest' | 'abs' | 'obliques'
  | 'deltoids' | 'biceps' | 'triceps' | 'forearm' | 'hands'
  | 'gluteal' | 'quadriceps' | 'hamstring' | 'adductors'
  | 'knees' | 'tibialis' | 'calves' | 'ankles' | 'feet'

export type LibSide = 'left' | 'right'

export type LibPart = { slug: LibSlug; side?: LibSide }

/** '전신' 빠른 선택은 라이브러리 외부 처리 — slug 없음 */
export const GENERAL_ID = 'general'

/**
 * 옛/새 ID → 라이브러리 part로 변환.
 * 매칭 안 되면 null (예: 'general'은 라이브러리에 시각화 안 함).
 */
export function idToLibPart(id: string): LibPart | null {
  if (id === GENERAL_ID) return null

  // 옛 ID (친구 SVG) — 명시 매핑 테이블
  const old = OLD_ID_MAP[id]
  if (old) return old

  // 새 ID 형태: '{slug}' 또는 '{slug}_l' / '{slug}_r'
  const match = id.match(/^([a-z-]+?)(?:_(l|r))?$/)
  if (!match) return null
  const [, slug, sideShort] = match
  if (!LIB_SLUGS.has(slug as LibSlug)) return null
  return {
    slug: slug as LibSlug,
    side: sideShort === 'l' ? 'left' : sideShort === 'r' ? 'right' : undefined,
  }
}

/** 라이브러리 part → 새 ID 형식으로 인코딩 */
export function libPartToId(slug: LibSlug, side?: LibSide): string {
  if (!side) return slug
  return `${slug}_${side === 'left' ? 'l' : 'r'}`
}

/** 한글 라벨 생성 (side + 부위명) */
export function buildLabel(slug: LibSlug, side?: LibSide): string {
  const base = LIB_LABEL_KO[slug]
  if (!side) return base
  return `${side === 'left' ? '왼쪽' : '오른쪽'} ${base}`
}

/** 옛 ID에서도 라벨 생성 가능 (DetailSheet 등 표시 시) */
export function labelFromId(id: string): string {
  if (id === GENERAL_ID) return '전신'
  const lib = idToLibPart(id)
  if (!lib) return id  // 알 수 없으면 id 그대로 fallback
  return buildLabel(lib.slug, lib.side)
}

// ============================================================
// 내부 데이터
// ============================================================

const LIB_SLUGS = new Set<LibSlug>([
  'head', 'neck', 'trapezius', 'upper-back', 'lower-back',
  'chest', 'abs', 'obliques',
  'deltoids', 'biceps', 'triceps', 'forearm', 'hands',
  'gluteal', 'quadriceps', 'hamstring', 'adductors',
  'knees', 'tibialis', 'calves', 'ankles', 'feet',
])

const LIB_LABEL_KO: Record<LibSlug, string> = {
  head: '머리',
  neck: '목',
  trapezius: '상부 등 (승모근)',
  'upper-back': '상부 등',
  'lower-back': '허리',
  chest: '가슴',
  abs: '복부',
  obliques: '옆구리',
  deltoids: '어깨',
  biceps: '앞팔 (이두근)',
  triceps: '뒷팔 (삼두근)',
  forearm: '하완',
  hands: '손',
  gluteal: '엉덩이',
  quadriceps: '허벅지 앞',
  hamstring: '허벅지 뒤',
  adductors: '안쪽 허벅지',
  knees: '무릎',
  tibialis: '정강이',
  calves: '종아리',
  ankles: '발목',
  feet: '발',
}

/** 친구 SVG 시절 옛 ID → 라이브러리 매핑 (호환성 유지용) */
const OLD_ID_MAP: Record<string, LibPart> = {
  // 머리/목
  head: { slug: 'head' },
  neck: { slug: 'neck' },
  head_back: { slug: 'head' },
  neck_back: { slug: 'neck' },
  // 어깨 (앞면만 친구 SVG에 있었음)
  shoulder_l: { slug: 'deltoids', side: 'left' },
  shoulder_r: { slug: 'deltoids', side: 'right' },
  // 가슴/복부
  chest: { slug: 'chest' },
  abdomen: { slug: 'abs' },
  // 등
  back_up: { slug: 'trapezius' },
  back_low: { slug: 'lower-back' },
  // 상완 (앞=이두 / 뒤=삼두)
  arm_up_l: { slug: 'biceps', side: 'left' },
  arm_up_r: { slug: 'biceps', side: 'right' },
  arm_up_l_back: { slug: 'triceps', side: 'left' },
  arm_up_r_back: { slug: 'triceps', side: 'right' },
  // 하완 / 손
  forearm_l: { slug: 'forearm', side: 'left' },
  forearm_r: { slug: 'forearm', side: 'right' },
  forearm_l_back: { slug: 'forearm', side: 'left' },
  forearm_r_back: { slug: 'forearm', side: 'right' },
  hand_l: { slug: 'hands', side: 'left' },
  hand_r: { slug: 'hands', side: 'right' },
  hand_l_back: { slug: 'hands', side: 'left' },
  hand_r_back: { slug: 'hands', side: 'right' },
  // 고관절/엉덩이
  hip_l: { slug: 'gluteal', side: 'left' },
  hip_r: { slug: 'gluteal', side: 'right' },
  glute_l: { slug: 'gluteal', side: 'left' },
  glute_r: { slug: 'gluteal', side: 'right' },
  // 허벅지 (앞=대퇴사두 / 뒤=햄스트링)
  thigh_l: { slug: 'quadriceps', side: 'left' },
  thigh_r: { slug: 'quadriceps', side: 'right' },
  hamstring_l: { slug: 'hamstring', side: 'left' },
  hamstring_r: { slug: 'hamstring', side: 'right' },
  // 무릎
  knee_l: { slug: 'knees', side: 'left' },
  knee_r: { slug: 'knees', side: 'right' },
  // 종아리/정강이
  shin_l: { slug: 'tibialis', side: 'left' },
  shin_r: { slug: 'tibialis', side: 'right' },
  calf_l: { slug: 'calves', side: 'left' },
  calf_r: { slug: 'calves', side: 'right' },
  // 발
  foot_l: { slug: 'feet', side: 'left' },
  foot_r: { slug: 'feet', side: 'right' },
  foot_l_back: { slug: 'feet', side: 'left' },
  foot_r_back: { slug: 'feet', side: 'right' },
}

/** intensity 1~10 → 색상 10단계 그라데이션 (yellow → orange → red) */
export const INTENSITY_COLORS_10 = [
  '#fef3c7', // 1 connecting yellow
  '#fde68a', // 2
  '#fcd34d', // 3
  '#fdba74', // 4
  '#fb923c', // 5
  '#f97316', // 6 orange
  '#ef4444', // 7
  '#dc2626', // 8
  '#b91c1c', // 9
  '#7f1d1d', // 10 deep red
]
```

- [ ] **Step 2: 빌드 검증 (단일 파일이라 격리)**

```bash
npx tsc --noEmit 2>&1 | grep "bodymap-mapping" || echo "ok"
```

Expected: `ok` (해당 파일에 대한 TypeScript 에러 없음). 단 다른 파일은 에러 가능 (다음 task에서 정리).

---

## Task 2 — BodyMap.tsx 통째 재작성

**Files:**
- Modify: `src/features/evaluations/components/BodyMap.tsx` (재작성)

- [ ] **Step 1: 파일 통째 교체**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { PainPattern, PainArea } from '../domain/types'
import {
  GENERAL_ID,
  INTENSITY_COLORS_10,
  buildLabel,
  idToLibPart,
  labelFromId,
  libPartToId,
  type LibSide,
  type LibSlug,
} from '../lib/bodymap-mapping'

type Props = {
  value: PainArea[]
  onChange: (value: PainArea[]) => void
  readOnly?: boolean
  gender?: 'male' | 'female'
}

export function BodyMap({ value, onChange, readOnly = false, gender = 'male' }: Props) {
  const [view, setView] = useState<'front' | 'back'>('front')
  // 활성 부위 — 라이브러리 클릭 또는 '전신' 버튼으로 set. Dialog 열림 트리거.
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLabel, setActiveLabel] = useState<string>('')
  const [intensity, setIntensity] = useState(5)
  const [pattern, setPattern] = useState<PainPattern>('referred')
  const [customLabel, setCustomLabel] = useState('')

  const computedVas = useMemo(
    () => (value.length > 0 ? Math.max(...value.map((p) => p.intensity)) : 0),
    [value]
  )

  // 라이브러리에 넘길 데이터 — painMapping 중 라이브러리 slug로 변환 가능한 것만.
  // intensity는 라이브러리 colors 배열의 1-based 인덱스이므로 우리 1-10을 그대로 사용.
  const libData = useMemo<ExtendedBodyPart[]>(() => {
    return value
      .map((p) => {
        const lib = idToLibPart(p.id)
        if (!lib) return null
        return {
          slug: lib.slug as ExtendedBodyPart['slug'],
          intensity: p.intensity,
          side: lib.side,
        }
      })
      .filter((p): p is ExtendedBodyPart => p !== null)
  }, [value])

  const openDialogFor = (id: string, label: string) => {
    if (readOnly) return
    const existing = value.find((p) => p.id === id)
    if (existing) {
      setIntensity(existing.intensity)
      setPattern(existing.pattern)
      setCustomLabel(existing.customPatternLabel ?? '')
    } else {
      setIntensity(5)
      setPattern('referred')
      setCustomLabel('')
    }
    setActiveId(id)
    setActiveLabel(label)
  }

  const handleLibClick = (
    part: { slug: string },
    libSide?: 'left' | 'right'
  ) => {
    const slug = part.slug as LibSlug
    const id = libPartToId(slug, libSide as LibSide | undefined)
    const label = buildLabel(slug, libSide as LibSide | undefined)
    openDialogFor(id, label)
  }

  const handleGeneralClick = () => openDialogFor(GENERAL_ID, '전신')

  const addOrUpdate = () => {
    if (!activeId) return
    const newPain: PainArea = {
      id: activeId,
      label: activeLabel,
      pattern,
      intensity,
      customPatternLabel: pattern === 'custom' ? customLabel : undefined,
    }
    const existing = value.find((p) => p.id === activeId)
    if (existing) {
      onChange(value.map((p) => (p.id === activeId ? newPain : p)))
    } else {
      onChange([...value, newPain])
    }
    setActiveId(null)
  }

  const remove = (id: string) => {
    onChange(value.filter((p) => p.id !== id))
    setActiveId(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* 자동 계산값 + 전신 빠른 버튼 */}
      <div className="flex w-full flex-col items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
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
            onClick={handleGeneralClick}
            className="text-xs"
          >
            전신 통증으로 입력
          </Button>
        )}
      </div>

      {/* 앞/뒷면 토글 */}
      <div className="flex gap-2">
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

      {/* 라이브러리 인체 도식 */}
      <div className="flex w-full justify-center rounded-2xl border bg-slate-900/5 p-4">
        <Body
          data={libData}
          side={view}
          gender={gender}
          scale={1.2}
          colors={INTENSITY_COLORS_10}
          onBodyPartPress={handleLibClick}
        />
      </div>

      {/* 추가된 부위 태그 리스트 */}
      {!readOnly && value.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {value.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 rounded-full border bg-secondary/50 px-2 py-1 text-[10px] sm:text-xs"
            >
              <span className="font-semibold">{p.label || labelFromId(p.id)}</span>
              <span className="mx-0.5 text-muted-foreground">·</span>
              <span className={patternColor(p.pattern)}>
                {p.pattern === 'custom' ? p.customPatternLabel || '기타' : patternLabel(p.pattern)}
              </span>
              <span className="ml-0.5 text-muted-foreground">· {p.intensity}/10</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 통증 입력 Dialog */}
      <Dialog open={!!activeId} onOpenChange={(open) => !open && setActiveId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-primary">{activeLabel}</span>
              <span className="text-sm font-normal text-muted-foreground">통증 설정</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
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
                <span className="w-10 text-center text-sm font-semibold text-primary">
                  {intensity}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="text-sm font-medium">통증 양상</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  ['referred', 'tingling', 'weakness', 'paresthesia', 'radiating', 'sharp', 'custom'] as PainPattern[]
                ).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={pattern === p ? 'default' : 'outline'}
                    className={`h-auto py-2.5 flex flex-col gap-1 ${
                      pattern === p ? '' : 'hover:bg-muted'
                    }`}
                    onClick={() => setPattern(p)}
                  >
                    <span className="text-xs sm:text-sm">{patternLabel(p)}</span>
                  </Button>
                ))}
              </div>
            </div>

            {pattern === 'custom' && (
              <div className="grid gap-2">
                <Label htmlFor="custom-label" className="text-sm font-medium">
                  기타 통증 내용
                </Label>
                <input
                  id="custom-label"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="예: 뻐근함, 욱신거림"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={() => activeId && remove(activeId)}
              >
                삭제
              </Button>
              <Button className="flex-[2]" onClick={addOrUpdate}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function patternLabel(p: PainPattern) {
  switch (p) {
    case 'referred': return '연관통'
    case 'tingling': return '저림'
    case 'weakness': return '힘빠짐'
    case 'paresthesia': return '이상감각'
    case 'radiating': return '방사통'
    case 'sharp': return '날카로운 통증'
    case 'custom': return '기타'
  }
}

function patternColor(p: PainPattern) {
  switch (p) {
    case 'referred': return 'text-red-500'
    case 'tingling': return 'text-blue-500'
    case 'weakness': return 'text-indigo-600'
    case 'paresthesia': return 'text-purple-500'
    case 'radiating': return 'text-orange-500'
    case 'sharp': return 'text-yellow-500'
    case 'custom': return 'text-teal-500'
  }
}
```

- [ ] **Step 2: BodyMap.css 삭제**

```bash
rm src/features/evaluations/components/BodyMap.css
```

새 컴포넌트는 Tailwind 클래스만 사용. `pain-referred` 등 CSS 클래스 더 이상 필요 없음.

---

## Task 3 — caller 페이지 gender 전달

**Files:**
- Modify: `src/features/evaluations/components/EvaluationForm.tsx`
- Modify: `src/app/patients/[id]/evaluations/new/page.tsx`
- Modify: `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx`

- [ ] **Step 1: EvaluationForm props에 gender 추가**

[src/features/evaluations/components/EvaluationForm.tsx](../../src/features/evaluations/components/EvaluationForm.tsx)의 Props 타입에 `patientGender?: 'male' | 'female'` 추가:

```tsx
type Props = {
  defaultValues?: Partial<EvaluationFormValues>
  submitLabel?: string
  onSubmit: (values: EvaluationFormValues) => void | Promise<void>
  onCancel?: () => void
  patientGender?: 'male' | 'female'
}

export function EvaluationForm({
  defaultValues,
  submitLabel = '저장',
  onSubmit,
  onCancel,
  patientGender,
}: Props) {
```

BodyMap 호출 부분에 prop 전달:

```tsx
<BodyMap
  value={form.watch('painMapping')}
  onChange={(v) => form.setValue('painMapping', v, { shouldDirty: true })}
  gender={patientGender}
/>
```

- [ ] **Step 2: new/page.tsx에서 patient.gender 전달**

[src/app/patients/[id]/evaluations/new/page.tsx](../../src/app/patients/[id]/evaluations/new/page.tsx)의 `<EvaluationForm ... onSubmit={handleSubmit} />` 호출에 prop 추가:

```tsx
<EvaluationForm
  patientGender={patient.gender as 'male' | 'female' | undefined}
  submitLabel="저장"
  onSubmit={handleSubmit}
/>
```

(기존 props 사이에 끼워넣음.)

- [ ] **Step 3: edit/page.tsx에 동일 처리**

[src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx](../../src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx)의 EvaluationForm 호출에 동일 prop 추가:

```tsx
<EvaluationForm
  patientGender={patient.gender as 'male' | 'female' | undefined}
  defaultValues={defaultValues}
  submitLabel="수정"
  onSubmit={handleSubmit}
/>
```

---

## Task 4 — 임시 prototype 페이지 삭제

**Files:**
- Delete: `src/app/bodymap-preview/page.tsx`

- [ ] **Step 1: 파일 삭제 + 빈 폴더 정리**

```bash
rm src/app/bodymap-preview/page.tsx
rmdir src/app/bodymap-preview
```

---

## Task 5 — 빌드 + 검증 + commit

- [ ] **Step 1: 빌드 통과 확인**

```bash
npm run build
```

Expected: `Compiled successfully` + `Finished TypeScript`. ESLint 0 errors.

- [ ] **Step 2: 옛 SVG 잔재 grep**

```bash
grep -rn "BODY_PARTS\b\|BodyMap.css\|body-part\b" src/ 2>&1 | head
```

Expected: BodyMap.tsx 안의 CSS 클래스 참조 0건. `body-part` (이전 CSS 클래스 selector) 0건.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(evaluations): BodyMap을 react-muscle-highlighter로 교체 — 의료 해부도급 디자인

기존 친구 SVG (베지어 도형 70+ path)의 어색한 비례·디자인을 라이브러리로 교체:
- react-muscle-highlighter v1.2.0 (MIT, zero deps, React 19 호환)
- 의료 해부도급 근육 단위 디테일 + intensity 그라데이션
- 남/여 분리 모델 + 앞/뒤 + side(left/right) 자동 처리

변경:
- 신규 src/features/evaluations/lib/bodymap-mapping.ts:
  · 옛 ID(shoulder_l, arm_up_r_back, glute_l 등) ↔ 라이브러리 slug+side 매핑
  · 새 ID 형태: {slug}_{l|r} (예: deltoids_l, chest, lower-back)
  · INTENSITY_COLORS_10: 통증 1~10 색상 그라데이션 (yellow → orange → red)
  · 한글 label 생성 helper (어깨/허벅지 앞/이두근 등)
- 재작성 BodyMap.tsx:
  · 라이브러리 <Body> 컴포넌트로 SVG path 70+ 제거
  · 자동 계산값 헤더, 전신 빠른 버튼, Dialog(강도+양상) 모두 유지
  · 부위 태그 리스트에 intensity 표시 추가
- 삭제 BodyMap.css (Tailwind만 사용)
- 삭제 임시 prototype 페이지 /bodymap-preview
- EvaluationForm + new/edit 페이지: patientGender prop 전달

마이그레이션 (자연 호환):
- 기존 painMapping의 옛 ID는 idToLibPart() 매핑으로 그대로 시각화
- 사용자가 평가 수정 시 새 ID 형태로 점진 갱신
- DB 스키마 무변경

검증:
- npm run build (tsc + eslint 0 errors)
- Playwright는 Task 6에서

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 — Playwright 시각 검증

**Files:** (캡처 저장)
- `screenshot_after_lib_mobile.jpg`
- `screenshot_after_lib_desktop.jpg`
- 정리 후 이동: `~/.claude/projects/.../memory/screenshots/2026-05-13-vas-bodymap/`

- [ ] **Step 1: dev 서버 시작**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || npm run dev &
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; do sleep 0.5; done
echo "ready"
```

- [ ] **Step 2: 평가 입력 페이지 진입 — 모바일**

테스트 환자 ID `452bc962-c0b0-477b-a58b-89303b512b8f`:

1. `browser_resize` 390x844
2. `browser_navigate` → `http://localhost:3000/patients/452bc962-c0b0-477b-a58b-89303b512b8f/evaluations/new`
3. 통증 섹션 자동 ON 상태 확인 (`browser_evaluate`로 헤더 텍스트 "자동 계산된 통증 점수 0 / 10" 검증)
4. 라이브러리 SVG가 보이는지 확인 (path 클래스 또는 svg 요소 존재)
5. `browser_take_screenshot` (jpeg, fullPage) → `screenshot_after_lib_mobile.jpg`

- [ ] **Step 3: 부위 클릭 + Dialog 열림 + 자동 계산값 갱신**

라이브러리 SVG의 첫 path 클릭:

```js
() => {
  const path = document.querySelector('svg path[class]')
  path?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}
```

1초 대기 후:
- Dialog 열렸는지 (텍스트 "통증 강도 (1~10)" 검증)
- 강도 슬라이더 7로 설정 (`HTMLInputElement.prototype.value` setter 사용 + input/change 이벤트)
- 양상 "날카로운 통증" 버튼 클릭
- "확인" 버튼 클릭
- 1초 대기 후 헤더 갱신 검증 (`자동 계산된 통증 점수 7 / 10`)

- [ ] **Step 4: 전신 버튼**

"전신 통증으로 입력" 버튼 클릭 → Dialog 열림 → 강도 5 → 확인 → 헤더 그대로 7

- [ ] **Step 5: 데스크톱 캡처**

1. `browser_resize` 1440x900
2. `browser_take_screenshot` (jpeg, viewport) → `screenshot_after_lib_desktop.jpg`

- [ ] **Step 6: 정리 + 캡처 이동**

```bash
mv /Users/jeonghunsakong/Projects/physiolog-collab/screenshot_after_lib_*.jpg \
   ~/.claude/projects/-Users-jeonghunsakong-Projects-physiolog-collab/memory/screenshots/2026-05-13-vas-bodymap/
pkill -f "next-server|next dev" 2>/dev/null
pkill -f "playwright-mcp|mcp-chrome" 2>/dev/null
```

`browser_close`도 호출.

---

## Task 7 — Push + Vercel 확인

- [ ] **Step 1: push**

```bash
git push origin main 2>&1 | tail
```

Expected: hook 통과 (메모리 fork main push OK 룰).

- [ ] **Step 2: Vercel 배포 상태**

`mcp__claude_ai_Vercel__list_deployments` (projectId `prj_V4fp6A6gHuXF44ymc0BmkAtWZzeM`, teamId `team_1UrWvoXl21gJ5kv2o9fdQha1`) 호출 후 새 배포 ID 확인. BUILDING이면 30-90초 후 `get_deployment`로 다시 확인 → READY 검증.

- [ ] **Step 3: 사용자 폰 검증 안내**

> "Vercel 배포 READY. `physiolog-collab.vercel.app` 폰에서 PWA 새로고침 후 평가 입력 페이지 진입해서:
> 1. 새 의료 해부도급 인체 도식 보이는지
> 2. 부위 클릭 → Dialog → 강도/양상 → 자동 계산값 헤더 갱신
> 3. 환자 성별이 male/female이면 다른 모델로 표시되는지
> 4. 기존 평가 (옛 painMapping 있는 evaluation의 detail 시트) 시각화 정상인지
> 확인 부탁."

---

## Done Criteria

- [ ] `npm run build` 0 errors
- [ ] `grep -rn "BODY_PARTS\|BodyMap.css" src/` 0건
- [ ] Playwright 모바일/데스크톱 캡처 정상 (라이브러리 SVG + 자동 계산값 헤더 + 부위 추가 갱신)
- [ ] 기존 painMapping (옛 ID) 시각화 정상 (idToLibPart 매핑 동작)
- [ ] Vercel prod 배포 READY
- [ ] 사용자 폰 검증 통과
- [ ] 임시 prototype 페이지 `/bodymap-preview` 삭제됨
