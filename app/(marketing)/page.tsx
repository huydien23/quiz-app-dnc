"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { LandingPage } from "@/components/landing-page"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Auto redirect based on user role
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 0) {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  // Show loading or login options for non-authenticated users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse">📚</div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, they will be redirected
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 text-primary mx-auto mb-4">📚</div>
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  return <LandingPage />
}
