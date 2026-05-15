import type { Patient } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'
import type { Evaluation } from '@/features/evaluations/domain/types'

/**
 * 환자에게 카카오톡으로 보낼 친근한 메시지 텍스트 빌더.
 *
 * 환자 요약지의 핵심을 한 메시지로 압축 — 환자가 폰에서 받았을 때
 * 별도 페이지 클릭 없이 즉시 읽고 따라할 수 있게.
 *
 * 순수 함수 — Vitest 테스트 가능. 데이터 없는 필드는 자동 skip.
 */

interface ShareInput {
  patient: Patient
  treatments: Treatment[]
  evaluations: Evaluation[]
  authorName?: string
}

function formatKDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${mm}/${dd} (${days[d.getDay()]})`
}

export function buildShareMessage({
  patient,
  treatments,
  evaluations,
  authorName,
}: ShareInput): string {
  const lines: string[] = []
  lines.push(`[${patient.name} 님 운동·관리 안내]`)
  lines.push('')

  // 최근 평가 핵심
  const latestEval = evaluations.find(
    (e) =>
      typeof e.vas === 'number' ||
      (e.rom && e.rom.length > 0) ||
      (e.mmt && e.mmt.length > 0) ||
      (e.custom && e.custom.length > 0),
  )
  if (latestEval) {
    const evalParts: string[] = []
    if (typeof latestEval.vas === 'number') {
      evalParts.push(`통증 ${latestEval.vas}/10`)
    }
    if (latestEval.custom && latestEval.custom.length > 0) {
      const first = latestEval.custom[0]
      evalParts.push(`${first.name} ${first.value}`)
    }
    if (evalParts.length > 0) {
      lines.push(`📋 최근 평가 (${formatKDate(latestEval.date)}): ${evalParts.join(' · ')}`)
      lines.push('')
    }
  }

  // 최근 치료의 숙제·운동
  const latestTreatment = treatments[0]
  if (latestTreatment) {
    if (latestTreatment.exercises && latestTreatment.exercises.length > 0) {
      lines.push('🏠 집에서 하실 운동')
      const names = latestTreatment.exercises
        .slice(0, 5)
        .map((e) => e.name?.trim())
        .filter(Boolean)
      for (const name of names) {
        lines.push(`• ${name}`)
      }
      lines.push('')
    }
    if (latestTreatment.homework) {
      lines.push('📝 숙제')
      lines.push(latestTreatment.homework)
      lines.push('')
    }
  }

  // 주의사항
  if (patient.notes) {
    lines.push('⚠️ 주의')
    lines.push(patient.notes)
    lines.push('')
  }

  // 마무리 인사 + 발신자
  lines.push('궁금하신 점 있으시면 다음 진료 때 편히 말씀해주세요. 무리하지 않으시는 게 가장 중요합니다 🙂')
  if (authorName || patient.therapist) {
    lines.push('')
    lines.push(`— ${authorName || patient.therapist} 물리치료사 (physiolog)`)
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
