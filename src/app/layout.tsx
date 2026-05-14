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

export const metadata: Metadata = {
  title: "physiolog — 물리치료 차팅",
  description: "정확한 평가는 치료의 가장 정직한 지도가 됩니다.",
  // iOS PWA 메타 — manifest background_color를 안 따르는 iOS를 위해.
  // startupImage는 의도적으로 빼놓음: 정적 splash와 AuthGuard splash가
  // 동시에 보이면서 텍스트 겹쳐 보이는 문제(2026-05-14 사용자 폰 검증)로 제거.
  // viewport.themeColor 다크로 frame만 메우고, 텍스트는 AuthGuard splash 단독.
  appleWebApp: {
    capable: true,
    title: "physiolog",
    statusBarStyle: "black-translucent",
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
