import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

// edge runtime은 Hobby plan 1MB 한계 — next/og(satori+resvg)가 그 이상.
// nodejs runtime은 Vercel function size 50MB까지 허용. ImageResponse는 두 runtime 다 지원.
export const runtime = 'nodejs'

/**
 * iOS PWA cold start용 동적 splash 이미지.
 *
 * 사용:
 *   /api/splash?w=1290&h=2796
 *
 * iOS PWA는 manifest background_color를 거의 안 따르고
 * <link rel="apple-touch-startup-image"> + media query로 매칭되는 PNG를 보여줌.
 * layout.tsx의 appleWebApp.startupImage 배열이 디바이스별로 이 URL을 가리킴.
 *
 * 디자인: 다크 배경 + "Atlas" 워드마크 + 인용구.
 * AuthGuard splash와 같은 톤(#1c1c1c) — 자연스러운 인계.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const w = Math.min(Number(searchParams.get('w') ?? 1290), 4096)
  const h = Math.min(Number(searchParams.get('h') ?? 2796), 4096)

  // 디바이스 size에 따라 폰트 크기 비율 조정 (긴 변 기준)
  const longSide = Math.max(w, h)
  const titleSize = Math.round(longSide * 0.085)   // ≈ 240 on iPhone 15 Pro Max
  const subtitleSize = Math.round(longSide * 0.018) // ≈ 50 — "물리치료 차팅"
  const quoteSize = Math.round(longSide * 0.014)    // ≈ 39 — 인용구

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1c1c1c',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${Math.round(longSide * 0.08)}px`,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto',
        }}
      >
        {/* 상단 워드마크 + tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: Math.round(longSide * 0.012),
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 300,
              letterSpacing: -Math.round(titleSize * 0.025),
              lineHeight: 1,
              color: '#ffffff',
            }}
          >
            Atlas
          </div>
          <div
            style={{
              fontSize: subtitleSize,
              fontWeight: 400,
              letterSpacing: Math.round(subtitleSize * 0.4),
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.35)',
              display: 'flex',
            }}
          >
            Physiotherapy charting
          </div>
        </div>

        {/* 가운데 distinctive divider */}
        <div
          style={{
            width: Math.round(longSide * 0.05),
            height: 1,
            background: 'rgba(255, 255, 255, 0.18)',
            marginTop: Math.round(longSide * 0.07),
            marginBottom: Math.round(longSide * 0.05),
            display: 'flex',
          }}
        />

        {/* 인용구 */}
        <div
          style={{
            fontSize: quoteSize,
            fontStyle: 'italic',
            color: 'rgba(255, 255, 255, 0.55)',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.7,
            display: 'flex',
          }}
        >
          &ldquo;정확한 평가는 치료의 가장 정직한 지도가 됩니다.&rdquo;
        </div>
      </div>
    ),
    {
      width: w,
      height: h,
      headers: {
        // iOS가 install 시점에 캐시. 우리도 길게 캐시해서 비용 절감.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}
