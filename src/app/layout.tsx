import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { InitialSplash } from "@/components/InitialSplash";
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
        {/* PWA cold start splash — React state 기반으로 mount 후 fade out (DOM 직접 조작 X). */}
        <InitialSplash />
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
