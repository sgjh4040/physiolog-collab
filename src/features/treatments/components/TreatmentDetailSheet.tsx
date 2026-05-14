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
import { BODY_REGION_LABEL, SIDE_LABEL } from '@/data/body-parts'
import {
  EXERCISE_CONCEPT_LABEL,
  TREATMENT_METHOD_LABEL,
} from '@/data/treatment-options'
import { formatDate } from '@/lib/utils/date'
import type { Treatment } from '@/features/treatments/domain/types'

type Props = {
  treatment: Treatment | null
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function TreatmentDetailSheet({ treatment, onOpenChange, onDelete }: Props) {
  const open = treatment !== null
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {treatment && (
          <div className="mx-auto max-w-2xl">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between pr-8">
                <div>
                  <SheetTitle className="text-xl">{formatDate(treatment.date)}</SheetTitle>
                  <SheetDescription>치료 상세 기록</SheetDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="h-9 px-3">
                  <Link href={`/patients/${treatment.patientId}/treatments/${treatment.id}/edit`}>
                    <Pencil className="mr-1.5 h-4 w-4" />수정하기
                  </Link>
                </Button>
              </div>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-6 pb-12">
              {/* 치료 부위 및 방법 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="치료 부위">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {treatment.bodyParts?.map((p, idx) => (
                      <div key={idx} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span className="font-bold text-primary">
                          {p.side && p.side !== 'both' ? `${SIDE_LABEL[p.side]} ` : ''}
                          {BODY_REGION_LABEL[p.region] ?? p.region}
                        </span>
                        {p.muscles && p.muscles.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{p.muscles.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>

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
              </div>

              <Separator />

              {/* 오늘의 특이사항 (Flag) */}
              {treatment.flags && treatment.flags.length > 0 && (
                <Section title="오늘의 특이사항 (Flags)">
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {treatment.flags.map((f) => (
                      <span key={f} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                        {f}
                      </span>
                    ))}
                  </div>
                  <Separator className="mt-6" />
                </Section>
              )}

              {/* 운동 치료 상세 */}
              {treatment.exerciseConcept && (
                <Section title={`운동 치료 (${EXERCISE_CONCEPT_LABEL[treatment.exerciseConcept]})`}>
                  <div className="mt-2 space-y-3">
                    {treatment.exercises?.map((e, idx) => (
                      <div key={e.id ?? idx} className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2 mb-2">
                          <span className="font-bold text-sm text-primary">{idx + 1}. {e.name}</span>
                          <div className="flex gap-3 text-xs font-black text-slate-900">
                            {e.sets && <span>{e.sets} SET</span>}
                            {e.reps && <span>{e.reps} REP</span>}
                            {e.weight && <span>{e.weight} kg</span>}
                          </div>
                        </div>
                        {e.intensity && (
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                            &quot;{e.intensity}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-6" />
                </Section>
              )}

              {/* 코멘트 및 숙제 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="당일 코멘트">
                  <div className="rounded-lg bg-slate-50 p-4 border min-h-[100px]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {treatment.comment || <span className="text-muted-foreground italic">작성된 코멘트가 없습니다.</span>}
                    </p>
                  </div>
                </Section>

                <Section title="숙제">
                  <div className="rounded-lg bg-amber-50/30 p-4 border border-amber-100 min-h-[100px]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-amber-900">
                      {treatment.homework || <span className="text-muted-foreground italic">부여된 숙제가 없습니다.</span>}
                    </p>
                  </div>
                </Section>
              </div>

              {onDelete && (
                <div className="mt-8 pt-4 border-t flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onDelete(treatment.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />치료 기록 삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{title}</h3>
      <div>{children}</div>
    </section>
  )
}
