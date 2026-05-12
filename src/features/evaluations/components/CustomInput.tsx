'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { evaluationFavoritesStore } from '@/lib/storage'
import type { FavoriteEvaluationEntry } from '@/lib/storage/evaluation-favorites'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'

export function CustomInput() {
  const { control, register, formState, watch } = useFormContext<EvaluationFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'custom' })
  const error = formState.errors.custom

  const [favorites, setFavorites] = useState<FavoriteEvaluationEntry[]>([])
  useEffect(() => {
    // localStorage(favorites store)에서 초기값 로드 — 외부 시스템 동기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(evaluationFavoritesStore.getSortedEvaluationFavorites())
  }, [])

  const currentNames = new Set(
    (watch('custom') ?? []).map((c) => c.name.trim()),
  )
  const suggestable = favorites
    .filter((f) => !currentNames.has(f.name))
    .slice(0, 6)

  const handleAdd = (name = '') => {
    append({ name, value: '' })
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
          커스텀 검사 항목 없음 (예: 특수검사 등)
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-md border bg-background p-3"
            >
              <Input
                placeholder="항목명 (예: 특수검사)"
                {...register(`custom.${idx}.name`)}
                className="flex-1"
              />
              <Input
                placeholder="값"
                {...register(`custom.${idx}.value`)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(idx)}
                aria-label="항목 제거"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

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

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => handleAdd()}
      >
        <Plus className="mr-1 h-4 w-4" />검사 항목 추가
      </Button>

      {error && typeof error.message === 'string' && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
