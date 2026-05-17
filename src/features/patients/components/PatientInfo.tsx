'use client'

import type { Patient } from '@/features/patients/domain/types'
import {
  GENDER_LABEL,
  INSURANCE_LABEL,
  PATIENT_STATUS_LABEL,
} from '@/data/patient-options'
import { calcAge, formatDate } from '@/lib/utils/date'

type Props = { patient: Patient }

export function PatientInfo({ patient }: Props) {
  const age = calcAge(patient.birthDate)
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      <Field label="이름" value={patient.name} />
      <Field
        label="생년월일"
        value={`${formatDate(patient.birthDate)}${age !== undefined ? ` (만 ${age}세)` : ''}`}
      />
      <Field label="성별" value={GENDER_LABEL[patient.gender]} />
      <Field label="연락처" value={patient.phone} />
      <Field
        label="주소"
        value={patient.address || '-'}
        full
      />
      <Field label="진단명" value={patient.diagnosis} full />
      <Field
        label="수술/시술 이력"
        value={patient.surgeryHistory || '-'}
        full
        multiline
      />
      <Field label="발병일" value={patient.onsetDate ? formatDate(patient.onsetDate) : '-'} />
      <Field label="치료 시작일" value={formatDate(patient.treatmentStartDate)} />
      <Field label="보험 유형" value={INSURANCE_LABEL[patient.insurance]} />
      <Field label="담당 치료사" value={patient.therapist} />
      <Field label="상태" value={PATIENT_STATUS_LABEL[patient.status]} />
      <Field
        label="과거력/기저질환"
        value={formatMedicalHistory(patient.medicalHistory, patient.otherMedicalHistory)}
        full
        multiline
      />
      <Field
        label="특이사항/금기사항"
        value={patient.notes || '-'}
        full
        multiline
      />
    </dl>
  )
}

function formatMedicalHistory(
  list: string[] | undefined,
  other: string | undefined,
): string {
  const items = [...(list ?? [])]
  if (other && other.trim()) items.push(other.trim())
  return items.length > 0 ? items.join(', ') : '-'
}

function Field({
  label,
  value,
  full,
  multiline,
}: {
  label: string
  value: string
  full?: boolean
  multiline?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 text-sm ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}
      >
        {value}
      </dd>
    </div>
  )
}
