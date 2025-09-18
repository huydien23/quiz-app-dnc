import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/components/toast-provider"
import { Navbar } from "@/components/navbar"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import "./globals.css"

// Font configuration - Inter for modern, clean typography
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "QuizMaster - Luyện thi trắc nghiệm",
  description: "Hệ thống luyện thi trắc nghiệm trực tuyến",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorBoundary>
            <AuthProvider>
              <ToastProvider>
                <main className="min-h-screen bg-background">{children}</main>
              </ToastProvider>
            </AuthProvider>
          </ErrorBoundary>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
