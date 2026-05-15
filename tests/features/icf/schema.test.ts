import { describe, it, expect } from 'vitest'
import { icfAnalysisResultSchema } from '@/features/icf/domain/schema'

describe('icfAnalysisResultSchema', () => {
  const validBase = {
    domains: { body: [], activity: [], participation: [], environment: [], personal: [] },
    coverage: { hasGaps: false, missingOrWeak: [] },
    followUpQuestion: '',
    clinicalNote: '',
  }

  it('정상 응답 통과', () => {
    const ok = {
      domains: {
        body: ['우측 어깨 외전 ROM 150°', '극상근 근지구력 저하'],
        activity: ['머리 위 작업 30분 후 피로'],
        participation: ['미용실 부분 복귀'],
        environment: ['남편의 가사 분담[촉진]'],
        personal: ['41세 여성, 미용 경력 15년'],
      },
      redFlags: [],
      coverage: { hasGaps: false, missingOrWeak: [] },
      followUpQuestion: '풀타임 복귀 시점은?',
      clinicalNote: '회전근개 봉합 후 9주차 양호한 회복.',
    }
    const r = icfAnalysisResultSchema.parse(ok)
    expect(r.domains.body).toHaveLength(2)
    expect(r.redFlags).toEqual([])
  })

  it('redFlags 없으면 빈 배열로 보정', () => {
    const r = icfAnalysisResultSchema.parse(validBase)
    expect(r.redFlags).toEqual([])
  })

  it('redFlags 있으면 그대로 보존 (Cauda Equina 등)', () => {
    const withRedFlag = {
      ...validBase,
      redFlags: ['Cauda Equina 의심 — 안장감각 + 요실금', '비기계적 통증 + 야간통'],
    }
    const r = icfAnalysisResultSchema.parse(withRedFlag)
    expect(r.redFlags).toHaveLength(2)
    expect(r.redFlags?.[0]).toContain('Cauda Equina')
  })

  it('필수 도메인 누락 시 검증 실패', () => {
    const broken = { ...validBase, domains: { body: [] } } // activity 등 누락
    expect(() => icfAnalysisResultSchema.parse(broken)).toThrow()
  })

  it('coverage 누락 시 검증 실패', () => {
    const broken: Record<string, unknown> = { ...validBase }
    delete broken.coverage
    expect(() => icfAnalysisResultSchema.parse(broken)).toThrow()
  })

  it('domains.body가 string[] 아니면 검증 실패', () => {
    const broken = {
      ...validBase,
      domains: { ...validBase.domains, body: [123 as unknown as string] },
    }
    expect(() => icfAnalysisResultSchema.parse(broken)).toThrow()
  })

  it('hasGaps boolean 필수 — string 거부', () => {
    const broken = {
      ...validBase,
      coverage: { hasGaps: 'true' as unknown as boolean, missingOrWeak: [] },
    }
    expect(() => icfAnalysisResultSchema.parse(broken)).toThrow()
  })
})
