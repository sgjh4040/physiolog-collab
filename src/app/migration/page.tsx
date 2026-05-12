'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { patientStore, treatmentStore, evaluationStore, icfStore } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function MigrationPage() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({
    patients: 0,
    treatments: 0,
    evaluations: 0,
    icfAssessments: 0
  })
  const router = useRouter()

  useEffect(() => {
    // localStorage(patient/treatment store)에서 통계 집계 — 외부 시스템 동기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats({
      patients: patientStore.getAllPatients().length,
      treatments: patientStore.getAllPatients().reduce((acc, p) => acc + treatmentStore.getTreatments(p.id).length, 0),
      evaluations: patientStore.getAllPatients().reduce((acc, p) => acc + evaluationStore.getEvaluations(p.id).length, 0),
      icfAssessments: patientStore.getAllPatients().reduce((acc, p) => acc + icfStore.getIcfAssessments(p.id).length, 0)
    })
  }, [])

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg])
  }

  const handleMigration = async () => {
    setIsMigrating(true)
    addLog('🚀 마이그레이션 시작...')
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      const userId = user.id

      // 1. 환자 데이터 마이그레이션
      const patients = patientStore.getAllPatients()
      addLog(`👤 환자 데이터 ${patients.length}개 업로드 중...`)
      
      for (const p of patients) {
        const { error } = await supabase.from('patients').upsert({
          id: p.id,
          user_id: userId,
          name: p.name,
          birth_date: p.birthDate,
          gender: p.gender,
          phone: p.phone,
          address: p.address,
          referral_route: p.referralRoute,
          medical_history: p.medicalHistory,
          other_medical_history: p.otherMedicalHistory,
          diagnosis: p.diagnosis,
          surgery_history: p.surgeryHistory,
          insurance: p.insurance,
          notes: p.notes,
          treatment_start_date: p.treatmentStartDate,
          therapist: p.therapist,
          status: p.status,
          created_at: p.createdAt,
          updated_at: p.updatedAt
        })
        if (error) throw new Error(`환자 업로드 실패 (${p.name}): ${error.message}`)
      }
      addLog('✅ 환자 데이터 업로드 완료')

      // 2. 치료 기록 마이그레이션
      let treatmentCount = 0
      for (const p of patients) {
        const treatments = treatmentStore.getTreatments(p.id)
        for (const t of treatments) {
          const { error } = await supabase.from('treatments').upsert({
            id: t.id,
            user_id: userId,
            patient_id: t.patientId,
            date: t.date,
            body_parts: t.bodyParts,
            methods: t.methods,
            other_treatment_method: t.otherTreatmentMethod,
            exercise_concept: t.exerciseConcept,
            exercises: t.exercises,
            homework: t.homework,
            comment: t.comment,
            flags: t.flags,
            created_at: t.createdAt
          })
          if (error) throw new Error(`치료 기록 업로드 실패: ${error.message}`)
          treatmentCount++
        }
      }
      addLog(`✅ 치료 기록 ${treatmentCount}개 업로드 완료`)

      // 3. 검사(평가) 기록 마이그레이션
      let evalCount = 0
      for (const p of patients) {
        const evaluations = evaluationStore.getEvaluations(p.id)
        for (const e of evaluations) {
          const { error } = await supabase.from('evaluations').upsert({
            id: e.id,
            user_id: userId,
            patient_id: e.patientId,
            date: e.date,
            vas: e.vas,
            rom: e.rom,
            mmt: e.mmt,
            body_measurement: e.bodyMeasurement,
            pain_mapping: e.painMapping,
            custom: e.custom,
            created_at: e.createdAt
          })
          if (error) throw new Error(`검사 기록 업로드 실패: ${error.message}`)
          evalCount++
        }
      }
      addLog(`✅ 검사 기록 ${evalCount}개 업로드 완료`)

      // 4. ICF 평가 기록 마이그레이션
      let icfCount = 0
      for (const p of patients) {
        const icfs = icfStore.getIcfAssessments(p.id)
        for (const i of icfs) {
          const { error } = await supabase.from('icf_assessments').upsert({
            id: i.id,
            user_id: userId,
            patient_id: i.patientId,
            date: i.date,
            turns: i.turns,
            final_domains: i.finalDomains,
            final_note: i.finalNote,
            created_at: i.createdAt
          })
          if (error) throw new Error(`ICF 평가 기록 업로드 실패: ${error.message}`)
          icfCount++
        }
      }
      addLog(`✅ ICF 평가 기록 ${icfCount}개 업로드 완료`)

      toast.success('모든 데이터가 성공적으로 클라우드에 이전되었습니다!')
      addLog('🎉 마이그레이션 대성공! 이제 안전하게 클라우드에서 데이터를 사용할 수 있습니다.')
      
    } catch (err: unknown) {
      console.error(err)
      toast.error('마이그레이션 중 오류가 발생했습니다.')
      const message = err instanceof Error ? err.message : '알 수 없는 오류'
      addLog(`❌ 오류 발생: ${message}`)
    } finally {
      setIsMigrating(false)
    }
  }

  const totalRecords = stats.patients + stats.treatments + stats.evaluations + stats.icfAssessments

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 border-b border-slate-100 bg-slate-900 text-white">
          <h1 className="text-2xl font-bold mb-2">☁️ 클라우드 이사 센터 (데이터 마이그레이션)</h1>
          <p className="text-slate-300 text-sm">
            컴퓨터에 임시로 저장되어 있던 소중한 기록들을 안전한 클라우드(Supabase) 서버로 옮깁니다.
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.patients}</div>
              <div className="text-xs text-slate-500 mt-1">환자 정보</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.treatments}</div>
              <div className="text-xs text-slate-500 mt-1">치료 기록</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.evaluations}</div>
              <div className="text-xs text-slate-500 mt-1">검사 기록</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.icfAssessments}</div>
              <div className="text-xs text-slate-500 mt-1">ICF 평가</div>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>총 {totalRecords}개의 기록이 발견되었습니다.</strong><br/>
              이사 작업을 시작하면 로컬 데이터를 읽어 클라우드로 안전하게 복사합니다. (원본 데이터는 지워지지 않습니다.)
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleMigration} 
              disabled={isMigrating || totalRecords === 0}
              className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  열심히 이사 중입니다...
                </>
              ) : (
                <>
                  클라우드로 안전하게 이사 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {totalRecords === 0 && (
              <p className="text-center text-sm text-slate-500">
                옮길 데이터가 없습니다. 홈으로 돌아가주세요.
              </p>
            )}
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')} 
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>

          {logs.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                진행 상황
              </h3>
              <div className="bg-slate-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 space-y-2">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
