import { describe, it, expect } from 'vitest'
import {
  classifyDirection,
  extractVasTrend,
  extractJointTrends,
  extractCustomTrends,
  extractTreatmentStats,
} from '@/features/icf/domain/trend-extraction'
import type { Evaluation } from '@/features/evaluations/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'

function mkEval(overrides: Partial<Evaluation> & { date: string }): Evaluation {
  return {
    id: `e-${overrides.date}`,
    patientId: 'p',
    createdAt: `${overrides.date}T10:00:00Z`,
    ...overrides,
  }
}

function mkTreatment(overrides: Partial<Treatment> & { date: string }): Treatment {
  return {
    id: `t-${overrides.date}`,
    patientId: 'p',
    bodyParts: [],
    methods: [],
    createdAt: `${overrides.date}T10:00:00Z`,
    ...overrides,
  }
}

describe('classifyDirection', () => {
  it('VAS 7→3 단조 감소 → improving (invert=true)', () => {
    expect(classifyDirection([7, 6, 5, 4, 3], { invert: true })).toBe('improving')
  })

  it('ROM 60→150 단조 증가 → improving (invert=false)', () => {
    expect(classifyDirection([60, 75, 90, 120, 150], { invert: false, deltaThreshold: 5 })).toBe('improving')
  })

  it('VAS 3→7 단조 증가 → worsening (invert=true)', () => {
    expect(classifyDirection([3, 4, 5, 6, 7], { invert: true })).toBe('worsening')
  })

  it('변화량이 임계값 미만 → stable', () => {
    expect(classifyDirection([5, 5, 4, 5, 5], { invert: true, deltaThreshold: 1 })).toBe('stable')
  })

  it('단조성 없으면 mixed (변동)', () => {
    expect(classifyDirection([5, 8, 4, 7, 3], { invert: true })).toBe('mixed')
  })

  it('데이터 1건 미만 → stable', () => {
    expect(classifyDirection([5])).toBe('stable')
    expect(classifyDirection([])).toBe('stable')
  })
})

describe('extractVasTrend', () => {
  it('VAS 호전 추세 — 시간순 정렬 + delta + direction', () => {
    const evs = [
      mkEval({ date: '2026-05-13', vas: 3 }),
      mkEval({ date: '2026-05-06', vas: 4 }),
      mkEval({ date: '2026-04-29', vas: 5 }),
      mkEval({ date: '2026-04-22', vas: 6 }),
      mkEval({ date: '2026-04-15', vas: 7 }),
    ]
    const t = extractVasTrend(evs)
    expect(t).not.toBeNull()
    expect(t!.first).toBe(7)
    expect(t!.last).toBe(3)
    expect(t!.delta).toBe(-4)
    expect(t!.direction).toBe('improving')
    expect(t!.series.map((p) => p.vas)).toEqual([7, 6, 5, 4, 3])
  })

  it('VAS 1건 → null (추세 불가)', () => {
    expect(extractVasTrend([mkEval({ date: '2026-05-13', vas: 3 })])).toBeNull()
  })

  it('VAS 누락 평가는 series에서 제외', () => {
    const evs = [
      mkEval({ date: '2026-05-13', vas: 3 }),
      mkEval({ date: '2026-05-06' }), // vas 없음
      mkEval({ date: '2026-04-29', vas: 5 }),
    ]
    const t = extractVasTrend(evs)
    expect(t).not.toBeNull()
    expect(t!.series).toHaveLength(2)
    expect(t!.series.map((p) => p.vas)).toEqual([5, 3])
  })
})

