'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EvaluationCard } from './EvaluationCard'
import { EvaluationChart } from './EvaluationChart'
import { EvaluationDetailSheet } from './EvaluationDetailSheet'
import { GraphSettingsDialog } from './GraphSettingsDialog'
import { evaluationStore } from '@/lib/storage'
import { getEvaluations, deleteEvaluation } from '@/lib/supabase/evaluations'
import { useConfirm } from '@/components/confirm-dialog'
import { LoadingScreen } from '@/components/loading-screen'
import type {
  Evaluation,
  GraphMetric,
} from '@/features/evaluations/domain/types'

type Props = {
  patientId: string
  initialEvaluations: Evaluation[]
}

export function EvaluationList({ patientId, initialEvaluations }: Props) {
  // 초기 데이터는 server prefetch → 첫 렌더에 즉시 표시
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations)
  const [graphMetrics, setGraphMetrics] = useState<GraphMetric[]>([])
  // graphMetrics는 localStorage(client-only) 읽기라 hydration 분리 필요
  const [graphHydrated, setGraphHydrated] = useState(false)
  const [selected, setSelected] = useState<Evaluation | null>(null)

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const confirm = useConfirm()

  // 삭제 등 mutation 후 최신 데이터 동기화용. 첫 로드는 server에서 처리됨.
  const loadEvaluations = async () => {
    const data = await getEvaluations(patientId)
    setEvaluations(data)
  }

  useEffect(() => {
    // localStorage 기반 그래프 설정만 client에서 hydrate (SSR mismatch 회피)
    setGraphMetrics(evaluationStore.getGraphSettings(patientId).metrics)
    setGraphHydrated(true)
  }, [patientId])

  const updateGraph = (metrics: GraphMetric[]) => {
    evaluationStore.setGraphSettings(patientId, metrics)
    setGraphMetrics(metrics)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '이 검사를 삭제할까요?',
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    await deleteEvaluation(id, patientId)
    await loadEvaluations()
    setSelected(null)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    const ok = await confirm({
      title: `선택한 ${selectedIds.size}건의 검사 기록을 삭제할까요?`,
      description: '되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    
    for (const id of selectedIds) {
      await deleteEvaluation(id, patientId)
    }
    
    await loadEvaluations()
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

  const hasAny = evaluations.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* 그래프 영역 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">회복 그래프</h3>
          <GraphSettingsDialog
            evaluations={evaluations}
            selected={graphMetrics}
            onChange={updateGraph}
          />
        </div>

        {!graphHydrated ? (
          <LoadingScreen className="min-h-32 flex-none py-6" />
        ) : graphMetrics.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground leading-relaxed">
            표시할 그래프가 없습니다.<br />
            VAS(통증 점수) 또는 추가로 함께 확인하고 싶은 검사결과를 설정하면 같이 점수 변화를 볼 수 있습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {graphMetrics.map((m, idx) => (
              <EvaluationChart key={idx} evaluations={evaluations} metric={m} />
            ))}
          </div>
        )}
      </section>

      {/* 평가 리스트 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold">검사 기록</h3>
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
              <Button asChild size="sm"><Link href={`/patients/${patientId}/evaluations/new`}><Plus className="mr-1 h-4 w-4" />검사 입력</Link></Button>
            )}
          </div>
        </div>

        {!hasAny && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12">
            <ClipboardList
              className="h-10 w-10 text-muted-foreground/40"
              strokeWidth={1.5}
            />
            <p className="text-sm text-muted-foreground">
              아직 입력된 검사가 없습니다.
            </p>
            <Button asChild size="sm"><Link href={`/patients/${patientId}/evaluations/new`}><Plus className="mr-1 h-4 w-4" />첫 검사 입력</Link></Button>
          </div>
        )}

        {hasAny && (
          <div className="flex flex-col gap-2">
            {evaluations.map((e) => (
              <EvaluationCard
                key={e.id}
                evaluation={e}
                onClick={() => setSelected(e)}
                onDelete={isSelectionMode ? undefined : handleDelete}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(e.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </section>

      <EvaluationDetailSheet
        evaluation={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}
