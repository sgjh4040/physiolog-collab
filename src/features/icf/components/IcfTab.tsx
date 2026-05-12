'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, CheckSquare, Plus, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IcfDomainCard } from './IcfDomainCard'
import { getIcfAssessments, deleteIcfAssessment } from '@/lib/supabase/icf'
import { useConfirm } from '@/components/confirm-dialog'
import { DOMAIN_KEYS, DOMAIN_META, type IcfAssessment } from '@/features/icf/domain/types'
import { cn } from '@/lib/utils'

type Props = { patientId: string }

export function IcfTab({ patientId }: Props) {
  const [assessments, setAssessments] = useState<IcfAssessment[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const confirm = useConfirm()

  const loadAssessments = async () => {
    setAssessments(await getIcfAssessments(patientId))
  }

  useEffect(() => {
    async function load() {
      await loadAssessments()
      setHydrated(true)
    }
    load()
  }, [patientId])

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '이 평가를 삭제할까요?',
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    await deleteIcfAssessment(id, patientId)
    await loadAssessments()
    if (expanded === id) setExpanded(null)
    toast.success('삭제되었습니다.')
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    const ok = await confirm({
      title: `선택한 ${selectedIds.size}건의 평가 기록을 삭제할까요?`,
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    
    for (const id of selectedIds) {
      await deleteIcfAssessment(id, patientId)
    }
    
    await loadAssessments()
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

  if (!hydrated) {
    return <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">불러오는 중…</div>
  }

  const hasAny = assessments.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">평가지</h3>
          {isSelectionMode && (
            <p className="text-[10px] font-medium text-primary">
              {selectedIds.size}개 선택됨
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {hasAny && !isSelectionMode && (
            <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="text-xs h-8">
              선택
            </Button>
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
            <Button asChild size="sm"><Link href={`/patients/${patientId}/icf/new`}><Plus className="mr-1 h-4 w-4" />새 평가</Link></Button>
          )}
        </div>
      </div>

      {!hasAny && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12">
          <Brain className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">아직 평가 기록이 없습니다.</p>
          <Button asChild size="sm"><Link href={`/patients/${patientId}/icf/new`}><Plus className="mr-1 h-4 w-4" />첫 평가 시작</Link></Button>
        </div>
      )}

      {assessments.map((a) => (
        <div key={a.id} className={cn("rounded-lg border bg-card transition", selectedIds.has(a.id) && "border-primary bg-primary/5")}>
          {/* 카드 헤더 */}
          <div className="flex items-center px-3">
            {isSelectionMode && (
              <button 
                onClick={() => toggleSelect(a.id)}
                className="mr-2"
              >
                {selectedIds.has(a.id) ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}
            <button
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelect(a.id)
                } else {
                  setExpanded(expanded === a.id ? null : a.id)
                }
              }}
              className="flex flex-1 items-center justify-between py-3 text-left"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{a.date}</span>
                {/* 도메인 커버리지 도트 */}
                <div className="flex gap-1">
                  {DOMAIN_KEYS.map((key) => {
                    const filled = a.finalDomains[key].length > 0
                    const meta = DOMAIN_META[key]
                    return (
                      <span
                        key={key}
                        title={meta.label}
                        className={`h-2 w-2 rounded-full ${filled ? meta.color.replace('text-', 'bg-') : 'bg-muted'}`}
                      />
                    )
                  })}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {isSelectionMode ? "" : (expanded === a.id ? '닫기' : '펼치기')}
              </span>
            </button>
          </div>

          {/* 상세 */}
          {!isSelectionMode && expanded === a.id && (
            <div className="border-t px-3 pb-3 pt-3 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DOMAIN_KEYS.map((key, i) => (
                  <IcfDomainCard key={key} domainKey={key} items={a.finalDomains[key]} index={i} />
                ))}
              </div>

              {a.finalNote && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">임상 추론 요약</p>
                  <p className="text-sm leading-relaxed">{a.finalNote}</p>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(a.id)}
                className="w-full gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />삭제
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
