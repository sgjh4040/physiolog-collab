import type { PatientInput } from '@/features/patients/domain/types'
import type { TreatmentInput, Exercise } from '@/features/treatments/domain/types'
import type { EvaluationInput } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'

/**
 * 쇼케이스 환자 ② — 좌측 편마비 (MCA infarct), 발병 4개월차 재활
 *
 * 시연 포인트:
 * - ICF 5도메인 모두 풀로 채워짐 (신체기능·활동·참여·환경·개인)
 * - NDT, Bobath, 양손 활용 ADL, 보호자 환경 등 P3 임상 사전 활용
 * - 가족 간병·욕실 손잡이 미설치 등 환경 요인 풍부
 * - 통증 위주가 아니라 보행·균형·ADL 회복 중심 (VAS는 제한적, MMT·보행 거리·균형 위주)
 */

export const SHOWCASE_PATIENT_2: Omit<PatientInput, 'therapist'> = {
  name: '쇼케이스_박순자',
  birthDate: '1963-04-15',
  gender: 'female',
  phone: '010-8421-3357',
  address: '서울시 노원구 (아파트 1층)',
  referralRoute: '재활의학과 의뢰',
  medicalHistory: ['고혈압', '당뇨'],
  otherMedicalHistory: '2026.01 좌측 중대뇌동맥 경색 (Left MCA infarct)',
  diagnosis: '좌측 편마비 (Left hemiplegia, post-stroke)',
  surgeryHistory: undefined,
  insurance: 'medical',
  notes: '발병 4개월차, 우세손(우측) 사용. 보호자(딸) 적극 간병. 가정 내 보행 가능, 외출 시 동반 필요. 욕실 손잡이 미설치 — 환경 개선 권유 예정.',
  treatmentStartDate: '2026-02-15',
  status: 'readmit',
}

const ex = (
  name: string,
  sets?: number,
  reps?: number,
  weight?: number,
  duration?: number,
): Exercise => ({
  id: crypto.randomUUID(),
  name,
  sets,
  reps,
  weight,
  duration,
})

// ─── 치료 기록 10회 ──────────────────────────────────────────────
// 시기별: NDT·균형 → 보행 훈련 → 계단·ADL 통합

