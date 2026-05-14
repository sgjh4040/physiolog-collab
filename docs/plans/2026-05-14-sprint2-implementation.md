# Sprint 2 — 보강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprint 1로 사용성 직격 마찰 제거 후, 남은 보강 3건 — 마지막 치료 날짜 즉시 갱신 확인 / 수정 페이지 ← 즉시 피드백 / 헤더 ⋮ 드롭다운 재배치.

**Architecture:** 코드 변경 1줄 없는 검증 작업(S2-1) + 세 수정 페이지 동일 useTransition 패턴(S2-2) + shadcn dropdown-menu 추가 + PatientList 헤더 5→2 아이콘 재구성(S2-3). UI 변경이 큰 부분(헤더)은 Playwright 모바일+데스크톱 캡처 + 사용자 검토 게이트.

**Tech Stack:** Next.js 16 App Router, React 19, useTransition, lucide-react Loader2, shadcn/ui DropdownMenu (Radix UI), Tailwind v4

**Related spec:** [docs/specs/2026-05-14-mvp-polish-batch-design.md](../specs/2026-05-14-mvp-polish-batch-design.md) Sprint 2 섹션

**Pre-existing context (Sprint 2 조사 결과):**
- ✅ `revalidatePath('/')` + `revalidatePath('/patients/${id}')`가 모든 mutation(patients/treatments/evaluations 9개 함수)에 이미 호출 중 → S2-1은 코드 변경 없음
- 세 수정 페이지(patient/treatment/evaluation edit) 모두 `<Link href>` 패턴 + `useRouter` 이미 import 됨 → useTransition만 추가
- `src/components/ui/dropdown-menu.tsx` 미존재, `@radix-ui/react-dropdown-menu` 미설치 → shadcn add 필요
- 헤더 위치 확정: `src/features/patients/components/PatientList.tsx:238-294`

---

## File Structure

**Modify:**
- `src/app/patients/[id]/edit/page.tsx` — Task 2
- `src/app/patients/[id]/treatments/[treatmentId]/edit/page.tsx` — Task 2
- `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx` — Task 2
- `src/features/patients/components/PatientList.tsx:238-294` — Task 3

**Create (shadcn add 자동):**
- `src/components/ui/dropdown-menu.tsx` — Task 3 (shadcn CLI 자동 생성)

**Dependency 추가:**
- `@radix-ui/react-dropdown-menu` — shadcn CLI가 package.json + node_modules 처리

**커밋 단위:**
- Task 1: commit 없음 (검증만)
- Task 2: 1 commit (세 페이지 동일 패턴)
- Task 3: 2 commit으로 분리 — (a) `chore: shadcn add dropdown-menu`, (b) `feat: 헤더 재배치` (shadcn 자동 생성 파일을 별도 commit으로 분리하면 헤더 diff가 깨끗함)

---

## Pre-flight

- [ ] **Step 0.1: 동기화 확인**

```bash
cd /Users/jeonghunsakong/Projects/physiolog-collab
git status
git pull --ff-only origin main
git log --oneline -3
```

Expected: working tree clean, head는 `af1fdf5` (Sprint 1 마지막 commit) 또는 그 이후.

---

## Task 1: S2-1 폰 검증만 (코드 무변경)

**Spec:** S2-1
**Files:** 없음

조사 결과 모든 mutation에 revalidatePath가 호출됨. 폰에서 실제로 캐시 무효화가 즉시 반영되는지 확인.

- [ ] **Step 1.1: 사용자 폰 검증 안내**

사용자에게 prod URL `https://physiolog-collab.vercel.app`에서 다음 시나리오:

1. 환자 A 클릭 (마지막 치료 날짜 기억해두기, 예: "3일 전")
2. 치료 탭 → ➕ 새 치료 입력 → 오늘 날짜로 저장
3. ← 버튼으로 환자 리스트 복귀
4. 환자 A 카드의 "마지막 치료" 표시가 **"방금 전" 또는 "오늘"로 즉시 변경**됐는지 확인

