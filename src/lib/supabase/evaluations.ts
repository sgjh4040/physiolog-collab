'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type { Evaluation, EvaluationInput } from '@/features/evaluations/domain/types'

// 특정 환자의 검사 기록 목록 조회
export async function getEvaluations(patientId: string): Promise<Evaluation[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching evaluations:', error)
    return []
  }

  return data.map(dbToEvaluation)
}

// 특정 검사 기록 상세 조회
export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return dbToEvaluation(data)
}

// 검사 기록 등록
export async function createEvaluation(input: EvaluationInput): Promise<{ success: boolean; data?: Evaluation; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      user_id: user.id,
      patient_id: input.patientId,
      date: input.date,
      vas: input.vas,
      rom: input.rom,
      mmt: input.mmt,
      body_measurement: input.bodyMeasurement,
      pain_mapping: input.painMapping,
      custom: input.custom,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating evaluation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${input.patientId}`)
  
  return { success: true, data: dbToEvaluation(data) }
}

// 검사 기록 수정
export async function updateEvaluation(id: string, patientId: string, updates: Partial<EvaluationInput>): Promise<{ success: boolean; data?: Evaluation; error?: string }> {
  const supabase = await createClient()

  // `in` 검사로 caller가 명시한 필드만 DB에 반영
  // undefined를 보내면 명시적 clear로 해석해 null로 설정 → 토글 OFF 시 옛 값이 남는 버그 방지
  const dbUpdates: Record<string, unknown> = {}
  if ('date' in updates) dbUpdates.date = updates.date
  if ('vas' in updates) dbUpdates.vas = updates.vas ?? null
  if ('rom' in updates) dbUpdates.rom = updates.rom ?? null
  if ('mmt' in updates) dbUpdates.mmt = updates.mmt ?? null
  if ('bodyMeasurement' in updates) dbUpdates.body_measurement = updates.bodyMeasurement ?? null
  if ('painMapping' in updates) dbUpdates.pain_mapping = updates.painMapping ?? null
  if ('custom' in updates) dbUpdates.custom = updates.custom ?? null

  const { data, error } = await supabase
    .from('evaluations')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating evaluation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true, data: dbToEvaluation(data) }
}

// 검사 기록 삭제
export async function deleteEvaluation(id: string, patientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting evaluation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true }
}

// DB snake_case -> 앱 camelCase 변환
function dbToEvaluation(dbRecord: any): Evaluation {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    date: dbRecord.date,
    vas: dbRecord.vas,
    rom: dbRecord.rom,
    mmt: dbRecord.mmt,
    bodyMeasurement: dbRecord.body_measurement,
    painMapping: dbRecord.pain_mapping,
    custom: dbRecord.custom,
    createdAt: dbRecord.created_at,
  }
}
