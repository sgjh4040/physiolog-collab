import type { Gender, InsuranceType, PatientStatus } from '@/features/patients/domain/types'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

export const GENDER_LABEL: Record<Gender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Gender, string>

export const INSURANCE_OPTIONS: { value: InsuranceType; label: string }[] = [
  { value: 'health', label: '건강보험' },
  { value: 'industrial', label: '산재' },
  { value: 'auto', label: '자동차' },
  { value: 'private', label: '실비' },
  { value: 'medical', label: '의료급여(1,2종)' },
  { value: 'self', label: '자비' },
]

export const INSURANCE_LABEL: Record<InsuranceType, string> = Object.fromEntries(
  INSURANCE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<InsuranceType, string>

export const PATIENT_STATUS_OPTIONS: { value: PatientStatus; label: string }[] = [
  { value: 'new', label: '신규' },
  { value: 'readmit', label: '재입원' },
  { value: 'hold', label: '홀드' },
  { value: 'discharged', label: '종결' },
]

export const PATIENT_STATUS_LABEL: Record<PatientStatus, string> = Object.fromEntries(
  PATIENT_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<PatientStatus, string>

// 옛 긴 카테고리(예: '심혈관질환 (고혈압, 협심증, 심부전 등)')는 시드의 짧은
// 단답('고혈압', '당뇨')과 매치 안 돼 폼 진입 시 체크박스가 모두 빈 상태로
// 시작하는 silent 손실 위험. 시드·임상 단답에 맞춰 짧게 정리. 의뢰서·AI도
// 짧은 텍스트가 더 자연스러움.
export const MEDICAL_HISTORY_OPTIONS = [
  '고혈압',
  '당뇨',
  '고지혈증',
  '심부전·협심증',
  '뇌졸중(과거)',
  '천식·COPD',
  '신부전',
  '간 질환',
  '암(과거)',
  '류마티스·자가면역',
  '파킨슨·치매',
  '기타',
]
