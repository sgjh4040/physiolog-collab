/**
 * iOS apple-touch-startup-image용 정적 splash 마크업.
 * AuthGuard의 동적 splash와 같은 디자인 톤(워드마크 + 부제 + 인용구)이지만
 * spinner는 제외 — PNG 캡처 후 정지 상태로만 노출되므로 회전 의미 없음.
 *
 * 캡처 절차: /_splash 페이지 진입 → Playwright로 device size별 캡처 → public/splash/*.png 저장
 */
export function Splash() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#1c1c1c',
        color: '#ffffff',
      }}
    >
      <div className="flex flex-col items-center gap-8 text-center max-w-sm">
        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="text-5xl font-light tracking-tight"
            style={{ color: '#ffffff' }}
          >
            physiolog
          </h1>
          <p
            className="text-[10px] font-medium tracking-[0.3em] uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Physiotherapy charting
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p
            className="text-lg font-medium tracking-tight break-keep leading-relaxed italic"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            {'"정확한 평가는 치료의 가장 '}
            <span
              className="font-bold underline underline-offset-8"
              style={{ color: '#a78bfa' }}
            >
              정직한 지도(Map)
            </span>
            {'가 됩니다."'}
          </p>
          <div
            className="mx-auto h-[1px] w-16"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
