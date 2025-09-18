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
import { LogoutHandler } from "@/components/logout-handler"

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
  type: 'quiz_completed' | 'quiz_created' | 'user_registered'
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
  const [topQuizzes, setTopQuizzes] = useState<(Quiz & { attemptCount: number, avgScore: number })[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for testing
      const mockQuizzes = [
        {
          id: "1",
          title: "Bài thi Python cơ bản",
          description: "Kiểm tra kiến thức Python cơ bản",
          questions: [
            { id: "1", question: "Python là gì?", options: ["Ngôn ngữ lập trình", "Hệ điều hành", "Database", "Framework"], correctAnswer: 0 },
            { id: "2", question: "Cú pháp nào đúng?", options: ["print('Hello')", "echo 'Hello'", "console.log('Hello')", "System.out.println('Hello')"], correctAnswer: 0 }
          ],
          timeLimit: 60,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "2", 
          title: "Bài thi JavaScript",
          description: "Kiểm tra kiến thức JavaScript",
          questions: [
            { id: "1", question: "JavaScript là gì?", options: ["Ngôn ngữ lập trình", "Hệ điều hành", "Database", "Framework"], correctAnswer: 0 }
          ],
          timeLimit: 45,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]

      const mockAttempts = [
        {
          id: "1",
          quizId: "1",
          userId: "user1",
          score: 85,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: "2", 
          quizId: "2",
          userId: "user2",
          score: 92,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]

      const mockUsers = [
        {
          id: "user1",
          name: "Nguyễn Văn A",
          email: "user1@example.com",
          role: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: "user2",
          name: "Trần Thị B", 
          email: "user2@example.com",
          role: 1,
          createdAt: new Date().toISOString()
        }
      ]

      // Use mock data instead of API calls
      const allQuizzes = mockQuizzes
      const allAttempts = mockAttempts
      const allUsers = mockUsers

      const activeQuizzes = allQuizzes.filter(quiz => quiz.isActive)
      const totalAttempts = allAttempts.length
      const totalUsers = allUsers.length
      
      // Calculate average score
      const avgScore = allAttempts.length > 0 
        ? allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / allAttempts.length
        : 0

      // Calculate growth trends (mock data for now)
      const quizzesGrowth = Math.floor(Math.random() * 20) + 5
      const attemptsGrowth = Math.floor(Math.random() * 30) + 10
      const usersGrowth = Math.floor(Math.random() * 15) + 8

      setStats({
        totalQuizzes: allQuizzes.length,
        activeQuizzes: activeQuizzes.length,
        totalAttempts,
        totalUsers,
        avgScore: Math.round(avgScore * 100) / 100,
        trendsData: {
          quizzesGrowth,
          attemptsGrowth,
          usersGrowth
        }
      })

      // Set recent quizzes (last 5)
      setRecentQuizzes(activeQuizzes.slice(0, 5))

      // Calculate top quizzes by attempts
      const quizAttempts = allAttempts.reduce((acc, attempt) => {
        if (!acc[attempt.quizId]) {
          acc[attempt.quizId] = { count: 0, totalScore: 0 }
        }
        acc[attempt.quizId].count++
        acc[attempt.quizId].totalScore += attempt.score || 0
        return acc
      }, {} as Record<string, { count: number, totalScore: number }>)

      const topQuizzesData = Object.entries(quizAttempts)
        .map(([quizId, data]) => {
          const quiz = allQuizzes.find(q => q.id === quizId)
          if (!quiz) return null
          return {
            ...quiz,
            attemptCount: data.count,
            avgScore: data.count > 0 ? data.totalScore / data.count : 0
          }
        })
        .filter(Boolean)
        .sort((a, b) => b!.attemptCount - a!.attemptCount)
        .slice(0, 5) as (Quiz & { attemptCount: number, avgScore: number })[]

      setTopQuizzes(topQuizzesData)

      // Generate recent activities
      const activities: RecentActivity[] = []
      
      // Add recent quiz completions
      allAttempts.slice(0, 3).forEach(attempt => {
        const user = allUsers.find(u => u.id === attempt.userId)
        activities.push({
          id: `attempt-${attempt.id}`,
          type: 'quiz_completed',
          description: `${user?.name || 'Người dùng'} đã hoàn thành bài thi`,
          timestamp: attempt.completedAt || attempt.createdAt,
          user: user?.name
        })
      })

      // Add recent quiz creations
      allQuizzes.slice(0, 2).forEach(quiz => {
        activities.push({
          id: `quiz-${quiz.id}`,
          type: 'quiz_created',
          description: `Bài thi "${quiz.title}" đã được tạo`,
          timestamp: quiz.createdAt
        })
      })

      // Add recent user registrations
      allUsers.slice(0, 2).forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registered',
          description: `${user.name} đã đăng ký tài khoản`,
          timestamp: user.createdAt,
          user: user.name
        })
      })

      // Sort by timestamp and take recent 5
      setRecentActivities(
        activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
      )

    } catch (err) {
      error("Không thể tải dữ liệu dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    success("Đã làm mới dữ liệu")
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue 
  }: {
    title: string
    value: number | string
    subtitle?: string
    icon: any
    trend?: 'up' | 'down'
    trendValue?: string
  }) => (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Icon className="h-6 w-6" />
            </div>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {trendValue}
              </div>
            )}
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
            <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-slate-200 rounded w-full"></div>
                    ))}
                  </div>
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
      <LogoutHandler />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-heading">Dashboard</h1>
          <p className="text-slate-600 font-body">Tổng quan hệ thống quản lý bài thi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <div className="flex gap-2">
            <Link href="/admin/quiz/create">
              <Button variant="outline" className="btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Tạo bài thi
              </Button>
            </Link>
            <Link href="/admin/quiz/quick">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Tạo nhanh
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng bài thi"
          value={stats.totalQuizzes}
          subtitle={`${stats.trendsData.quizzesGrowth}% so với tháng trước`}
          icon={BookOpen}
          trend="up"
          trendValue={`+${stats.trendsData.quizzesGrowth}%`}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.activeQuizzes}
          icon={CheckCircle}
        />
        <StatCard
          title="Lượt làm bài"
          value={stats.totalAttempts}
          subtitle={`${stats.trendsData.attemptsGrowth}% so với tháng trước`}
          icon={TrendingUp}
          trend="up"
          trendValue={`+${stats.trendsData.attemptsGrowth}%`}
        />
        <StatCard
          title="Điểm trung bình"
          value={`${stats.avgScore}%`}
          icon={Star}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Bài thi gần đây
            </CardTitle>
            <CardDescription>Danh sách các bài thi được tạo gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Chưa có bài thi nào</p>
                </div>
              ) : (
                recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{quiz.title}</h4>
                      <p className="text-sm text-slate-600">{quiz.questions?.length || 0} câu hỏi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>
                        {quiz.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                      <Link href={`/quiz/${quiz.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Quizzes */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Bài thi phổ biến
            </CardTitle>
            <CardDescription>Top bài thi có nhiều lượt làm nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topQuizzes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Chưa có dữ liệu thống kê</p>
                </div>
              ) : (
                topQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{quiz.title}</h4>
                        <p className="text-sm text-slate-600">{quiz.attemptCount} lượt làm</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">{Math.round(quiz.avgScore)}%</p>
                      <p className="text-xs text-slate-600">điểm TB</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Hoạt động gần đây
          </CardTitle>
          <CardDescription>Những hoạt động mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Chưa có hoạt động nào</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center text-sm">
                    {activity.type === 'quiz_completed' && <CheckCircle className="h-4 w-4" />}
                    {activity.type === 'quiz_created' && <Plus className="h-4 w-4" />}
                    {activity.type === 'user_registered' && <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}