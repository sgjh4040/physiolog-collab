import type { PatientInput } from '@/features/patients/domain/types'
import type { TreatmentInput, Exercise } from '@/features/treatments/domain/types'
import type { EvaluationInput } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'

/**
 * 풀 시드 환자 10명 — 다양한 진단군의 임상 fixture.
 *
 * 기존 자동 생성 시드(random methodDetails·exercises) 대체.
 * 각 환자에 치료 4~5건 + 평가 2~3건 + 일부는 ICF 분석 1건.
 *
 * 진단 다양성:
 * - 신경계: 척추관 협착증·CTS·좌골신경통·경추간판탈출증
 * - 어깨/상지: 오십견·어깨충돌증후군
 * - 하지/스포츠: 발목 염좌
 * - 퇴행성: 무릎 관절염
 * - 척추: 허리 디스크·만성 요통
 *
 * ICF 분석 풍부화 4명: 척추관 협착증·CTS·만성 요통·오십견
 * (직업·환경·심리 영역까지 5도메인 풍부)
 */

export type RichSeedBundle = {
  patient: Omit<PatientInput, 'therapist'>
  treatments: Omit<TreatmentInput, 'patientId'>[]
  evaluations: Omit<EvaluationInput, 'patientId'>[]
  icfAssessment?: Omit<IcfAssessment, 'id' | 'patientId' | 'createdAt'>
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

// ─── 1. 김철수 67세 남 — 척추관 협착증 (Spinal Stenosis) ──────────────
const PT_1_SPINAL_STENOSIS: RichSeedBundle = {
  patient: {
    name: '김철수',
    birthDate: '1959-03-12',
    gender: 'male',
    phone: '010-2451-8836',
    address: '서울시 강북구',
    referralRoute: '정형외과 의뢰',
    medicalHistory: ['고혈압'],
    otherMedicalHistory: undefined,
    diagnosis: '요추 척추관 협착증 (Lumbar Spinal Stenosis L4-5)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '보행성 파행(neurogenic claudication) — 100m 이상 보행 시 양측 하지 저림·무력감. 앉으면 호전. 은퇴 후 등산 취미.',
    treatmentStartDate: '2026-03-20',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-03-20',
      bodyParts: [{ region: 'lumbar', muscles: ['요방형근 (Quadratus lumborum)', '척추기립근 (Erector spinae)'] }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '요추 굴곡 가동, 척추기립근 이완',
        electric: 'TENS 15분 — 양측 L4 분포',
        thermal: '온열 10분 (치료 전)',
      },
      exerciseConcept: 'recovery',
      exercises: [ex('Pelvic tilt (Posterior)', 3, 10), ex('Knee-to-chest (양측)', 3, 10, undefined, 10)],
      homework: '집에서 무릎 가슴 운동 하루 2회. 등산 잠시 보류.',
      comment: '신경학 검사: SLR 음성, 발등 감각 약간 둔함. 보행 검사 100m에서 다리 저림 발생.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-03',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'electric', 'exercise'],
      methodDetails: {
        manual: 'McKenzie 굴곡 편향 — 요추 굴곡 시 호전',
        electric: 'TENS 20분',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Pelvic tilt', 3, 12),
        ex('Cat-camel', 3, 10),
        ex('Bird-dog (보조)', 3, 8),
        ex('자전거 페달 (안장 낮춤)', undefined, undefined, undefined, 10),
      ],
      homework: '실내 자전거 하루 10분 (앉아서). 통증 없는 범위.',
      comment: '굴곡 편향 명확. 자전거 10분 통증 없음.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-17',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        manual: 'Mulligan SNAGs L4-5',
        task: '쇼핑카트 보행 시뮬레이션 (몸 살짝 기울임 — 굴곡 자세 유지)',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Bird-dog', 3, 10),
        ex('Glute bridge', 3, 12),
        ex('자전거', undefined, undefined, undefined, 15),
        ex('보행 훈련 (쇼핑카트 자세)', undefined, undefined, undefined, 10),
      ],
      homework: '쇼핑카트 자세 보행 하루 2회. 외출 시 카트 활용.',
      comment: '보행 거리 200m까지 가능 (쇼핑카트 사용 시).',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-01',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }, { region: 'knee' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '요추 굴곡 가동 + 고관절 가동성',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Dead bug', 3, 10),
        ex('Glute bridge (single leg, 보조)', 3, 8),
        ex('자전거', undefined, undefined, undefined, 20),
        ex('Mini-squat (벽 짚고)', 3, 12),
      ],
      homework: '자전거 20분 매일. 일반 보행은 짧게 자주.',
      comment: '보행 300m 가능 (천천히). 등산은 보류 중.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-12',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        manual: '요추 가동성 + 흉추 신전 가동',
        task: '계단 오르내리기 — 5층 (난간 잡고)',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Bird-dog', 3, 12),
        ex('자전거', undefined, undefined, undefined, 25),
        ex('계단 오르기', 3, undefined, undefined, undefined),
        ex('체중부하 보행 (가방 1kg)', undefined, undefined, undefined, 10),
      ],
      homework: '자전거 25분 + 계단 사용 권장. 등산은 1개월 후 짧은 코스부터.',
      comment: '500m 보행 가능. 자전거 25분 무통. 다음 단계 — 등산 복귀 계획.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-03-20',
      vas: 6,
      rom: [
        { jointId: 'lumbar_flexion', active: 50, passive: 60 },
        { jointId: 'lumbar_extension', active: 10, passive: 20 },
      ],
      custom: [
        { name: '보행 거리 (통증 발생 전)', value: '약 100m' },
        { name: 'SLR (Straight Leg Raise)', value: '음성, 양측' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'tingling', intensity: 6 },
        { id: 'quadriceps_r', label: '우측 허벅지 앞', pattern: 'paresthesia', intensity: 5 },
        { id: 'quadriceps_l', label: '좌측 허벅지 앞', pattern: 'paresthesia', intensity: 4 },
      ],
    },
    {
      date: '2026-04-17',
      vas: 4,
      rom: [
        { jointId: 'lumbar_flexion', active: 60, passive: 70 },
        { jointId: 'lumbar_extension', active: 15, passive: 25 },
      ],
      custom: [
        { name: '보행 거리 (쇼핑카트 사용)', value: '약 200m' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'tingling', intensity: 4 },
        { id: 'quadriceps_r', label: '우측 허벅지 앞', pattern: 'paresthesia', intensity: 3 },
      ],
    },
    {
      date: '2026-05-12',
      vas: 3,
      rom: [
        { jointId: 'lumbar_flexion', active: 70, passive: 80 },
        { jointId: 'lumbar_extension', active: 20, passive: 30 },
      ],
      custom: [
        { name: '보행 거리 (평지, 천천히)', value: '약 500m' },
        { name: '자전거 무통 시간', value: '25분 이상' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'tingling', intensity: 3 },
      ],
    },
  ],
  icfAssessment: {
    date: '2026-05-12',
    turns: [{
      input: '67세 남성, 요추 척추관 협착증. 보행성 파행 — 초기 100m → 현재 500m 가능. 자전거 25분 무통. 은퇴 후 등산 취미 — 현재 보류 중. 고혈압 관리 중. 본인 의지 양호.',
      result: {
        domains: {
          body: [
            '요추 굴곡 ROM 70° (Active) — 회복 추세',
            '요추 신전 ROM 20° — 협착증 특성상 제한 지속',
            '양측 하지 paresthesia 호전 (intensity 5→3)',
            '통증 VAS 3/10 (활동 시)',
          ],
          activity: [
            '평지 보행 500m 가능 (이전 100m)',
            '실내 자전거 25분 무통',
            '쇼핑카트 활용 시 보행 거리 ↑ (굴곡 자세 효과)',
            '계단 5층 오르내리기 가능 (난간 잡고)',
          ],
          participation: [
            '일상 외출·쇼핑 가능 (보행 거리 회복)',
            '은퇴 후 등산 취미 미복귀 (다음 1~2개월 후 짧은 코스부터)',
            '본인 일상 자립',
          ],
          environment: [
            '쇼핑카트·실내 자전거 사용 가능[촉진]',
            '서울시 강북구 — 산악 지형 접근성 양호하지만 등산 보류[현재 장벽]',
            '건강보험 — 재활 빈도 확보[촉진]',
          ],
          personal: [
            '67세 남성, 은퇴',
            '등산·체력 회복 의지 강함[촉진]',
            '운동 순응도 우수 (자전거 매일)',
            '고혈압 관리 중 — 2차 예방 고려',
          ],
        },
        redFlags: [],
        coverage: { hasGaps: false, missingOrWeak: [] },
        followUpQuestion: '등산 복귀를 위한 단계적 부하 계획(거리·고도) 수립하셨나요? 척추관 협착증 특성상 굴곡 자세 유리하므로 산악 자세에서의 보행 패턴 점검이 필요합니다.',
        clinicalNote: '가설: 척추관 협착증 6주차 — 굴곡 편향 기반 보존 치료에 양호한 반응. 보행 거리 100→500m, VAS 6→3 호전. 근거: McKenzie 굴곡 편향·자전거 활용·쇼핑카트 자세로 신경 공간 확보. 다음 단계: 등산 복귀 단계 계획 (평지 산책 → 짧은 등산로 → 가벼운 산악), 흉추 신전 가동성·고관절 강화로 요추 부하 분산 지속.',
      },
    }],
    finalDomains: {
      body: [
        '요추 굴곡 ROM 70° (Active) — 회복 추세',
        '요추 신전 ROM 20° — 협착증 특성상 제한 지속',
        '양측 하지 paresthesia 호전 (intensity 5→3)',
        '통증 VAS 3/10 (활동 시)',
      ],
      activity: [
        '평지 보행 500m 가능 (이전 100m)',
        '실내 자전거 25분 무통',
        '쇼핑카트 활용 시 보행 거리 ↑ (굴곡 자세 효과)',
        '계단 5층 오르내리기 가능 (난간 잡고)',
      ],
      participation: [
        '일상 외출·쇼핑 가능 (보행 거리 회복)',
        '은퇴 후 등산 취미 미복귀 (다음 1~2개월 후 짧은 코스부터)',
        '본인 일상 자립',
      ],
      environment: [
        '쇼핑카트·실내 자전거 사용 가능[촉진]',
        '서울시 강북구 — 산악 지형 접근성 양호하지만 등산 보류[현재 장벽]',
        '건강보험 — 재활 빈도 확보[촉진]',
      ],
      personal: [
        '67세 남성, 은퇴',
        '등산·체력 회복 의지 강함[촉진]',
        '운동 순응도 우수 (자전거 매일)',
        '고혈압 관리 중 — 2차 예방 고려',
      ],
    },
    finalNote: '가설: 척추관 협착증 6주차 — 굴곡 편향 기반 보존 치료에 양호한 반응. 보행 거리 100→500m, VAS 6→3 호전. 근거: McKenzie 굴곡 편향·자전거 활용·쇼핑카트 자세로 신경 공간 확보. 다음 단계: 등산 복귀 단계 계획, 흉추 신전 가동성·고관절 강화로 요추 부하 분산 지속.',
  },
}

