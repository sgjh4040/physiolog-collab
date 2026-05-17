import { getMovementById } from '@/data/joints'
import { SIDE_LABEL } from '@/data/body-parts'
import type {
  Evaluation,
  GraphMetric,
} from '@/features/evaluations/domain/types'

export type GraphOption = {
  /** 안정적인 직렬화 키 (Set 비교용) */
  key: string
  metric: GraphMetric
  label: string
}

/**
 * 평가 데이터에서 차트 옵션을 추출.
 * 데이터가 1개라도 있는 항목만 후보가 됨.
 */
export function extractGraphOptions(evaluations: Evaluation[]): GraphOption[] {
  const options: GraphOption[] = []
  const seen = new Set<string>()

  const push = (opt: GraphOption) => {
    if (seen.has(opt.key)) return
    seen.add(opt.key)
    options.push(opt)
  }

  // VAS
  if (evaluations.some((e) => typeof e.vas === 'number')) {
    push({
      key: 'vas',
      metric: { kind: 'vas' },
      label: 'VAS (통증 점수)',
    })
  }

  // ROM — (jointId, side, active|passive) 조합
  for (const e of evaluations) {
    for (const r of e.rom ?? []) {
      const side = r.side ?? 'both'
      if (typeof r.active === 'number') {
        const mv = getMovementById(r.jointId)
        const jointMov = mv ? `${mv.joint.label} ${mv.movement.label}` : r.jointId
        const label = `ROM ${side !== 'both' ? SIDE_LABEL[side] + ' ' : ''}${jointMov} (능동)`
        push({
          key: `rom:${r.jointId}:${side}:active`,
          metric: { kind: 'rom', jointId: r.jointId, side, mode: 'active' },
          label,
        })
      }
      if (typeof r.passive === 'number') {
        const mv = getMovementById(r.jointId)
        const jointMov = mv ? `${mv.joint.label} ${mv.movement.label}` : r.jointId
        const label = `ROM ${side !== 'both' ? SIDE_LABEL[side] + ' ' : ''}${jointMov} (수동)`
        push({
          key: `rom:${r.jointId}:${side}:passive`,
          metric: { kind: 'rom', jointId: r.jointId, side, mode: 'passive' },
          label,
        })
      }
    }
  }

  // MMT — (jointId, side)
  for (const e of evaluations) {
    for (const m of e.mmt ?? []) {
      const side = m.side ?? 'both'
      const mv = getMovementById(m.jointId)
      const jointMov = mv ? `${mv.joint.label} ${mv.movement.label}` : m.jointId
      const label = `MMT ${side !== 'both' ? SIDE_LABEL[side] + ' ' : ''}${jointMov}`
      push({
        key: `mmt:${m.jointId}:${side}`,
        metric: { kind: 'mmt', jointId: m.jointId, side },
        label,
      })
    }
  }

  // Measurement — (type, location)
  for (const e of evaluations) {
    for (const b of e.bodyMeasurement ?? []) {
      const label = `계측 - ${b.location}`
      push({
        key: `measurement:${b.type}:${b.location}`,
        metric: { kind: 'measurement', type: b.type, location: b.location },
        label,
      })
    }
  }

  // Custom — 숫자 파싱되는 항목만 후보
  for (const e of evaluations) {
    for (const c of e.custom ?? []) {
      const num = Number(c.value)
      if (!Number.isFinite(num)) continue
      push({
        key: `custom:${c.name}`,
        metric: { kind: 'custom', name: c.name },
        label: c.name,
      })
    }
  }

  return options
}

export function metricKey(m: GraphMetric): string {
  switch (m.kind) {
    case 'vas':
      return 'vas'
    case 'rom':
      return `rom:${m.jointId}:${m.side ?? 'both'}:${m.mode}`
    case 'mmt':
      return `mmt:${m.jointId}:${m.side ?? 'both'}`
    case 'measurement':
      return `measurement:${m.type}:${m.location}`
    case 'custom':
      return `custom:${m.name}`
  }
}
