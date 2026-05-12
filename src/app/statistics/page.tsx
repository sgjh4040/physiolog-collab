'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingUp, Users, Target, Activity, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getPatients } from '@/lib/supabase/patients'
import { getIcfAssessments } from '@/lib/supabase/icf'
import { DOMAIN_META, type IcfDomainKey, type IcfAssessment } from '@/features/icf/domain/types'
import { LoadingScreen } from '@/components/loading-screen'

export default function StatisticsPage() {
  const [hydrated, setHydrated] = useState(false)
  const [stats, setStats] = useState<{
    totalPatients: number
    totalAssessments: number
    topKeywords: { domain: IcfDomainKey; keywords: [string, number][] }[]
  } | null>(null)

  useEffect(() => {
    async function loadStats() {
      const patients = await getPatients()
      
      const allAssessments: IcfAssessment[] = []
      for (const p of patients) {
        const assessments = await getIcfAssessments(p.id)
        allAssessments.push(...assessments)
      }
      
      const keywordCounts: Record<IcfDomainKey, Record<string, number>> = {
        body: {},
        activity: {},
        participation: {},
        environment: {},
        personal: {},
      }

      allAssessments.forEach(a => {
        Object.entries(a.finalDomains).forEach(([domain, items]) => {
          items.forEach((item: string) => {
            const d = domain as IcfDomainKey
            keywordCounts[d][item] = (keywordCounts[d][item] || 0) + 1
          })
        })
      })

      const topKeywords = Object.entries(keywordCounts).map(([domain, counts]) => {
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
        return {
          domain: domain as IcfDomainKey,
          keywords: sorted
        }
      })

      setStats({
        totalPatients: patients.length,
        totalAssessments: allAssessments.length,
        topKeywords
      })
      setHydrated(true)
    }
    loadStats()
  }, [])

  if (!hydrated) return <LoadingScreen fullScreen />

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24 min-h-screen bg-slate-50/50">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">통계 및 인사이트</h1>
          <p className="text-sm text-muted-foreground">질병을 넘어 환자의 삶(기능)을 분석합니다</p>
        </div>
      </header>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex flex-col gap-1 border-none shadow-sm bg-white">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">총 환자</span>
          </div>
          <div className="text-2xl font-bold">{stats?.totalPatients ?? 0}명</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-none shadow-sm bg-white">
          <div className="flex items-center gap-2 text-indigo-500">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">평가 기록</span>
          </div>
          <div className="text-2xl font-bold">{stats?.totalAssessments ?? 0}건</div>
        </Card>
      </div>

      <div className="space-y-6 mt-2">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">영역별 주요 키워드</h2>
        </div>

        {stats?.topKeywords.map(({ domain, keywords }) => {
          const meta = DOMAIN_META[domain]
          if (keywords.length === 0) return null

          return (
            <Card key={domain} className="overflow-hidden border-none shadow-sm bg-white">
              <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${meta.bg} ${meta.color} border-b ${meta.border}`}>
                {meta.label}
              </div>
              <div className="p-4 space-y-4">
                {keywords.map(([word, count]) => {
                  const percentage = Math.min((count / (stats?.totalAssessments || 1)) * 100, 100)
                  return (
                    <div key={word} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{word}</span>
                        <span className="text-xs text-muted-foreground">{count}회</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${meta.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} 
                          style={{ width: `${percentage}%`, backgroundColor: 'currentColor' }} 
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {stats?.totalAssessments === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Target className="w-12 h-12 text-slate-200" />
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">데이터가 부족합니다.</p>
              <p className="text-xs text-slate-400">환자 평가를 시작하면 주요 키워드 분석이 시작됩니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 인사이트 섹션 */}
      <Card className="p-5 border-none shadow-md bg-gradient-to-br from-indigo-900 to-slate-900 text-white mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold uppercase tracking-widest text-xs">Clinical Philosophy</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed italic">
          {'"우리는 진단명이라는 라벨에만 집중하지 않습니다. 환자가 자신의 삶 속에서 어떻게 기능하고 참여하는지, 그 실질적인 \'삶의 변화\'를 추적하는 것이 physiolog의 진정한 전문성입니다."'}
        </p>
        <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Powered by</p>
            <p className="text-xs font-semibold">WHO ICF Framework</p>
          </div>
          <div className="text-[10px] bg-primary/20 px-2 py-1 rounded text-primary-foreground border border-primary/30 font-medium">
            Professional Insight
          </div>
        </div>
      </Card>
    </div>
  )
}
