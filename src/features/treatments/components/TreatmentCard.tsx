'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Square, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BODY_REGION_LABEL, SIDE_LABEL } from '@/data/body-parts'
import {
  EXERCISE_CONCEPT_LABEL,
  TREATMENT_METHOD_LABEL,
} from '@/data/treatment-options'
import { formatDateShort } from '@/lib/utils/date'
import type { Treatment } from '@/features/treatments/domain/types'
import { cn } from '@/lib/utils'

type Props = {
  treatment: Treatment
  onClick?: () => void
  onDelete?: (id: string) => void
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export function TreatmentCard({ 
  treatment, 
  onClick, 
  onDelete,
  isSelectionMode,
  isSelected,
  onSelect
}: Props) {
  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(treatment.id)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group cursor-pointer px-4 py-3 transition hover:border-primary",
        isSelected && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center gap-3">
        {isSelectionMode && (
          <div className="shrink-0">
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
        
        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {formatDateShort(treatment.date)}
            </span>
            <div className="flex flex-wrap gap-1">
              {treatment.bodyParts?.map((p, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {BODY_REGION_LABEL[p.region] ?? p.region}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {treatment.methods?.map((m) => (
              <span key={m} className="text-[10px] text-muted-foreground">
                #{TREATMENT_METHOD_LABEL[m]}
              </span>
            ))}
          </div>
          {treatment.flags && treatment.flags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {treatment.flags.map((f) => (
                <span key={f} className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 border border-slate-200">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground opacity-100 sm:opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive sm:group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(treatment.id)
            }}
            aria-label="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        </div>
      </div>
    </Card>
  )
}