describe('extractJointTrends — ROM 능동', () => {
  it('같은 jointId+side 그룹별 시계열', () => {
    const evs = [
      mkEval({
        date: '2026-05-13',
        rom: [
          { jointId: 'shoulder-abduction', side: 'right', active: 150 },
        ],
      }),
      mkEval({
        date: '2026-04-15',
        rom: [
          { jointId: 'shoulder-abduction', side: 'right', active: 60 },
        ],
      }),
    ]
    const trends = extractJointTrends(evs, 'rom-active', { invert: false, deltaThreshold: 5 })
    expect(trends).toHaveLength(1)
    expect(trends[0].first).toBe(60)
    expect(trends[0].last).toBe(150)
    expect(trends[0].delta).toBe(90)
    expect(trends[0].direction).toBe('improving')
  })

  it('1건 그룹은 결과에서 제외 (추세 불가)', () => {
    const evs = [
      mkEval({
        date: '2026-05-13',
        rom: [{ jointId: 'knee-flexion', side: 'left', active: 100 }],
      }),
    ]
    expect(extractJointTrends(evs, 'rom-active', { invert: false, deltaThreshold: 5 })).toEqual([])
  })
})

describe('extractCustomTrends', () => {
  it('Berg 균형 척도 추이 — 같은 name으로 시간순 묶음', () => {
    const evs = [
      mkEval({
        date: '2026-05-13',
        custom: [{ name: 'Berg 균형 척도', value: '42/56' }],
      }),
      mkEval({
        date: '2026-04-15',
        custom: [{ name: 'Berg 균형 척도', value: '14/56' }],
      }),
    ]
    const trends = extractCustomTrends(evs)
    expect(trends).toHaveLength(1)
    expect(trends[0].name).toBe('Berg 균형 척도')
    expect(trends[0].series.map((p) => p.value)).toEqual(['14/56', '42/56'])
  })

  it('서로 다른 name은 별도 그룹', () => {
    const evs = [
      mkEval({
        date: '2026-05-13',
        custom: [
          { name: 'Berg', value: '42/56' },
          { name: '보행 거리', value: '50m' },
        ],
      }),
      mkEval({
        date: '2026-04-15',
        custom: [
          { name: 'Berg', value: '14/56' },
          { name: '보행 거리', value: '0m' },
        ],
      }),
    ]
    const trends = extractCustomTrends(evs)
    expect(trends).toHaveLength(2)
    expect(trends.map((t) => t.name).sort()).toEqual(['Berg', '보행 거리'])
  })
})

describe('extractTreatmentStats', () => {
  it('부위·방법·운동 컨셉 빈도 카운트, 빈도순 정렬', () => {
    const ts = [
      mkTreatment({
        date: '2026-05-13',
        bodyParts: [{ region: 'lumbar', side: 'left' }],
        methods: ['manual', 'exercise'],
        exerciseConcept: 'strength',
      }),
      mkTreatment({
        date: '2026-05-06',
        bodyParts: [{ region: 'lumbar', side: 'left' }],
        methods: ['manual'],
      }),
      mkTreatment({
        date: '2026-04-29',
        bodyParts: [{ region: 'knee', side: 'right' }],
        methods: ['exercise'],
        exerciseConcept: 'strength',
      }),
    ]
    const stats = extractTreatmentStats(ts)
    expect(stats.totalSessions).toBe(3)
    // 부위 빈도순: 좌측 lumbar 2회, 우측 knee 1회
    expect(stats.bodyPartCounts[0]).toEqual({ region: 'lumbar', side: 'left', count: 2 })
    // 방법 빈도순: manual 2회, exercise 2회 (동률)
    expect(stats.methodCounts.find((m) => m.method === 'manual')?.count).toBe(2)
    expect(stats.methodCounts.find((m) => m.method === 'exercise')?.count).toBe(2)
    // 운동 컨셉
    expect(stats.exerciseConceptCounts[0]).toEqual({ concept: 'strength', count: 2 })
  })

  it('빈 입력', () => {
    expect(extractTreatmentStats([])).toEqual({
      totalSessions: 0,
      bodyPartCounts: [],
      methodCounts: [],
      exerciseConceptCounts: [],
    })
  })
})
