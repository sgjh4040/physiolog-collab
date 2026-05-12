'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, getSession } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ShieldCheck, Activity, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberId, setRememberId] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const ID_STORAGE_KEY = 'physiolog_remembered_email'

  useEffect(() => {
    // 세션 체크
    getSession().then(session => {
      if (session) {
        router.replace('/')
      }
    })

    // 저장된 아이디 불러오기 — localStorage(외부 시스템) 동기화
    const savedEmail = localStorage.getItem(ID_STORAGE_KEY)
    if (savedEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(savedEmail)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRememberId(true)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 아이디 저장 로직
    if (rememberId) {
      localStorage.setItem(ID_STORAGE_KEY, email)
    } else {
      localStorage.removeItem(ID_STORAGE_KEY)
    }

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await login(formData)
    
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success('환영합니다!')
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-background to-background">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 animate-in fade-in zoom-in duration-500">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-6">physiolog</h1>
          <p className="text-sm text-muted-foreground flex flex-col items-center gap-1 mt-2">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <ShieldCheck className="w-4 h-4" />
              질병을 넘어, 삶의 기능을 분석합니다
            </span>
            <span className="text-[11px] opacity-70">환자의 삶을 데이터로 연결하는 ICF 기반 어시스턴트</span>
          </p>
        </div>

        <div className="rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-500/5 animate-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 px-1">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
              />
              <label 
                htmlFor="remember" 
                className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
              >
                아이디 저장
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? '보안 연결 중...' : '시스템 접속'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 physiolog Security. All rights reserved.
        </p>
      </div>
    </div>
  )
}
