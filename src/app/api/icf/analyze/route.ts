import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { ICF_SYSTEM_PROMPT } from '@/data/icf-system-prompt'
import { createClient } from '@/lib/supabase/server'
import { buildPatientContext } from '@/features/icf/domain/patient-context'

// 시스템 프롬프트는 서버 코드에 고정 — 사용자 입력으로 절대 변경 불가
// API 키는 서버 환경변수(ANTHROPIC_API_KEY)에서만 읽어옴 — 클라이언트 BYOK 미지원
// 인증된(로그인) 사용자만 호출 가능 — 세션 체크 필수
// 환자 컨텍스트(기본정보 + 최근 평가 + 최근 치료)는 서버에서 fetch해서 system prompt에 자동 주입

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

const MODEL_ID = 'claude-sonnet-4-6'

export async function POST(req: NextRequest) {
  // 1. 세션 체크 — 로그인된 사용자만 허용
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 2. 서버 환경변수에서만 API 키 사용
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI 평가 기능이 비활성화되어 있습니다. 관리자에게 문의해주세요.' },
      { status: 503 },
    )
  }

  // 3. 입력 검증
  const body = await req.json() as { input: string; history?: ApiMessage[]; patientId?: string }
  const { input, history = [], patientId } = body
  if (!input?.trim()) {
    return NextResponse.json({ error: '입력값이 없습니다.' }, { status: 400 })
  }

  // 4. 환자 컨텍스트 주입 (실패해도 분석 자체는 진행)
  let systemPrompt = ICF_SYSTEM_PROMPT
  if (patientId) {
    try {
      const ctx = await buildPatientContext(patientId)
      if (ctx) systemPrompt = `${ICF_SYSTEM_PROMPT}\n\n${ctx}`
    } catch (err) {
      console.error('Failed to build patient context, falling back to base prompt:', err)
    }
  }

  const client = new Anthropic({ apiKey })
  const messages: ApiMessage[] = [...history, { role: 'user', content: input }]

  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: '분석 결과를 파싱할 수 없습니다.' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result, assistantMessage: text })

  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      const msg = err.status === 400 && err.message.includes('credit')
        ? 'AI 사용량 한도에 도달했습니다. 관리자에게 문의해주세요.'
        : err.status === 401
        ? 'AI 평가 설정에 문제가 있습니다. 관리자에게 문의해주세요.'
        : `AI 분석 오류 (${err.status})`
      return NextResponse.json({ error: msg }, { status: err.status ?? 500 })
    }
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다.' }, { status: 500 })
  }
}
