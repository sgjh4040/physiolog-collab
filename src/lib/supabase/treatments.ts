'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type {
  Treatment,
  TreatmentInput,
  BodyPart,
  TreatmentMethod,
  ExerciseConcept,
  Exercise,
} from '@/features/treatments/domain/types'

type TreatmentRow = {
  id: string
  patient_id: string
  date: string
  body_parts: BodyPart[] | null
  methods: TreatmentMethod[] | null
  other_treatment_method: string | null
  exercise_concept: ExerciseConcept | null
  exercises: Exercise[] | null
  homework: string | null
  comment: string | null
  flags: string[] | null
  created_at: string
}

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

/**
 * 여러 환자의 마지막 치료 날짜를 한 번의 쿼리로 가져옴 (N+1 제거).
 *
 * 기존 `for (const p of patients) await getLatestTreatment(p.id)` 패턴은
 * 환자 N명에 대해 N개의 순차 RSC POST 요청을 발생시켜:
 *   1. 모바일에서 환자 30명 = 3~9초 동안 connection 점유
 *   2. 그 동안 사용자가 카드 탭해도 navigation request가 큐잉되어
 *      "안 눌리는 것처럼" 보이는 UX 버그 발생
 *
 * IN 쿼리 + 클라이언트 그룹화로 1회 round-trip으로 압축. 환자 50명 *
 * 평균 5건이면 ~250행, 모바일에서도 충분히 빠름.
 *
 * 반환: { [patientId]: 'YYYY-MM-DD' } — 치료 기록이 없는 환자는 키 자체 없음.
 */
export async function getLatestTreatmentDateMap(
  patientIds: string[]
): Promise<Record<string, string>> {
  if (patientIds.length === 0) return {}

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatments')
    .select('patient_id, date')
    .in('patient_id', patientIds)
    .order('date', { ascending: false })

  if (error || !data) {
    if (error) console.error('Error fetching latest treatment dates:', error)
    return {}
  }

  // 정렬이 date desc라 각 patient_id의 첫 등장이 가장 최근.
  const result: Record<string, string> = {}
  for (const row of data) {
    if (!(row.patient_id in result)) {
      result[row.patient_id] = row.date
    }
  }
  return result
}

// DB snake_case -> 앱 camelCase 변환
function dbToTreatment(dbRecord: TreatmentRow): Treatment {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    date: dbRecord.date,
    bodyParts: dbRecord.body_parts ?? [],
    methods: dbRecord.methods ?? [],
    otherTreatmentMethod: dbRecord.other_treatment_method ?? undefined,
    exerciseConcept: dbRecord.exercise_concept ?? undefined,
    exercises: dbRecord.exercises ?? [],
    homework: dbRecord.homework ?? undefined,
    comment: dbRecord.comment ?? undefined,
    flags: dbRecord.flags ?? [],
    createdAt: dbRecord.created_at,
  }
}
