import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { ServiceWorkerUpdateToast } from "@/components/ServiceWorkerUpdateToast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "physiolog — 물리치료 차팅",
  description: "정확한 평가는 치료의 가장 정직한 지도가 됩니다.",
  // iOS PWA 메타 — manifest background_color를 안 따르는 iOS를 위해.
  // startupImage: 자동 캡처된 splash PNG 5종(iPhone SE ~ 15 Pro Max). iOS는
  // media query로 device pixel 매칭. 빌드는 scripts/capture-splash.cjs로 재생성.
  // AuthGuard splash와 동일 디자인이라 OS-level splash → AuthGuard splash 전환이
  // 매끄러움(2026-05-14 텍스트 겹침 문제는 디자인 톤 통일로 해소).
  appleWebApp: {
    capable: true,
    title: "physiolog",
    statusBarStyle: "black-translucent",
    startupImage: [
      // 매칭 실패 시 fallback (media 없으면 iOS가 default로 사용). 큰 거 한 장이라
      // iPhone 모델별 dimension 누락(예: 11/XR, 12 Pro Max, 14 Plus)에도 splash 노출 보장.
      { url: "/splash/apple-splash-1290x2796.png" },
      {
        url: "/splash/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
};

// Next.js 15+ 표준 viewport export — themeColor가 <meta name="theme-color"> 생성.
// iOS Safari/PWA의 UI chrome 색상 (주소 표시줄, 상태 표시줄 등) 다크로.
export const viewport: Viewport = {
  themeColor: "#1c1c1c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
          PWA cold start splash는 AuthGuard가 담당.
          AuthGuard는 client component지만 SSR 트리 렌더 시 isVerified=false 초기 상태로
          splash 마크업이 첫 HTML에 이미 포함됨 → cold start 흰 frame 직후 그대로 노출.
          별도 InitialSplash 두면 중복 + 폰트 차이로 두 splash 연달아 보이는 깜빡임.
        */}
        <AuthGuard>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </AuthGuard>
        <Toaster
          position="top-center"
          duration={2000}
          closeButton
          toastOptions={{
            style: {
              background: '#1f2937', // Dark contrast background
              color: '#ffffff',      // White text for maximum legibility
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
        <ServiceWorkerUpdateToast />
      </body>
    </html>
  );
}
