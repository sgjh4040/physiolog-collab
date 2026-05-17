import type { Patient } from './types'
import type { LatestTreatmentInfo } from '@/lib/supabase/treatments'

export type SortMode = 'name' | 'status' | 'recent' | 'created'
export type ActiveTab = 'active' | 'discharged' | 'all'

const STATUS_ORDER: Record<Patient['status'], number> = {
  new: 0,
  readmit: 1,
  hold: 2,
  discharged: 3,
}

/**
 * 환자 리스트에 검색·탭·정렬을 일관되게 적용한다.
 *
 * - 탭: 'active' (종결 제외) / 'discharged' (종결만) / 'all'
 * - 검색: 이름 일부 일치 (대소문자·앞뒤공백 무시)
 * - 정렬:
 *   - name        — 가나다순 (ko collation)
 *   - status      — 신규 → 재입원 → 홀드 → 종결
 *   - recent      — 마지막 치료일 DESC, 동일 날짜는 created_at(ts) DESC,
 *                   치료 기록 없는 환자(신규 등록 등)는 맨 위 — 그들끼리는 환자 등록일 DESC
 *   - created     — 환자 등록일 DESC
 *
 * 순수 함수 — Vitest 단위 테스트 가능. (입력 mutation 없음, lookup map 참조만.)
 */
export function filterAndSortPatients(
  patients: Patient[],
  options: {
    query: string
    activeTab: ActiveTab
    sortBy: SortMode
    latestByPatient: Record<string, LatestTreatmentInfo | undefined>
  },
): Patient[] {
  const { query, activeTab, sortBy, latestByPatient } = options
  let result = patients

  if (activeTab === 'active') {
    result = result.filter((p) => p.status !== 'discharged')
  } else if (activeTab === 'discharged') {
    result = result.filter((p) => p.status === 'discharged')
  }

  const q = query.trim().toLowerCase()
  if (q) {
    result = result.filter((p) => p.name.toLowerCase().includes(q))
  }

  return [...result].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko')
    }
    if (sortBy === 'status') {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    }
    if (sortBy === 'recent') {
      const infoA = latestByPatient[a.id]
      const infoB = latestByPatient[b.id]
      // 치료 기록 없는 환자는 맨 위 — 신규 등록 직후 바로 보이도록.
      // 둘 다 기록 없으면 환자 등록일 DESC.
      if (!infoA && !infoB) return b.createdAt.localeCompare(a.createdAt)
      if (!infoA) return -1
      if (!infoB) return 1
      const dateDiff = infoB.date.localeCompare(infoA.date)
      if (dateDiff !== 0) return dateDiff
      return infoB.createdAt.localeCompare(infoA.createdAt)
    }
    if (sortBy === 'created') {
      return b.createdAt.localeCompare(a.createdAt)
    }
    return 0
  })
}

export function countByStatus(patients: Patient[]): {
  all: number
  active: number
  closed: number
} {
  return {
    all: patients.length,
    active: patients.filter((p) => p.status !== 'discharged').length,
    closed: patients.filter((p) => p.status === 'discharged').length,
  }
}
