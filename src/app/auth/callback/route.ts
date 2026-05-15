import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase OAuth/Email 콜백 핸들러.
 *
 * 흐름:
 * 1. 사용자가 카카오 로그인 동의 → 카카오 → Supabase Auth callback
 * 2. Supabase가 우리 앱의 이 라우트로 `?code=...` 붙여 redirect
 * 3. 여기서 code를 session으로 교환 → 쿠키 발급 → 홈으로 이동
 *
 * signup 후 이메일 확인 링크도 같은 흐름이라 동일 라우트로 처리.
 * `next` 파라미터가 있으면 거기로, 없으면 `/`로.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const message = encodeURIComponent(error.message)
    return NextResponse.redirect(new URL(`/login?error=${message}`, url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
