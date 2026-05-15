import type { PatientInput } from '@/features/patients/domain/types'
import type { TreatmentInput, Exercise } from '@/features/treatments/domain/types'
import type { EvaluationInput } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'

/**
 * 쇼케이스 환자 ① — 회전근개 부분 파열, 봉합술 후 9주차 재활
 *
 * 시연 포인트:
 * - VAS 7 → 3 명확한 호전 곡선
 * - 어깨 외전 ROM 90° → 145° 회복
 * - MMT 3/5 → 4+/5
 * - 미용사 직업 — 머리 위 작업 한계 → 직장 부분 복귀
 * - ICF 5도메인 모두 채워짐
 * - PDF 의뢰서·환자용 요약지 모든 섹션 활성화
 */

export const SHOWCASE_PATIENT_1: Omit<PatientInput, 'therapist'> = {
  name: '쇼케이스_김미영',
  birthDate: '1984-06-20',
  gender: 'female',
  phone: '010-2845-1729',
  address: '서울시 마포구',
  referralRoute: '정형외과 의뢰',
  medicalHistory: [],
  otherMedicalHistory: undefined,
  diagnosis: '우측 어깨 회전근개 부분 파열 (Right Rotator Cuff Partial Tear)',
  surgeryHistory: '2026.02 회전근개 봉합술 (관절경)',
  insurance: 'health',
  notes: '미용사 — 머리 위 작업 다수, 우세손(우측). 빠른 직장 복귀 의지 강함. 봉합부 안정성 4개월차까지 보호 필요.',
  treatmentStartDate: '2026-03-10',
  status: 'readmit',
}

// ─── 치료 기록 10회 ──────────────────────────────────────────────
// 시기별 강도 진행: 수술 회복기(도수+초음파) → 점진적 운동치료 → 능동·저항 운동

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

