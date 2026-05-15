import type { Evaluation } from '@/features/evaluations/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'

/**
 * AI 컨텍스트용 시계열·통계 추출 헬퍼.
 *
 * 평가·치료 N건을 받아 시간순으로 직렬화하고, VAS/ROM/MMT/Custom의 추세
 * (호전·정체·악화)와 변화량을 미리 라벨링한다. Server Component / Server
 * Action 모두에서 호출 가능한 순수 함수 — Vitest로 단위 테스트 가능.
 *
 * 가정: 입력 평가/치료 배열은 호출 측에서 `date DESC` 정렬이라 [0]이 최근.
 */

export type TrendDirection = 'improving' | 'stable' | 'worsening' | 'mixed'

export interface VasTrend {
  series: { date: string; vas: number }[]
  first: number
  last: number
  delta: number
  direction: TrendDirection
}

export interface JointTrend {
  jointId: string
  side?: string
  series: { date: string; value: number }[]
  first: number
  last: number
  delta: number
  direction: TrendDirection
}

export interface CustomTrend {
  name: string
  series: { date: string; value: string }[]
}

export interface TreatmentStats {
  totalSessions: number
  bodyPartCounts: { region: string; side?: string; count: number }[]
  methodCounts: { method: string; count: number }[]
  exerciseConceptCounts: { concept: string; count: number }[]
}

/**
 * 단조성 + delta 임계값으로 방향 분류.
 * - VAS·통증류: 작아질수록 호전. (invert=true)
 * - ROM·MMT·보행거리·Berg: 커질수록 호전. (invert=false)
 *
 * 임계값(deltaThreshold)은 1차원의 한 단위(예: VAS 1포인트, ROM 5도).
 * delta 절대값이 임계값보다 작으면 'stable'.
 * 시계열이 단조 증가/감소가 아니면 'mixed'.
 */
export function classifyDirection(
  values: number[],
  options: { invert?: boolean; deltaThreshold?: number } = {},
): TrendDirection {
  if (values.length < 2) return 'stable'
  const { invert = false, deltaThreshold = 0.5 } = options
  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first

  if (Math.abs(delta) < deltaThreshold) return 'stable'

  let monotonicUp = true
  let monotonicDown = true
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) monotonicUp = false
    if (values[i] > values[i - 1]) monotonicDown = false
  }

  if (!monotonicUp && !monotonicDown) return 'mixed'

  const positiveDelta = delta > 0
  // invert=true: 값이 작아지는 게 호전 (VAS)
  // invert=false: 값이 커지는 게 호전 (ROM, MMT)
  if (invert) return positiveDelta ? 'worsening' : 'improving'
  return positiveDelta ? 'improving' : 'worsening'
}

/**
 * 최근 평가들에서 VAS 시계열을 시간순(과거→현재)으로 추출.
 * VAS가 없는 평가는 skip. 데이터 2건 미만이면 null.
 */
