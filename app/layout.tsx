import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/components/toast-provider"
import { Navbar } from "@/components/navbar"
import { ErrorBoundary } from "@/components/error-boundary"
import { SuppressHydrationWarning } from "@/components/suppress-hydration-warning"
import { Suspense } from "react"
import "./globals.css"
import { APP_CONFIG } from "@/lib/constants"

// Font configuration - Inter for modern, clean typography
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Luyện thi trắc nghiệm`,
  description: APP_CONFIG.description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://quiz-app-dnc.vercel.app"),
  openGraph: {
    title: `${APP_CONFIG.name} - Luyện thi trắc nghiệm`,
    description: APP_CONFIG.description,
    url: "https://quiz-app-dnc.vercel.app",
    siteName: APP_CONFIG.name,
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: APP_CONFIG.name,
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.name} - Luyện thi trắc nghiệm`,
    description: APP_CONFIG.description,
    images: ["/placeholder-logo.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script src="/suppress-warnings.js" />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <SuppressHydrationWarning />
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
