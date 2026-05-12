'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type { IcfAssessment, IcfTurn, IcfDomains } from '@/features/icf/domain/types'

type IcfRow = {
  id: string
  patient_id: string
  date: string
  turns: IcfTurn[] | null
  final_domains: IcfDomains | null
  final_note: string | null
  created_at: string
}

// 특정 환자의 ICF 평가 기록 목록 조회
export async function getIcfAssessments(patientId: string): Promise<IcfAssessment[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('icf_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching ICF assessments:', error)
    return []
  }

  return data.map(dbToIcf)
}

// ICF 평가 기록 등록
export async function createIcfAssessment(
  patientId: string,
  input: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'>
): Promise<{ success: boolean; data?: IcfAssessment; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data, error } = await supabase
    .from('icf_assessments')
    .insert({
      user_id: user.id,
      patient_id: patientId,
      date: input.date,
      turns: input.turns,
      final_domains: input.finalDomains,
      final_note: input.finalNote,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ICF assessment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true, data: dbToIcf(data) }
}

// ICF 평가 기록 삭제
export async function deleteIcfAssessment(id: string, patientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('icf_assessments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ICF assessment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/patients/${patientId}`)
  
  return { success: true }
}

// DB snake_case -> 앱 camelCase 변환
function dbToIcf(dbRecord: IcfRow): IcfAssessment {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    date: dbRecord.date,
    turns: dbRecord.turns ?? [],
    finalDomains: dbRecord.final_domains ?? { body: [], activity: [], participation: [], environment: [], personal: [] },
    finalNote: dbRecord.final_note ?? '',
    createdAt: dbRecord.created_at,
  }
}
