"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, Users, TrendingUp, Clock, Plus, Eye, Edit, Trash2,
  BarChart3, Activity, Calendar, Star, AlertCircle, CheckCircle,
  FileText, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import type { Quiz, QuizAttempt } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface DashboardStats {
  totalQuizzes: number
  activeQuizzes: number
  totalAttempts: number
  totalUsers: number
  avgScore: number
  trendsData: {
    quizzesGrowth: number
    attemptsGrowth: number
    usersGrowth: number
  }
}

interface RecentActivity {
  id: string
  type: "quiz_created" | "quiz_taken" | "user_registered"
  title: string
  description: string
  timestamp: string
  user?: string
}

export function AdminDashboard() {
  const { success, error } = useToast()
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalAttempts: 0,
    totalUsers: 0,
    avgScore: 0,
    trendsData: {
      quizzesGrowth: 0,
      attemptsGrowth: 0,
      usersGrowth: 0
    }
  })
  
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [topQuizzes, setTopQuizzes] = useState<(Quiz & { attemptCount: number, avgScore: number })[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load system stats using AdminService
      const systemStats = await AdminService.getSystemStats()
      
      setStats({
        totalQuizzes: systemStats.totalQuizzes,
        activeQuizzes: systemStats.activeQuizzes,
        totalAttempts: systemStats.totalAttempts,
        totalUsers: systemStats.totalUsers,
        avgScore: systemStats.averageScore,
        trendsData: {
          quizzesGrowth: calculateGrowth(systemStats.attempts, 'completedAt'),
          attemptsGrowth: systemStats.recentAttempts,
          usersGrowth: systemStats.recentUsers
        }
      })

      // Set recent quizzes from system stats
      const allQuizzes = await AdminService.getAllQuizzes()
      setRecentQuizzes(allQuizzes.slice(0, 5))

      // Calculate top quizzes by attempts
      const allAttempts = systemStats.attempts || []
      const quizAttemptCounts = allAttempts.reduce((acc, attempt) => {
        acc[attempt.quizId] = (acc[attempt.quizId] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const quizScores = allAttempts.reduce((acc, attempt) => {
        if (!acc[attempt.quizId]) acc[attempt.quizId] = []
        acc[attempt.quizId].push(attempt.score || 0)
        return acc
      }, {} as Record<string, number[]>)

      const topQuizzesData = allQuizzes
        .map(quiz => ({
          ...quiz,
          attemptCount: quizAttemptCounts[quiz.id] || 0,
          avgScore: quizScores[quiz.id] 
            ? quizScores[quiz.id].reduce((sum, score) => sum + score, 0) / quizScores[quiz.id].length 
            : 0
        }))
        .sort((a, b) => b.attemptCount - a.attemptCount)
        .slice(0, 5)

      setTopQuizzes(topQuizzesData)

      // Generate recent activities from system stats
      const activities: RecentActivity[] = [
        ...allQuizzes.slice(0, 3).map(quiz => ({
          id: `quiz-${quiz.id}`,
          type: "quiz_created" as const,
          title: "Bài thi mới",
          description: quiz.title,
          timestamp: quiz.createdAt,
          user: quiz.createdBy || "admin"
        })),
        ...allAttempts.slice(0, 3).map((attempt, index) => ({
          id: `attempt-${attempt.id}`,
          type: "quiz_taken" as const,
          title: "Hoàn thành bài thi",
          description: `Điểm: ${attempt.score || 0}%`,
          timestamp: attempt.completedAt,
          user: attempt.userId
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6)

      setRecentActivities(activities)

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      error("Không thể tải dữ liệu dashboard")
      // Use mock data for demo if error
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    setStats({
      totalQuizzes: 12,
      activeQuizzes: 8,
      totalAttempts: 245,
      totalUsers: 89,
      avgScore: 75.4,
      trendsData: {
        quizzesGrowth: 15.3,
        attemptsGrowth: 8.7,
        usersGrowth: 12.1
      }
    })

    setRecentActivities([
      {
        id: "1",
        type: "quiz_created",
        title: "Bài thi mới",
        description: "Quiz Python Programming - 129 Questions",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: "admin"
      },
      {
        id: "2", 
        type: "quiz_taken",
        title: "Hoàn thành bài thi",
        description: "Điểm: 85/100",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user: "student123"
      },
      {
        id: "3",
        type: "user_registered", 
        title: "Người dùng mới",
        description: "Nguyễn Văn A đã đăng ký",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ])
  }

  const calculateGrowth = (items: any[], dateField: string): number => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const thisMonth = items.filter(item => new Date(item[dateField]) > lastMonth).length
    const previousMonth = items.filter(item => {
      const date = new Date(item[dateField])
      return date <= lastMonth && date > new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
    }).length
    
    if (previousMonth === 0) return thisMonth > 0 ? 100 : 0
    return ((thisMonth - previousMonth) / previousMonth) * 100
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    success("Đã cập nhật dữ liệu dashboard")
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case "quiz_created": return <BookOpen className="h-4 w-4 text-blue-600" />
      case "quiz_taken": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "user_registered": return <Users className="h-4 w-4 text-purple-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, color }: {
    title: string
    value: string | number
    change?: number
    icon: React.ElementType
    color: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(1)}% so với tháng trước
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Tổng quan hệ thống quản lý bài thi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Link href="/admin/quiz/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài thi
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng bài thi"
          value={stats.totalQuizzes}
          change={stats.trendsData.quizzesGrowth}
          icon={BookOpen}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.activeQuizzes}
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Lượt làm bài"
          value={stats.totalAttempts}
          change={stats.trendsData.attemptsGrowth}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Điểm trung bình"
          value={`${stats.avgScore.toFixed(1)}%`}
          icon={Star}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quizzes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bài thi gần đây</CardTitle>
                <CardDescription>Những bài thi được tạo mới nhất</CardDescription>
              </div>
              <Link href="/admin/quizzes">
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-medium">{quiz.title}</h4>
                      <p className="text-sm text-muted-foreground">{quiz.questions.length} câu hỏi • {quiz.timeLimit} phút</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={quiz.isActive ? "default" : "secondary"}>
                          {quiz.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/quiz/${quiz.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/quiz/edit/${quiz.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Bài thi phổ biến</CardTitle>
              <CardDescription>Dựa trên số lượt làm bài</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{quiz.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{quiz.attemptCount} lượt làm</span>
                        <span>Điểm TB: {quiz.avgScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Các sự kiện mới nhất trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/quiz/create">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Tạo bài thi mới</div>
                  <div className="text-sm text-muted-foreground">Thêm bài thi trắc nghiệm</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/quizzes">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <BookOpen className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Quản lý bài thi</div>
                  <div className="text-sm text-muted-foreground">Xem và chỉnh sửa</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Quản lý users</div>
                  <div className="text-sm text-muted-foreground">Danh sách người dùng</div>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <BarChart3 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Báo cáo</div>
                  <div className="text-sm text-muted-foreground">Thống kê chi tiết</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}