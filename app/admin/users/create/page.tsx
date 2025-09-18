"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateUserPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<0 | 1>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password) {
      setError("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      // In real app, this would create user via API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      router.push("/admin/users")
    } catch (err) {
      setError("Không thể tạo người dùng. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tạo người dùng mới</h1>
            <p className="text-muted-foreground">Thêm người dùng mới vào hệ thống</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin người dùng</CardTitle>
            <CardDescription>
              Điền thông tin để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Vai trò *</Label>
                <Select value={role.toString()} onValueChange={(value) => setRole(parseInt(value) as 0 | 1)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Học sinh</SelectItem>
                    <SelectItem value="0">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {loading ? "Đang tạo..." : "Tạo người dùng"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
