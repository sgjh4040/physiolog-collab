'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, UserPlus, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await signup(formData)
    
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success('회원가입이 완료되었습니다! 이메일을 확인하거나 로그인해주세요.')
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-background to-background">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 animate-in fade-in zoom-in duration-500">
            <UserPlus className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-6">계정 생성</h1>
          <p className="text-sm text-muted-foreground">
            physiolog 시스템 이용을 위한 전문가 계정을 만듭니다.
          </p>
        </div>

        <div className="rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="사용할 이메일"
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
                  placeholder="6자 이상 입력"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative group">
                <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] mt-2" 
              disabled={isLoading}
            >
              {isLoading ? '계정 생성 중...' : '회원가입 완료'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              로그인 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