**예상:** revalidatePath('/')가 이미 호출되므로 즉시 갱신됨.

**만약 갱신 안 됨:**
- Network 탭으로 RSC payload 확인 필요
- 다음 단계에서 client-side `router.refresh()` 추가 옵션 등장

**OK 받으면 Task 1 종료.** 변경 없으므로 commit 없음.

---

## Task 1.5: 환자 리스트 "최근 치료순" secondary sort (Task 1 검증 중 발견)

**Spec:** Task 1 검증 중 사용자 제보 — "오늘 치료 갱신은 됐는데 환자 리스트에서 가장 위 아닌 두 번째"
**Files:**
- Modify: `src/lib/supabase/treatments.ts:189-216` (시그니처 확장)
- Modify: `src/features/patients/components/PatientList.tsx:36, 51, 216-220, 368`

**원인:**
- `getLatestTreatmentDateMap`이 `Record<string, string>` (YYYY-MM-DD만) 반환
- PatientList "최근순" 정렬에 secondary sort 없음 → 환자 X, Y 둘 다 마지막 치료=오늘이면 tie-break 무작위

**변경:**
- `LatestTreatmentInfo` 타입 export: `{ date, createdAt }`
- `getLatestTreatmentDateMap` SELECT에 `created_at` 추가, 반환 타입 `Record<string, LatestTreatmentInfo>`
- PatientList props/state 타입 동기 변경, sort 함수의 'recent' 분기에 secondary key 추가
- PatientCard에 전달하는 `lastTreatmentDate`는 `.date` 속성 추출

**1 commit으로 진행.** Task 2 전에 끼워넣음.

---

## Task 2: 수정 페이지 ← 버튼 useTransition

**Spec:** S2-2
**Files:**
- Modify: `src/app/patients/[id]/edit/page.tsx:71-77`
- Modify: `src/app/patients/[id]/treatments/[treatmentId]/edit/page.tsx:79-85`
- Modify: `src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx:85-91`

세 파일 모두 동일 패턴 적용:
- 기존: `<Link href="..."><ArrowLeft /></Link>`
- 변경: `<button onClick={() => startTransition(() => router.push(...))}>` + isPending이면 Loader2 spinner

useRouter는 이미 import 됨. useTransition import + Loader2 import 추가.

### Task 2A: PatientForm 환자 편집 페이지

- [ ] **Step 2A.1: useTransition + Loader2 import 추가**

찾을 문자열 (`src/app/patients/[id]/edit/page.tsx`):

```tsx
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
```

바꿀 문자열:

```tsx
import { use, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
```

(`Link` import 제거 — 더 이상 사용 안 함. `useTransition`/`Loader2` 추가)

- [ ] **Step 2A.2: useTransition state 추가**

찾을 문자열:

```tsx
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
```

바꿀 문자열:

```tsx
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [isBackPending, startBackTransition] = useTransition()
```

- [ ] **Step 2A.3: ← 버튼 마크업 변경**

찾을 문자열:

```tsx
        <Link
          href={`/patients/${id}`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
```

바꿀 문자열:

```tsx
        <button
          type="button"
          onClick={() => startBackTransition(() => router.push(`/patients/${id}`))}
          disabled={isBackPending}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted disabled:opacity-60"
        >
          {isBackPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
```

### Task 2B: 치료 수정 페이지

- [ ] **Step 2B.1: import 변경**

`src/app/patients/[id]/treatments/[treatmentId]/edit/page.tsx`

`use`, `useEffect`, `useState`, `useRouter`, `Link`, `ArrowLeft` 패턴 동일. Read로 정확한 import 라인 확인 후 다음 추가:
- `react`에서 `useTransition` 추가
- `lucide-react`에서 `Loader2` 추가
- `Link` import 제거

(파일 1~25라인 Read 후 Edit. PatientForm edit과 거의 동일 import 구조)

- [ ] **Step 2B.2: useTransition state**

`useRouter()` 호출 라인 바로 다음에 추가:

```tsx
  const [isBackPending, startBackTransition] = useTransition()
```

