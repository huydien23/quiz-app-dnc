import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/components/toast-provider"
import { Navbar } from "@/components/navbar"
import { Suspense } from "react"
import "./globals.css"

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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="min-h-screen bg-background">{children}</main>
            </ToastProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
