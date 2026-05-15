import type { Treatment, TreatmentInput } from '@/features/treatments/domain/types'
import { STORAGE_KEYS } from './keys'
import { newId, nowISO, readJSON, writeJSON } from './base'

export function getTreatments(patientId: string): Treatment[] {
  const list = readJSON<Treatment[]>(STORAGE_KEYS.treatments(patientId), [])
  // 최신순 정렬 — 같은 날짜는 createdAt DESC 보조 정렬로 더 최근 등록이 위
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function getTreatment(patientId: string, id: string): Treatment | undefined {
  return getTreatments(patientId).find((t) => t.id === id)
}

export function createTreatment(input: TreatmentInput): Treatment {
  const treatment: Treatment = {
    ...input,
    id: newId(),
    createdAt: nowISO(),
  }
  const list = getTreatments(input.patientId)
  writeJSON(STORAGE_KEYS.treatments(input.patientId), [...list, treatment])
  return treatment
}

export function updateTreatment(
  patientId: string,
  id: string,
  updates: Partial<TreatmentInput>,
): Treatment | undefined {
  const list = getTreatments(patientId)
  const idx = list.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: Treatment = { ...list[idx], ...updates }
  const next = [...list]
  next[idx] = updated
  writeJSON(STORAGE_KEYS.treatments(patientId), next)
  return updated
}

export function deleteTreatment(patientId: string, id: string): boolean {
  const list = getTreatments(patientId)
  const next = list.filter((t) => t.id !== id)
  if (next.length === list.length) return false
  writeJSON(STORAGE_KEYS.treatments(patientId), next)
  return true
}

export function getLatestTreatment(patientId: string): Treatment | undefined {
  return getTreatments(patientId)[0]
}