(컴포넌트 함수 상단에서 정확한 위치 Read 후 Edit)

- [ ] **Step 2B.3: ← 버튼 변경 (treatment edit)**

찾을 문자열:

```tsx
        <Link
          href={`/patients/${patientId}?tab=treatments`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
```

바꿀 문자열:

```tsx
        <button
          type="button"
          onClick={() =>
            startBackTransition(() =>
              router.push(`/patients/${patientId}?tab=treatments`)
            )
          }
          disabled={isBackPending}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted disabled:opacity-60"
        >
          {isBackPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
```

### Task 2C: 평가 수정 페이지

- [ ] **Step 2C.1: import 변경**

`src/app/patients/[id]/evaluations/[evaluationId]/edit/page.tsx`

Step 2B.1과 동일 패턴.

- [ ] **Step 2C.2: useTransition state**

Step 2B.2와 동일.

- [ ] **Step 2C.3: ← 버튼 변경 (evaluation edit)**

찾을 문자열:

```tsx
        <Link
          href={`/patients/${patientId}?tab=evaluations`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
```

바꿀 문자열:

```tsx
        <button
          type="button"
          onClick={() =>
            startBackTransition(() =>
              router.push(`/patients/${patientId}?tab=evaluations`)
            )
          }
          disabled={isBackPending}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted disabled:opacity-60"
        >
          {isBackPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
```

### Task 2 검증

- [ ] **Step 2D.1: 빌드 검증**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors. `Link` import 사용 안 함 경고가 있으면 import 줄 자체가 제거됐는지 다시 확인.

- [ ] **Step 2D.2: Playwright 검증 (모바일)**

dev 서버 확인 후 시작:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200 아니면 npm run dev background
```

Playwright 시나리오:
1. resize 390x844
2. navigate `/login` (세션 살아있으면 자동 / 됨)
3. navigate `/patients/452bc962-c0b0-477b-a58b-89303b512b8f/edit`
4. browser_evaluate로 ← 버튼 클릭 + button 상태 추적:

```js
async () => {
  const backBtn = document.querySelector('button[aria-label="뒤로"]')
  const states = []
  const observer = new MutationObserver(() => {
    states.push({
      t: Math.round(performance.now()),
      disabled: backBtn.disabled,
      innerHTML: backBtn.innerHTML.includes('animate-spin') ? 'spinner' : 'arrow',
    })
  })
  observer.observe(backBtn, { attributes: true, childList: true, subtree: true })
  states.push({ t: Math.round(performance.now()), event: 'before-click', disabled: backBtn.disabled })
  backBtn.click()
  await new Promise(r => setTimeout(r, 2000))
  observer.disconnect()
  return { states, finalUrl: window.location.pathname }
}
```

Expected:
- 클릭 직후 disabled=true + spinner 표시
- 잠시 후 페이지 이동 완료, finalUrl = `/patients/452bc962-c0b0-477b-a58b-89303b512b8f`

- [ ] **Step 2D.3: 사용자 검토 요청**

검증 결과 보여주고 OK 받기. 폰에서 직접 확인은 prod 배포 후.

- [ ] **Step 2D.4: Task 2 commit**

```bash
git add src/app/patients/\[id\]/edit/page.tsx \
        src/app/patients/\[id\]/treatments/\[treatmentId\]/edit/page.tsx \
        src/app/patients/\[id\]/evaluations/\[evaluationId\]/edit/page.tsx
git commit -m "$(cat <<'EOF'
feat(navigation): 수정 페이지 ← 버튼에 useTransition 즉시 피드백

세 수정 페이지(patient/treatment/evaluation edit) ← 버튼이 Link 기반이라
클릭 ~ root loading.tsx 표시 사이 0~300ms 동안 시각 변화 0 → "안 눌렸다" 느낌.

변경: Link → button + useTransition(() => router.push(...)). isPending일 때
disabled + Loader2 spinner. 클릭 즉시 spinner로 전환되어 응답성 확보.