// ─── 2. 이영희 52세 여 — 허리 디스크 (HIVD L4-5) ──────────────────────
const PT_2_LUMBAR_DISC: RichSeedBundle = {
  patient: {
    name: '이영희',
    birthDate: '1974-08-25',
    gender: 'female',
    phone: '010-3829-4456',
    address: '서울시 송파구',
    referralRoute: '정형외과 의뢰',
    medicalHistory: [],
    otherMedicalHistory: undefined,
    diagnosis: '요추 추간판 탈출증 L4-5 (HIVD L4-5)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '주부, 가사·육아. 좌측 하지 방사통(좌측 종아리까지). 기침·재채기 시 악화. 12주 보존 치료 중.',
    treatmentStartDate: '2026-02-25',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-02-25',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip', side: 'left' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '요추 견인 + 좌측 이상근(piriformis) 이완',
        electric: 'TENS 15분',
        thermal: '온열 10분',
      },
      exerciseConcept: 'recovery',
      exercises: [ex('McKenzie 신전 (prone press-up)', 3, 8), ex('Knee-to-chest (우측)', 3, 10)],
      homework: 'McKenzie 신전 운동 하루 5회, 통증 없는 범위.',
      comment: 'SLR 좌측 35° 양성. 종아리까지 방사통 명확.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-03-18',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip', side: 'left' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: 'Mulligan SNAGs + 신경가동(neural mobilization)',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('McKenzie 신전', 3, 10),
        ex('Glute bridge', 3, 12),
        ex('Cat-camel', 3, 10),
        ex('Pelvic tilt', 3, 15),
      ],
      homework: 'Glute bridge + McKenzie 신전 하루 1회.',
      comment: 'SLR 좌측 55°로 개선. 종아리 저림 강도 ↓',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-15',
      bodyParts: [{ region: 'lumbar' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        task: '집안일 자세 시뮬레이션 — 청소기·빨래바구니 들기',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Plank (수정형, 무릎 닿게)', 3, undefined, undefined, undefined),
        ex('Bird-dog', 3, 10),
        ex('Side-lying clam', 3, 12),
        ex('Dead bug', 3, 8),
      ],
      homework: '체간 운동 하루 1회. 무거운 거 들 때 무릎 굽혀 들기.',
      comment: '가사 일부 재개. 청소기 1시간 가능. 빨래바구니는 두 번 나눠서.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '체간 안정성 평가 + 흉추 회전 가동',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Plank (full)', 3, undefined, undefined, 30),
        ex('Bird-dog', 3, 12),
        ex('Glute bridge (single leg)', 3, 10),
        ex('Russian twist (가벼움)', 3, 12, 1),
      ],
      homework: '주 3회 체간 운동 지속. 좌식 30분 이상 피하기.',
      comment: 'SLR 좌측 75°. 종아리 저림 거의 소실. 일상 가사 복귀.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-02-25',
      vas: 7,
      rom: [
        { jointId: 'lumbar_flexion', active: 40, passive: 55 },
        { jointId: 'lumbar_extension', active: 15, passive: 25 },
      ],
      custom: [
        { name: 'SLR (좌측)', value: '35° 양성' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'radiating', intensity: 7 },
        { id: 'calf_l', label: '좌측 종아리', pattern: 'tingling', intensity: 5 },
      ],
    },
    {
      date: '2026-04-15',
      vas: 4,
      rom: [
        { jointId: 'lumbar_flexion', active: 65, passive: 80 },
        { jointId: 'lumbar_extension', active: 20, passive: 30 },
      ],
      custom: [
        { name: 'SLR (좌측)', value: '60° 음성' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'radiating', intensity: 4 },
        { id: 'calf_l', label: '좌측 종아리', pattern: 'tingling', intensity: 2 },
      ],
    },
    {
      date: '2026-05-13',
      vas: 2,
      rom: [
        { jointId: 'lumbar_flexion', active: 75, passive: 90 },
        { jointId: 'lumbar_extension', active: 25, passive: 35 },
      ],
      custom: [
        { name: 'SLR (좌측)', value: '75° 음성' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 2 },
      ],
    },
  ],
}

