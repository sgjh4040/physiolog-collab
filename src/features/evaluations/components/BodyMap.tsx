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
  PATTERN_COLOR_HEX,
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

  // 우리 painMapping의 side는 anatomical position(환자 기준 좌/우). 라이브러리는 view 무관하게
  // path.left = 화면 왼쪽 path로 정의해서 앞면에서 환자 좌/우가 반대로 표시됨. 의료 표준에 맞춰
  // 앞면일 때만 swap. 뒷면은 그대로 (환자 등 뒤에서 보는 시점이라 화면 좌/우 = 환자 좌/우).
  const toLibSide = (anatomicalSide?: LibSide): LibSide | undefined => {
    if (!anatomicalSide) return undefined
    if (view === 'back') return anatomicalSide
    return anatomicalSide === 'left' ? 'right' : 'left'
  }
  const fromLibSide = (libSide?: 'left' | 'right'): LibSide | undefined => {
    if (!libSide) return undefined
    if (view === 'back') return libSide
    return libSide === 'left' ? 'right' : 'left'
  }

  // 라이브러리에 넘길 데이터 — painMapping 중 라이브러리 slug로 변환 가능한 것만.
  // SVG 색칠은 양상별 색상(PATTERN_COLOR_HEX)으로 — color 필드가 라이브러리 우선순위에서
  // intensity보다 위에 있어 색상 명시 시 그라데이션 무시됨.
  //
  // 같은 slug에 left + right 둘 다 있으면:
  //   1. 라이브러리 Map.set이 한 entry만 유지 + data.find(slug).side 분기로 한쪽만 색칠하는
  //      한계가 있어 side 제거(undefined)해서 두 path 모두 색칠
  //   2. 좌/우 양상이 다를 경우 max intensity 쪽 양상으로 통일 (사용자 결정)
  const libData = useMemo(() => {
    // slug별 최대 intensity와 그때의 양상을 추적
    const bySlug = new Map<
      LibSlug,
      { left?: { intensity: number; pattern: PainPattern }; right?: { intensity: number; pattern: PainPattern }; central?: { intensity: number; pattern: PainPattern } }
    >()
    for (const p of value) {
      const lib = idToLibPart(p.id)
      if (!lib) continue
      const cur = bySlug.get(lib.slug) ?? {}
      const key = lib.side ?? 'central'
      const existing = cur[key]
      if (!existing || p.intensity > existing.intensity) {
        cur[key] = { intensity: p.intensity, pattern: p.pattern }
      }
      bySlug.set(lib.slug, cur)
    }

    const parts: ExtendedBodyPart[] = []
    for (const [slug, sides] of bySlug) {
      // 좌/우 합칠 때 max intensity 쪽 양상으로 통일
      const pickWinner = (
        a?: { intensity: number; pattern: PainPattern },
        b?: { intensity: number; pattern: PainPattern }
      ) => {
        if (!a) return b
        if (!b) return a
        return a.intensity >= b.intensity ? a : b
      }

      if (sides.left && sides.right) {
        const winner = pickWinner(sides.left, sides.right)!
        parts.push({
          slug: slug as ExtendedBodyPart['slug'],
          intensity: winner.intensity,
          color: PATTERN_COLOR_HEX[winner.pattern],
        })
      } else if (sides.left) {
        parts.push({
          slug: slug as ExtendedBodyPart['slug'],
          intensity: sides.left.intensity,
          side: toLibSide('left'),
          color: PATTERN_COLOR_HEX[sides.left.pattern],
        })
      } else if (sides.right) {
        parts.push({
          slug: slug as ExtendedBodyPart['slug'],
          intensity: sides.right.intensity,
          side: toLibSide('right'),
          color: PATTERN_COLOR_HEX[sides.right.pattern],
        })
      } else if (sides.central) {
        parts.push({
          slug: slug as ExtendedBodyPart['slug'],
          intensity: sides.central.intensity,
          color: PATTERN_COLOR_HEX[sides.central.pattern],
        })
      }
    }
    return parts
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toLibSide는 view에만 의존
  }, [value, view])

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
    part: ExtendedBodyPart,
    libSide?: 'left' | 'right'
  ) => {
    if (!part.slug) return
    const slug = part.slug as LibSlug
    // 라이브러리 side(화면 기준) → anatomical side(환자 기준)
    const anatomicalSide = fromLibSide(libSide)
    const id = libPartToId(slug, anatomicalSide)
    const label = buildLabel(slug, anatomicalSide)
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
                    className={`h-auto py-2.5 flex flex-row items-center justify-center gap-2 ${
                      pattern === p ? '' : 'hover:bg-muted'
                    }`}
                    onClick={() => setPattern(p)}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                      style={{ backgroundColor: PATTERN_COLOR_HEX[p] }}
                      aria-hidden="true"
                    />
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
