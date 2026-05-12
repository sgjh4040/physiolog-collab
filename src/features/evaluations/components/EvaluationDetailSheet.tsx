'use client'

import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SIDE_LABEL } from '@/data/body-parts'
import { getMovementById } from '@/data/joints'
import { MMT_GRADE_LABELS } from '@/data/evaluation-options'
import { formatDate } from '@/lib/utils/date'
import { BodyMap } from './BodyMap'
import type { Evaluation } from '@/features/evaluations/domain/types'

type Props = {
  evaluation: Evaluation | null
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function EvaluationDetailSheet({
  evaluation,
  onOpenChange,
  onDelete,
}: Props) {
  const open = evaluation !== null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {evaluation && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between pr-8">
                <div>
                  <SheetTitle>{formatDate(evaluation.date)}</SheetTitle>
                  <SheetDescription>검사 상세</SheetDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8 px-2">
                  <Link
                    href={`/patients/${evaluation.patientId}/evaluations/${evaluation.id}/edit`}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />수정
                  </Link>
                </Button>
              </div>
            </SheetHeader>

            <div className="mt-4 flex flex-col gap-4 px-4 pb-6">
              {typeof evaluation.vas === 'number' && (
                <Section title="VAS (통증 점수)">
                  <p className="text-2xl font-semibold">
                    {evaluation.vas}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / 10
                    </span>
                  </p>
                </Section>
              )}

              {evaluation.rom && evaluation.rom.length > 0 && (
                <>
                  <Separator />
                  <Section title="ROM (관절가동범위)">
                    <ul className="flex flex-col gap-1.5">
                      {evaluation.rom.map((r, idx) => {
                        const mv = getMovementById(r.jointId)
                        const side = r.side && r.side !== 'both'
                          ? `${SIDE_LABEL[r.side]} `
                          : ''
                        return (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {mv ? (
                                <>
                                  {mv.joint.label} {side}
                                  {mv.movement.label}
                                </>
                              ) : (
                                r.jointId
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {r.active !== undefined && (
                                <span>능동 {r.active}°</span>
                              )}
                              {r.active !== undefined && r.passive !== undefined && ' · '}
                              {r.passive !== undefined && (
                                <span>수동 {r.passive}°</span>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </Section>
                </>
              )}

              {evaluation.mmt && evaluation.mmt.length > 0 && (
                <>
                  <Separator />
                  <Section title="MMT (도수근력)">
                    <ul className="flex flex-col gap-1.5">
                      {evaluation.mmt.map((m, idx) => {
                        const side = m.side && m.side !== 'both'
                          ? `${SIDE_LABEL[m.side]} `
                          : ''
                        return (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {(() => {
                                const mv = getMovementById(m.jointId)
                                return mv ? (
                                  <>
                                    {mv.joint.label} {side}
                                    {mv.movement.label}
                                  </>
                                ) : (
                                  m.jointId
                                )
                              })()}
                            </span>
                            <Badge variant="outline">
                              {MMT_GRADE_LABELS[m.grade] ?? `${m.grade}등급`}
                            </Badge>
                          </li>
                        )
                      })}
                    </ul>
                  </Section>
                </>
              )}

              {evaluation.bodyMeasurement && evaluation.bodyMeasurement.length > 0 && (
                <>
                  <Separator />
                  <Section title="신체 계측">
                    <ul className="flex flex-col gap-1.5">
                      {evaluation.bodyMeasurement.map((b, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">
                            {typeLabel(b.type)} · {b.location}
                          </span>
                          <span className="text-muted-foreground">
                            {b.value} {b.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}

              {evaluation.painMapping && evaluation.painMapping.length > 0 && (
                <>
                  <Separator />
                  <Section title="통증 상세">
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {evaluation.painMapping.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">{p.label}</span>
                            <span className={`text-xs ${getPainColor(p.pattern)}`}>
                              {p.pattern === 'custom' ? (p.customPatternLabel || '기타') : patternLabel(p.pattern)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-medium">VAS</span>
                            <span className="text-lg font-bold text-primary">{p.intensity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex flex-col items-center border-t pt-6 bg-slate-50/50 rounded-b-xl">
                      <p className="text-[10px] text-muted-foreground mb-2">통증 부위 가시화 — 앞면/뒷면 토글 가능</p>
                      <div className="w-full max-w-[220px]">
                        <BodyMap
                          value={evaluation.painMapping}
                          onChange={() => {}}
                          readOnly={true}
                        />
                      </div>
                    </div>
                  </Section>
                </>
              )}

              {evaluation.custom && evaluation.custom.length > 0 && (
                <>
                  <Separator />
                  <Section title="커스텀 평가">
                    <ul className="flex flex-col gap-1.5">
                      {evaluation.custom.map((c, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground">{c.value}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}

              {onDelete && (
                <>
                  <Separator />
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(evaluation.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />검사 삭제
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function typeLabel(t: 'circumference' | 'length' | 'edema'): string {
  if (t === 'circumference') return '둘레'
  if (t === 'length') return '길이'
  return '부종'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}
function patternLabel(p: string) {
  switch (p) {
    case 'referred': return '연관통'
    case 'tingling': return '저림'
    case 'weakness': return '힘빠짐'
    case 'paresthesia': return '이상감각'
    case 'radiating': return '방사통'
    case 'sharp': return '날카로운 통증'
    case 'custom': return '기타'
    default: return p
  }
}

function getPainColor(p: string) {
  switch (p) {
    case 'referred': return 'text-red-500'
    case 'tingling': return 'text-blue-500'
    case 'weakness': return 'text-indigo-600'
    case 'paresthesia': return 'text-purple-500'
    case 'radiating': return 'text-orange-500'
    case 'sharp': return 'text-yellow-500'
    case 'custom': return 'text-teal-500'
    default: return ''
  }
}
