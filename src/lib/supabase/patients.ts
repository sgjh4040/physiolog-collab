'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type {
  Patient,
  PatientInput,
  Gender,
  InsuranceType,
  PatientStatus,
} from '@/features/patients/domain/types'

type PatientRow = {
  id: string
  name: string
  birth_date: string | null
  gender: Gender | null
  phone: string | null
  address: string | null
  referral_route: string | null
  medical_history: string[] | null
  other_medical_history: string | null
  diagnosis: string | null
  surgery_history: string | null
  onset_date: string | null
  insurance: InsuranceType | null
  notes: string | null
  treatment_start_date: string | null
  therapist: string | null
  status: PatientStatus
  created_at: string
  updated_at: string
}

// 환자 목록 조회 (자신이 등록한 환자만)
export async function getPatients(): Promise<Patient[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
    return []
  }

  // snake_case -> camelCase 변환
  return data.map(dbToPatient)
}

// 특정 환자 상세 조회
export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return dbToPatient(data)
}

// 환자 등록
export async function createPatient(input: PatientInput): Promise<{ success: boolean; data?: Patient; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      user_id: user.id,
      name: input.name,
      birth_date: input.birthDate,
      gender: input.gender,
      phone: input.phone,
      address: input.address,
      referral_route: input.referralRoute,
      medical_history: input.medicalHistory,
      other_medical_history: input.otherMedicalHistory,
      diagnosis: input.diagnosis,
      surgery_history: input.surgeryHistory,
      onset_date: input.onsetDate || null,
      insurance: input.insurance,
      notes: input.notes,
      treatment_start_date: input.treatmentStartDate,
      therapist: input.therapist,
      status: input.status,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating patient:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/patients')
  
  return { success: true, data: dbToPatient(data) }
}

// 환자 정보 수정
export async function updatePatient(id: string, updates: Partial<PatientInput>): Promise<{ success: boolean; data?: Patient; error?: string }> {
  const supabase = await createClient()

  // camelCase 업데이트 데이터를 snake_case로 변환
  // `in` 검사로 caller가 명시한 필드만 DB에 반영 (undefined도 명시적 clear로 인정)
  const dbUpdates: Record<string, unknown> = {}
  if ('name' in updates) dbUpdates.name = updates.name ?? null
  if ('birthDate' in updates) dbUpdates.birth_date = updates.birthDate ?? null
  if ('gender' in updates) dbUpdates.gender = updates.gender ?? null
  if ('phone' in updates) dbUpdates.phone = updates.phone ?? null
  if ('address' in updates) dbUpdates.address = updates.address ?? null
  if ('referralRoute' in updates) dbUpdates.referral_route = updates.referralRoute ?? null
  if ('medicalHistory' in updates) dbUpdates.medical_history = updates.medicalHistory ?? null
  if ('otherMedicalHistory' in updates) dbUpdates.other_medical_history = updates.otherMedicalHistory ?? null
  if ('diagnosis' in updates) dbUpdates.diagnosis = updates.diagnosis ?? null
  if ('surgeryHistory' in updates) dbUpdates.surgery_history = updates.surgeryHistory ?? null
  if ('onsetDate' in updates) dbUpdates.onset_date = updates.onsetDate || null
  if ('insurance' in updates) dbUpdates.insurance = updates.insurance ?? null
  if ('notes' in updates) dbUpdates.notes = updates.notes ?? null
  if ('treatmentStartDate' in updates) dbUpdates.treatment_start_date = updates.treatmentStartDate ?? null
  if ('therapist' in updates) dbUpdates.therapist = updates.therapist ?? null
  if ('status' in updates) dbUpdates.status = updates.status ?? null

  const { data, error } = await supabase
    .from('patients')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating patient:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${id}`)
  
  return { success: true, data: dbToPatient(data) }
}

// 환자 삭제
export async function deletePatient(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting patient:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/patients')
  
  return { success: true }
}

// 헬퍼 함수: DB snake_case 포맷을 앱의 camelCase Patient 타입으로 변환
function dbToPatient(dbRecord: PatientRow): Patient {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    birthDate: dbRecord.birth_date ?? '',
    gender: (dbRecord.gender ?? 'male') as Gender,
    phone: dbRecord.phone ?? '',
    address: dbRecord.address ?? '',
    referralRoute: dbRecord.referral_route ?? '',
    medicalHistory: dbRecord.medical_history ?? [],
    otherMedicalHistory: dbRecord.other_medical_history ?? undefined,
    diagnosis: dbRecord.diagnosis ?? '',
    surgeryHistory: dbRecord.surgery_history ?? undefined,
    onsetDate: dbRecord.onset_date ?? undefined,
    insurance: (dbRecord.insurance ?? 'none') as InsuranceType,
    notes: dbRecord.notes ?? undefined,
    treatmentStartDate: dbRecord.treatment_start_date ?? '',
    therapist: dbRecord.therapist ?? '',
    status: dbRecord.status,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  }
}
