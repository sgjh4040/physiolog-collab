import { notFound } from 'next/navigation'
import SeedClient from './seed-client'

/**
 * /seed — 개발용 더미 환자 데이터 시드 페이지.
 *
 * Production 환경에서는 일반 사용자에게 노출되면 안 되므로
 * server-side에서 NODE_ENV를 확인한 뒤 production 빌드에서는 404를 반환한다.
 * Vercel Preview/Production은 NODE_ENV=production이므로 자동으로 차단된다.
 *
 * 개발용 도구이기 때문에 URL을 알더라도 prod에서는 접근 불가능해야 한다.
 */
export default function SeedPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <SeedClient />
}
