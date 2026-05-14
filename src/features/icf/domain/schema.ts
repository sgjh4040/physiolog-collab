import { z } from 'zod'

/**
 * Claude 응답을 검증하는 zod 스키마.
 * AI가 가끔 형식 어긋난 출력을 내는 경우(필드 누락·타입 오류·토큰 한도 초과로 잘림 등)를
 * route.ts에서 잡아내고 명확한 에러 메시지로 사용자에게 돌려주기 위함.
 *
 * - 모든 도메인 배열은 string[] (빈 배열도 허용)
 * - redFlags는 옵셔널 (없으면 빈 배열로 보정)
 * - coverage·followUpQuestion·clinicalNote는 필수
 */
export const icfAnalysisResultSchema = z.object({
  domains: z.object({
    body: z.array(z.string()),
    activity: z.array(z.string()),
    participation: z.array(z.string()),
    environment: z.array(z.string()),
    personal: z.array(z.string()),
  }),
  redFlags: z.array(z.string()).optional().default([]),
  coverage: z.object({
    hasGaps: z.boolean(),
    missingOrWeak: z.array(z.string()),
  }),
  followUpQuestion: z.string(),
  clinicalNote: z.string(),
})

export type IcfAnalysisResultParsed = z.infer<typeof icfAnalysisResultSchema>
