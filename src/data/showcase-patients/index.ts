import type { PatientInput } from '@/features/patients/domain/types'
import type { TreatmentInput } from '@/features/treatments/domain/types'
import type { EvaluationInput } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'

import {
  SHOWCASE_PATIENT_1,
  SHOWCASE_TREATMENTS_1,
  SHOWCASE_EVALUATIONS_1,
  SHOWCASE_ICF_1,
} from './rotator-cuff'

import {
  SHOWCASE_PATIENT_2,
  SHOWCASE_TREATMENTS_2,
  SHOWCASE_EVALUATIONS_2,
  SHOWCASE_ICF_2,
} from './stroke-recovery'

export type ShowcaseBundle = {
  patient: Omit<PatientInput, 'therapist'>
  treatments: Omit<TreatmentInput, 'patientId'>[]
  evaluations: Omit<EvaluationInput, 'patientId'>[]
  icfAssessment: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'>
}

export const SHOWCASE_BUNDLES: ShowcaseBundle[] = [
  {
    patient: SHOWCASE_PATIENT_1,
    treatments: SHOWCASE_TREATMENTS_1,
    evaluations: SHOWCASE_EVALUATIONS_1,
    icfAssessment: SHOWCASE_ICF_1,
  },
  {
    patient: SHOWCASE_PATIENT_2,
    treatments: SHOWCASE_TREATMENTS_2,
    evaluations: SHOWCASE_EVALUATIONS_2,
    icfAssessment: SHOWCASE_ICF_2,
  },
]
