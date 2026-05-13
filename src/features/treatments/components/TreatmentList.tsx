'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { TreatmentCard } from './TreatmentCard'
import { TreatmentDetailSheet } from './TreatmentDetailSheet'
import { getTreatments, deleteTreatment } from '@/lib/supabase/treatments'
import { useConfirm } from '@/components/confirm-dialog'
import { formatDateShort } from '@/lib/utils/date'
import { BODY_REGION_LABEL } from '@/data/body-parts'
import type { Treatment } from '@/features/treatments/domain/types'

type Props = {
  patientId: string
  initialTreatments: Treatment[]
}

export function TreatmentList({ patientId, initialTreatments }: Props) {
  // 초기 데이터는 server prefetch → 첫 렌더에 즉시 표시 (깜빡임/로딩 텍스트 없음)
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments)
  const [selected, setSelected] = useState<Treatment | null>(null)
  const [openCopyPopover, setOpenCopyPopover] = useState(false)

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const router = useRouter()
  const confirm = useConfirm()

  // 삭제 등 mutation 후 최신 데이터 동기화용. 첫 로드는 server에서 처리됨.
  const loadTreatments = async () => {
    const data = await getTreatments(patientId)
    setTreatments(data)
  }

  const hasAny = treatments.length > 0

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '이 치료를 삭제할까요?',
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    await deleteTreatment(id, patientId)
    await loadTreatments()
    setSelected(null)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    const ok = await confirm({
      title: `선택한 ${selectedIds.size}건의 치료 기록을 삭제할까요?`,
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    
    for (const id of selectedIds) {
      await deleteTreatment(id, patientId)
    }
    
    await loadTreatments()
    setSelectedIds(new Set())
    setIsSelectionMode(false)
    toast.success('선택한 기록이 삭제되었습니다.')
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedIds(new Set())
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-muted-foreground">
            총 {treatments.length}건
          </p>
          {isSelectionMode && (
            <p className="text-[10px] font-medium text-primary">
              {selectedIds.size}개 선택됨
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {hasAny && !isSelectionMode && (
            <>
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="text-xs h-8">
                선택
              </Button>
              <Popover open={openCopyPopover} onOpenChange={setOpenCopyPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Copy className="mr-1 h-4 w-4" />이전 기록 복사
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="날짜 검색..." />
                    <CommandList>
                      <CommandEmpty>기록이 없습니다.</CommandEmpty>
                      <CommandGroup heading="복사할 기록 선택">
                        {treatments.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.date}
                            onSelect={() => {
                              router.push(
                                `/patients/${patientId}/treatments/new?copyFrom=${t.id}`,
                              )
                              setOpenCopyPopover(false)
                            }}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                {formatDateShort(t.date)}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {t.bodyParts?.map((p) => BODY_REGION_LABEL[p.region]).join(', ') || '부위 정보 없음'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}

          {isSelectionMode && (
            <>
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="text-xs h-8">
                취소
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="h-8"
              >
                삭제 ({selectedIds.size})
              </Button>
            </>
          )}

          {!isSelectionMode && (
            <Button asChild size="sm"><Link href={`/patients/${patientId}/treatments/new`}><Plus className="mr-1 h-4 w-4" />작성</Link></Button>
          )}
        </div>
      </div>

      {!hasAny && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12">
          <FileText
            className="h-10 w-10 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">
            아직 작성된 치료가 없습니다.
          </p>
          <Button asChild size="sm"><Link href={`/patients/${patientId}/treatments/new`}><Plus className="mr-1 h-4 w-4" />첫 치료 작성</Link></Button>
        </div>
      )}

      {hasAny && (
        <div className="flex flex-col gap-2">
          {treatments.map((t) => (
            <TreatmentCard
              key={t.id}
              treatment={t}
              onClick={() => setSelected(t)}
              onDelete={isSelectionMode ? undefined : handleDelete}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(t.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      <TreatmentDetailSheet
        treatment={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}