// ─── 3. 박지훈 38세 남 — 손목터널증후군 (CTS, 우측) ────────────────────
const PT_3_CTS: RichSeedBundle = {
  patient: {
    name: '박지훈',
    birthDate: '1988-11-04',
    gender: 'male',
    phone: '010-5512-2098',
    address: '경기도 분당',
    referralRoute: '정형외과 의뢰',
    medicalHistory: [],
    otherMedicalHistory: undefined,
    diagnosis: '우측 손목터널증후군 (Right Carpal Tunnel Syndrome)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: 'IT 개발자, 하루 10시간 키보드·마우스 사용. 우세손(우). 야간 paresthesia 흔함 — 새벽에 손 저림으로 깨짐. 운동 부족.',
    treatmentStartDate: '2026-04-01',
    status: 'new',
  },
  treatments: [
    {
      date: '2026-04-01',
      bodyParts: [{ region: 'wrist', side: 'right' }, { region: 'cervical' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '횡수근인대(transverse carpal ligament) 도수 이완 + 중수신경 활주',
        electric: 'TENS 손목 15분',
        thermal: '온열 10분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Median nerve gliding (신경가동)', 3, 10),
        ex('손목 굴곡·신전 스트레칭', 3, 15),
      ],
      homework: '근무 중 1시간마다 손목 스트레칭 3분. 야간 손목 부목 착용.',
      comment: 'Phalen·Tinel 양성. 엄지·검지·중지 paresthesia.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-15',
      bodyParts: [{ region: 'wrist', side: 'right' }, { region: 'cervical' }, { region: 'shoulder', side: 'right' }],
      methods: ['manual', 'exercise', 'electric'],
      methodDetails: {
        manual: 'Maitland 등급 II — 손목 + 흉곽출구 평가',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Median nerve gliding', 3, 12),
        ex('Wrist extensor 강화 (밴드)', 3, 12, 1),
        ex('어깨 견갑 후인 (scapular retraction)', 3, 15),
        ex('흉추 신전 (foam roller)', 3, undefined, undefined, 5),
      ],
      homework: '책상 자세 교정 — 모니터 높이·키보드 위치. 마우스는 수직형 추천.',
      comment: '야간 paresthesia 빈도 감소 (5회→2회). 부목 착용 잘 함.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-29',
      bodyParts: [{ region: 'wrist', side: 'right' }, { region: 'shoulder', side: 'right' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        manual: '손목 + 견갑대 통합 평가',
        task: '키보드·마우스 사용 자세 교정 + 1시간 작업 후 손목 회전',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Median nerve gliding', 3, 15),
        ex('Wrist flexor·extensor 강화', 3, 15, 1),
        ex('어깨 외회전 강화 (밴드)', 3, 12, 2),
        ex('Push-up plus (wall)', 3, 12),
      ],
      homework: '회사에서 1시간마다 알람 — 손목 스트레칭 + 어깨 후인 1분.',
      comment: '야간 깨는 빈도 주 1회로 감소. 키보드 작업 통증 없음.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'wrist', side: 'right' }, { region: 'cervical' }, { region: 'shoulder', side: 'right' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '경추-흉곽-손목 연쇄 통합 — 작업 자세 영향',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Median nerve gliding', 3, 15),
        ex('Wrist 강화 (덤벨)', 3, 12, 2),
        ex('Y-T-W (Prone scapular)', 3, 10),
        ex('흉추 신전 + 회전', 3, 10),
      ],
      homework: '주 3회 운동 지속. 야간 부목은 paresthesia 완전 소실까지.',
      comment: '야간 깨는 빈도 0회. 통증 VAS 2. 부분 종결 검토 — 자가 관리로 전환.',
      flags: ['컨디션 좋음', '재활 적극'],
    },
  ],
  evaluations: [
    {
      date: '2026-04-01',
      vas: 6,
      rom: [
        { jointId: 'wrist_flexion', side: 'right', active: 65, passive: 75 },
        { jointId: 'wrist_extension', side: 'right', active: 55, passive: 70 },
      ],
      mmt: [
        { jointId: 'wrist_flexion', side: 'right', grade: 4 },
      ],
      custom: [
        { name: 'Phalen test (우측)', value: '양성 (30초 내 저림)' },
        { name: 'Tinel sign (우측)', value: '양성' },
        { name: '야간 paresthesia 빈도', value: '주 5회 이상' },
      ],
      painMapping: [
        { id: 'hand_r', label: '우측 손', pattern: 'paresthesia', intensity: 6 },
      ],
    },
    {
      date: '2026-04-29',
      vas: 4,
      rom: [
        { jointId: 'wrist_flexion', side: 'right', active: 75, passive: 85 },
        { jointId: 'wrist_extension', side: 'right', active: 65, passive: 80 },
      ],
      mmt: [
        { jointId: 'wrist_flexion', side: 'right', grade: 4 },
      ],
      custom: [
        { name: '야간 paresthesia 빈도', value: '주 1회' },
      ],
      painMapping: [
        { id: 'hand_r', label: '우측 손', pattern: 'paresthesia', intensity: 3 },
      ],
    },
    {
      date: '2026-05-13',
      vas: 2,
      rom: [
        { jointId: 'wrist_flexion', side: 'right', active: 80, passive: 90 },
        { jointId: 'wrist_extension', side: 'right', active: 75, passive: 85 },
      ],
      mmt: [
        { jointId: 'wrist_flexion', side: 'right', grade: 5 },
      ],
      custom: [
        { name: '야간 paresthesia 빈도', value: '0회 (주간 가끔)' },
      ],
      painMapping: [
        { id: 'hand_r', label: '우측 손', pattern: 'paresthesia', intensity: 2 },
      ],
    },
  ],
  icfAssessment: {
    date: '2026-05-13',
    turns: [{
      input: '38세 남성 IT 개발자, 우측 손목터널증후군. 6주 치료로 야간 paresthesia 5회→0회, VAS 6→2. 키보드 작업 통증 없음. 본인 작업 자세 교정 적극. 운동 부족이 위험인자.',
      result: {
        domains: {
          body: [
            '우측 손목 굴곡 ROM 80° (Active) — 회복 추세',
            'Phalen·Tinel test 양성 → 음성 전환',
            'Median nerve 가동성 개선',
            '통증 VAS 2/10',
            '주간 paresthesia 잔존 (정밀 작업 시)',
          ],
          activity: [
            '키보드·마우스 사용 통증 없음 (이전: 1시간 후 통증)',
            '야간 수면 정상화 — 깨는 빈도 0회',
            '운전·일상 동작 자립',
          ],
          participation: [
            'IT 개발 업무 정상 복귀 — 10시간 작업 가능',
            '1시간마다 휴식 자율적 수행',
            '운동 부족 — 사회·여가 활동 미보고',
          ],
          environment: [
            '수직 마우스·키보드 트레이 도입[촉진]',
            '회사 자율 휴식 가능[촉진]',
            '재택근무 옵션 부분 활용[촉진]',
            '운동 환경(체육관) 미활용[장벽]',
          ],
          personal: [
            '38세 남성 IT 개발자',
            '자가 관리 의지 강함 — 작업 자세 교정 적극',
            '운동 부족 — 위험 인자',
            '치료 순응도 우수 (홈 프로그램 100%)',
          ],
        },
        redFlags: [],
        coverage: { hasGaps: true, missingOrWeak: ['participation: 운동·여가 활동 부재'] },
        followUpQuestion: '재발 예방을 위한 정기 운동 루틴(주 2~3회) 도입 가능한 시간대가 있나요? 환자분 작업 시간이 길어 운동 부족이 향후 재발 위험 인자입니다.',
        clinicalNote: '가설: CTS 6주차 — 보존 치료에 양호한 반응. 작업 자세 교정·median nerve 가동·야간 부목 조합 효과적. VAS 6→2, 야간 paresthesia 0회 도달. 근거: 직업 환경 개선[촉진]·본인 순응도 우수·환자 자가 작업 자세 인식. 다음 단계: 자가 관리로 전환, 운동 부족 [장벽] 해소 (주 2~3회 어깨·체간 운동), 3개월 후 재평가.',
      },
    }],
    finalDomains: {
      body: [
        '우측 손목 굴곡 ROM 80° (Active) — 회복 추세',
        'Phalen·Tinel test 양성 → 음성 전환',
        'Median nerve 가동성 개선',
        '통증 VAS 2/10',
        '주간 paresthesia 잔존 (정밀 작업 시)',
      ],
      activity: [
        '키보드·마우스 사용 통증 없음',
        '야간 수면 정상화',
        '운전·일상 동작 자립',
      ],
      participation: [
        'IT 개발 업무 정상 복귀 — 10시간 작업 가능',
        '1시간마다 휴식 자율적 수행',
        '운동 부족 — 사회·여가 활동 미보고',
      ],
      environment: [
        '수직 마우스·키보드 트레이 도입[촉진]',
        '회사 자율 휴식 가능[촉진]',
        '재택근무 옵션 부분 활용[촉진]',
        '운동 환경(체육관) 미활용[장벽]',
      ],
      personal: [
        '38세 남성 IT 개발자',
        '자가 관리 의지 강함',
        '운동 부족 — 위험 인자',
        '치료 순응도 우수',
      ],
    },
    finalNote: '가설: CTS 6주차 — 보존 치료에 양호한 반응. VAS 6→2, 야간 paresthesia 0회. 근거: 직업 환경 개선·본인 순응도 우수. 다음 단계: 자가 관리 전환, 운동 부족 해소(주 2~3회 어깨·체간), 3개월 후 재평가.',
  },
}