검증:
- npm run build (TypeScript 0 errors)
- Playwright: ← 클릭 직후 disabled+spinner, 2초 안에 페이지 전환 완료

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 헤더 ⋮ 드롭다운 재배치

**Spec:** S2-3
**Files:**
- Create (shadcn CLI): `src/components/ui/dropdown-menu.tsx`
- Modify: `package.json` (자동, `@radix-ui/react-dropdown-menu` 추가)
- Modify: `src/features/patients/components/PatientList.tsx:238-294`

### Task 3A: shadcn dropdown-menu 설치

- [ ] **Step 3A.1: shadcn CLI 실행**

```bash
cd /Users/jeonghunsakong/Projects/physiolog-collab
npx shadcn@latest add dropdown-menu
```

Expected output:
- `src/components/ui/dropdown-menu.tsx` 생성
- `package.json`에 `@radix-ui/react-dropdown-menu` 추가
- `node_modules/` 업데이트

만약 prompt가 뜨면:
- "Which style would you like?": 기본값 선택
- "Overwrite?": 우리는 새 파일이라 N/A

- [ ] **Step 3A.2: shadcn 산출물 확인**

```bash
ls -la src/components/ui/dropdown-menu.tsx
grep "react-dropdown-menu" package.json
```

Expected: 파일 존재 + dependencies에 패키지 표시

- [ ] **Step 3A.3: 빌드 검증 (변경 없이)**

```bash
npm run build 2>&1 | tail -10
```

Expected: 0 errors (shadcn 컴포넌트 추가만으로는 기존 기능 영향 없음)

- [ ] **Step 3A.4: shadcn add commit**

```bash
git add src/components/ui/dropdown-menu.tsx package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(ui): shadcn add dropdown-menu — 헤더 ⋮ 메뉴용 컴포넌트 추가

Sprint 2 헤더 재배치(PatientList ⋮ 메뉴) 준비.
shadcn/ui DropdownMenu (Radix UI 기반) 컴포넌트 + 의존성 추가.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3B: 헤더 재구성

**목표 레이아웃:**

```
┌─────────────────────────────────────────────────────────┐
│ 이름 직업·····················[소속배지]   [✏️]  [⋮]   │
│ Expert Healthcare Provider                              │
│                                                         │
│ 환자 목록                                               │
└─────────────────────────────────────────────────────────┘
```

좌측:
- `min-w-0` + `truncate`로 이름·직업·소속을 한 줄에 압축
- 소속 배지는 `shrink-0`으로 잘리지 않게

우측:
- 선택 모드 토글 (Edit3/X 아이콘) — 자주 쓰는 액션이라 노출 유지
- ⋮ 드롭다운
  - 데이터 생성 (dev only, 조건부)
  - 프로필 설정
  - 통계 분석
  - ─ (구분선)
  - 로그아웃 (destructive 색상)

- [ ] **Step 3B.1: PatientList.tsx import 추가**

찾을 문자열 (`src/features/patients/components/PatientList.tsx`의 lucide-react import — 라인 1~30 범위 Read 후 정확한 import 라인 식별):

```tsx
import { Plus, UserCircle, BarChart2, Edit3, X, LogOut } from 'lucide-react'
```

(실제 import 라인은 다를 수 있음 — 다른 lucide 아이콘들도 함께 import되어 있을 가능성. Read로 확인 후 정확한 매칭)

바꿀 문자열 (lucide-react import에 `MoreVertical` 추가, 이후 모든 다른 아이콘 import는 유지):

`Plus, UserCircle, BarChart2, Edit3, X, LogOut`의 끝에 `, MoreVertical` 추가. 정확한 형태는 실제 import 라인에 맞춤.

또 별도 import 추가 (lucide-react import 바로 아래):

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
```

- [ ] **Step 3B.2: 헤더 마크업 전체 교체**

찾을 문자열 (PatientList.tsx:238-294 정확히 — header 시작부터 끝까지):

