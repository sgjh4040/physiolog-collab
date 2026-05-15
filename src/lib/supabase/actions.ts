'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * 카카오 OAuth 로그인 시작 — Supabase Auth가 발급하는 카카오 인증 URL을 반환.
 * 클라이언트는 이 URL로 window.location.href를 갱신해 카카오로 이동한다.
 * 카카오 로그인·동의 → Supabase callback → /auth/callback?code=... 으로 돌아옴.
 *
 * Supabase Dashboard → Authentication → Providers → Kakao 활성화 + 키 등록 필요.
 */
export async function loginWithKakao() {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }
  return { url: data.url }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const workplace = formData.get('workplace') as string

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      email: user.email,
      name, 
      role, 
      workplace 
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile', 'page')
  revalidatePath('/', 'layout')
  
  return { success: true }
}