export const SHOWCASE_TREATMENTS_1: Omit<TreatmentInput, 'patientId'>[] = [
  // ─ 수술 회복 후기 (3주차~5주차): 도수치료 + 초음파, 운동은 소극적 ─
  {
    date: '2026-03-10',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근 (Supraspinatus)', '삼각근 전부 (Anterior deltoid)'] }],
    methods: ['manual', 'ultrasound'],
    methodDetails: {
      manual: '관절가동술 등급 II, 견갑면 수동 외전 가동',
      ultrasound: '1MHz, 1.0W/cm², 5분 — 봉합부 주변',
    },
    exerciseConcept: 'recovery',
    exercises: [ex('펜듈럼 (Pendulum)', undefined, undefined, undefined, 5)],
    homework: '집에서 펜듈럼 하루 2회 10분, 어깨 부목 착용 유지',
    comment: '봉합부 안정. 야간통 호소 — 베개로 어깨 받치도록 안내.',
    flags: ['통증 호소'],
  },
  {
    date: '2026-03-13',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근 (Supraspinatus)'] }],
    methods: ['manual', 'ultrasound', 'thermal'],
    methodDetails: {
      manual: '극상근 연부조직 이완, 견갑대 가동',
      ultrasound: '1MHz, 1.0W/cm², 5분',
      thermal: '온열 10분 (치료 전)',
    },
    exerciseConcept: 'recovery',
    exercises: [ex('펜듈럼', undefined, undefined, undefined, 5), ex('수동 어깨 외전 (Passive abduction)', 2, 10)],
    homework: '펜듈럼 하루 2회 10분, 통증 없는 범위 내 수동 ROM',
    comment: '야간통 약간 호전 (VAS 6). 봉합부 봉합사 제거 양호.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-03-20',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근 (Supraspinatus)', '극하근 (Infraspinatus)'] }],
    methods: ['manual', 'ultrasound', 'exercise'],
    methodDetails: {
      manual: 'Maitland 등급 II~III, 견갑대 정렬',
      ultrasound: '1MHz, 1.0W/cm², 5분',
    },
    exerciseConcept: 'recovery',
    exercises: [
      ex('펜듈럼', undefined, undefined, undefined, 5),
      ex('수동 외전 (Passive abduction)', 3, 10),
      ex('수동 굴곡 (Passive flexion)', 3, 10),
    ],
    homework: '펜듈럼 하루 2회 10분 + 수동 ROM 운동 가족 보조',
    comment: '수동 외전 105°까지 가능. 봉합부 통증 거의 없음.',
    flags: ['컨디션 좋음'],
  },

  // ─ 능동 ROM 도입기 (6~8주차) ─
  {
    date: '2026-04-01',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근 (Supraspinatus)', '삼각근 전부 (Anterior deltoid)'] }],
    methods: ['manual', 'exercise'],
    methodDetails: {
      manual: 'Mulligan MWM, 견갑면 외전',
    },
    exerciseConcept: 'recovery',
    exercises: [
      ex('펜듈럼', undefined, undefined, undefined, 5),
      ex('능동 보조 외전 (Active-assisted abduction)', 3, 12),
      ex('지팡이 운동 (Cane exercise) — 굴곡', 3, 12),
      ex('어깨 후방 스트레칭 (Cross-body stretch)', 3, 15, undefined, undefined),
    ],
    homework: '집에서 능동 보조 외전 하루 2회. 거울 보며 견갑골 정렬 확인.',
    comment: '능동 외전 120°까지 가능. 미용실 일주일 휴진 중.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-04-08',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '소원근 (Teres minor)'] }],
    methods: ['manual', 'exercise', 'electric'],
    methodDetails: {
      manual: 'Maitland 등급 III, 외회전 가동성 강조',
      electric: 'TENS 15분 — 통증 조절',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('능동 외전', 3, 15),
      ex('지팡이 외회전 (ER with cane)', 3, 12),
      ex('어깨 후방 스트레칭', 3, 15),
      ex('isometric 외회전 (벽 누르기)', 3, 10, undefined, undefined),
    ],
    homework: 'isometric 외회전 하루 2회 (벽 누르기 10초씩 10회)',
    comment: '미용실 단발컷 시술 시도 — 5분 시술 후 통증. 점진적 복귀 권유.',
    flags: ['동작 시 통증'],
  },
  {
    date: '2026-04-15',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '견갑하근 (Subscapularis)'] }],
    methods: ['manual', 'exercise'],
    methodDetails: {
      manual: '극하근·견갑하근 dry needling 대체로 도수 이완',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('능동 외전', 3, 15),
      ex('밴드 외회전 (ER with band, light)', 3, 12, 1),
      ex('밴드 내회전 (IR with band, light)', 3, 12, 1),
      ex('견갑 안정화 (Scapular set)', 3, 15),
    ],
    homework: '밴드 운동 하루 1회 — light band, 통증 없는 범위',
    comment: '능동 외전 130°. 미용실 시술 시간 10분까지 가능.',
    flags: ['컨디션 좋음'],
  },

  // ─ 저항·기능 회복기 (8~9주차) ─
  {
    date: '2026-04-22',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '견갑하근', '승모근 중·하부'] }],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: 'Mulligan MWM 외회전 강조',
      task: '미용 시술 자세 시뮬레이션 — 가위 들고 어깨 외전 유지',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('밴드 외회전 (medium)', 3, 12, 2),
      ex('Y-T-W (Prone scapular)', 3, 10),
      ex('펄스 위 들기 (Empty can — 0.5kg)', 3, 10, 0.5),
      ex('견갑 안정화', 3, 15),
    ],
    homework: '밴드 외회전·내회전 하루 1회, 거울 보며 견갑골 안정 확인',
    comment: '시술 시뮬레이션 통과. 30분 이상 작업 시 피로 호소.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-04-29',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '견갑하근', '광배근 (Latissimus dorsi)'] }],
    methods: ['manual', 'exercise'],
    methodDetails: {
      manual: '광배근·승모근 이완',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('밴드 외회전 (medium)', 3, 15, 2),
      ex('Y-T-W', 3, 12),
      ex('펄스 위 들기 (Full can — 1kg)', 3, 10, 1),
      ex('Wall slide (벽면 미끄러뜨리기)', 3, 12),
    ],
    homework: '하루 1회 밴드 운동 + Wall slide. 미용실 시술 30분 이상 시 휴식.',
    comment: '능동 외전 140°, 부분 직장 복귀(주 3일, 단발 위주).',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-05-06',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '견갑하근'] }],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: '극상근 eccentric loading 시연 + 자가 운동 교육',
      task: '미용 시술 시뮬레이션 — 펌·드라이 자세 (어깨 외전 90° 유지)',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('Eccentric loading (3초 하강)', 3, 10, 1.5),
      ex('Y-T-W', 3, 15),
      ex('밴드 외회전 (heavy)', 3, 12, 3),
      ex('Wall slide', 3, 15),
    ],
    homework: 'Eccentric loading 하루 1회 + 밴드 운동. 펌·드라이 시 어깨 통증 시 즉시 휴식.',
    comment: '펌 5분 시술 가능. 드라이는 여전히 통증. 다음 주 평가 예정.',
    flags: ['컨디션 좋음'],
  },
  {
    date: '2026-05-13',
    bodyParts: [{ region: 'shoulder', side: 'right', muscles: ['극상근', '극하근', '견갑하근'] }],
    methods: ['manual', 'exercise', 'task'],
    methodDetails: {
      manual: '견갑대 안정성 평가 — 충돌증후군 무 확인',
      task: '드라이 시뮬레이션 어깨 외전 90~120° 유지 훈련',
    },
    exerciseConcept: 'strength',
    exercises: [
      ex('Eccentric loading', 3, 12, 2),
      ex('밴드 외회전 (heavy)', 3, 15, 3),
      ex('Push-up plus (wall)', 3, 10),
      ex('견갑 안정화 + 외전 holding', 3, 15),
    ],
    homework: '하루 1회 강화 운동, 미용실 작업 시 15분마다 휴식·자세 점검',
    comment: '미용실 풀타임 복귀 검토 가능. 펌·드라이 모두 시술 가능 (통증 미약).',
    flags: ['컨디션 좋음'],
  },
]

