export interface IcfDomains {
  body: string[]
  activity: string[]
  participation: string[]
  environment: string[]
  personal: string[]
}

export interface IcfAnalysisResult {
  domains: IcfDomains
  /**
   * 의학적 적색 신호(red flag) — PT 범위를 넘어 의사 평가가 우선되어야 하는 단서.
   * 야간통 + 체중감소 + 발열(악성 의심), 안장마비/요실금(cauda equina), 진행성 신경학 결손,
   * 외상 후 변형(골절 의심), 운동 시 흉통·호흡곤란(심혈관) 등. 없으면 빈 배열.
   */
  redFlags?: string[]
  coverage: {
    hasGaps: boolean
    missingOrWeak: string[]
  }
  followUpQuestion: string
  clinicalNote: string
}

export interface IcfTurn {
  input: string
  result: IcfAnalysisResult
}

export interface IcfAssessment {
  id: string
  patientId: string
  date: string       // yyyy-mm-dd
  createdAt: string
  turns: IcfTurn[]
  finalDomains: IcfDomains
  finalNote: string
}

export type IcfDomainKey = keyof IcfDomains

export const DOMAIN_META: Record<IcfDomainKey, { label: string; color: string; bg: string; border: string }> = {
  body:          { label: '신체 기능',  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  activity:      { label: '활동',       color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  participation: { label: '참여',       color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  environment:   { label: '환경',       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  personal:      { label: '개인',       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
}

export const DOMAIN_KEYS: IcfDomainKey[] = ['body', 'activity', 'participation', 'environment', 'personal']

export function mergeDomains(turns: IcfTurn[]): IcfDomains {
  const merged: IcfDomains = { body: [], activity: [], participation: [], environment: [], personal: [] }
  for (const turn of turns) {
    for (const key of DOMAIN_KEYS) {
      for (const item of turn.result.domains[key]) {
        if (!merged[key].includes(item)) merged[key].push(item)
      }
    }
  }
  return merged
}

/**
 * 모든 turn의 redFlags를 합쳐서 중복 제거. 한 번이라도 감지된 적색 신호는 보존.
 */
export function mergeRedFlags(turns: IcfTurn[]): string[] {
  const merged: string[] = []
  for (const turn of turns) {
    const flags = turn.result.redFlags ?? []
    for (const flag of flags) {
      if (!merged.includes(flag)) merged.push(flag)
    }
  }
  return merged
}
