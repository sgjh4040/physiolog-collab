'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { PainPattern } from '@/features/evaluations/domain/types'
import {
  libPartToId,
  buildLabel,
  type LibSlug,
  type LibSide,
} from '@/features/evaluations/lib/bodymap-mapping'

// ============================================================
// Fixture: 10명 — 진단명·연령·통증 부위 임상적으로 자연스러운 매핑
// ============================================================

type SeedPainArea = {
  slug: LibSlug
  side?: LibSide
  pattern: PainPattern
  intensity: number  // 1~10, 첫 평가(2026-01) 기준. 이후 평가에서 감소
}

type PatientFixture = {
  name: string
  age: number               // 2026년 기준
  gender: 'male' | 'female'
  diagnosis: string
  region: string            // BodyRegionId — 치료 부위
  methods: string[]         // TreatmentMethod[]
  exercises: string[]
  insurance: 'health' | 'industrial' | 'auto' | 'private' | 'medical' | 'self'
  status: 'new' | 'readmit' | 'hold' | 'discharged'
  painAreas: SeedPainArea[]
}

const PATIENT_FIXTURES: PatientFixture[] = [
  {
    name: '김철수', age: 67, gender: 'male',
    diagnosis: '뇌졸중 (Stroke)', region: 'cervical',
    methods: ['manual', 'task'], exercises: ['Balance Training', 'Gait Practice'],
    insurance: 'health', status: 'readmit',
    painAreas: [
      { slug: 'deltoids', side: 'right', pattern: 'weakness', intensity: 6 },
      { slug: 'quadriceps', side: 'right', pattern: 'weakness', intensity: 5 },
    ],
  },
  {
    name: '이영희', age: 52, gender: 'female',
    diagnosis: '허리 디스크 (HLD)', region: 'lumbar',
    methods: ['manual', 'exercise'], exercises: ['Pelvic Tilt', 'Bird Dog'],
    insurance: 'health', status: 'new',
    painAreas: [
      { slug: 'lower-back', pattern: 'radiating', intensity: 8 },
      { slug: 'hamstring', side: 'left', pattern: 'tingling', intensity: 4 },
    ],
  },
  {
    name: '박지민', age: 58, gender: 'female',
    diagnosis: '오십견 (Frozen Shoulder)', region: 'shoulder',
    methods: ['manual', 'thermal'], exercises: ['Codman Exercise', 'Wall Walk'],
    insurance: 'health', status: 'new',
    painAreas: [
      { slug: 'deltoids', side: 'left', pattern: 'sharp', intensity: 7 },
    ],
  },
  {
    name: '최성훈', age: 72, gender: 'male',
    diagnosis: '파킨슨병 (Parkinson)', region: 'cervical',
    methods: ['task', 'exercise'], exercises: ['Big Movements', 'Step Training'],
    insurance: 'medical', status: 'hold',
    painAreas: [
      { slug: 'neck', pattern: 'weakness', intensity: 4 },
    ],
  },
  {
    name: '정다은', age: 65, gender: 'female',
    diagnosis: '퇴행성 관절염 (Knee OA)', region: 'knee',
    methods: ['manual', 'electric'], exercises: ['Quadriceps Setting', 'SLR Exercise'],
    insurance: 'health', status: 'readmit',
    painAreas: [
      { slug: 'knees', side: 'right', pattern: 'sharp', intensity: 7 },
      { slug: 'knees', side: 'left', pattern: 'sharp', intensity: 4 },
    ],
  },
  {
    name: '강민호', age: 42, gender: 'male',
    diagnosis: '회전근개 파열 (Rotator Cuff Tear)', region: 'shoulder',
    methods: ['manual', 'exercise'], exercises: ['Internal Rotation', 'External Rotation'],
    insurance: 'industrial', status: 'new',
    painAreas: [
      { slug: 'deltoids', side: 'right', pattern: 'sharp', intensity: 6 },
      { slug: 'trapezius', side: 'right', pattern: 'referred', intensity: 3 },
    ],
  },
  {
    name: '윤서연', age: 71, gender: 'female',
    diagnosis: '척추관 협착증 (Spinal Stenosis)', region: 'lumbar',
    methods: ['manual', 'thermal'], exercises: ['Knee to Chest', 'Cat-Camel'],
    insurance: 'health', status: 'hold',
    painAreas: [
      { slug: 'lower-back', pattern: 'radiating', intensity: 7 },
      { slug: 'calves', side: 'right', pattern: 'tingling', intensity: 5 },
      { slug: 'calves', side: 'left', pattern: 'tingling', intensity: 4 },
    ],
  },
  {
    name: '한지우', age: 38, gender: 'male',
    diagnosis: '테니스 엘보 (Lateral Epicondylitis)', region: 'elbow',
    methods: ['manual', 'ultrasound'], exercises: ['Wrist Extension', 'Eccentric Loading'],
    insurance: 'private', status: 'new',
    painAreas: [
      { slug: 'forearm', side: 'right', pattern: 'sharp', intensity: 6 },
    ],
  },
  {
    name: '오세현', age: 28, gender: 'male',
    diagnosis: '발목 불안정성 (Ankle Instability)', region: 'ankle',
    methods: ['manual', 'exercise'], exercises: ['Balance Board', 'Heel Raise'],
    insurance: 'auto', status: 'new',
    painAreas: [
      { slug: 'ankles', side: 'left', pattern: 'sharp', intensity: 5 },
    ],
  },
  {
    name: '임채원', age: 33, gender: 'female',
    diagnosis: '경추통 (Cervicalgia)', region: 'cervical',
    methods: ['manual', 'thermal'], exercises: ['Chin Tuck', 'Neck Isometric'],
    insurance: 'health', status: 'new',
    painAreas: [
      { slug: 'neck', pattern: 'sharp', intensity: 6 },
      { slug: 'trapezius', side: 'right', pattern: 'referred', intensity: 4 },
    ],
  },
]

