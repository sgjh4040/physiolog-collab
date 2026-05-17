export type Gender = 'male' | 'female'

export type InsuranceType =
  | 'health'      // 건강보험
  | 'industrial'  // 산재
  | 'auto'        // 자동차
  | 'private'     // 실비
  | 'medical'     // 의료급여(1,2종)
  | 'self'        // 자비

export type PatientStatus =
  | 'new'         // 신규
  | 'readmit'     // 재입원
  | 'hold'        // 홀드
  | 'discharged'  // 종결

export type Patient = {
  id: string
  name: string
  birthDate: string            // ISO yyyy-mm-dd
  gender: Gender
  phone: string
  address: string
  referralRoute: string        // 내원(의뢰)경로
  medicalHistory: string[]     // 병력 (심혈관, 대사성, 호흡기 등)
  otherMedicalHistory?: string // 기타 과거력 (텍스트)
  diagnosis: string
  surgeryHistory?: string
  onsetDate?: string           // ISO yyyy-mm-dd — 다친/아프기 시작한 날 (만성·선천성은 비울 수 있음)
  insurance: InsuranceType
  notes?: string               // 특이사항/금기사항
  treatmentStartDate: string   // ISO yyyy-mm-dd
  therapist: string            // 담당 치료사 (텍스트)
  status: PatientStatus
  createdAt: string            // ISO datetime
  updatedAt: string            // ISO datetime
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
