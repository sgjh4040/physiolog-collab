import type { IcfAssessment } from '@/features/icf/domain/types'
import { STORAGE_KEYS } from './keys'
import { newId, nowISO, readJSON, writeJSON } from './base'

export function getIcfAssessments(patientId: string): IcfAssessment[] {
  const list = readJSON<IcfAssessment[]>(STORAGE_KEYS.icf(patientId), [])
  // 최신순 — 같은 날짜는 createdAt DESC 보조 정렬로 더 최근 등록이 위
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function createIcfAssessment(
  patientId: string,
  data: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'>,
): IcfAssessment {
  const assessment: IcfAssessment = {
    ...data,
    id: newId(),
    patientId,
    createdAt: nowISO(),
  }
  const list = readJSON<IcfAssessment[]>(STORAGE_KEYS.icf(patientId), [])
  writeJSON(STORAGE_KEYS.icf(patientId), [...list, assessment])
  return assessment
}

export function deleteIcfAssessment(patientId: string, id: string): boolean {
  const list = readJSON<IcfAssessment[]>(STORAGE_KEYS.icf(patientId), [])
  const next = list.filter((a) => a.id !== id)
  if (next.length === list.length) return false
  writeJSON(STORAGE_KEYS.icf(patientId), next)
  return true
}
