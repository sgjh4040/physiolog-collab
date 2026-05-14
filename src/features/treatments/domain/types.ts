export type BodyRegionId =
  | 'cervical'    // 목/경추
  | 'shoulder'    // 어깨
  | 'elbow'       // 팔꿈치
  | 'wrist'       // 손목/손
  | 'thoracic'    // 흉추
  | 'lumbar'      // 요추
  | 'hip'         // 고관절/엉덩이
  | 'knee'        // 무릎
  | 'ankle'       // 발목
  | 'foot'        // 발/발가락

export type Side = 'left' | 'right' | 'both'

export type TreatmentMethod =
  | 'manual'      // 도수치료
  | 'electric'    // 전기
  | 'ultrasound'  // 초음파
  | 'thermal'     // 냉-온치료
  | 'task'        // 과제 훈련
  | 'exercise'    // 운동치료
  | 'other'       // 기타

export type ExerciseConcept =
  | 'strength'    // 근력증가
  | 'cardio'      // 심폐지구력
  | 'endurance'   // 근지구력
  | 'recovery'    // 회복운동
  | 'balance'     // 균형-기능

export type BodyPart = {
  region: BodyRegionId
  side?: Side
  muscles?: string[]
}

export type Exercise = {
  id: string
  name: string
  intensity?: string  // 기존 자유 입력 유지
  sets?: number       // 델타 기록용 수치
  reps?: number
  weight?: number
  duration?: number   // 분 단위 (소수 OK). 에르고미터·유산소 등 시간 기반 운동
}

export type Treatment = {
  id: string
  patientId: string
  date: string                 // ISO yyyy-mm-dd
  bodyParts: BodyPart[]        // 다중
  methods: TreatmentMethod[]   // 다중
  otherTreatmentMethod?: string // 기타 치료방법 (legacy — methodDetails.other 로 점진 이전 예정)
  /**
   * 메서드별 optional 상세 메모.
   * 'exercise'는 운동 카드로 자세 입력하므로 UI에서 textarea 안 노출 (키 자체는 허용).
   * 예: { manual: "우측 어깨 강도 중", ultrasound: "5분 1MHz" }
   */
  methodDetails?: Partial<Record<TreatmentMethod, string>>
  exerciseConcept?: ExerciseConcept
  exercises?: Exercise[]
  homework?: string            // 숙제 (과제·운동 등)
  comment?: string             // 당일 코멘트 (환자 반응·특이사항)
  flags?: string[]             // 델타 기록법: 오늘 특이사항 플래그
  createdAt: string
}

export type TreatmentInput = Omit<Treatment, 'id' | 'createdAt'>
