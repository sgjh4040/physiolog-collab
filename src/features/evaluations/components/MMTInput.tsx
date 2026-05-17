'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleSide } from '@/features/treatments/components/ToggleSide'
import { JOINTS, getMovementById } from '@/data/joints'
import { MMT_GRADE_LABELS } from '@/data/evaluation-options'
import type { Side } from '@/features/treatments/domain/types'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'

const GRADES = [0, 1, 2, 3, 4, 5] as const

export function MMTInput() {
  const { control, watch, setValue, formState } =
    useFormContext<EvaluationFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'mmt' })
  const error = formState.errors.mmt

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
          MMT 항목 없음
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, idx) => {
            const jointId = watch(`mmt.${idx}.jointId`)
            const side = watch(`mmt.${idx}.side`) ?? 'both'
            const movement = jointId ? getMovementById(jointId) : undefined

            return (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={jointId ?? ''}
                    onValueChange={(v) =>
                      setValue(`mmt.${idx}.jointId`, v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      {movement ? (
                        <span className="truncate">
                          {movement.joint.label} {movement.movement.label}
                        </span>
                      ) : (
                        <SelectValue placeholder="관절·동작 선택" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {JOINTS.map((joint) => (
                        <SelectGroup key={joint.id}>
                          <SelectLabel className="bg-muted/30 py-2 text-sm font-bold text-foreground">
                            {joint.label}
                          </SelectLabel>
                          {joint.movements.map((mv) => (
                            <SelectItem key={mv.id} value={mv.id}>
                              {mv.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(idx)}
                    aria-label="MMT 제거"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ToggleSide
                    value={side as Side}
                    onChange={(v) =>
                      setValue(`mmt.${idx}.side`, v, { shouldDirty: true })
                    }
                  />
                  <Select
                    value={String(watch(`mmt.${idx}.grade`) ?? 0)}
                    onValueChange={(v) =>
                      setValue(`mmt.${idx}.grade`, Number(v) as 0 | 1 | 2 | 3 | 4 | 5, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="등급" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {MMT_GRADE_LABELS[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append({ jointId: '', side: 'both', grade: 5 })}
      >
        <Plus className="mr-1 h-4 w-4" />MMT 추가
      </Button>

      {error && typeof error.message === 'string' && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
