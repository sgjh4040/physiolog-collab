'use server'

/**
 * AI ICF 분석에 환자 컨텍스트를 자동으로 주입하기 위한 빌더.
 * 환자 기본정보 + 최근 평가 8건 시계열 + 최근 치료 8건 통계를 한국어
 * markdown 문자열로 직렬화한다. VAS/ROM/MMT/Custom의 추세(호전·정체·악화)와
 * 변화량을 미리 라벨링해 AI가 그래프 추이를 임상 추론에 cross-reference하게 함.
 *
 * route.ts에서 호출 → system prompt 뒤에 `## 환자 컨텍스트` 섹션으로 합쳐서 Claude에 전달.
 */

import { getPatient } from '@/lib/supabase/patients'
import { getEvaluations } from '@/lib/supabase/evaluations'
import { getTreatments } from '@/lib/supabase/treatments'
import { JOINTS } from '@/data/joints'
import { BODY_REGIONS } from '@/data/body-parts'
import {
  extractVasTrend,
  extractJointTrends,
  extractCustomTrends,
  extractTreatmentStats,
  formatDirection,
} from './trend-extraction'

const TREND_WINDOW = 8

// ─── 한국어 라벨 매핑 ─────────────────────────────────────
const METHOD_LABELS: Record<string, string> = {
  manual: '도수치료',
  electric: '전기치료',
  ultrasound: '초음파',
  thermal: '냉-온치료',
  task: '과제 훈련',
  exercise: '운동치료',
}

const CONCEPT_LABELS: Record<string, string> = {
  strength: '근력 증가',
  cardio: '심폐 지구력',
  endurance: '근지구력',
  recovery: '회복 운동',
  balance: '균형-기능',
}

const SIDE_LABELS: Record<string, string> = {
  left: '좌측',
  right: '우측',
  both: '양측',
}

// ─── 유틸 ────────────────────────────────────────────────
function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

function lookupMovementLabel(jointId: string): string {
  for (const joint of JOINTS) {
    for (const movement of joint.movements) {
      if (movement.id === jointId) return `${joint.label} ${movement.label}`
    }
  }
  return jointId
}

function lookupRegionLabel(regionId: string): string {
  return BODY_REGIONS.find((r) => r.id === regionId)?.label ?? regionId
}

function formatGender(g: string | undefined): string {
  if (g === 'male') return '남성'
  if (g === 'female') return '여성'
  return g ?? '미상'
}

