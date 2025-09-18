import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Nunito_Sans, Open_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/components/toast-provider"
import { Navbar } from "@/components/navbar"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import "./globals.css"

// Font configuration for Vietnamese text - Beautiful and professional
const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
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
      <body className={`${nunitoSans.variable} ${openSans.variable} ${poppins.variable} font-sans`} suppressHydrationWarning>
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
