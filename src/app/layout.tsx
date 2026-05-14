import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { RemoveInitialSplash } from "@/components/RemoveInitialSplash";
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
  title: "physiolog",
  description: "물리치료사·트레이너용 환자 차팅 앱",
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
          PWA cold start 흰 frame 메우기 — SSR HTML에 정적으로 박힌 splash.
          React hydrate 직후 RemoveInitialSplash가 useEffect에서 제거.
          manifest background_color(다크)와 같은 톤이라 시스템 splash와 자연 인계.
        */}
        <div
          id="initial-splash"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background text-foreground px-6"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-base font-medium italic text-center max-w-xs leading-relaxed break-keep text-foreground/80">
            &ldquo;정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다.&rdquo;
          </p>
        </div>
        <RemoveInitialSplash />
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