export const SHOWCASE_TREATMENTS_2: Omit<TreatmentInput, 'patientId'>[] = [
  // ─ 초기 NDT·자세 조절 (1~3회) ─
  {
    date: '2026-02-15',
    bodyParts: [
      { region: 'shoulder', side: 'left', muscles: ['삼각근 전부', '극상근'] },
      { region: 'hip', side: 'left', muscles: ['둔근군 (Gluteals)', '대퇴사두근 (Quadriceps)'] },
    ],
    methods: ['manual', 'task'],
    methodDetails: {
      manual: 'NDT(신경발달치료) 기반 — 좌측 체간 정렬, 견갑대 가동',
      task: '앉기→서기 자세 전환 훈련 (보호자 보조)',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('체간 회전 (Trunk rotation, supine)', 2, 10),
      ex('견갑대 가동 (Scapular protraction/retraction)', 2, 10),
      ex('앉아서 체중 이동 (Weight shift, sitting)', 3, 10),
    ],
    homework: '집에서 앉아 체중 이동 운동 하루 2회 (보호자 보조)',
    comment: '좌측 강직(Modified Ashworth 1+) — 발목 배측굴곡 제한. 보호자 교육 시작.',
    flags: ['보호자 동반', '컨디션 좋음'],
  },
  {
    date: '2026-02-22',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
      { region: 'ankle', side: 'left' },
    ],
    methods: ['manual', 'task'],
    methodDetails: {
      manual: 'Bobath 접근 — 좌측 하지 정렬, 발목 가동성 회복',
      task: '서기 자세 유지 훈련 (안정 표면)',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('서기 유지 (Static standing, 평행봉 잡고)', undefined, undefined, undefined, 5),
      ex('체중 이동 서기 (Weight shift, standing)', 3, 10),
      ex('발목 가동 (Ankle DF/PF, AAROM)', 3, 15),
    ],
    homework: '평행봉(또는 식탁 잡고) 서기 유지 하루 2회 5분씩',
    comment: '5분간 서기 유지 가능. 좌측 발목 배측굴곡 약함.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-03-01',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
    ],
    methods: ['manual', 'task', 'exercise'],
    methodDetails: {
      manual: 'PNF — 좌측 하지 D1 굴곡 패턴 촉진',
      task: '평행봉 안에서 보행 (3m 왕복)',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('평행봉 보행 (3m 왕복)', 3, undefined, undefined, undefined),
      ex('한 발 서기 (우측, 30초)', 3, undefined, undefined, undefined),
      ex('의자에서 서기/앉기', 3, 8),
    ],
    homework: '의자 서기/앉기 하루 2회 8회씩',
    comment: '평행봉 보행 3m 가능. 좌측 발목 끌림(foot drop) 미약.',
    flags: ['컨디션 좋음'],
  },

  // ─ 보행 훈련 중기 (4~7회) ─
  {
    date: '2026-03-15',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
      { region: 'ankle', side: 'left' },
    ],
    methods: ['manual', 'task', 'exercise'],
    methodDetails: {
      manual: '좌측 발목 단축 근육 신장 (장딴지·아킬레스건)',
      task: '4점 지팡이 보행 훈련 — 평지 5m',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('4점 지팡이 보행 (5m 왕복)', 4, undefined, undefined, undefined),
      ex('한 발 서기 (좌측, 보조)', 3, undefined, undefined, 15),
      ex('Step-up (10cm 박스)', 3, 8),
    ],
    homework: '집에서 한 발 서기(우측만, 안전한 곳에서) 하루 2회',
    comment: '4점 지팡이 보행 5m 가능. 외출 시 보호자 보조 필수.',
    flags: ['보호자 동반'],
  },
  {
    date: '2026-03-29',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
      { region: 'ankle', side: 'left' },
    ],
    methods: ['exercise', 'task'],
    methodDetails: {
      task: '계단 오르기 1~2 계단 (난간 잡고)',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('지팡이 보행 (10m 왕복)', 3, undefined, undefined, undefined),
      ex('Step-up (15cm)', 3, 10),
      ex('대퇴사두근 isometric', 3, 10),
      ex('밴드 외전 (좌측 둔근)', 3, 12, 1),
    ],
    homework: '집 거실에서 지팡이 보행 5m × 3회. 계단은 보호자 보조 후 시도.',
    comment: '계단 1~2 계단 가능 (난간 잡고). 가정 내 보행 4m 자립.',
    flags: ['컨디션 좋음', '재활 적극'],
  },
  {
    date: '2026-04-12',
    bodyParts: [
      { region: 'cervical' },
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
    ],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: '체간 회전 가동성 강조 — 보행 중 팔 흔들기 패턴',
      task: '장애물 넘기 훈련 (5cm 콘 2개)',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('지팡이 보행 (15m)', 3, undefined, undefined, undefined),
      ex('장애물 넘기 (5cm)', 3, 10),
      ex('Mini-squat (난간 잡고)', 3, 12),
      ex('밴드 외전', 3, 15, 1),
    ],
    homework: '거실 보행 + Mini-squat 하루 2회',
    comment: '체간 회전 개선. 좌측 hip flexion 활성도 향상.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-04-19',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
    ],
    methods: ['exercise', 'task'],
    methodDetails: {
      task: '계단 오르기 5 계단 (난간 잡고), 부엌 ADL 시뮬레이션',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('계단 오르기 (5 계단 × 3회)', 3, undefined, undefined, undefined),
      ex('Sit-to-stand (의자, 손 안 짚고)', 3, 8),
      ex('Step-up (20cm)', 3, 10),
      ex('밴드 외전 (medium)', 3, 15, 2),
    ],
    homework: '식기 정리 등 가벼운 가사 일부 시도 (보호자 감독)',
    comment: '식기 정리 가능 (가벼운 그릇 한 손으로). 가족 내 역할 일부 재개.',
    flags: ['컨디션 좋음', '재활 적극'],
  },

  // ─ ADL·기능 통합기 (8~10회) ─
  {
    date: '2026-05-03',
    bodyParts: [
      { region: 'cervical' },
      { region: 'shoulder', side: 'left' },
      { region: 'hip', side: 'left' },
    ],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: '좌측 견갑대·체간 협응 강화',
      task: '양손 활용 ADL — 식기 닦기, 옷 개기',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('양손 식기 닦기 (좌측 사용 강조)', undefined, undefined, undefined, 10),
      ex('지팡이 보행 (20m)', 3, undefined, undefined, undefined),
      ex('Step-up (20cm)', 3, 12),
      ex('Sit-to-stand', 3, 10),
    ],
    homework: '집에서 양손 활용 ADL 의식적으로 (옷 개기·식기 닦기)',
    comment: '양손 활용 시도 — 좌측 보조 손으로 사용 가능. 글씨 쓰기는 우세손.',
    flags: ['재활 적극', '컨디션 좋음'],
  },
  {
    date: '2026-05-10',
    bodyParts: [
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
      { region: 'ankle', side: 'left' },
    ],
    methods: ['exercise', 'task'],
    methodDetails: {
      task: '외부 환경 보행 — 아파트 단지 내 보행 (50m, 보호자 동반)',
    },
    exerciseConcept: 'cardio',
    exercises: [
      ex('외부 보행 (50m)', 1, undefined, undefined, undefined),
      ex('계단 오르기 (10 계단)', 3, undefined, undefined, undefined),
      ex('Sit-to-stand', 3, 12),
      ex('Tandem stance (15초)', 3, undefined, undefined, undefined),
    ],
    homework: '날씨 좋은 날 보호자와 아파트 단지 보행 (10분)',
    comment: '아파트 단지 50m 보행 성공. 균형은 안정적. 외출 시 보호자 동반은 안전 위주.',
    flags: ['보호자 동반', '재활 적극'],
  },
  {
    date: '2026-05-13',
    bodyParts: [
      { region: 'cervical' },
      { region: 'shoulder', side: 'left' },
      { region: 'hip', side: 'left' },
      { region: 'knee', side: 'left' },
    ],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: '좌측 체간·하지 통합 동작 패턴 점검',
      task: '욕실 ADL 시뮬레이션 — 손잡이 활용 자세 전환',
    },
    exerciseConcept: 'balance',
    exercises: [
      ex('지팡이 보행 (실내)', 5, undefined, undefined, undefined),
      ex('욕실 모의 자세 전환 (앉기→일어서기, 손잡이 잡고)', 3, 8),
      ex('한 발 서기 (좌측, 10초)', 3, undefined, undefined, undefined),
      ex('Tandem walking', 3, undefined, undefined, undefined),
    ],
    homework: '욕실 손잡이 설치 후 사용 (가족과 상의). 외부 보행 빈도 늘리기.',
    comment: '욕실 손잡이 설치 권유 다시 강조. 보호자와 환경 개선 의논 예정.',
    flags: ['보호자 동반', '재활 적극'],
  },
]

