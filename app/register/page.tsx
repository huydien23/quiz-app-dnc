"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { BookOpen, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Redirect admin to admin page, regular user to dashboard  
      if (user.role === 0) {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, name, 1) // Mặc định role = 1 (user)
      // Don't redirect here, let the useEffect handle it
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email này đã được sử dụng")
      } else if (error.code === "auth/weak-password") {
        setError("Mật khẩu quá yếu")
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
      // Don't redirect here, let the useEffect handle it
    } catch (error: any) {
      setError("Đăng nhập với Google thất bại")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back to Home Button */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay về trang chủ
            </Button>
          </Link>
        </div>

        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <BookOpen className="h-8 w-8" />
            </div>
            <span className="text-3xl font-bold text-gradient">QuizMaster</span>
          </Link>
        </div>

        <Card className="border-0 shadow-soft-xl bg-white/90 backdrop-blur-sm animate-slide-up">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl text-center font-heading">Đăng ký</CardTitle>
            <CardDescription className="text-center text-base">Tạo tài khoản mới để bắt đầu luyện thi</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đăng ký
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 bg-transparent"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng ký với Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Đã có tài khoản? </span>
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