```tsx
      <header className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-4">
          {userProfile && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">
                  {userProfile.name} <span className="text-xs font-normal text-muted-foreground">{userProfile.role}</span>
                </p>
                {userProfile.workplace && (
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                    {userProfile.workplace}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
                Expert Healthcare Provider
              </p>
            </div>
          )}
          
          <h1 className="text-2xl font-bold tracking-tight">환자 목록</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="ghost" size="icon" asChild title="데이터 생성 (dev only)" className="h-9 w-9">
              <Link href="/seed">
                <Plus className="h-4 w-4 text-blue-600" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild title="프로필 설정" className="h-9 w-9">
            <Link href="/profile">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="통계 분석" className="h-9 w-9">
            <Link href="/statistics">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              setSelectedIds([])
            }} 
            title={isSelectionMode ? "취소" : "선택 모드"} 
            className={`h-9 w-9 ${isSelectionMode ? 'bg-primary/10 text-primary' : ''}`}
          >
            {isSelectionMode ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃" className="h-9 w-9">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </header>
```

바꿀 문자열:

```tsx
      <header className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex flex-col gap-4 min-w-0 flex-1">
          {userProfile && (
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-base font-semibold text-foreground truncate min-w-0">
                  {userProfile.name}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {userProfile.role}
                  </span>
                </p>
                {userProfile.workplace && (
                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                    {userProfile.workplace}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
                Expert Healthcare Provider
              </p>
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight">환자 목록</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              setSelectedIds([])
            }}
            title={isSelectionMode ? '취소' : '선택 모드'}
            className={`h-9 w-9 ${isSelectionMode ? 'bg-primary/10 text-primary' : ''}`}
          >
            {isSelectionMode ? (
              <X className="h-4 w-4" />
            ) : (
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="메뉴"
                className="h-9 w-9"
                aria-label="메뉴"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {process.env.NODE_ENV !== 'production' && (
                <DropdownMenuItem asChild>
                  <Link href="/seed" className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4 text-blue-600" />
                    데이터 생성 (dev)
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/statistics" className="cursor-pointer">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  통계 분석
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
```

**핵심 변경:**
- 좌측 div에 `min-w-0 flex-1` 추가 → flex container 안에서 truncate 활성화
- 이름·직업이 한 줄에서 잘리면 `truncate`로 ... 처리
- 우측 컨테이너에 `shrink-0` 추가 (아이콘이 줄어들지 않음)
- 5 아이콘 → 2 (선택 모드 + ⋮)
- ⋮ 메뉴 안: 데이터생성(dev) / 프로필 / 통계 / ─ / 로그아웃

- [ ] **Step 3B.3: 빌드 검증**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors. DropdownMenu import 경로가 정확한지 확인.

- [ ] **Step 3B.4: Playwright 모바일 캡처**

1. resize 390x844
2. navigate `/`
3. take_screenshot — fullPage jpg, `screenshot_after_header_mobile.jpg`
4. 헤더 영역만 → 이름/직업/소속 한 줄, 우측 [✏️] [⋮] 표시 확인
5. ⋮ 클릭:
   ```js
   const menuBtn = document.querySelector('button[aria-label="메뉴"]')
   menuBtn.click()
   ```
6. snapshot 또는 screenshot — 드롭다운 메뉴 4 항목 표시 확인

- [ ] **Step 3B.5: 긴 이름 fixture 검증 (truncate 동작)**

이름이 짧은 환자만 있으면 truncate 동작 확인 어려움. browser_evaluate로 강제 변경:

```js
const nameP = document.querySelector('header p.truncate')
if (nameP) {
  const original = nameP.textContent
  nameP.firstChild.textContent = '아주아주아주아주아주아주아주긴이름테스트 '
  // capture screenshot here, then restore
  return { width: nameP.offsetWidth, scrollWidth: nameP.scrollWidth }
}
```

scrollWidth > offsetWidth면 truncate가 실제로 작동 중. 캡처 후 원래 텍스트 복원.

(이건 검증용 dom 조작이므로 reload하면 원복. 폰 검증에서는 실제 사용자 이름으로 확인)

