import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * iOS apple-touch-startup-image 디바이스 매트릭스.
 *
 * iOS PWA는 manifest의 background_color를 거의 안 따르고, 정확한 device dimension에
 * 매칭되는 정적 splash 이미지를 link 태그로 지정해야 cold start 흰 frame을 메움.
 *
 * 8개 핵심 iPhone 디바이스 cover. URL은 /api/splash로 동적 ImageResponse 생성.
 */
const APPLE_STARTUP_IMAGES = [
  // iPhone 15 Pro Max / 14 Pro Max — 430x932 @3x
  { w: 1290, h: 2796, dw: 430, dh: 932, dpr: 3 },
  // iPhone 15 / 15 Pro / 14 Pro — 393x852 @3x
  { w: 1179, h: 2556, dw: 393, dh: 852, dpr: 3 },
  // iPhone 14 Plus / 13 Pro Max / 12 Pro Max — 428x926 @3x
  { w: 1284, h: 2778, dw: 428, dh: 926, dpr: 3 },
  // iPhone 14 / 13 / 13 Pro / 12 / 12 Pro — 390x844 @3x
  { w: 1170, h: 2532, dw: 390, dh: 844, dpr: 3 },
  // iPhone 11 Pro Max / XS Max — 414x896 @3x
  { w: 1242, h: 2688, dw: 414, dh: 896, dpr: 3 },
  // iPhone 11 / XR — 414x896 @2x
  { w: 828, h: 1792, dw: 414, dh: 896, dpr: 2 },
  // iPhone 11 Pro / XS / X / 13 mini / 12 mini — 375x812 @3x
  { w: 1125, h: 2436, dw: 375, dh: 812, dpr: 3 },
  // iPhone 8 / 7 / 6 / SE — 375x667 @2x
  { w: 750, h: 1334, dw: 375, dh: 667, dpr: 2 },
] as const

const appleStartupImages = APPLE_STARTUP_IMAGES.map(({ w, h, dw, dh, dpr }) => ({
  url: `/api/splash?w=${w}&h=${h}`,
  media: `(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}))

export const metadata: Metadata = {
  title: "Atlas — 물리치료 차팅",
  description: "정확한 평가는 치료의 가장 정직한 지도가 됩니다.",
  // iOS PWA 메타 — manifest background_color를 안 따르는 iOS를 위해.
  appleWebApp: {
    capable: true,
    title: "Atlas",
    statusBarStyle: "black-translucent",
    startupImage: appleStartupImages,
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
      </body>
    </html>
  );
}