// ─── 메인 함수 ───────────────────────────────────────────
export async function buildPatientContext(patientId: string): Promise<string> {
  const [patient, allEvaluations, allTreatments] = await Promise.all([
    getPatient(patientId),
    getEvaluations(patientId),
    getTreatments(patientId),
  ])

  if (!patient) return ''

  // 최근 N건만 — 만성 환자(100+ 평가) 시 토큰 폭주 방지
  const recentEvaluations = allEvaluations.slice(0, TREND_WINDOW)
  const recentTreatments = allTreatments.slice(0, TREND_WINDOW)

  const lines: string[] = ['## 환자 컨텍스트']

  // ── 기본정보 ──
  lines.push('')
  lines.push('**기본정보**')
  lines.push(`- 이름: ${patient.name}`)
  const age = calculateAge(patient.birthDate)
  if (age !== null) lines.push(`- 나이/성별: ${age}세 ${formatGender(patient.gender)}`)
  if (patient.diagnosis) lines.push(`- 진단명: ${patient.diagnosis}`)
  if (patient.surgeryHistory) lines.push(`- 수술이력: ${patient.surgeryHistory}`)
  if (patient.medicalHistory && patient.medicalHistory.length > 0) {
    const mh = patient.medicalHistory.join(', ')
    const extra = patient.otherMedicalHistory ? ` / 기타: ${patient.otherMedicalHistory}` : ''
    lines.push(`- 병력: ${mh}${extra}`)
  } else if (patient.otherMedicalHistory) {
    lines.push(`- 병력: ${patient.otherMedicalHistory}`)
  }
  if (patient.notes) lines.push(`- 특이사항: ${patient.notes}`)
  if (patient.treatmentStartDate) lines.push(`- 치료 시작일: ${patient.treatmentStartDate}`)
  if (patient.therapist) lines.push(`- 담당 치료사: ${patient.therapist}`)

  // ── 최근 평가 (스냅샷) ──
  const latestEval = recentEvaluations[0]
  if (latestEval) {
    lines.push('')
    lines.push(`**최근 평가 (${latestEval.date})**`)
    if (typeof latestEval.vas === 'number') {
      lines.push(`- 통증(VAS): ${latestEval.vas}/10`)
    }
    if (latestEval.rom && latestEval.rom.length > 0) {
      const items = latestEval.rom.slice(0, 6).map((r) => {
        const label = lookupMovementLabel(r.jointId)
        const side = r.side ? `${SIDE_LABELS[r.side] ?? r.side} ` : ''
        const parts: string[] = []
        if (typeof r.active === 'number') parts.push(`능동 ${r.active}°`)
        if (typeof r.passive === 'number') parts.push(`수동 ${r.passive}°`)
        return `${side}${label} ${parts.join(' / ')}`.trim()
      })
      lines.push(`- ROM: ${items.join('; ')}`)
    }
    if (latestEval.mmt && latestEval.mmt.length > 0) {
      const items = latestEval.mmt.slice(0, 6).map((m) => {
        const label = lookupMovementLabel(m.jointId)
        const side = m.side ? `${SIDE_LABELS[m.side] ?? m.side} ` : ''
        return `${side}${label} ${m.grade}/5`.trim()
      })
      lines.push(`- MMT: ${items.join('; ')}`)
    }
    if (latestEval.bodyMeasurement && latestEval.bodyMeasurement.length > 0) {
      const items = latestEval.bodyMeasurement
        .slice(0, 4)
        .map((b) => `${b.location} ${b.value}${b.unit}`)
      lines.push(`- 신체계측: ${items.join('; ')}`)
    }
    if (latestEval.painMapping && latestEval.painMapping.length > 0) {
      const items = latestEval.painMapping.slice(0, 4).map((p) => `${p.label}(${p.pattern})`)
      lines.push(`- 통증 부위: ${items.join('; ')}`)
    }
    if (latestEval.custom && latestEval.custom.length > 0) {
      const items = latestEval.custom.map((c) => `${c.name}=${c.value}`)
      lines.push(`- 추가 평가: ${items.join('; ')}`)
    }
  }

  // ── 평가 추이 (시계열 + 추세 라벨) ──
  const vasTrend = extractVasTrend(recentEvaluations)
  const romActiveTrends = extractJointTrends(recentEvaluations, 'rom-active', { invert: false, deltaThreshold: 5 })
  const romPassiveTrends = extractJointTrends(recentEvaluations, 'rom-passive', { invert: false, deltaThreshold: 5 })
  const mmtTrends = extractJointTrends(recentEvaluations, 'mmt', { invert: false, deltaThreshold: 0.5 })
  const customTrends = extractCustomTrends(recentEvaluations)

  const hasAnyTrend =
    !!vasTrend || romActiveTrends.length > 0 || romPassiveTrends.length > 0 || mmtTrends.length > 0 || customTrends.length > 0

  if (hasAnyTrend) {
    lines.push('')
    lines.push(`**평가 추이 (최근 ${recentEvaluations.length}건)**`)

    if (vasTrend) {
      const series = vasTrend.series.map((p) => p.vas).join('→')
      const sign = vasTrend.delta > 0 ? '+' : ''
      lines.push(
        `- VAS: ${series} (${formatDirection(vasTrend.direction)}, ${sign}${vasTrend.delta}pt over ${vasTrend.series.length}회)`,
      )
    }

    for (const t of romActiveTrends.slice(0, 4)) {
      const label = lookupMovementLabel(t.jointId)
      const side = t.side ? `${SIDE_LABELS[t.side] ?? t.side} ` : ''
      const series = t.series.map((p) => `${p.value}°`).join('→')
      const sign = t.delta > 0 ? '+' : ''
      lines.push(`- ${side}${label} ROM(능동): ${series} (${formatDirection(t.direction)}, ${sign}${t.delta}°)`)
    }
    for (const t of romPassiveTrends.slice(0, 2)) {
      const label = lookupMovementLabel(t.jointId)
      const side = t.side ? `${SIDE_LABELS[t.side] ?? t.side} ` : ''
      const series = t.series.map((p) => `${p.value}°`).join('→')
      const sign = t.delta > 0 ? '+' : ''
      lines.push(`- ${side}${label} ROM(수동): ${series} (${formatDirection(t.direction)}, ${sign}${t.delta}°)`)
    }
    for (const t of mmtTrends.slice(0, 3)) {
      const label = lookupMovementLabel(t.jointId)
      const side = t.side ? `${SIDE_LABELS[t.side] ?? t.side} ` : ''
      const series = t.series.map((p) => p.value).join('→')
      const sign = t.delta > 0 ? '+' : ''
      lines.push(`- ${side}${label} MMT: ${series}/5 (${formatDirection(t.direction)}, ${sign}${t.delta})`)
    }
    for (const t of customTrends.slice(0, 4)) {
      const series = t.series.map((p) => p.value).join(' → ')
      lines.push(`- ${t.name}: ${series}`)
    }
  }

  // ── 최근 치료 (스냅샷) ──
  const latestTreatment = recentTreatments[0]
  if (latestTreatment) {
    lines.push('')
    lines.push(`**최근 치료 (${latestTreatment.date})**`)
    if (latestTreatment.bodyParts && latestTreatment.bodyParts.length > 0) {
      const parts = latestTreatment.bodyParts.map((p) => {
        const region = lookupRegionLabel(p.region)
        const side = p.side ? `${SIDE_LABELS[p.side] ?? p.side} ` : ''
        return `${side}${region}`
      })
      lines.push(`- 치료부위: ${parts.join(', ')}`)
    }
    if (latestTreatment.methods && latestTreatment.methods.length > 0) {
      const methods = latestTreatment.methods.map((m) => METHOD_LABELS[m] ?? m)
      lines.push(`- 치료방법: ${methods.join(', ')}`)
    }
    if (latestTreatment.otherTreatmentMethod) {
      lines.push(`- 기타 치료: ${latestTreatment.otherTreatmentMethod}`)
    }
    if (latestTreatment.exerciseConcept) {
      lines.push(`- 운동 컨셉: ${CONCEPT_LABELS[latestTreatment.exerciseConcept] ?? latestTreatment.exerciseConcept}`)
    }
    if (latestTreatment.exercises && latestTreatment.exercises.length > 0) {
      const names = latestTreatment.exercises
        .slice(0, 5)
        .map((e) => e.name)
        .filter(Boolean)
      if (names.length > 0) lines.push(`- 운동: ${names.join(', ')}`)
    }
    if (latestTreatment.homework) lines.push(`- 숙제: ${latestTreatment.homework}`)
    if (latestTreatment.comment) lines.push(`- 코멘트: ${latestTreatment.comment}`)
    if (latestTreatment.flags && latestTreatment.flags.length > 0) {
      lines.push(`- 오늘 특이사항(델타): ${latestTreatment.flags.join(', ')}`)
    }
  }

  // ── 치료 빈도 통계 (최근 N회) ──
  if (recentTreatments.length >= 2) {
    const stats = extractTreatmentStats(recentTreatments)
    lines.push('')
    lines.push(`**치료 빈도 (최근 ${stats.totalSessions}회)**`)
    if (stats.bodyPartCounts.length > 0) {
      const items = stats.bodyPartCounts.slice(0, 4).map((b) => {
        const region = lookupRegionLabel(b.region)
        const side = b.side ? `${SIDE_LABELS[b.side] ?? b.side} ` : ''
        return `${side}${region}(${b.count}회)`
      })
      lines.push(`- 부위: ${items.join(', ')}`)
    }
    if (stats.methodCounts.length > 0) {
      const items = stats.methodCounts.map((m) => `${METHOD_LABELS[m.method] ?? m.method}(${m.count}회)`)
      lines.push(`- 방법: ${items.join(', ')}`)
    }
    if (stats.exerciseConceptCounts.length > 0) {
      const items = stats.exerciseConceptCounts.map(
        (c) => `${CONCEPT_LABELS[c.concept] ?? c.concept}(${c.count}회)`,
      )
      lines.push(`- 운동 컨셉: ${items.join(', ')}`)
    }
  }

  lines.push('')
  lines.push('> 위 컨텍스트는 시스템이 자동 첨부한 것이며, 사용자 입력보다 우선하지 않습니다.')
  lines.push('> 사용자가 새로 관찰한 내용을 기준으로 분류하되, 위 정보를 일관성 유지에 활용하세요.')
  lines.push('> 평가 추이가 제공되었다면 clinicalNote에 호전·정체·악화 흐름을 명시하세요.')

  return lines.join('\n')
}
