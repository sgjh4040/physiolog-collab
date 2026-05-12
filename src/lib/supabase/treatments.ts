'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type { Treatment, TreatmentInput } from '@/features/treatments/domain/types'

// 특정 환자의 치료 기록 목록 조회
export async function getTreatments(patientId: string): Promise<Treatment[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching treatments:', error)
    return []
  }

  return data.map(dbToTreatment)
}

// 특정 치료 기록 상세 조회
export async function getTreatment(id: string): Promise<Treatment | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return dbToTreatment(data)
}

// 치료 기록 등록
export async function createTreatment(input: TreatmentInput): Promise<{ success: boolean; data?: Treatment; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data, error } = await supabase
    .from('treatments')
    .insert({
      user_id: user.id,
      patient_id: input.patientId,
      date: input.date,
      body_parts: input.bodyParts,
      methods: input.methods,
      other_treatment_method: input.otherTreatmentMethod,
      exercise_concept: input.exerciseConcept,
      exercises: input.exercises,
      homework: input.homework,
      comment: input.comment,
      flags: input.flags,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating treatment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${input.patientId}`)
  
  return { success: true, data: dbToTreatment(data) }
}

// 치료 기록 수정
export async function updateTreatment(id: string, patientId: string, updates: Partial<TreatmentInput>): Promise<{ success: boolean; data?: Treatment; error?: string }> {
  const supabase = await createClient()

  // `in` 검사로 caller가 명시한 필드만 DB에 반영 (undefined도 명시적 clear로 인정)
  const dbUpdates: Record<string, unknown> = {}
  if ('date' in updates) dbUpdates.date = updates.date
  if ('bodyParts' in updates) dbUpdates.body_parts = updates.bodyParts ?? null
  if ('methods' in updates) dbUpdates.methods = updates.methods ?? null
  if ('otherTreatmentMethod' in updates) dbUpdates.other_treatment_method = updates.otherTreatmentMethod ?? null
  if ('exerciseConcept' in updates) dbUpdates.exercise_concept = updates.exerciseConcept ?? null
  if ('exercises' in updates) dbUpdates.exercises = updates.exercises ?? null
  if ('homework' in updates) dbUpdates.homework = updates.homework ?? null
  if ('comment' in updates) dbUpdates.comment = updates.comment ?? null
  if ('flags' in updates) dbUpdates.flags = updates.flags ?? null

  const { data, error } = await supabase
    .from('treatments')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating treatment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true, data: dbToTreatment(data) }
}

// 치료 기록 삭제
export async function deleteTreatment(id: string, patientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('treatments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting treatment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true }
}

// 가장 최근 치료 기록 조회 (메인 화면용)
export async function getLatestTreatment(patientId: string): Promise<Treatment | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return dbToTreatment(data)
}

// DB snake_case -> 앱 camelCase 변환
function dbToTreatment(dbRecord: any): Treatment {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    date: dbRecord.date,
    bodyParts: dbRecord.body_parts || [],
    methods: dbRecord.methods || [],
    otherTreatmentMethod: dbRecord.other_treatment_method,
    exerciseConcept: dbRecord.exercise_concept,
    exercises: dbRecord.exercises || [],
    homework: dbRecord.homework,
    comment: dbRecord.comment,
    flags: dbRecord.flags || [],
    createdAt: dbRecord.created_at,
  }
}