- [ ] **Step 3B.6: 데스크톱 회귀 캡처**

```
resize 1440x900
같은 URL navigate (자동 갱신)
screenshot_after_header_desktop.jpg
```

데스크톱에서 헤더가 부서지지 않았는지 확인.

- [ ] **Step 3B.7: 사용자 검토 요청**

캡처 2장 + 메뉴 펼친 캡처 보여주고 OK 받기.

- [ ] **Step 3B.8: Task 3B commit**

```bash
git add src/features/patients/components/PatientList.tsx
git commit -m "$(cat <<'EOF'
feat(patients): 헤더 5 아이콘 → 선택 모드 + ⋮ 드롭다운 재배치

좌측 이름·직업·소속이 길면 줄바꿈되던 문제 해결:
- 좌측 컨테이너에 min-w-0 flex-1, 이름 텍스트에 truncate 적용
- 소속 배지는 shrink-0으로 잘리지 않게 유지

우측 5 아이콘이 모바일에서 밀집되던 문제 해결:
- 자주 쓰는 "선택 모드"만 노출 유지
- 프로필/통계/데이터생성(dev)/로그아웃은 ⋮ DropdownMenu 안으로
- 로그아웃은 destructive 색상으로 구분

shadcn/ui DropdownMenu 사용. 좌측 정보 공간 확보 + 모바일 헤더 깔끔.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] **Step F.1: 전체 빌드 + lint**

```bash
npm run build 2>&1 | tail -10
npm run lint 2>&1 | tail -10
```

Expected: 0 errors / 0 warnings.

- [ ] **Step F.2: dev 정리**

```bash
pkill -f "next-server|next dev" 2>/dev/null
pkill -f "playwright-mcp|mcp-chrome" 2>/dev/null
```

- [ ] **Step F.3: push**

```bash
git log --oneline origin/main..main   # 1 plan + 1 chore + 1 feat 보이는지
git push origin main
```

- [ ] **Step F.4: Vercel 배포 확인**

`mcp__claude_ai_Vercel__list_deployments` 호출 → 가장 최근 deployment id → READY 확인.

- [ ] **Step F.5: 사용자 폰 prod 검증 안내**

prod URL: `https://physiolog-collab.vercel.app`

체크리스트:
1. **S2-1:** 환자 A 치료 추가 → ← → 환자 카드 "마지막 치료" 즉시 갱신
2. **S2-2:** 환자 편집 페이지에서 ← 버튼 누르자마자 spinner 표시 (체감 즉시)
3. **S2-3 (a):** 헤더 좌측 이름·직업·소속이 한 줄에 표시 (혹시 너의 이름·소속이 길면 자동으로 ...)
4. **S2-3 (b):** 헤더 우측 [✏️] [⋮] 두 아이콘만 표시. ⋮ 누르면 메뉴(데이터 생성 / 프로필 / 통계 / 로그아웃) 펼침
5. **S2-3 (c):** 각 메뉴 항목 클릭 → 해당 페이지로 이동

폰 검증 OK 받은 후 Sprint 2 종료, Sprint 3 plan(운동 시간 측정 + PWA splash) 작성 단계로.

---

## Rollback Plan

Task 단위 커밋이라 부분 rollback 가능:

```bash
# Task 3B만 되돌리기 (헤더 변경)
git revert <Task 3B commit SHA>

# Task 3 전체 (shadcn 포함)
git revert <Task 3B> <Task 3A>

# Sprint 2 전체
git revert <Task 3B>..<Task 2>
```

prod에서 critical 버그 발견 시 즉시 revert + 재배포.

---

## Out of Scope (Sprint 3로 미룸)

- 운동 시간(분) 측정 필드 (S3-1)
- PWA cold start splash (S3-2)
- 헤더 전역 layout 추출 (환자 상세 페이지 헤더는 별도 작업)
- 메뉴 항목별 단축키 (k 누르면 검색 등)
- 사용자 프로필 사진 아바타 (현재 텍스트만)