// ─── 평가 기록 5회 (보행 거리·MMT·균형 추이) ─────────────────────────────
export const SHOWCASE_EVALUATIONS_2: Omit<EvaluationInput, 'patientId'>[] = [
  {
    date: '2026-02-15',
    vas: 2, // 통증 위주 환자는 아니지만 좌측 어깨 미약한 통증
    mmt: [
      { jointId: 'hip_flexion', side: 'left', grade: 2 },
      { jointId: 'knee_flexion', side: 'left', grade: 2 },
      { jointId: 'ankle_dorsiflexion', side: 'left', grade: 1 },
      { jointId: 'shoulder_flexion', side: 'left', grade: 2 },
    ],
    custom: [
      { name: '보행 거리 (보조 없이)', value: '0m' },
      { name: '보행 거리 (지팡이/평행봉)', value: '0m' },
      { name: 'Berg 균형 척도', value: '14/56' },
      { name: '강직 (Modified Ashworth, 좌측 발목)', value: '1+' },
    ],
  },
  {
    date: '2026-03-01',
    vas: 1,
    mmt: [
      { jointId: 'hip_flexion', side: 'left', grade: 3 },
      { jointId: 'knee_flexion', side: 'left', grade: 2 },
      { jointId: 'ankle_dorsiflexion', side: 'left', grade: 2 },
    ],
    custom: [
      { name: '보행 거리 (지팡이/평행봉)', value: '3m' },
      { name: 'Berg 균형 척도', value: '22/56' },
    ],
  },
  {
    date: '2026-03-29',
    mmt: [
      { jointId: 'hip_flexion', side: 'left', grade: 3 },
      { jointId: 'knee_flexion', side: 'left', grade: 3 },
      { jointId: 'ankle_dorsiflexion', side: 'left', grade: 2 },
    ],
    custom: [
      { name: '보행 거리 (지팡이)', value: '10m' },
      { name: '계단 (난간 잡고)', value: '1~2 계단' },
      { name: 'Berg 균형 척도', value: '32/56' },
    ],
  },
  {
    date: '2026-04-19',
    mmt: [
      { jointId: 'hip_flexion', side: 'left', grade: 4 },
      { jointId: 'knee_flexion', side: 'left', grade: 3 },
      { jointId: 'ankle_dorsiflexion', side: 'left', grade: 3 },
      { jointId: 'shoulder_flexion', side: 'left', grade: 3 },
    ],
    custom: [
      { name: '보행 거리 (지팡이)', value: '15m' },
      { name: '계단 (난간 잡고)', value: '5 계단' },
      { name: 'Berg 균형 척도', value: '42/56' },
    ],
  },
  {
    date: '2026-05-13',
    mmt: [
      { jointId: 'hip_flexion', side: 'left', grade: 4 },
      { jointId: 'knee_flexion', side: 'left', grade: 4 },
      { jointId: 'ankle_dorsiflexion', side: 'left', grade: 3 },
      { jointId: 'shoulder_flexion', side: 'left', grade: 3 },
    ],
    custom: [
      { name: '보행 거리 (지팡이, 실내)', value: '20m+' },
      { name: '보행 거리 (외부, 보호자 동반)', value: '50m' },
      { name: '계단 (난간 잡고)', value: '10 계단' },
      { name: 'Berg 균형 척도', value: '48/56' },
      { name: '강직 (Modified Ashworth, 좌측 발목)', value: '1' },
    ],
    painMapping: [
      { id: 'shoulder_l', label: '좌측 어깨', pattern: 'weakness', intensity: 2 },
    ],
  },
]

