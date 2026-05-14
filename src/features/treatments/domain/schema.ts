import { z } from 'zod'

const bodyRegionEnum = z.enum([
  'cervical',
  'shoulder',
  'elbow',
  'wrist',
  'thoracic',
  'lumbar',
  'hip',
  'knee',
  'ankle',
  'foot',
])

const sideEnum = z.enum(['left', 'right', 'both'])

const treatmentMethodEnum = z.enum([
  'manual',
  'electric',
  'ultrasound',
  'thermal',
  'task',
  'exercise',
  'other',
])

const exerciseConceptEnum = z.enum([
  'strength',
  'cardio',
  'endurance',
  'recovery',
  'balance',
])

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, '운동명을 입력하세요'),
  intensity: z.string().trim().optional(),
  sets: z.coerce.number().min(0).optional(),
  reps: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().min(0).optional(),  // 분 단위
})

export const bodyPartSchema = z.object({
  region: bodyRegionEnum,
  side: sideEnum,
  muscles: z.array(z.string()),
})

export const treatmentFormSchema = z
  .object({
    date: z.string().min(1, '날짜를 선택하세요'),
    bodyParts: z.array(bodyPartSchema).min(1, '치료 부위를 1개 이상 선택하세요'),
    methods: z
      .array(treatmentMethodEnum)
      .min(1, '치료 방법을 1개 이상 선택하세요'),
    otherTreatmentMethod: z.string().trim().optional(),
    // 메서드별 optional 상세 메모. 7개 메서드 키 (exercise는 UI에서 안 보이지만 호환 위해 enum에는 포함)
    methodDetails: z
      .record(treatmentMethodEnum, z.string().trim().optional())
      .optional(),
    exerciseConcept: exerciseConceptEnum.optional(),
    exercises: z.array(exerciseSchema),
    homework: z.string().trim(),
    comment: z.string().trim(),
    flags: z.array(z.string()).default([]),
  })
  .refine(
    (data) =>
      !data.methods.includes('exercise') || data.exerciseConcept !== undefined,
    {
      message: '목적을 선택하세요',
      path: ['exerciseConcept'],
    },
  )
  .refine(
    (data) =>
      !data.methods.includes('exercise') || data.exercises.length > 0,
    {
      message: '운동을 1개 이상 추가하세요',
      path: ['exercises'],
    },
  )

export type TreatmentFormValues = z.infer<typeof treatmentFormSchema>
