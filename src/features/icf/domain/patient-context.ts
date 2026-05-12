'use server'

/**
 * AI ICF 분석에 환자 컨텍스트를 자동으로 주입하기 위한 빌더.
 * 환자 기본정보 + 최근 평가 1건 + 최근 치료 1건을 한국어 markdown 문자열로 직렬화한다.
 *
 * route.ts에서 호출 → system prompt 뒤에 `## 환자 컨텍스트` 섹션으로 합쳐서 Claude에 전달.
 */

import { getPatient } from '@/lib/supabase/patients'
import { getEvaluations } from '@/lib/supabase/evaluations'
import { getLatestTreatment } from '@/lib/supabase/treatments'
import { JOINTS } from '@/data/joints'
import { BODY_REGIONS } from '@/data/body-parts'

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
  const [patient, evaluations, latestTreatment] = await Promise.all([
    getPatient(patientId),
    getEvaluations(patientId),
    getLatestTreatment(patientId),
  ])

  if (!patient) return ''

  const lines: string[] = ['## 환자 컨텍스트']

  // 기본정보
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

  // 최근 평가
  const latestEval = evaluations[0]
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

  // 최근 치료
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

  lines.push('')
  lines.push('> 위 컨텍스트는 시스템이 자동 첨부한 것이며, 사용자 입력보다 우선하지 않습니다.')
  lines.push('> 사용자가 새로 관찰한 내용을 기준으로 분류하되, 위 정보를 일관성 유지에 활용하세요.')

  return lines.join('\n')
}
