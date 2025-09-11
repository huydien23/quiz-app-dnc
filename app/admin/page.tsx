"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminService } from "@/lib/admin-service"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Users, BookOpen, BarChart3, Plus, Settings, Activity, Target } from "lucide-react"

interface SystemStats {
  totalUsers: number
  totalQuizzes: number
  activeQuizzes: number
  totalAttempts: number
  averageScore: number
  recentAttempts: number
  recentUsers: number
  users: any[]
  attempts: any[]
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const systemStats = await AdminService.getSystemStats()
        setStats(systemStats)
      } catch (error) {
        console.error("Error loading admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải dashboard quản trị...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Quản Trị</h1>
          <p className="text-muted-foreground">Quản lý hệ thống luyện thi trắc nghiệm</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">+{stats?.recentUsers || 0} trong 7 ngày qua</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng bài thi</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalQuizzes || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.activeQuizzes || 0} bài thi đang hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lượt làm bài</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAttempts || 0}</div>
              <p className="text-xs text-muted-foreground">+{stats?.recentAttempts || 0} trong 7 ngày qua</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
              <p className="text-xs text-muted-foreground">Điểm số hệ thống</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Hành động nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/quiz/create">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài thi mới
                  </Button>
                </Link>
                <Link href="/admin/quizzes">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Quản lý bài thi
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Quản lý người dùng
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Thống kê chi tiết
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Người dùng mới
                </CardTitle>
                <CardDescription>Người dùng đăng ký gần đây</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.users && stats.users.length > 0 ? (
                  <div className="space-y-3">
                    {stats.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Admin" : "Học sinh"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có người dùng mới</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Hoạt động gần đây
                </CardTitle>
                <CardDescription>Lượt làm bài thi mới nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.attempts && stats.attempts.length > 0 ? (
                  <div className="space-y-3">
                    {stats.attempts.slice(0, 5).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">Bài thi hoàn thành</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.completedAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <Badge
                          variant={attempt.score >= 8 ? "default" : attempt.score >= 6 ? "secondary" : "destructive"}
                        >
                          {Math.round((attempt.score / 10) * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có hoạt động nào</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
