import { z } from 'zod'

export const patientFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요'),
  birthDate: z.string().min(1, '생년월일을 선택하세요'),
  gender: z.enum(['male', 'female']),
  phone: z.string().trim().min(1, '연락처를 입력하세요'),
  address: z.string().trim(),
  referralRoute: z.string().trim(),
  medicalHistory: z.array(z.string()).default([]),
  otherMedicalHistory: z.string().trim(),
  diagnosis: z.string().trim().min(1, '진단명을 입력하세요'),
  surgeryHistory: z.string().trim(),
  onsetDate: z.string().trim(), // 선택 — 빈 문자열 허용
  insurance: z.enum(['health', 'industrial', 'auto', 'private', 'medical', 'self']),
  notes: z.string().trim(),
  treatmentStartDate: z.string().min(1, '치료 시작일을 선택하세요'),
  therapist: z.string().trim().min(1, '담당 치료사를 입력하세요'),
  status: z.enum(['new', 'readmit', 'hold', 'discharged']),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>
