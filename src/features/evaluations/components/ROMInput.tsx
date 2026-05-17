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
import type { Side } from '@/features/treatments/domain/types'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'

export function ROMInput() {
  const { control, watch, setValue, formState } = useFormContext<EvaluationFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'rom' })
  const error = formState.errors.rom

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
          ROM 항목 없음
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, idx) => {
            const jointId = watch(`rom.${idx}.jointId`)
            const side = watch(`rom.${idx}.side`) ?? 'both'
            const active = watch(`rom.${idx}.active`)
            const passive = watch(`rom.${idx}.passive`)
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
                      setValue(`rom.${idx}.jointId`, v, {
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
                    aria-label="ROM 제거"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ToggleSide
                  value={side as Side}
                  onChange={(v) =>
                    setValue(`rom.${idx}.side`, v, { shouldDirty: true })
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <DegreeInput
                    label="능동"
                    value={active}
                    onChange={(v) =>
                      setValue(`rom.${idx}.active`, v, { shouldDirty: true })
                    }
                  />
                  <DegreeInput
                    label="수동"
                    value={passive}
                    onChange={(v) =>
                      setValue(`rom.${idx}.passive`, v, { shouldDirty: true })
                    }
                  />
                </div>

                {movement?.movement.normal && (
                  <p className="text-xs text-muted-foreground">
                    정상 범위: {movement.movement.normal}
                  </p>
                )}
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
        onClick={() => append({ jointId: '', side: 'both' })}
      >
        <Plus className="mr-1 h-4 w-4" />ROM 추가
      </Button>

      {error && typeof error.message === 'string' && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}

function DegreeInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="-"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? undefined : Number(v))
        }}
      />
      <span className="text-xs text-muted-foreground">°</span>
    </div>
  )
}
