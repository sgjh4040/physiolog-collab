'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { SHOWCASE_BUNDLES } from '@/data/showcase-patients'

/**
 * 시연용 시드 액션 — 현재 사용자 데이터 청소 + 풍부한 쇼케이스 환자 2명 생성.
 *
 * - 현재 로그인 사용자의 환자만 영향 (RLS로 다른 사용자 데이터는 보호)
 * - patients 삭제 시 FK ON DELETE CASCADE로 treatments/evaluations/icf_assessments 자동 삭제
 *   (full-schema-idempotent.sql의 외래키 정의 그대로)
 */

type ActionResult = { success: boolean; error?: string; count?: number }

/**
 * 현재 사용자의 모든 환자 데이터를 삭제.
 * 시연·인계 직전에 깔끔한 baseline을 만들기 위함.
 */
export async function cleanAllPatientData(): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  // 먼저 삭제될 환자 수 카운트 (UI 피드백용)
  const { count: beforeCount } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 환자 일괄 삭제 — FK cascade로 자식 데이터 자동 정리
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('cleanAllPatientData error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/patients')

  return { success: true, count: beforeCount ?? 0 }
}

/**
 * 쇼케이스 환자 2명 생성 (회전근개·뇌졸중) + 각 환자의 치료 10건·평가 5건·ICF 1건.
 * 환자 INSERT → patientId 받음 → 그 ID로 자식 데이터 INSERT.
 */
export async function createShowcasePatients(): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  // 담당 치료사 이름은 현재 사용자의 profile.name (없으면 email local-part)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single()
  const therapistName =
    profile?.name?.trim() || profile?.email?.split('@')[0] || '담당자'

  let totalCreated = 0

  for (const bundle of SHOWCASE_BUNDLES) {
    // 1. 환자 INSERT
    const { data: patientRow, error: patientErr } = await supabase
      .from('patients')
      .insert({
        user_id: user.id,
        name: bundle.patient.name,
        birth_date: bundle.patient.birthDate,
        gender: bundle.patient.gender,
        phone: bundle.patient.phone,
        address: bundle.patient.address,
        referral_route: bundle.patient.referralRoute,
        medical_history: bundle.patient.medicalHistory,
        other_medical_history: bundle.patient.otherMedicalHistory,
        diagnosis: bundle.patient.diagnosis,
        surgery_history: bundle.patient.surgeryHistory,
        insurance: bundle.patient.insurance,
        notes: bundle.patient.notes,
        treatment_start_date: bundle.patient.treatmentStartDate,
        therapist: therapistName,
        status: bundle.patient.status,
      })
      .select('id')
      .single()

    if (patientErr || !patientRow) {
      console.error('Showcase patient insert error:', patientErr)
      return {
        success: false,
        error: `환자 생성 실패 (${bundle.patient.name}): ${patientErr?.message ?? '알 수 없는 오류'}`,
      }
    }

    const patientId: string = patientRow.id

    // 2. 치료 기록 일괄 INSERT
    const treatmentRows = bundle.treatments.map((t) => ({
      user_id: user.id,
      patient_id: patientId,
      date: t.date,
      body_parts: t.bodyParts,
      methods: t.methods,
      other_treatment_method: t.otherTreatmentMethod,
      method_details: t.methodDetails ?? {},
      exercise_concept: t.exerciseConcept,
      exercises: t.exercises,
      homework: t.homework,
      comment: t.comment,
      flags: t.flags,
    }))
    const { error: trxErr } = await supabase.from('treatments').insert(treatmentRows)
    if (trxErr) {
      console.error('Showcase treatments insert error:', trxErr)
      return { success: false, error: `치료 기록 생성 실패: ${trxErr.message}` }
    }

    // 3. 평가 기록 일괄 INSERT
    const evaluationRows = bundle.evaluations.map((e) => ({
      user_id: user.id,
      patient_id: patientId,
      date: e.date,
      vas: e.vas,
      rom: e.rom,
      mmt: e.mmt,
      body_measurement: e.bodyMeasurement,
      pain_mapping: e.painMapping,
      custom: e.custom,
    }))
    const { error: evalErr } = await supabase.from('evaluations').insert(evaluationRows)
    if (evalErr) {
      console.error('Showcase evaluations insert error:', evalErr)
      return { success: false, error: `평가 기록 생성 실패: ${evalErr.message}` }
    }

    // 4. ICF 분석 1건 INSERT
    const { error: icfErr } = await supabase.from('icf_assessments').insert({
      user_id: user.id,
      patient_id: patientId,
      date: bundle.icfAssessment.date,
      turns: bundle.icfAssessment.turns,
      final_domains: bundle.icfAssessment.finalDomains,
      final_note: bundle.icfAssessment.finalNote,
    })
    if (icfErr) {
      console.error('Showcase ICF insert error:', icfErr)
      return { success: false, error: `ICF 평가 생성 실패: ${icfErr.message}` }
    }

    totalCreated++
  }

  revalidatePath('/')
  revalidatePath('/patients')

  return { success: true, count: totalCreated }
}