// ─── ICF 분석 1건 (시연 임팩트: 5도메인 풀세트) ─────────────────────────
export const SHOWCASE_ICF_2: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'> = {
  date: '2026-05-13',
  turns: [
    {
      input:
        '63세 여성 가정주부. 좌측 MCA 경색 후 편마비, 발병 4개월차. 가정 내 지팡이 보행 20m 가능, 외부 보행 50m(보호자 동반), 계단 10개 난간 잡고 가능. MMT 좌측 hip flexion 4/5, knee flexion 4/5, ankle DF 3/5, shoulder flexion 3/5. 좌측 발목 강직 Modified Ashworth 1. Berg 균형 48/56. 가벼운 가사(식기 정리, 옷 개기) 일부 재개. 딸이 적극 간병. 욕실 손잡이 미설치 — 환경 개선 권유 중. 의료급여 1종으로 재활 빈도 확보 가능.',
      result: {
        domains: {
          body: [
            '좌측 편마비 — 근력 등급 회복 추세 (hip flexion 4/5, knee 4/5)',
            '좌측 발목 배측굴곡 약화 (MMT 3/5) — foot drop 위험',
            '좌측 발목 경직(spasticity) — Modified Ashworth 1',
            '좌측 견갑대·체간 협응 저하 (shoulder flexion 3/5)',
            '균형 능력 부분 회복 — Berg 48/56',
          ],
          activity: [
            '실내 지팡이 보행 20m 자립',
            '외부 보행 50m (보호자 동반)',
            '계단 오르기 10 계단 (난간 잡고)',
            '식사·세수·옷 입기는 우세손으로 자립',
            '양손 활용 ADL 시도 가능 (옷 개기, 식기 닦기)',
            '글씨 쓰기·정밀 동작은 우세손에 의존',
          ],
          participation: [
            '가정 내 가벼운 가사 일부 재개 — 식기 정리, 옷 개기',
            '외출 시 보호자 동반 필요',
            '교회·사회 모임 미참여 — 외출 부담',
            '아파트 단지 내 보행 가능 (50m)',
          ],
          environment: [
            '딸의 적극적 간병[촉진]',
            '아파트 1층 거주 — 외출 접근성 양호[촉진]',
            '의료급여 1종 — 재활 치료 빈도 확보 가능[촉진]',
            '욕실 손잡이 미설치 — 자세 전환 시 낙상 위험[장벽]',
            '교회 등 사회 모임 장소 접근성 미상[장벽 가능성]',
          ],
          personal: [
            '63세 여성, 우세손(우측) 유지로 ADL 자립도 높음',
            '회복 의지 양호 — 운동 순응도 우수',
            '뇌졸중 발병 전 활발한 사회 활동 (교회·이웃 교류)',
            '고혈압·당뇨 관리 중 — 2차 예방 중요',
            '치료 순응도 높음 — 보호자 교육 잘 수용',
          ],
        },
        redFlags: [],
        coverage: {
          hasGaps: true,
          missingOrWeak: [
            'participation: 사회 활동(교회·이웃) 재개 시점·장벽 미상',
            'environment: 교회 등 외부 시설 접근성·동반자 가능성 미상',
          ],
        },
        followUpQuestion:
          '교회 모임 재개를 위해 차량·동반자가 확보 가능한지 가족과 상의하셨나요? 사회 참여 회복은 환자분의 회복 동기와 직결되며, 50m 보행 가능 단계에서 단계적 외출 빈도를 늘리는 것이 핵심입니다.',
        clinicalNote:
          '가설: 발병 4개월차로 신경학적 회복기 진입 — 좌측 근력 점진 호전(MMT 4/5)과 보행 거리 확장은 양호한 추세. 활동 영역은 가정 내 자립까지 도달, 참여 영역(사회 활동)이 다음 회복 목표. 근거: Berg 48/56(중등도 균형 안정), 가벼운 가사 재개, 양손 활용 ADL 시도, 딸 간병·의료급여 1종 등 환경 촉진 요인 다수. 다음 단계: ① 욕실 손잡이 설치(낙상 예방), ② 외부 보행 빈도 늘리기(아파트 단지 50m → 100m → 외부 시설), ③ 좌측 발목 배측굴곡 강화로 foot drop 예방, ④ 사회 참여 재개(교회 모임 등) 가족 상의.',
      },
    },
  ],
  finalDomains: {
    body: [
      '좌측 편마비 — 근력 등급 회복 추세 (hip flexion 4/5, knee 4/5)',
      '좌측 발목 배측굴곡 약화 (MMT 3/5) — foot drop 위험',
      '좌측 발목 경직(spasticity) — Modified Ashworth 1',
      '좌측 견갑대·체간 협응 저하 (shoulder flexion 3/5)',
      '균형 능력 부분 회복 — Berg 48/56',
    ],
    activity: [
      '실내 지팡이 보행 20m 자립',
      '외부 보행 50m (보호자 동반)',
      '계단 오르기 10 계단 (난간 잡고)',
      '식사·세수·옷 입기는 우세손으로 자립',
      '양손 활용 ADL 시도 가능 (옷 개기, 식기 닦기)',
      '글씨 쓰기·정밀 동작은 우세손에 의존',
    ],
    participation: [
      '가정 내 가벼운 가사 일부 재개 — 식기 정리, 옷 개기',
      '외출 시 보호자 동반 필요',
      '교회·사회 모임 미참여 — 외출 부담',
      '아파트 단지 내 보행 가능 (50m)',
    ],
    environment: [
      '딸의 적극적 간병[촉진]',
      '아파트 1층 거주 — 외출 접근성 양호[촉진]',
      '의료급여 1종 — 재활 치료 빈도 확보 가능[촉진]',
      '욕실 손잡이 미설치 — 자세 전환 시 낙상 위험[장벽]',
      '교회 등 사회 모임 장소 접근성 미상[장벽 가능성]',
    ],
    personal: [
      '63세 여성, 우세손(우측) 유지로 ADL 자립도 높음',
      '회복 의지 양호 — 운동 순응도 우수',
      '뇌졸중 발병 전 활발한 사회 활동 (교회·이웃 교류)',
      '고혈압·당뇨 관리 중 — 2차 예방 중요',
      '치료 순응도 높음 — 보호자 교육 잘 수용',
    ],
  },
  finalNote:
    '가설: 발병 4개월차로 신경학적 회복기 진입 — 좌측 근력 점진 호전(MMT 4/5)과 보행 거리 확장은 양호한 추세. 활동 영역은 가정 내 자립까지 도달, 참여 영역(사회 활동)이 다음 회복 목표. 근거: Berg 48/56, 가벼운 가사 재개, 양손 활용 ADL 시도, 딸 간병·의료급여 1종 등 환경 촉진 요인 다수. 다음 단계: ① 욕실 손잡이 설치(낙상 예방), ② 외부 보행 빈도 늘리기, ③ 좌측 발목 배측굴곡 강화로 foot drop 예방, ④ 사회 참여 재개 가족 상의.',
}