export function extractVasTrend(evaluations: Evaluation[]): VasTrend | null {
  const withVas = evaluations
    .filter((e) => typeof e.vas === 'number')
    .map((e) => ({ date: e.date, vas: e.vas as number }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (withVas.length < 2) return null

  const values = withVas.map((p) => p.vas)
  const first = values[0]
  const last = values[values.length - 1]
  return {
    series: withVas,
    first,
    last,
    delta: last - first,
    direction: classifyDirection(values, { invert: true, deltaThreshold: 1 }),
  }
}

/**
 * 모든 평가에 나타난 (jointId + side) 조합에 대해 시계열을 추출.
 * ROM/MMT 둘 다 같은 시그니처라 selector로 일반화.
 */
export function extractJointTrends(
  evaluations: Evaluation[],
  selector: 'rom-active' | 'rom-passive' | 'mmt',
  options: { invert?: boolean; deltaThreshold?: number },
): JointTrend[] {
  type Pt = { date: string; jointId: string; side?: string; value: number }
  const points: Pt[] = []

  for (const e of evaluations) {
    if (selector === 'mmt') {
      for (const m of e.mmt ?? []) {
        if (typeof m.grade === 'number') {
          points.push({ date: e.date, jointId: m.jointId, side: m.side, value: m.grade })
        }
      }
    } else {
      for (const r of e.rom ?? []) {
        const v = selector === 'rom-active' ? r.active : r.passive
        if (typeof v === 'number') {
          points.push({ date: e.date, jointId: r.jointId, side: r.side, value: v })
        }
      }
    }
  }

  // 같은 (jointId+side) 그룹별 시계열로 묶기
  const groups = new Map<string, Pt[]>()
  for (const p of points) {
    const key = `${p.jointId}|${p.side ?? ''}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const result: JointTrend[] = []
  for (const [, arr] of groups) {
    if (arr.length < 2) continue
    arr.sort((a, b) => a.date.localeCompare(b.date))
    const values = arr.map((p) => p.value)
    const first = values[0]
    const last = values[values.length - 1]
    result.push({
      jointId: arr[0].jointId,
      side: arr[0].side,
      series: arr.map((p) => ({ date: p.date, value: p.value })),
      first,
      last,
      delta: last - first,
      direction: classifyDirection(values, options),
    })
  }
  return result
}

/**
 * Custom 평가 시계열 — 같은 name으로 묶음. 값은 string이라 추세 분류 안 함.
 * 보행 거리·Berg·Modified Ashworth 등 자유 평가 항목 추이를 그대로 박제.
 */
export function extractCustomTrends(evaluations: Evaluation[]): CustomTrend[] {
  const groups = new Map<string, { date: string; value: string }[]>()
  for (const e of evaluations) {
    for (const c of e.custom ?? []) {
      const arr = groups.get(c.name) ?? []
      arr.push({ date: e.date, value: c.value })
      groups.set(c.name, arr)
    }
  }
  const result: CustomTrend[] = []
  for (const [name, arr] of groups) {
    if (arr.length < 2) continue
    arr.sort((a, b) => a.date.localeCompare(b.date))
    result.push({ name, series: arr })
  }
  return result
}

/**
 * 최근 N건 치료의 부위·방법·운동 컨셉 빈도 카운트.
 * "최근 4주 도수치료 8회, 운동치료 6회"같은 패턴 인식용.
 */
export function extractTreatmentStats(treatments: Treatment[]): TreatmentStats {
  const bodyKey = (region: string, side?: string) => `${region}|${side ?? ''}`
  const bodyMap = new Map<string, number>()
  const methodMap = new Map<string, number>()
  const conceptMap = new Map<string, number>()

  for (const t of treatments) {
    for (const bp of t.bodyParts ?? []) {
      const k = bodyKey(bp.region, bp.side)
      bodyMap.set(k, (bodyMap.get(k) ?? 0) + 1)
    }
    for (const m of t.methods ?? []) {
      methodMap.set(m, (methodMap.get(m) ?? 0) + 1)
    }
    if (t.exerciseConcept) {
      conceptMap.set(t.exerciseConcept, (conceptMap.get(t.exerciseConcept) ?? 0) + 1)
    }
  }

  const toSortedArray = <T>(m: Map<string, number>, decode: (key: string) => T) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ ...(decode(key) as object), count }) as T & { count: number })

  return {
    totalSessions: treatments.length,
    bodyPartCounts: toSortedArray(bodyMap, (k) => {
      const [region, side] = k.split('|')
      return { region, side: side || undefined }
    }) as { region: string; side?: string; count: number }[],
    methodCounts: toSortedArray(methodMap, (method) => ({ method })) as { method: string; count: number }[],
    exerciseConceptCounts: toSortedArray(conceptMap, (concept) => ({ concept })) as { concept: string; count: number }[],
  }
}

const DIRECTION_LABEL: Record<TrendDirection, string> = {
  improving: '호전',
  stable: '정체',
  worsening: '악화',
  mixed: '변동',
}

export function formatDirection(d: TrendDirection): string {
  return DIRECTION_LABEL[d]
}
