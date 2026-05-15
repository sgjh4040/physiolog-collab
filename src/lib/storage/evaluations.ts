import type {
  Evaluation,
  EvaluationInput,
  GraphMetric,
  GraphSettings,
} from '@/features/evaluations/domain/types'
import { STORAGE_KEYS } from './keys'
import { newId, nowISO, readJSON, writeJSON } from './base'

export function getEvaluations(patientId: string): Evaluation[] {
  const list = readJSON<Evaluation[]>(STORAGE_KEYS.evaluations(patientId), [])
  // 최신순 — 같은 날짜는 createdAt DESC 보조 정렬로 더 최근 등록이 위
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function getEvaluation(patientId: string, id: string): Evaluation | undefined {
  return getEvaluations(patientId).find((e) => e.id === id)
}

export function createEvaluation(input: EvaluationInput): Evaluation {
  const evaluation: Evaluation = {
    ...input,
    id: newId(),
    createdAt: nowISO(),
  }
  const list = getEvaluations(input.patientId)
  writeJSON(STORAGE_KEYS.evaluations(input.patientId), [...list, evaluation])
  return evaluation
}

export function updateEvaluation(
  patientId: string,
  id: string,
  updates: Partial<EvaluationInput>,
): Evaluation | undefined {
  const list = getEvaluations(patientId)
  const idx = list.findIndex((e) => e.id === id)
  if (idx === -1) return undefined
  const updated: Evaluation = { ...list[idx], ...updates }
  const next = [...list]
  next[idx] = updated
  writeJSON(STORAGE_KEYS.evaluations(patientId), next)
  return updated
}

export function deleteEvaluation(patientId: string, id: string): boolean {
  const list = getEvaluations(patientId)
  const next = list.filter((e) => e.id !== id)
  if (next.length === list.length) return false
  writeJSON(STORAGE_KEYS.evaluations(patientId), next)
  return true
}

// 그래프 설정 ---------------------------------------------

const DEFAULT_GRAPH_METRICS: GraphMetric[] = [{ kind: 'vas' }]

export function getGraphSettings(patientId: string): GraphSettings {
  return readJSON<GraphSettings>(STORAGE_KEYS.graphSettings(patientId), {
    patientId,
    metrics: DEFAULT_GRAPH_METRICS,
  })
}

export function setGraphSettings(patientId: string, metrics: GraphMetric[]): GraphSettings {
  const settings: GraphSettings = { patientId, metrics }
  writeJSON(STORAGE_KEYS.graphSettings(patientId), settings)
  return settings
}
