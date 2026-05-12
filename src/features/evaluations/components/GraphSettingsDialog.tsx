'use client'

import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { extractGraphOptions, metricKey } from '@/features/evaluations/lib/graph-options'
import type {
  Evaluation,
  GraphMetric,
} from '@/features/evaluations/domain/types'

type Props = {
  evaluations: Evaluation[]
  selected: GraphMetric[]
  onChange: (next: GraphMetric[]) => void
}

export function GraphSettingsDialog({ evaluations, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<string>>(new Set())

  useEffect(() => {
    // open prop 변경 시 draft를 selected로 재초기화 — 외부 prop 동기화
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(new Set(selected.map(metricKey)))
    }
  }, [open, selected])

  const options = extractGraphOptions(evaluations)

  const toggle = (key: string) => {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const save = () => {
    const nextMetrics = options
      .filter((o) => draft.has(o.key))
      .map((o) => o.metric)
    onChange(nextMetrics)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-1 h-4 w-4" />그래프 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>그래프 표시 항목</DialogTitle>
          <DialogDescription>
            검사 기록에 데이터가 있는 항목만 그래프로 표시할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            아직 검사 데이터가 없습니다.
          </p>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-3">
            <div className="flex flex-col gap-1.5">
              {options.map((opt) => {
                const checked = draft.has(opt.key)
                return (
                  <Label
                    key={opt.key}
                    className={
                      checked
                        ? 'flex cursor-pointer items-center gap-2 rounded-md border border-primary bg-primary/5 px-3 py-2'
                        : 'flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 hover:bg-accent'
                    }
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(opt.key)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </Label>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={save} disabled={options.length === 0}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