// ─── 평가 기록 5회 (VAS 7→3 호전 곡선) ──────────────────────────────────
export const SHOWCASE_EVALUATIONS_1: Omit<EvaluationInput, 'patientId'>[] = [
  {
    date: '2026-03-10',
    vas: 7,
    rom: [
      { jointId: 'shoulder_abduction', side: 'right', active: 90, passive: 110 },
      { jointId: 'shoulder_flexion', side: 'right', active: 100, passive: 120 },
      { jointId: 'shoulder_er', side: 'right', active: 30, passive: 45 },
    ],
    mmt: [
      { jointId: 'shoulder_abduction', side: 'right', grade: 3 },
      { jointId: 'shoulder_er', side: 'right', grade: 3 },
    ],
    bodyMeasurement: [
      { type: 'circumference', location: '우측 견봉 5cm 하방', value: 32.5, unit: 'cm' },
    ],
    painMapping: [
      { id: 'shoulder_r', label: '우측 어깨', pattern: 'sharp', intensity: 7 },
    ],
  },
  {
    date: '2026-03-25',
    vas: 6,
    rom: [
      { jointId: 'shoulder_abduction', side: 'right', active: 105, passive: 125 },
      { jointId: 'shoulder_flexion', side: 'right', active: 115, passive: 135 },
      { jointId: 'shoulder_er', side: 'right', active: 40, passive: 55 },
    ],
    mmt: [
      { jointId: 'shoulder_abduction', side: 'right', grade: 3 },
      { jointId: 'shoulder_er', side: 'right', grade: 3 },
    ],
    painMapping: [
      { id: 'shoulder_r', label: '우측 어깨', pattern: 'sharp', intensity: 6 },
    ],
  },
  {
    date: '2026-04-15',
    vas: 5,
    rom: [
      { jointId: 'shoulder_abduction', side: 'right', active: 125, passive: 140 },
      { jointId: 'shoulder_flexion', side: 'right', active: 135, passive: 150 },
      { jointId: 'shoulder_er', side: 'right', active: 55, passive: 65 },
    ],
    mmt: [
      { jointId: 'shoulder_abduction', side: 'right', grade: 4 },
      { jointId: 'shoulder_er', side: 'right', grade: 4 },
    ],
    bodyMeasurement: [
      { type: 'circumference', location: '우측 견봉 5cm 하방', value: 32.0, unit: 'cm' },
    ],
    painMapping: [
      { id: 'shoulder_r', label: '우측 어깨', pattern: 'sharp', intensity: 4 },
    ],
  },
  {
    date: '2026-04-29',
    vas: 4,
    rom: [
      { jointId: 'shoulder_abduction', side: 'right', active: 140, passive: 155 },
      { jointId: 'shoulder_flexion', side: 'right', active: 150, passive: 165 },
      { jointId: 'shoulder_er', side: 'right', active: 65, passive: 75 },
    ],
    mmt: [
      { jointId: 'shoulder_abduction', side: 'right', grade: 4 },
      { jointId: 'shoulder_er', side: 'right', grade: 4 },
    ],
    painMapping: [
      { id: 'shoulder_r', label: '우측 어깨', pattern: 'custom', customPatternLabel: '둔한 통증', intensity: 3 },
    ],
  },
  {
    date: '2026-05-13',
    vas: 3,
    rom: [
      { jointId: 'shoulder_abduction', side: 'right', active: 150, passive: 165 },
      { jointId: 'shoulder_flexion', side: 'right', active: 165, passive: 175 },
      { jointId: 'shoulder_er', side: 'right', active: 75, passive: 85 },
    ],
    mmt: [
      { jointId: 'shoulder_abduction', side: 'right', grade: 4 },
      { jointId: 'shoulder_er', side: 'right', grade: 4 },
    ],
    bodyMeasurement: [
      { type: 'circumference', location: '우측 견봉 5cm 하방', value: 31.5, unit: 'cm' },
    ],
    painMapping: [
      { id: 'shoulder_r', label: '우측 어깨', pattern: 'custom', customPatternLabel: '둔한 통증', intensity: 2 },
    ],
  },
]