// ─── 4. 최수민 28세 여 — 우측 발목 외측 염좌 ────────────────────────
const PT_4_ANKLE: RichSeedBundle = {
  patient: {
    name: '최수민',
    birthDate: '1998-05-19',
    gender: 'female',
    phone: '010-7723-5119',
    address: '서울시 마포구',
    referralRoute: '응급실 의뢰',
    medicalHistory: [],
    otherMedicalHistory: undefined,
    diagnosis: '우측 발목 외측 인대 염좌 (Right Lateral Ankle Sprain Grade II, ATFL)',
    surgeryHistory: undefined,
    insurance: 'private',
    notes: '회사원, 주말 농구 동호회. 점프 착지 시 발목 안쪽으로 꺾임. 부종·멍 심함. 사회 활동 적극.',
    treatmentStartDate: '2026-04-08',
    status: 'new',
  },
  treatments: [
    {
      date: '2026-04-08',
      bodyParts: [{ region: 'ankle', side: 'right' }],
      methods: ['manual', 'thermal', 'electric'],
      methodDetails: {
        manual: 'PRICE 적용 (Protection·Rest·Ice·Compression·Elevation)',
        thermal: '냉찜질 15분',
        electric: 'TENS 15분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Toe pumping (능동 발가락)', 3, 20),
        ex('Ankle alphabet (능동 ROM)', 3, undefined, undefined, 3),
      ],
      homework: 'PRICE 지속. 체중부하 최소화. 부종 줄을 때까지 압박붕대.',
      comment: '부종 +++, 외측 ATFL 압통. 체중부하 불가. 목발 보조.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-22',
      bodyParts: [{ region: 'ankle', side: 'right' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: 'Mulligan MWM 발목 가동성',
      },
      exerciseConcept: 'balance',
      exercises: [
        ex('수동 배측굴곡·저측굴곡', 3, 15),
        ex('체중부하 calf raise (양발, 보조)', 3, 10),
        ex('Towel curl (수건 잡기)', 3, 15),
        ex('한 발 서기 (우측, 안정 표면)', 3, undefined, undefined, 10),
      ],
      homework: '한 발 서기 하루 2회, 안전한 곳에서.',
      comment: '부종 ++. 체중부하 50% 가능. 정상 보행 시도.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-06',
      bodyParts: [{ region: 'ankle', side: 'right' }, { region: 'knee', side: 'right' }],
      methods: ['exercise', 'task'],
      methodDetails: {
        task: '점프 착지 시뮬레이션 — 양발 → 우측 한 발',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('단일 발 서기 (BOSU 또는 쿠션)', 3, undefined, undefined, 30),
        ex('Heel raise (단발)', 3, 15),
        ex('Lunge', 3, 10),
        ex('Mini hop (전방·측방)', 3, 10),
      ],
      homework: '점프·착지 운동 하루 1회. 농구는 다음 평가 후 결정.',
      comment: '부종 +. 점프 착지 안정. 단발 서기 30초 가능.',
      flags: ['컨디션 좋음', '재활 적극'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'ankle', side: 'right' }],
      methods: ['exercise', 'task'],
      methodDetails: {
        task: '농구 복귀 평가 — 측방 cutting, 점프 슛 동작',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Single leg hop (전방·측방)', 3, 10),
        ex('Lateral shuffle', 3, undefined, undefined, 30),
        ex('Cutting drill', 3, 5),
        ex('Plyometric box jump', 3, 8),
      ],
      homework: '농구 동호회 가벼운 시범 경기 가능. 통증·불안 시 즉시 중단.',
      comment: 'Cutting·점프 모두 안정. 농구 복귀 OK. 외측 발목 안정성 평가 추가 권유.',
      flags: ['컨디션 좋음', '재활 적극'],
    },
  ],
  evaluations: [
    {
      date: '2026-04-08',
      vas: 7,
      rom: [
        { jointId: 'ankle_dorsiflexion', side: 'right', active: 10, passive: 15 },
        { jointId: 'ankle_plantarflexion', side: 'right', active: 30, passive: 40 },
      ],
      bodyMeasurement: [
        { type: 'circumference', location: '우측 발목 외과', value: 28.5, unit: 'cm' },
        { type: 'circumference', location: '좌측 발목 외과 (대조)', value: 24.0, unit: 'cm' },
      ],
      custom: [
        { name: '체중부하', value: '불가 (목발 사용)' },
      ],
      painMapping: [
        { id: 'ankle_r', label: '우측 발목 외측', pattern: 'sharp', intensity: 7 },
      ],
    },
    {
      date: '2026-04-22',
      vas: 4,
      rom: [
        { jointId: 'ankle_dorsiflexion', side: 'right', active: 15, passive: 20 },
        { jointId: 'ankle_plantarflexion', side: 'right', active: 40, passive: 50 },
      ],
      bodyMeasurement: [
        { type: 'circumference', location: '우측 발목 외과', value: 26.5, unit: 'cm' },
      ],
      custom: [
        { name: '체중부하', value: '50% 가능' },
      ],
    },
    {
      date: '2026-05-13',
      vas: 1,
      rom: [
        { jointId: 'ankle_dorsiflexion', side: 'right', active: 20, passive: 25 },
        { jointId: 'ankle_plantarflexion', side: 'right', active: 45, passive: 55 },
      ],
      bodyMeasurement: [
        { type: 'circumference', location: '우측 발목 외과', value: 24.5, unit: 'cm' },
      ],
      custom: [
        { name: '단발 서기 시간', value: '30초+' },
        { name: 'Single leg hop', value: '안정 (cutting OK)' },
      ],
    },
  ],
}