// ============================================================
// Seed client
// ============================================================

export default function SeedClient() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const generateData = async () => {
    setLoading(true)
    setError(null)
    setProgress(0)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const total = PATIENT_FIXTURES.length

      for (let i = 0; i < total; i++) {
        const fx = PATIENT_FIXTURES[i]
        setStatus(`환자 ${i + 1}/${total} 생성 중... (${fx.name})`)

        // 생년월일은 age 기반 계산 (2026 기준, 임의 월/일)
        const birthYear = 2026 - fx.age
        const birthDate = `${birthYear}-01-01`

        // 1. Create Patient
        const { data: patient, error: pError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: `${fx.name}_${i + 1}`,
            birth_date: birthDate,
            gender: fx.gender,
            diagnosis: fx.diagnosis,
            treatment_start_date: '2026-01-01',
            insurance: fx.insurance,
            status: fx.status,
          })
          .select()
          .single()

        if (pError) throw pError

        // 2. Create Evaluations — 월간 5건, painMapping 시간 흐름에 따라 intensity 감소
        const evalDates = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01']
        const evals = evalDates.map((date, idx) => {
          const decay = idx * 1.5  // 5개월간 강도 점진 감소 (치료 효과 시각화)
          const painMapping = fx.painAreas.map((pa) => ({
            id: libPartToId(pa.slug, pa.side),
            label: buildLabel(pa.slug, pa.side),
            pattern: pa.pattern,
            intensity: Math.max(1, Math.round(pa.intensity - decay)),
          }))
          // VAS = painMapping intensity의 최대값
          const vas = painMapping.reduce((max, p) => Math.max(max, p.intensity), 0)
          return {
            user_id: user.id,
            patient_id: patient.id,
            date,
            vas,
            rom: [],
            mmt: [],
            body_measurement: [],
            pain_mapping: painMapping,
            custom: [],
          }
        })
        await supabase.from('evaluations').insert(evals)

        // 3. Create Treatments — 주 2~3회, 2026-01-01~05-11
        const treatments: Array<Record<string, unknown>> = []
        const currentDate = new Date('2026-01-01')
        const endDate = new Date('2026-05-11')
        const sessionDays = Math.random() > 0.5 ? [1, 3, 5] : [2, 4]

        while (currentDate <= endDate) {
          if (sessionDays.includes(currentDate.getDay())) {
            treatments.push({
              user_id: user.id,
              patient_id: patient.id,
              date: currentDate.toISOString().split('T')[0],
              body_parts: [{ region: fx.region, side: Math.random() > 0.5 ? 'right' : 'left', muscles: [] }],
              methods: fx.methods,
              method_details: {},  // 시드는 빈 객체. 사용자 직접 입력 케이스는 새 치료 작성에서 검증
              exercise_concept: 'recovery',
              exercises: fx.exercises.map((ex) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ex,
                sets: Math.floor(Math.random() * 3) + 2,
                reps: Math.floor(Math.random() * 5) + 10,
              })),
              comment: `${fx.diagnosis} 치료 ${treatments.length + 1}회차 진행. ${['통증 완화 중', '가동범위 개선 중', '근력 향상 관찰됨', '보행 패턴 안정화'][Math.floor(Math.random() * 4)]}.`,
            })
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Chunk insert to avoid payload limits
        for (let j = 0; j < treatments.length; j += 20) {
          await supabase.from('treatments').insert(treatments.slice(j, j + 20))
        }

        setProgress(Math.round(((i + 1) / total) * 100))
      }

      setStatus('모든 데이터 생성 완료!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">임의 데이터 생성기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <p>이 도구는 다음 데이터를 생성합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>10명의 환자 명단 (진단명·연령·통증 부위 다양)</li>
              <li>환자별 월간 평가 기록 (26년 1월~5월, painMapping 포함)</li>
              <li>환자별 주 2~3회 치료 기록 (26년 1월~5월)</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded border border-red-200 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {status && !error && (
            <div className="bg-green-50 p-3 rounded border border-green-200 flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{status}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Button
            onClick={generateData}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                데이터 생성 중...
              </>
            ) : (
              '환자 10명 데이터 추가하기'
            )}
          </Button>

          <p className="text-center text-xs text-slate-400">
            데이터 생성 후 메인 페이지로 돌아가 확인하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
