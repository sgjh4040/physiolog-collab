'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle, Sparkles, Trash2, Users } from 'lucide-react'
import {
  cleanAllPatientData,
  createShowcasePatients,
  createRichSeedPatients,
} from '@/lib/supabase/seed-actions'

type LoadingKey = 'idle' | 'cleaning' | 'rich' | 'showcase'

/**
 * /seed 페이지 — 시연·인계 baseline 세팅 도구.
 *
 * 세 가지 액션:
 * - 🧹 청소: 현재 사용자의 모든 환자 데이터 삭제 (FK cascade)
 * - 👥 풀 시드 10명: 다양한 진단군 fixture (척추관 협착증·CTS·디스크·OA 등)
 * - ✨ 쇼케이스 2명: 시연 메인 카드 (회전근개·뇌졸중)
 *
 * 시연 직전 흐름: 청소 → 풀 시드 10명 + 쇼케이스 2명 = 12명 풀 baseline.
 */
export default function SeedClient() {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingKey>('idle')
  const [msg, setMsg] = useState<string>('')
  const [err, setErr] = useState<string | null>(null)

  async function handleClean() {
    if (!confirm('현재 사용자의 모든 환자·치료·평가·ICF 기록을 삭제합니다.\n복구할 수 없습니다. 계속하시겠습니까?')) return
    setLoading('cleaning')
    setErr(null)
    setMsg('')
    const result = await cleanAllPatientData()
    if (result.success) {
      setMsg(`청소 완료 — 환자 ${result.count ?? 0}명 삭제됨`)
    } else {
      setErr(result.error ?? '청소 실패')
    }
    setLoading('idle')
  }

  async function handleRichSeed() {
    setLoading('rich')
    setErr(null)
    setMsg('')
    const result = await createRichSeedPatients()
    if (result.success) {
      setMsg(`풀 시드 환자 ${result.count ?? 0}명 생성 완료 — 1초 후 환자 리스트로 이동합니다`)
      setTimeout(() => router.push('/'), 1000)
    } else {
      setErr(result.error ?? '생성 실패')
    }
    setLoading('idle')
  }

  async function handleShowcase() {
    setLoading('showcase')
    setErr(null)
    setMsg('')
    const result = await createShowcasePatients()
    if (result.success) {
      setMsg(`쇼케이스 환자 ${result.count ?? 0}명 생성 완료 — 1초 후 환자 리스트로 이동합니다`)
      setTimeout(() => router.push('/'), 1000)
    } else {
      setErr(result.error ?? '생성 실패')
    }
    setLoading('idle')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-50 p-4 py-10">
      {/* 공통 상태 표시 (한 영역에서 모든 액션의 success/error 노출) */}
      {(err || msg) && (
        <div className="w-full max-w-md">
          {err && (
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}
          {msg && !err && (
            <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}
        </div>
      )}

      {/* 1. 청소 카드 */}
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <Trash2 className="h-5 w-5 text-slate-600" />
            데이터 청소
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-700">
            현재 로그인 사용자의 환자·치료·평가·ICF 기록을 모두 삭제합니다.
            <br />
            <span className="text-slate-500">시드를 새로 생성하기 전에 baseline을 깨끗하게 만드는 용도.</span>
          </p>
          <Button
            variant="outline"
            onClick={handleClean}
            disabled={loading !== 'idle'}
            className="w-full gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            {loading === 'cleaning' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                청소 중...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                모든 환자 데이터 청소
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 2. 풀 시드 10명 카드 */}
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <Users className="h-5 w-5 text-blue-600" />
            풀 시드 환자 10명
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
            <p className="font-semibold">다양한 진단군 임상 fixture</p>
            <p className="mt-1 text-blue-800/90">
              척추관 협착증·디스크·CTS·발목 염좌·경추 디스크·무릎 OA·오십견·좌골신경통·어깨충돌·만성 요통
            </p>
            <p className="mt-1 text-blue-700/80">
              각 환자에 치료 3~5건·평가 2~3건, 4명은 ICF 분석 포함.
            </p>
          </div>
          <Button
            onClick={handleRichSeed}
            disabled={loading !== 'idle'}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading === 'rich' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                풀 시드 10명 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 3. 쇼케이스 2명 카드 */}
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-emerald-600">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            시연용 쇼케이스 환자
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
            <p className="font-semibold">대회 시연·친구 인계 메인 카드</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-emerald-800/90">
              <li>① 회전근개 부분 파열 후 9주차 재활 (미용사, 40대 여성)</li>
              <li>② 좌측 편마비 후 4개월차 재활 (가정주부, 60대 여성)</li>
            </ul>
            <p className="mt-2 text-emerald-700/80">
              각 환자마다 치료 10건·평가 5건·ICF 분석 1건 — PDF 모든 섹션 풀 채워짐.
            </p>
          </div>
          <Button
            onClick={handleShowcase}
            disabled={loading !== 'idle'}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading === 'showcase' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                쇼케이스 환자 2명 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-slate-400">
        추천 순서: 청소 → 풀 시드 10명 → 쇼케이스 2명. 시연 baseline 30초 완성.
      </p>
    </div>
  )
}
