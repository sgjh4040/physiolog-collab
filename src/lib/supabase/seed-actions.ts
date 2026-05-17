'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type { PatientInput } from '@/features/patients/domain/types'
import type { TreatmentInput } from '@/features/treatments/domain/types'
import type { EvaluationInput } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'
import { SHOWCASE_BUNDLES } from '@/data/seeds/showcase'
import { RICH_SEED_BUNDLES } from '@/data/seeds/rich/rich-patients'

/**
 * 시연용 시드 액션 — 현재 사용자 데이터 청소 + 풍부한 fixture 생성.
 *
 * - 현재 로그인 사용자의 환자만 영향 (RLS로 다른 사용자 데이터는 보호)
 * - patients 삭제 시 FK ON DELETE CASCADE로 treatments/evaluations/icf_assessments 자동 삭제
 *   (docs/migrations/schema.sql의 외래키 정의 그대로)
 */

type ActionResult = { success: boolean; error?: string; count?: number }

/**
 * 시드 fixture 공통 타입 — 쇼케이스·풀 시드 양쪽 모두 같은 구조.
 * ICF만 optional (모든 환자가 ICF 분석 필요한 건 아님).
 */
type SeedBundle = {
  patient: Omit<PatientInput, 'therapist'>
  treatments: Omit<TreatmentInput, 'patientId'>[]
  evaluations: Omit<EvaluationInput, 'patientId'>[]
  icfAssessment?: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'>
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * 환자 1명 + 치료/평가/ICF 자식 데이터 일괄 INSERT.
 * createShowcasePatients와 createRichSeedPatients 양쪽에서 재사용.
 */
async function insertSeedBundle(
  supabase: SupabaseClient,
  bundle: SeedBundle,
  userId: string,
  therapistName: string,
): Promise<{ ok: true; patientId: string } | { ok: false; error: string }> {
  // 1. 환자 INSERT
  const { data: patientRow, error: patientErr } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
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
      onset_date: bundle.patient.onsetDate || null,
      insurance: bundle.patient.insurance,
      notes: bundle.patient.notes,
      treatment_start_date: bundle.patient.treatmentStartDate,
      therapist: therapistName,
      status: bundle.patient.status,
    })
    .select('id')
    .single()

  if (patientErr || !patientRow) {
    console.error('Seed patient insert error:', patientErr)
    return {
      ok: false,
      error: `환자 생성 실패 (${bundle.patient.name}): ${patientErr?.message ?? '알 수 없는 오류'}`,
    }
  }

  const patientId: string = patientRow.id

  // 2. 치료 기록 일괄 INSERT
  if (bundle.treatments.length > 0) {
    const treatmentRows = bundle.treatments.map((t) => ({
      user_id: userId,
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
      console.error('Seed treatments insert error:', trxErr)
      return { ok: false, error: `치료 기록 생성 실패 (${bundle.patient.name}): ${trxErr.message}` }
    }
  }

  // 3. 평가 기록 일괄 INSERT
  if (bundle.evaluations.length > 0) {
    const evaluationRows = bundle.evaluations.map((e) => ({
      user_id: userId,
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
      console.error('Seed evaluations insert error:', evalErr)
      return { ok: false, error: `평가 기록 생성 실패 (${bundle.patient.name}): ${evalErr.message}` }
    }
  }

  // 4. ICF 분석 (optional)
  if (bundle.icfAssessment) {
    const { error: icfErr } = await supabase.from('icf_assessments').insert({
      user_id: userId,
      patient_id: patientId,
      date: bundle.icfAssessment.date,
      turns: bundle.icfAssessment.turns,
      final_domains: bundle.icfAssessment.finalDomains,
      final_note: bundle.icfAssessment.finalNote,
    })
    if (icfErr) {
      console.error('Seed ICF insert error:', icfErr)
      return { ok: false, error: `ICF 평가 생성 실패 (${bundle.patient.name}): ${icfErr.message}` }
    }
  }

  return { ok: true, patientId }
}

/**
 * 현재 로그인 사용자 + therapist 이름 조회 — 모든 시드 액션의 공통 prelude.
 */
async function getCurrentUserAndTherapist(
  supabase: SupabaseClient,
): Promise<{ ok: true; userId: string; therapistName: string } | { ok: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single()
  const therapistName =
    profile?.name?.trim() || profile?.email?.split('@')[0] || '담당자'

  return { ok: true, userId: user.id, therapistName }
}

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
 * 쇼케이스 환자 2명 생성 (회전근개·뇌졸중) — 시연 메인 카드용 풀 데이터.
 * 각 환자에 치료 10건·평가 5건·ICF 1건.
 */
export async function createShowcasePatients(): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await getCurrentUserAndTherapist(supabase)
  if (!auth.ok) return { success: false, error: auth.error }

  let totalCreated = 0
  for (const bundle of SHOWCASE_BUNDLES) {
    const result = await insertSeedBundle(supabase, bundle, auth.userId, auth.therapistName)
    if (!result.ok) return { success: false, error: result.error }
    totalCreated++
  }

  revalidatePath('/')
  revalidatePath('/patients')
  return { success: true, count: totalCreated }
}

/**
 * 풀 시드 환자 10명 생성 — 다양한 진단군의 임상 fixture.
 * 척추관 협착증·디스크·CTS·발목 염좌·경추 디스크·무릎 OA·오십견·좌골신경통·어깨충돌·만성 요통.
 * 각 환자에 치료 3~5건·평가 2~3건, 4명은 ICF 분석 1건 포함.
 */
export async function createRichSeedPatients(): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await getCurrentUserAndTherapist(supabase)
  if (!auth.ok) return { success: false, error: auth.error }

  let totalCreated = 0
  for (const bundle of RICH_SEED_BUNDLES) {
    const result = await insertSeedBundle(supabase, bundle, auth.userId, auth.therapistName)
    if (!result.ok) return { success: false, error: result.error }
    totalCreated++
  }

  revalidatePath('/')
  revalidatePath('/patients')
  return { success: true, count: totalCreated }
}
