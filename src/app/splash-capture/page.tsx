import { notFound } from 'next/navigation'
import { Splash } from '@/components/Splash'

/**
 * iOS splash 캡처 전용 페이지. Playwright가 device viewport별로 진입해서
 * PNG 캡처 후 public/splash/ 저장. 결과 PNG는 layout.tsx의
 * apple-touch-startup-image 메타에서 참조.
 *
 * production에서는 noindex + notFound로 자동 404 — repo는 public이지만
 * 시연·평가 환경에 노출되지 않도록.
 */
export default function SplashCapturePage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Splash />
}
