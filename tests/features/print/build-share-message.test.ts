import { describe, it, expect } from 'vitest'
import { buildShareMessage } from '@/features/print/utils/build-share-message'
import type { Patient } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'
import type { Evaluation } from '@/features/evaluations/domain/types'

function mkPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p',
    name: '김미영',
    birthDate: '1984-06-20',
    gender: 'female',
    phone: '',
    address: '',
    referralRoute: '',
    medicalHistory: [],
    diagnosis: '회전근개 부분 파열',
    insurance: 'health',
    treatmentStartDate: '2026-03-10',
    therapist: '홍길동',
    status: 'readmit',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    ...overrides,
  }
}

describe('buildShareMessage', () => {
  it('기본 구조 — 환자명·평가·운동·인사·발신자', () => {
    const patient = mkPatient({ notes: '봉합 후 4개월차까지 보호 필요' })
    const evaluations: Evaluation[] = [
      {
        id: 'e1',
        patientId: 'p',
        date: '2026-05-13',
        vas: 3,
        createdAt: '',
      },
    ]
    const treatments: Treatment[] = [
      {
        id: 't1',
        patientId: 'p',
        date: '2026-05-13',
        bodyParts: [],
        methods: [],
        exercises: [
          { id: 'x1', name: 'Eccentric raise (밴드) 3×15' },
          { id: 'x2', name: '외회전 강화 3×15' },
        ],
        homework: '하루 2회 운동 + 무리한 머리 위 작업 피하기',
        createdAt: '',
      },
    ]
    const msg = buildShareMessage({ patient, treatments, evaluations, authorName: 'baseline-test' })
    expect(msg).toContain('[김미영 님 운동·관리 안내]')
    expect(msg).toContain('통증 3/10')
    expect(msg).toContain('Eccentric raise')
    expect(msg).toContain('무리한 머리 위 작업')
    expect(msg).toContain('봉합 후 4개월차까지 보호 필요')
    expect(msg).toContain('baseline-test 물리치료사 (physiolog)')
  })

  it('평가·치료 데이터 없으면 해당 섹션 생략', () => {
    const msg = buildShareMessage({
      patient: mkPatient({ name: '홍길동', notes: undefined }),
      treatments: [],
      evaluations: [],
    })
    expect(msg).toContain('[홍길동 님 운동·관리 안내]')
    expect(msg).not.toContain('통증')
    expect(msg).not.toContain('🏠')
    expect(msg).not.toContain('⚠️')
  })

  it('Custom 평가 첫 항목이 표시됨', () => {
    const evaluations: Evaluation[] = [
      {
        id: 'e1',
        patientId: 'p',
        date: '2026-05-13',
        custom: [{ name: 'Berg', value: '42/56' }],
        createdAt: '',
      },
    ]
    const msg = buildShareMessage({ patient: mkPatient(), treatments: [], evaluations })
    expect(msg).toContain('Berg 42/56')
  })

  it('운동 5개까지만 — 6개째는 잘림', () => {
    const treatments: Treatment[] = [
      {
        id: 't1',
        patientId: 'p',
        date: '2026-05-13',
        bodyParts: [],
        methods: [],
        exercises: [
          { id: 'a', name: '운동A' },
          { id: 'b', name: '운동B' },
          { id: 'c', name: '운동C' },
          { id: 'd', name: '운동D' },
          { id: 'e', name: '운동E' },
          { id: 'f', name: '운동F-잘려야함' },
        ],
        createdAt: '',
      },
    ]
    const msg = buildShareMessage({ patient: mkPatient(), treatments, evaluations: [] })
    expect(msg).toContain('운동E')
    expect(msg).not.toContain('운동F-잘려야함')
  })

  it('빈 평가 카드(데이터 없음)는 skip하고 다음 의미 있는 평가 사용', () => {
    const evaluations: Evaluation[] = [
      { id: 'e1', patientId: 'p', date: '2026-05-13', createdAt: '' }, // 빈 평가
      { id: 'e2', patientId: 'p', date: '2026-05-06', vas: 5, createdAt: '' },
    ]
    const msg = buildShareMessage({ patient: mkPatient(), treatments: [], evaluations })
    expect(msg).toContain('통증 5/10')
  })

  it('authorName 없으면 patient.therapist fallback', () => {
    const msg = buildShareMessage({
      patient: mkPatient({ therapist: '박물리' }),
      treatments: [],
      evaluations: [],
    })
    expect(msg).toContain('박물리 물리치료사')
  })
})
