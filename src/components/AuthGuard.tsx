'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { getSession } from '@/lib/supabase/actions'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession()
      const isPublicPage = pathname === '/login' || pathname === '/signup'

      if (!session && !isPublicPage) {
        router.replace('/login')
      } else {
        setIsVerified(true)
      }
    }

    checkAuth()
  // router는 stable reference이므로 deps에서 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isPublicPage = pathname === '/login' || pathname === '/signup'

  // 로딩 상태이거나 로그인하지 않은 경우 화면을 보여주지 않음 (깜빡임 방지)
  if (!isVerified && !isPublicPage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center gap-8 text-center max-w-sm"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/10" />
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-xl" />
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-xl font-medium tracking-tight text-foreground/80 break-keep leading-relaxed italic">
              {'"정확한 평가는 치료의 가장 '}<span className="text-primary font-bold decoration-primary/40 underline underline-offset-8">정직한 지도(Map)</span>{'가 됩니다."'}
            </p>
            <div className="mx-auto h-[1px] w-16 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
