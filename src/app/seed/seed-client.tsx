'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const DISEASES = [
  { name: '뇌졸중 (Stroke)', region: 'cervical', methods: ['manual', 'task'], exercises: ['Balance Training', 'Gait Practice'] },
  { name: '허리 디스크 (HLD)', region: 'lumbar', methods: ['manual', 'exercise'], exercises: ['Pelvic Tilt', 'Bird Dog'] },
  { name: '오십견 (Frozen Shoulder)', region: 'shoulder', methods: ['manual', 'thermal'], exercises: ['Codman Exercise', 'Wall Walk'] },
  { name: '파킨슨병 (Parkinson)', region: 'cervical', methods: ['task', 'exercise'], exercises: ['Big Movements', 'Step Training'] },
  { name: '퇴행성 관절염 (Knee OA)', region: 'knee', methods: ['manual', 'electric'], exercises: ['Quadriceps Setting', 'SLR Exercise'] },
  { name: '회전근개 파열 (Rotator Cuff Tear)', region: 'shoulder', methods: ['manual', 'exercise'], exercises: ['Internal Rotation', 'External Rotation'] },
  { name: '척추관 협착증 (Spinal Stenosis)', region: 'lumbar', methods: ['manual', 'thermal'], exercises: ['Knee to Chest', 'Cat-Camel'] },
  { name: '테니스 엘보 (Lateral Epicondylitis)', region: 'elbow', methods: ['manual', 'ultrasound'], exercises: ['Wrist Extension', 'Eccentric Loading'] },
  { name: '발목 불안정성 (Ankle Instability)', region: 'ankle', methods: ['manual', 'exercise'], exercises: ['Balance Board', 'Heel Raise'] },
  { name: '경추통 (Cervicalgia)', region: 'cervical', methods: ['manual', 'thermal'], exercises: ['Chin Tuck', 'Neck Isometric'] },
]

const NAMES = ['김철수', '이영희', '박지민', '최성훈', '정다은', '강민호', '윤서연', '한지우', '오세현', '임채원', '조현우', '송미경', '남궁현', '서예진', '유재석', '강호동', '신동엽', '이광수', '전소민', '양세찬', '김종국', '하동훈', '지석진', '박명수', '정준하', '노홍철', '정형돈', '길성준', '장윤주', '데프콘']

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

      for (let i = 0; i < 30; i++) {
        setStatus(`환자 ${i + 1}/30 생성 중...`)
        const disease = DISEASES[i % DISEASES.length]
        const name = NAMES[i % NAMES.length]
        
        // 1. Create Patient
        const { data: patient, error: pError } = await supabase.from('patients').insert({
          user_id: user.id,
          name: `${name}_${i + 1}`,
          birth_date: `19${Math.floor(Math.random() * 50) + 40}-01-01`,
          gender: Math.random() > 0.5 ? 'male' : 'female',
          diagnosis: disease.name,
          treatment_start_date: '2026-01-01',
          status: 'treating'
        }).select().single()

        if (pError) throw pError

        // 2. Create Evaluations (Monthly from 2026-01-01)
        const evalDates = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01']
        const evals = evalDates.map((date, idx) => ({
          user_id: user.id,
          patient_id: patient.id,
          date,
          vas: Math.max(0, 8 - idx * 1.5), // Decreasing pain
          rom: [],
          mmt: [],
          body_measurement: [],
          pain_mapping: [],
          custom: []
        }))
        await supabase.from('evaluations').insert(evals)

        // 3. Create Treatments (2-3 times a week from 2026-01-01 to 2026-05-11)
        const treatments = []
        let currentDate = new Date('2026-01-01')
        const endDate = new Date('2026-05-11')
        
        // Randomize session days for each patient (e.g., [1,3,5] or [2,4] etc.)
        const sessionDays = Math.random() > 0.5 ? [1, 3, 5] : [2, 4]

        while (currentDate <= endDate) {
          if (sessionDays.includes(currentDate.getDay())) {
            treatments.push({
              user_id: user.id,
              patient_id: patient.id,
              date: currentDate.toISOString().split('T')[0],
              body_parts: [{ region: disease.region, side: Math.random() > 0.5 ? 'right' : 'left', muscles: [] }],
              methods: disease.methods,
              exercise_concept: 'recovery',
              exercises: disease.exercises.map(ex => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ex,
                sets: Math.floor(Math.random() * 3) + 2,
                reps: Math.floor(Math.random() * 5) + 10
              })),
              comment: `${disease.name} 치료 ${treatments.length + 1}회차 진행. ${['통증 완화 중', '가동범위 개선 중', '근력 향상 관찰됨', '보행 패턴 안정화'][Math.floor(Math.random() * 4)]}.`
            })
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // Chunk insert treatments to avoid payload limits
        for (let j = 0; j < treatments.length; j += 20) {
          await supabase.from('treatments').insert(treatments.slice(j, j + 20))
        }

        setProgress(Math.round(((i + 1) / 30) * 100))
      }

      setStatus('모든 데이터 생성 완료!')
    } catch (err: any) {
      setError(err.message)
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
              <li>30명의 환자 명단</li>
              <li>환자별 월간 평가 기록 (26년 1월~5월)</li>
              <li>환자별 주 2회 치료 기록 (26년 1월~5월)</li>
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
              '환자 30명 데이터 추가하기'
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
