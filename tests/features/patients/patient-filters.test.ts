import { describe, it, expect } from 'vitest'
import {
  filterAndSortPatients,
  countByStatus,
} from '@/features/patients/domain/patient-filters'
import type { Patient } from '@/features/patients/domain/types'
import type { LatestTreatmentInfo } from '@/lib/supabase/treatments'

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p1',
    name: '환자',
    birthDate: '1990-01-01',
    gender: 'male',
    phone: '010-0000-0000',
    address: '',
    referralRoute: '',
    medicalHistory: [],
    diagnosis: '',
    insurance: 'health',
    treatmentStartDate: '2026-01-01',
    therapist: 'pt',
    status: 'new',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeLatest(date: string, createdAt: string): LatestTreatmentInfo {
  return { date, createdAt }
}

describe('filterAndSortPatients', () => {
  const song = makePatient({ id: 's', name: '송미라', status: 'readmit', createdAt: '2026-03-01T00:00:00Z' })
  const yoon = makePatient({ id: 'y', name: '윤서영', status: 'new', createdAt: '2026-04-01T00:00:00Z' })
  const park = makePatient({ id: 'b', name: '박지훈', status: 'new', createdAt: '2026-02-01T00:00:00Z' })
  const closed = makePatient({ id: 'd', name: '강종결', status: 'discharged', createdAt: '2026-01-01T00:00:00Z' })
  const all = [song, yoon, park, closed]

  const baseOpts = {
    query: '',
    activeTab: 'all' as const,
    sortBy: 'created' as const,
    latestByPatient: {} as Record<string, LatestTreatmentInfo>,
  }

  describe('탭 필터', () => {
    it('active — 종결 환자 제외', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, activeTab: 'active' })
      expect(r.map((p) => p.id)).not.toContain('d')
      expect(r).toHaveLength(3)
    })

    it('discharged — 종결만 포함', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, activeTab: 'discharged' })
      expect(r.map((p) => p.id)).toEqual(['d'])
    })

    it('all — 모두 포함', () => {
      const r = filterAndSortPatients(all, baseOpts)
      expect(r).toHaveLength(4)
    })
  })

  describe('검색', () => {
    it('이름 부분 일치 (대소문자·앞뒤공백 무시)', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, query: '  송  ' })
      expect(r.map((p) => p.id)).toEqual(['s'])
    })

    it('일치 없으면 빈 배열', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, query: '없는이름' })
      expect(r).toEqual([])
    })
  })

  describe('정렬', () => {
    it('name — 가나다순', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, sortBy: 'name' })
      expect(r.map((p) => p.name)).toEqual(['강종결', '박지훈', '송미라', '윤서영'])
    })

    it('status — 신규 → 재입원 → 홀드 → 종결', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, sortBy: 'status' })
      const order = r.map((p) => p.status)
      expect(order.indexOf('new')).toBeLessThan(order.indexOf('readmit'))
      expect(order.indexOf('readmit')).toBeLessThan(order.indexOf('discharged'))
    })

    it('created — 등록일 DESC', () => {
      const r = filterAndSortPatients(all, { ...baseOpts, sortBy: 'created' })
      expect(r.map((p) => p.id)).toEqual(['y', 's', 'b', 'd'])
    })

    it('recent — 치료 기록 없는 환자가 맨 위, 그 다음 마지막 치료일 DESC', () => {
      const latestByPatient: Record<string, LatestTreatmentInfo> = {
        s: makeLatest('2026-05-13', '2026-05-13T10:00:00Z'),
        y: makeLatest('2026-05-12', '2026-05-12T10:00:00Z'),
        b: makeLatest('2026-05-12', '2026-05-12T14:00:00Z'), // 같은 날, 더 늦은 시각
      }
      const r = filterAndSortPatients(all, { ...baseOpts, sortBy: 'recent', latestByPatient })
      // 'd'는 치료기록 없으니 맨 위, 이어 's' 가장 최근일,
      // 'b' vs 'y' 같은 날이지만 'b'가 더 늦은 시각 → 'b' 위
      expect(r.map((p) => p.id)).toEqual(['d', 's', 'b', 'y'])
    })

    it('recent — 치료 기록 없는 환자가 여럿이면 그들끼리는 등록일 DESC', () => {
      const noTreatA = makePatient({ id: 'na', name: '신규A', status: 'new', createdAt: '2026-05-10T00:00:00Z' })
      const noTreatB = makePatient({ id: 'nb', name: '신규B', status: 'new', createdAt: '2026-05-15T00:00:00Z' })
      const treated = makePatient({ id: 't', name: '치료환자', status: 'new', createdAt: '2026-01-01T00:00:00Z' })
      const latestByPatient: Record<string, LatestTreatmentInfo> = {
        t: makeLatest('2026-05-01', '2026-05-01T10:00:00Z'),
      }
      const r = filterAndSortPatients([treated, noTreatA, noTreatB], {
        ...baseOpts,
        sortBy: 'recent',
        latestByPatient,
      })
      // 신규B(2026-05-15) → 신규A(2026-05-10) → 치료환자
      expect(r.map((p) => p.id)).toEqual(['nb', 'na', 't'])
    })
  })

  describe('탭 + 검색 + 정렬 결합', () => {
    it('active 탭 + 이름 검색 + name 정렬', () => {
      const r = filterAndSortPatients(all, {
        query: '미',
        activeTab: 'active',
        sortBy: 'name',
        latestByPatient: {},
      })
      expect(r.map((p) => p.name)).toEqual(['송미라'])
    })
  })

  describe('immutability', () => {
    it('입력 patients 배열을 mutate하지 않음', () => {
      const input = [...all]
      const snapshot = [...input]
      filterAndSortPatients(input, { ...baseOpts, sortBy: 'name' })
      expect(input).toEqual(snapshot)
    })
  })
})

describe('countByStatus', () => {
  it('all / active / closed 카운트', () => {
    const ps = [
      makePatient({ id: '1', status: 'new' }),
      makePatient({ id: '2', status: 'readmit' }),
      makePatient({ id: '3', status: 'discharged' }),
      makePatient({ id: '4', status: 'discharged' }),
    ]
    expect(countByStatus(ps)).toEqual({ all: 4, active: 2, closed: 2 })
  })

  it('빈 배열', () => {
    expect(countByStatus([])).toEqual({ all: 0, active: 0, closed: 0 })
  })
})