// ─── 5. 정민호 45세 남 — 경추간판탈출증 (HIVD C5-6) ────────────────────
const PT_5_CERVICAL_DISC: RichSeedBundle = {
  patient: {
    name: '정민호',
    birthDate: '1981-09-08',
    gender: 'male',
    phone: '010-4456-7723',
    address: '서울시 강남구',
    referralRoute: '신경외과 의뢰',
    medicalHistory: [],
    otherMedicalHistory: undefined,
    diagnosis: '경추 추간판 탈출증 C5-6 (Cervical HIVD C5-6)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '회계사, 사무직. 우측 견갑·상완 방사통. 야간 통증 일부. 모니터 작업 자세 영향.',
    treatmentStartDate: '2026-03-15',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-03-15',
      bodyParts: [{ region: 'cervical' }, { region: 'shoulder', side: 'right' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '경추 견인 + 견갑거근(levator scapulae) 이완',
        electric: 'TENS 경추 분포 15분',
        thermal: '온열 10분',
      },
      exerciseConcept: 'recovery',
      exercises: [ex('Chin tuck', 3, 10), ex('경추 등길이 신장', 3, 15)],
      homework: 'Chin tuck 회사에서 시간마다. 베개 높이 조정.',
      comment: 'Spurling test 우측 양성. C6 분포 방사통.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-05',
      bodyParts: [{ region: 'cervical' }, { region: 'shoulder', side: 'right' }, { region: 'thoracic' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: 'Maitland 등급 II — C5-6, 흉추 신전 가동',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Chin tuck', 3, 15),
        ex('견갑 후인 (Scapular retraction)', 3, 15),
        ex('흉추 신전 (foam roller)', 3, undefined, undefined, 5),
        ex('Median nerve gliding (우측)', 3, 10),
      ],
      homework: '재택 근무 자세 점검. 모니터 눈높이 + 키보드 가깝게.',
      comment: 'Spurling test 우측 음성. 방사통 강도 ↓.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-26',
      bodyParts: [{ region: 'cervical' }, { region: 'shoulder', side: 'right' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        manual: '심부 경부 굴곡근(deep cervical flexor) 활성화',
        task: '회계 업무 자세 시뮬레이션 — 모니터·문서 동시 사용',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Deep cervical flexor 강화', 3, 10),
        ex('Y-T-W (Prone)', 3, 10),
        ex('Push-up plus (wall)', 3, 12),
        ex('흉추 회전 (Open book)', 3, 10),
      ],
      homework: '책상 자세 + 시간마다 chin tuck.',
      comment: '회사 풀타임 복귀. 모니터 작업 4~5시간 통증 없음.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-12',
      bodyParts: [{ region: 'cervical' }, { region: 'thoracic' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '경추-흉추 통합 가동성',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Deep cervical flexor', 3, 12),
        ex('Y-T-W', 3, 12),
        ex('흉추 회전', 3, 12),
        ex('Plank', 3, undefined, undefined, 45),
      ],
      homework: '주 3회 운동 지속. 재발 시 즉시 내원.',
      comment: '통증 VAS 1. 정상 업무 복귀. 자가 관리 전환.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-03-15',
      vas: 6,
      rom: [
        { jointId: 'cervical_flexion', active: 35, passive: 45 },
        { jointId: 'cervical_rotation', side: 'right', active: 55, passive: 70 },
      ],
      custom: [
        { name: 'Spurling test (우측)', value: '양성' },
      ],
      painMapping: [
        { id: 'neck', label: '목', pattern: 'sharp', intensity: 6 },
        { id: 'biceps_r', label: '우측 상완', pattern: 'radiating', intensity: 5 },
      ],
    },
    {
      date: '2026-05-12',
      vas: 1,
      rom: [
        { jointId: 'cervical_flexion', active: 50, passive: 60 },
        { jointId: 'cervical_rotation', side: 'right', active: 75, passive: 85 },
      ],
      custom: [
        { name: 'Spurling test (우측)', value: '음성' },
      ],
      painMapping: [
        { id: 'neck', label: '목', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 1 },
      ],
    },
  ],
}

// ─── 6. 한지연 60세 여 — 우측 무릎 골관절염 (OA Grade II) ────────────
const PT_6_KNEE_OA: RichSeedBundle = {
  patient: {
    name: '한지연',
    birthDate: '1966-06-30',
    gender: 'female',
    phone: '010-3389-1145',
    address: '경기도 분당',
    referralRoute: '정형외과 의뢰',
    medicalHistory: ['당뇨'],
    otherMedicalHistory: undefined,
    diagnosis: '우측 무릎 골관절염 (Knee OA Grade II, Medial Compartment)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '주부, 손주 돌봄 활발. 계단·쪼그려 앉기 시 통증. 비만 — 체중 감소 권유.',
    treatmentStartDate: '2026-03-25',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-03-25',
      bodyParts: [{ region: 'knee', side: 'right' }, { region: 'hip', side: 'right' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '슬개골 가동 + 대퇴사두근 이완',
        electric: 'TENS 무릎 주변 15분',
        thermal: '온열 10분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Quad set (대퇴사두근 isometric)', 3, 15),
        ex('Heel slide', 3, 12),
      ],
      homework: 'Quad set 하루 2회.',
      comment: '내측 압통. ROM 굴곡 110° (제한).',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-15',
      bodyParts: [{ region: 'knee', side: 'right' }, { region: 'hip', side: 'right' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: 'Mulligan MWM — 무릎 굴곡',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Quad set', 3, 15),
        ex('Straight leg raise', 3, 12),
        ex('Glute bridge', 3, 12),
        ex('자전거 (안장 높임)', undefined, undefined, undefined, 10),
      ],
      homework: '실내 자전거 권유. 손주 안기 시 무릎 자세 주의.',
      comment: 'ROM 굴곡 120°. 계단 오르기 4 계단 가능.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-06',
      bodyParts: [{ region: 'knee', side: 'right' }, { region: 'hip' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        task: '쪼그려 앉기 → 부엌 자세 시뮬레이션',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Wall squat (45도)', 3, undefined, undefined, 20),
        ex('Step-up (15cm)', 3, 10),
        ex('Side-lying clam', 3, 12),
        ex('자전거', undefined, undefined, undefined, 15),
      ],
      homework: '자전거 15분 매일. 손주 돌봄 시 의자 활용.',
      comment: '쪼그려 앉기 부분 가능 (낮은 의자 활용). 손주 돌봄 활동성 ↑.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'knee', side: 'right' }, { region: 'hip' }],
      methods: ['exercise'],
      methodDetails: {},
      exerciseConcept: 'strength',
      exercises: [
        ex('Wall squat', 3, undefined, undefined, 30),
        ex('Step-up (20cm)', 3, 12),
        ex('자전거', undefined, undefined, undefined, 20),
        ex('Lateral band walk', 3, 12, 1),
      ],
      homework: '체중 관리 + 자전거 매일 20분 권장.',
      comment: 'VAS 2. 손주 돌봄 정상. 계단 정상 사용. 자가 관리 전환.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-03-25',
      vas: 6,
      rom: [
        { jointId: 'knee_flexion', side: 'right', active: 110, passive: 120 },
      ],
      mmt: [
        { jointId: 'knee_extension', side: 'right', grade: 3 },
      ],
      bodyMeasurement: [
        { type: 'circumference', location: '우측 무릎 슬개골 중심', value: 41.5, unit: 'cm' },
      ],
      painMapping: [
        { id: 'knee_r', label: '우측 무릎', pattern: 'sharp', intensity: 6 },
      ],
    },
    {
      date: '2026-05-13',
      vas: 2,
      rom: [
        { jointId: 'knee_flexion', side: 'right', active: 135, passive: 145 },
      ],
      mmt: [
        { jointId: 'knee_extension', side: 'right', grade: 4 },
      ],
      bodyMeasurement: [
        { type: 'circumference', location: '우측 무릎 슬개골 중심', value: 40.5, unit: 'cm' },
      ],
      painMapping: [
        { id: 'knee_r', label: '우측 무릎', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 2 },
      ],
    },
  ],
}

// ─── 7. 강태우 42세 남 — 좌측 오십견 (Adhesive Capsulitis) ────────────
const PT_7_FROZEN_SHOULDER: RichSeedBundle = {
  patient: {
    name: '강태우',
    birthDate: '1984-02-14',
    gender: 'male',
    phone: '010-6678-2284',
    address: '서울시 영등포구',
    referralRoute: '정형외과 의뢰',
    medicalHistory: ['당뇨'],
    otherMedicalHistory: undefined,
    diagnosis: '좌측 견관절 유착성 관절낭염 (Left Adhesive Capsulitis, Frozen Shoulder)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '영업직, 운전·악수·물건 들기 많음. 비우세손(좌). 야간통 심함. 당뇨 — 오십견 위험 인자.',
    treatmentStartDate: '2026-02-20',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-02-20',
      bodyParts: [{ region: 'shoulder', side: 'left' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '관절낭 신장 (Capsular stretch) — Maitland 등급 III',
        electric: 'TENS 야간통 조절',
        thermal: '온열 15분 (치료 전)',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('펜듈럼 (Pendulum)', undefined, undefined, undefined, 5),
        ex('수동 외전', 3, 10),
      ],
      homework: '펜듈럼 + 수동 외전 하루 3회. 야간 베개로 어깨 받침.',
      comment: 'ROM 외전 60° 제한. 야간통 호소 — 수면 영향.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-03-13',
      bodyParts: [{ region: 'shoulder', side: 'left' }],
      methods: ['manual', 'exercise', 'thermal'],
      methodDetails: {
        manual: 'Capsular pattern 신장 (외회전 > 외전 > 내회전)',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('지팡이 외회전', 3, 12),
        ex('수동 외전 (능동 보조)', 3, 12),
        ex('Cross-body stretch', 3, 15),
      ],
      homework: '운전 시 시간마다 어깨 스트레칭.',
      comment: 'ROM 외전 90° / 외회전 30°.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-10',
      bodyParts: [{ region: 'shoulder', side: 'left' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: 'Mulligan MWM + 관절낭 신장',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('지팡이 운동 (모든 방향)', 3, 15),
        ex('밴드 외회전', 3, 12, 1),
        ex('어깨 풀리 (door pulley)', undefined, undefined, undefined, 5),
      ],
      homework: '직장에서 30분마다 어깨 ROM 운동.',
      comment: '야간통 거의 소실. ROM 외전 120° / 외회전 45°.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-08',
      bodyParts: [{ region: 'shoulder', side: 'left' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        task: '영업 업무 시뮬레이션 — 악수·서류 가방 들기',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('밴드 외회전·내회전', 3, 15, 2),
        ex('Y-T-W', 3, 12),
        ex('Wall slide', 3, 15),
        ex('덤벨 외전 (lateral raise)', 3, 12, 2),
      ],
      homework: '주 3회 운동 + 영업 일정에 맞춰 휴식.',
      comment: 'ROM 외전 150° / 외회전 65°. 영업 업무 정상.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-02-20',
      vas: 7,
      rom: [
        { jointId: 'shoulder_abduction', side: 'left', active: 60, passive: 75 },
        { jointId: 'shoulder_er', side: 'left', active: 15, passive: 25 },
        { jointId: 'shoulder_flexion', side: 'left', active: 80, passive: 95 },
      ],
      mmt: [
        { jointId: 'shoulder_abduction', side: 'left', grade: 3 },
      ],
      custom: [
        { name: '야간통 수면 영향', value: '주 5회 이상 깸' },
      ],
      painMapping: [
        { id: 'shoulder_l', label: '좌측 어깨', pattern: 'sharp', intensity: 7 },
      ],
    },
    {
      date: '2026-04-10',
      vas: 4,
      rom: [
        { jointId: 'shoulder_abduction', side: 'left', active: 120, passive: 135 },
        { jointId: 'shoulder_er', side: 'left', active: 45, passive: 55 },
      ],
      mmt: [
        { jointId: 'shoulder_abduction', side: 'left', grade: 4 },
      ],
      custom: [
        { name: '야간통 수면 영향', value: '주 1회 미만' },
      ],
    },
    {
      date: '2026-05-08',
      vas: 2,
      rom: [
        { jointId: 'shoulder_abduction', side: 'left', active: 150, passive: 165 },
        { jointId: 'shoulder_er', side: 'left', active: 65, passive: 75 },
        { jointId: 'shoulder_flexion', side: 'left', active: 160, passive: 175 },
      ],
      mmt: [
        { jointId: 'shoulder_abduction', side: 'left', grade: 4 },
      ],
      custom: [
        { name: '야간통 수면 영향', value: '없음' },
      ],
    },
  ],
  icfAssessment: {
    date: '2026-05-08',
    turns: [{
      input: '42세 남성 영업직, 좌측 오십견 12주차. ROM 외전 60→150°, 외회전 15→65°, VAS 7→2. 야간통 소실. 당뇨 위험 인자.',
      result: {
        domains: {
          body: [
            '좌측 어깨 외전 ROM 150° (Active) — 정상 범위 근접',
            '좌측 어깨 외회전 ROM 65° (Active)',
            '통증 VAS 2/10',
            '야간통 소실',
          ],
          activity: [
            '운전·서류 가방 들기 가능',
            '머리 위 물건 잡기 자립',
            '악수·문 열기 통증 없음',
            '셔츠 단추 채우기 자립',
          ],
          participation: [
            '영업 직장 정상 복귀 — 출장·고객 응대 가능',
            '주말 휴식 정상',
            '취미(골프) 복귀 검토 단계',
          ],
          environment: [
            '운전 환경 — 핸들 조작 가능[촉진]',
            '서류 가방 차내 보관 [장벽 → 촉진 전환]',
            '회사 자율 휴식 가능[촉진]',
          ],
          personal: [
            '42세 남성 영업직',
            '직업 복귀 의지 강함[촉진]',
            '당뇨 관리 — 오십견 재발 위험 인자',
            '치료 순응도 우수',
          ],
        },
        redFlags: [],
        coverage: { hasGaps: false, missingOrWeak: [] },
        followUpQuestion: '당뇨 관리(혈당·체중) 진료팀과 협진하셨나요? 당뇨는 오십견 양측·재발 위험 인자입니다.',
        clinicalNote: '가설: 오십견 해빙기(thawing stage) — 12주 보존 치료에 우수한 반응. ROM 외전 60→150°, VAS 7→2. 근거: 관절낭 신장·Mulligan MWM·직업 자세 교정 조합. 다음 단계: 당뇨 협진[2차 예방], 골프 복귀 단계 계획, 우측 어깨 예방적 관리.',
      },
    }],
    finalDomains: {
      body: [
        '좌측 어깨 외전 ROM 150° (Active) — 정상 범위 근접',
        '좌측 어깨 외회전 ROM 65° (Active)',
        '통증 VAS 2/10',
        '야간통 소실',
      ],
      activity: [
        '운전·서류 가방 들기 가능',
        '머리 위 물건 잡기 자립',
        '악수·문 열기 통증 없음',
        '셔츠 단추 채우기 자립',
      ],
      participation: [
        '영업 직장 정상 복귀',
        '주말 휴식 정상',
        '취미(골프) 복귀 검토 단계',
      ],
      environment: [
        '운전 환경 — 핸들 조작 가능[촉진]',
        '회사 자율 휴식 가능[촉진]',
      ],
      personal: [
        '42세 남성 영업직',
        '직업 복귀 의지 강함[촉진]',
        '당뇨 관리 — 오십견 재발 위험 인자',
        '치료 순응도 우수',
      ],
    },
    finalNote: '가설: 오십견 해빙기 — 12주 보존 치료에 우수 반응. ROM 외전 60→150°, VAS 7→2. 근거: 관절낭 신장·Mulligan MWM 조합. 다음 단계: 당뇨 협진, 골프 복귀 단계, 우측 어깨 예방적 관리.',
  },
}

// ─── 8. 윤서영 35세 여 — 좌측 좌골신경통 ──────────────────────────
const PT_8_SCIATICA: RichSeedBundle = {
  patient: {
    name: '윤서영',
    birthDate: '1991-12-03',
    gender: 'female',
    phone: '010-2278-9923',
    address: '서울시 성동구',
    referralRoute: '정형외과 의뢰',
    medicalHistory: [],
    otherMedicalHistory: undefined,
    diagnosis: '좌측 좌골신경통 (Left Sciatica, 이상근 증후군 의심)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '디자이너, 좌식 8~10시간. 좌측 둔부·후방 대퇴 통증. 운전 30분 이상 시 악화.',
    treatmentStartDate: '2026-04-05',
    status: 'new',
  },
  treatments: [
    {
      date: '2026-04-05',
      bodyParts: [{ region: 'hip', side: 'left' }, { region: 'lumbar' }],
      methods: ['manual', 'electric'],
      methodDetails: {
        manual: '이상근(piriformis) 이완 + 좌골신경 가동',
        electric: 'TENS 둔부 15분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Piriformis stretch', 3, undefined, undefined, undefined),
        ex('Sciatic nerve gliding', 3, 10),
      ],
      homework: '근무 중 30분마다 일어나서 스트레칭. 좌석 쿠션 활용.',
      comment: 'Piriformis 압통. SLR 좌측 60° 음성 (디스크 아님).',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-26',
      bodyParts: [{ region: 'hip', side: 'left' }, { region: 'lumbar' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '둔근군·이상근 통합 이완 + Mulligan SNAGs',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Piriformis stretch', 3, undefined, undefined, undefined),
        ex('Side-lying clam', 3, 12),
        ex('Glute bridge', 3, 12),
        ex('Sciatic nerve gliding', 3, 12),
      ],
      homework: '둔근 강화 + 스트레칭 매일.',
      comment: '운전 1시간 가능. 후방 대퇴 통증 ↓.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'hip', side: 'left' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        task: '책상 자세 시뮬레이션 + 스탠딩 데스크 활용',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Piriformis stretch', 3, undefined, undefined, undefined),
        ex('Glute bridge (single leg)', 3, 10),
        ex('Lateral band walk', 3, 12, 1),
        ex('Plank', 3, undefined, undefined, 45),
      ],
      homework: '스탠딩 데스크 하루 2~3시간 시도. 좌식 시간 줄이기.',
      comment: 'VAS 2. 운전 정상. 자가 관리 전환.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-04-05',
      vas: 6,
      custom: [
        { name: 'SLR (좌측)', value: '60° 음성' },
        { name: 'Piriformis test (좌측)', value: '양성' },
      ],
      painMapping: [
        { id: 'glutes_l', label: '좌측 둔부', pattern: 'sharp', intensity: 6 },
        { id: 'hamstring_l', label: '좌측 후방 대퇴', pattern: 'tingling', intensity: 4 },
      ],
    },
    {
      date: '2026-05-13',
      vas: 2,
      custom: [
        { name: 'Piriformis test (좌측)', value: '음성' },
      ],
      painMapping: [
        { id: 'glutes_l', label: '좌측 둔부', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 2 },
      ],
    },
  ],
}

// ─── 9. 임재훈 55세 남 — 우측 어깨충돌증후군 ──────────────────────
const PT_9_IMPINGEMENT: RichSeedBundle = {
  patient: {
    name: '임재훈',
    birthDate: '1971-07-19',
    gender: 'male',
    phone: '010-4456-3389',
    address: '서울시 노원구',
    referralRoute: '정형외과 의뢰',
    medicalHistory: ['고혈압'],
    otherMedicalHistory: undefined,
    diagnosis: '우측 어깨충돌증후군 (Right Shoulder Impingement Syndrome)',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '주말 테니스. 우측 어깨 painful arc 60~120°. 야간통 일부.',
    treatmentStartDate: '2026-03-30',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-03-30',
      bodyParts: [{ region: 'shoulder', side: 'right' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '극상근·견봉하 활액낭 이완',
        electric: 'TENS 15분',
        thermal: '온열 10분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('펜듈럼', undefined, undefined, undefined, 5),
        ex('수동 외전 (painful arc 회피)', 3, 10),
      ],
      homework: '테니스 잠시 보류. 머리 위 작업 자제.',
      comment: 'Neer·Hawkins test 양성. Painful arc 60~120°.',
      flags: ['통증 호소'],
    },
    {
      date: '2026-04-20',
      bodyParts: [{ region: 'shoulder', side: 'right' }, { region: 'thoracic' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '견갑대 정렬 + 흉추 신전 가동성',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('밴드 외회전', 3, 12, 2),
        ex('Y-T-W (Prone)', 3, 10),
        ex('Wall slide', 3, 12),
        ex('흉추 신전', 3, 10),
      ],
      homework: '주 3회 견갑 안정성 운동. 테니스 복귀는 4주 후.',
      comment: 'Painful arc 80~110°로 좁혀짐.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-05-11',
      bodyParts: [{ region: 'shoulder', side: 'right' }],
      methods: ['exercise', 'task'],
      methodDetails: {
        task: '테니스 스윙 시뮬레이션 — 서브·포핸드 자세',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('밴드 외회전 (heavy)', 3, 15, 3),
        ex('Eccentric loading', 3, 12, 1.5),
        ex('Push-up plus', 3, 12),
        ex('덤벨 외전 (lateral raise)', 3, 12, 3),
      ],
      homework: '테니스 가벼운 랠리부터 단계적으로.',
      comment: 'Painful arc 거의 소실. 테니스 가벼운 랠리 가능.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-03-30',
      vas: 5,
      rom: [
        { jointId: 'shoulder_abduction', side: 'right', active: 130, passive: 150 },
      ],
      mmt: [
        { jointId: 'shoulder_abduction', side: 'right', grade: 4 },
      ],
      custom: [
        { name: 'Neer test (우측)', value: '양성' },
        { name: 'Hawkins test (우측)', value: '양성' },
        { name: 'Painful arc', value: '60~120°' },
      ],
      painMapping: [
        { id: 'shoulder_r', label: '우측 어깨', pattern: 'sharp', intensity: 5 },
      ],
    },
    {
      date: '2026-05-11',
      vas: 2,
      rom: [
        { jointId: 'shoulder_abduction', side: 'right', active: 165, passive: 175 },
      ],
      mmt: [
        { jointId: 'shoulder_abduction', side: 'right', grade: 5 },
      ],
      custom: [
        { name: 'Painful arc', value: '거의 소실' },
      ],
      painMapping: [
        { id: 'shoulder_r', label: '우측 어깨', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 2 },
      ],
    },
  ],
}

// ─── 10. 송미라 48세 여 — 만성 요통 + 근막통증증후군 ─────────────────
const PT_10_CHRONIC_LBP: RichSeedBundle = {
  patient: {
    name: '송미라',
    birthDate: '1978-04-22',
    gender: 'female',
    phone: '010-5589-3367',
    address: '경기도 성남',
    referralRoute: '재활의학과 의뢰',
    medicalHistory: ['우울증'],
    otherMedicalHistory: '갱년기 호르몬 변화',
    diagnosis: '만성 요통 (Chronic Low Back Pain) + 요방형근 근막통증증후군',
    surgeryHistory: undefined,
    insurance: 'health',
    notes: '3년 이상 만성 요통. 우울증 동반 — 정신건강의학과 진료 중. 가사·육아·간병(시어머니) 모두 본인. 재발 두려움 있음.',
    treatmentStartDate: '2026-01-15',
    status: 'readmit',
  },
  treatments: [
    {
      date: '2026-01-15',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'electric', 'thermal'],
      methodDetails: {
        manual: '요방형근(QL)·이상근 근막 이완 (MET)',
        electric: 'TENS 20분',
        thermal: '온열 15분',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Cat-camel', 3, 10),
        ex('Pelvic tilt', 3, 15),
      ],
      homework: '아침 일어나서 스트레칭 5분. 통증 일기 작성.',
      comment: 'Tender point QL·이상근 다수. 통증 catastrophizing 평가 필요.',
      flags: ['통증 호소', '심리 평가 권유'],
    },
    {
      date: '2026-02-26',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '근막 이완 + 호흡 운동 통합 (이완 반응 유도)',
      },
      exerciseConcept: 'recovery',
      exercises: [
        ex('Diaphragmatic breathing', undefined, undefined, undefined, 5),
        ex('Cat-camel', 3, 12),
        ex('Glute bridge', 3, 12),
        ex('Pelvic tilt', 3, 15),
      ],
      homework: '복식호흡 + 가벼운 스트레칭. 정신건강의학과 협진 권유.',
      comment: '정신건강의학과 진료 시작. 운동 강도 가벼움 유지.',
      flags: ['컨디션 좋음'],
    },
    {
      date: '2026-04-09',
      bodyParts: [{ region: 'lumbar' }, { region: 'hip' }],
      methods: ['manual', 'exercise', 'task'],
      methodDetails: {
        task: '가사·간병 자세 시뮬레이션 — 시어머니 부축, 빨래',
      },
      exerciseConcept: 'strength',
      exercises: [
        ex('Bird-dog', 3, 10),
        ex('Dead bug', 3, 10),
        ex('Side-lying clam', 3, 12),
        ex('Glute bridge', 3, 15),
      ],
      homework: '간병 자세 — 무릎 굽혀 부축. 가족 협조 의논.',
      comment: '통증 일기 — 통증 인식 변화 시작. "통증 = 위험" 두려움 완화.',
      flags: ['컨디션 좋음', '재활 적극'],
    },
    {
      date: '2026-05-13',
      bodyParts: [{ region: 'lumbar' }],
      methods: ['manual', 'exercise'],
      methodDetails: {
        manual: '근막 이완 + 신경학 평가',
      },
      exerciseConcept: 'endurance',
      exercises: [
        ex('Plank', 3, undefined, undefined, 30),
        ex('Bird-dog', 3, 12),
        ex('Glute bridge (single leg)', 3, 10),
        ex('Cat-camel + 호흡', 3, 15),
      ],
      homework: '주 3회 운동 + 정신건강의학과 약물 지속.',
      comment: 'VAS 3 (이전 6). 우울증 호전. 가족 협조 — 시어머니 간병 분담 시작.',
      flags: ['컨디션 좋음'],
    },
  ],
  evaluations: [
    {
      date: '2026-01-15',
      vas: 6,
      rom: [
        { jointId: 'lumbar_flexion', active: 45, passive: 55 },
      ],
      custom: [
        { name: 'Pain Catastrophizing Scale (PCS)', value: '32/52 (높음)' },
        { name: '수면 영향', value: '주 3~4회 깸' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'custom', customPatternLabel: '묵직함', intensity: 6 },
        { id: 'glutes_r', label: '우측 둔부', pattern: 'referred', intensity: 4 },
      ],
    },
    {
      date: '2026-04-09',
      vas: 4,
      rom: [
        { jointId: 'lumbar_flexion', active: 60, passive: 70 },
      ],
      custom: [
        { name: 'Pain Catastrophizing Scale (PCS)', value: '22/52 (중간)' },
        { name: '수면 영향', value: '주 1~2회 깸' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 4 },
      ],
    },
    {
      date: '2026-05-13',
      vas: 3,
      rom: [
        { jointId: 'lumbar_flexion', active: 70, passive: 80 },
      ],
      custom: [
        { name: 'Pain Catastrophizing Scale (PCS)', value: '15/52 (낮음)' },
        { name: '수면 영향', value: '거의 없음' },
      ],
      painMapping: [
        { id: 'lower-back', label: '허리', pattern: 'custom', customPatternLabel: '뻐근함', intensity: 3 },
      ],
    },
  ],
  icfAssessment: {
    date: '2026-05-13',
    turns: [{
      input: '48세 여성, 만성 요통 3년+. 4개월 치료로 VAS 6→3, Pain Catastrophizing Scale 32→15 호전. 우울증 동반(정신건강의학과 협진). 시어머니 간병·가사 모두 본인. 가족 협조 시작.',
      result: {
        domains: {
          body: [
            '요추 굴곡 ROM 70° (Active) — 회복 추세',
            '통증 VAS 3/10 — 만성 통증 인식 변화 진행',
            '요방형근·이상근 tender point 감소',
            '수면 정상화',
          ],
          activity: [
            '가사 활동 자립 (이전: 통증 회피로 제한)',
            '간병 자세 교정 — 무릎 굽혀 부축',
            '운동 순응도 우수 (홈 프로그램 100%)',
          ],
          participation: [
            '가정 내 간병·가사 역할 지속',
            '가족 간 역할 분담 시작 (이전: 본인 단독)',
            '사회 활동 점진적 복귀',
          ],
          environment: [
            '정신건강의학과 협진[촉진]',
            '가족 협조 시작 — 시어머니 간병 분담[촉진]',
            '간병 자세 환경 개선[촉진]',
            '갱년기 호르몬 변화 — 만성 통증 영향[장벽 가능성]',
          ],
          personal: [
            '48세 여성, 주부',
            '우울증 동반 — 정신건강의학과 진료 중',
            '통증 catastrophizing 호전 (PCS 32→15)',
            '재활 의지 회복 — 통증 인식 변화 핵심',
          ],
        },
        redFlags: [],
        coverage: { hasGaps: false, missingOrWeak: [] },
        followUpQuestion: '갱년기 호르몬 변화가 통증 양상에 미치는 영향(전신 통증·수면·기분)에 대해 산부인과 협진을 검토하셨나요? 만성 통증의 다요인 접근에 호르몬 평가가 도움될 수 있습니다.',
        clinicalNote: '가설: 만성 요통 — 생물심리사회 모델 접근에 양호한 반응. 통증 인식 변화(PCS 32→15)와 가족 환경 변화[촉진]가 신체기능 회복(VAS 6→3, ROM 45→70°)을 추동. 근거: 정신건강의학과 협진·운동·자세 교정·가족 협조 다층 개입. 다음 단계: 자가 관리 + 정신건강의학과 지속, 갱년기 평가 협진, 만성 통증 재발 예방 교육.',
      },
    }],
    finalDomains: {
      body: [
        '요추 굴곡 ROM 70° (Active) — 회복 추세',
        '통증 VAS 3/10 — 만성 통증 인식 변화 진행',
        '요방형근·이상근 tender point 감소',
        '수면 정상화',
      ],
      activity: [
        '가사 활동 자립',
        '간병 자세 교정 — 무릎 굽혀 부축',
        '운동 순응도 우수',
      ],
      participation: [
        '가정 내 간병·가사 역할 지속',
        '가족 간 역할 분담 시작',
        '사회 활동 점진적 복귀',
      ],
      environment: [
        '정신건강의학과 협진[촉진]',
        '가족 협조 시작 — 시어머니 간병 분담[촉진]',
        '간병 자세 환경 개선[촉진]',
        '갱년기 호르몬 변화 — 만성 통증 영향[장벽 가능성]',
      ],
      personal: [
        '48세 여성, 주부',
        '우울증 동반 — 정신건강의학과 진료 중',
        '통증 catastrophizing 호전 (PCS 32→15)',
        '재활 의지 회복 — 통증 인식 변화 핵심',
      ],
    },
    finalNote: '가설: 만성 요통 — 생물심리사회 모델 접근에 양호한 반응. 통증 인식 변화(PCS 32→15)와 가족 환경 변화[촉진]가 신체기능 회복(VAS 6→3, ROM 45→70°)을 추동. 근거: 정신건강의학과 협진·운동·자세 교정·가족 협조 다층 개입. 다음 단계: 자가 관리 + 정신건강의학과 지속, 갱년기 평가 협진, 만성 통증 재발 예방 교육.',
  },
}

// ─── 통합 export ──────────────────────────────────────────────────
export const RICH_SEED_BUNDLES: RichSeedBundle[] = [
  PT_1_SPINAL_STENOSIS,
  PT_2_LUMBAR_DISC,
  PT_3_CTS,
  PT_4_ANKLE,
  PT_5_CERVICAL_DISC,
  PT_6_KNEE_OA,
  PT_7_FROZEN_SHOULDER,
  PT_8_SCIATICA,
  PT_9_IMPINGEMENT,
  PT_10_CHRONIC_LBP,
]