// ─── ICF 분석 1건 (시연용 핵심) ──────────────────────────────────────────
export const SHOWCASE_ICF_1: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'> = {
  date: '2026-05-13',
  turns: [
    {
      input:
        '41세 여성 미용사. 우측 회전근개 부분 파열 후 봉합술(2026.02). 9주차 재활 중. 현재 ROM 외전 150°, MMT 4/5, VAS 3. 미용실 부분 복귀했으며 펌·드라이 시술 모두 가능하나 30분 이상 작업 시 피로 호소. 남편이 가사 적극 분담. 빠른 풀타임 복귀 희망.',
      result: {
        domains: {
          body: [
            '우측 어깨 외전 ROM 150° (Active) — 회복 추세',
            '우측 어깨 외회전 ROM 75° (Active)',
            'MMT 외전 4/5, 외회전 4/5',
            '통증 VAS 3/10 (활동 시)',
            '극상근·극하근 근지구력 저하 (30분 이상 작업 시 피로)',
          ],
          activity: [
            '머리 빗기·세수·옷 입기 자립',
            '5kg 이상 들기 일부 제한',
            '머리 위 작업 30분 지속 후 피로감 발생',
            '펌·드라이 시술 가능 (이전: 5분 시술 후 통증)',
          ],
          participation: [
            '미용실 부분 복귀 — 주 3일, 단발컷 위주에서 펌·드라이까지 확장 가능',
            '풀타임 복귀 시도 단계 — 30분마다 휴식 필요',
            '주말 휴식 유지 권장',
          ],
          environment: [
            '남편의 가사 분담[촉진]',
            '미용실 의자 높이 조절 가능 — 직업 환경 협조[촉진]',
            '예약 손님 많은 환경 — 자율적 휴식 어려움[장벽]',
          ],
          personal: [
            '41세 여성, 미용 경력 15년',
            '빠른 풀타임 복귀에 대한 강한 의지[촉진]',
            '직업 정체성 강함 — 회복 동기 높음[촉진]',
            '운동 순응도 우수 (홈 프로그램 100% 수행)',
          ],
        },
        redFlags: [],
        coverage: {
          hasGaps: false,
          missingOrWeak: [],
        },
        followUpQuestion:
          '미용실에서 30분 이상 시술 시 피로감의 양상이 통증인지 근지구력 한계인지 구체적으로 파악하셨나요? 통증이라면 봉합부 안정성 재검토, 단순 근지구력이라면 직무 특이 endurance 훈련(시술 자세 holding)을 늘리는 방향으로 분기 가능합니다.',
        clinicalNote:
          '가설: 봉합 후 9주차로 구조적 회복은 양호하나 직무 특이 endurance(미용 시술 자세 유지)가 풀타임 복귀의 마지막 관문. 근거: ROM·MMT 모두 기능적 범위 회복(외전 150°, MMT 4/5), 통증 VAS 3까지 호전, 단발컷 시술 가능. 30분 이상에서 피로 호소는 통증보다는 근지구력 한계 가능성. 다음 단계: 시술 자세 task-specific endurance 훈련 추가(어깨 외전 90~120° holding 5분→10분→15분 점진), 견갑대 안정성 강화 지속(Y-T-W 무게 증진), 4주 후 풀타임 복귀 평가.',
      },
    },
  ],
  finalDomains: {
    body: [
      '우측 어깨 외전 ROM 150° (Active) — 회복 추세',
      '우측 어깨 외회전 ROM 75° (Active)',
      'MMT 외전 4/5, 외회전 4/5',
      '통증 VAS 3/10 (활동 시)',
      '극상근·극하근 근지구력 저하 (30분 이상 작업 시 피로)',
    ],
    activity: [
      '머리 빗기·세수·옷 입기 자립',
      '5kg 이상 들기 일부 제한',
      '머리 위 작업 30분 지속 후 피로감 발생',
      '펌·드라이 시술 가능 (이전: 5분 시술 후 통증)',
    ],
    participation: [
      '미용실 부분 복귀 — 주 3일, 단발컷 위주에서 펌·드라이까지 확장 가능',
      '풀타임 복귀 시도 단계 — 30분마다 휴식 필요',
      '주말 휴식 유지 권장',
    ],
    environment: [
      '남편의 가사 분담[촉진]',
      '미용실 의자 높이 조절 가능 — 직업 환경 협조[촉진]',
      '예약 손님 많은 환경 — 자율적 휴식 어려움[장벽]',
    ],
    personal: [
      '41세 여성, 미용 경력 15년',
      '빠른 풀타임 복귀에 대한 강한 의지[촉진]',
      '직업 정체성 강함 — 회복 동기 높음[촉진]',
      '운동 순응도 우수 (홈 프로그램 100% 수행)',
    ],
  },
  finalNote:
    '가설: 봉합 후 9주차로 구조적 회복은 양호하나 직무 특이 endurance(미용 시술 자세 유지)가 풀타임 복귀의 마지막 관문. 근거: ROM·MMT 모두 기능적 범위 회복(외전 150°, MMT 4/5), 통증 VAS 3까지 호전, 단발컷 시술 가능. 다음 단계: 시술 자세 task-specific endurance 훈련 추가(어깨 외전 90~120° holding 5분→10분→15분 점진), 견갑대 안정성 강화 지속, 4주 후 풀타임 복귀 평가.',
}
