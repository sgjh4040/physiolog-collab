'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, updateProfile } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Building, Briefcase, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LoadingScreen } from '@/components/loading-screen'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [workplace, setWorkplace] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile()
      if (profile) {
        setName(profile.name || '')
        setRole(profile.role || '')
        setWorkplace(profile.workplace || '')
      }
      setIsLoading(false)
    }
    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('role', role)
    formData.append('workplace', workplace)

    const result = await updateProfile(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('프로필 정보가 저장되었습니다.')
      router.push('/')
    }
    
    setIsSaving(false)
  }

  if (isLoading) {
    return <LoadingScreen fullScreen />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <Link 
          href="/" 
          className="absolute -top-12 left-0 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          홈으로 돌아가기
        </Link>
        
        <div className="text-center mb-8 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">내 프로필 설정</h1>
          <p className="text-muted-foreground mt-2">
            시스템에서 사용될 정보를 입력해 주세요.
          </p>
        </div>

        <div className="rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 (실명)</Label>
              <div className="relative group">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  placeholder="예: 홍길동"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">직업 (역할)</Label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="role"
                  placeholder="예: 물리치료사, 트레이너"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplace">소속 (병원/센터명)</Label>
              <div className="relative group">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="workplace"
                  placeholder="소속 병원 또는 센터 이름"
                  className="pl-10 h-11 bg-background/50 border-muted focus:ring-primary/20"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '정보 저장하기'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
