'use client'

import { useEffect, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { exerciseFavoritesStore, newId } from '@/lib/storage'
import { EXERCISE_CONCEPT_OPTIONS } from '@/data/treatment-options'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'

type FavoriteEntry = { name: string; count: number; lastUsedAt: string }

export function ExerciseSection() {
  const { control, watch, setValue, register, formState } =
    useFormContext<TreatmentFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  })

  const concept = watch('exerciseConcept')
  const exercisesError = formState.errors.exercises
  const conceptError = formState.errors.exerciseConcept

  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  useEffect(() => {
    // localStorage(favorites store)에서 초기값 로드 — 외부 시스템 동기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(exerciseFavoritesStore.getSortedFavorites())
  }, [])

  const currentNames = new Set(
    (watch('exercises') ?? []).map((e) => e.name.trim()),
  )
  const suggestable = favorites
    .filter((f) => !currentNames.has(f.name))
    .slice(0, 6)

  const handleAdd = (name = '') => {
    append({ id: newId(), name, intensity: '', sets: 3, reps: 10, weight: 0 })
  }

  return (
    <Card className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-col gap-2">
        <Label>목적</Label>
        <Select
          value={concept ?? ''}
          onValueChange={(v) =>
            setValue(
              'exerciseConcept',
              v as TreatmentFormValues['exerciseConcept'],
              { shouldDirty: true, shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="목적 선택" />
          </SelectTrigger>
          <SelectContent>
            {EXERCISE_CONCEPT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {conceptError && (
          <p className="text-sm text-destructive">{conceptError.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>운동 목록</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAdd()}
          >
            <Plus className="mr-1 h-4 w-4" />운동 추가
          </Button>
        </div>

        {suggestable.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />자주 쓰는
            </span>
            {suggestable.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => handleAdd(f.name)}
                className="rounded-full border border-input bg-background px-2.5 py-1 text-xs hover:bg-accent"
              >
                {f.name}
                <span className="ml-1 text-muted-foreground">×{f.count}</span>
              </button>
            ))}
          </div>
        )}

        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            추가된 운동이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    {idx + 1}
                  </Badge>
                  <Input
                    placeholder="운동명 (예: 스쿼트)"
                    {...register(`exercises.${idx}.name`)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    aria-label="운동 제거"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

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

                <Textarea
                  rows={1}
                  placeholder="특이사항 (예: 좌측 통증 있음)"
                  {...register(`exercises.${idx}.intensity`)}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {exercisesError && typeof exercisesError.message === 'string' && (
          <p className="text-sm text-destructive">{exercisesError.message}</p>
        )}
      </div>
    </Card>
  )
}

function CounterField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-muted-foreground ml-1">{label}</span>
      <div className="flex items-center overflow-hidden rounded-md border bg-slate-50">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-8 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-full bg-transparent text-center text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200"
        >
          +
        </button>
      </div>
    </div>
  )
}
