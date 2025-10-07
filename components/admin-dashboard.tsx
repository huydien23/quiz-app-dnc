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
  FileText, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, FileSpreadsheet, Search, Filter, UserCheck, Trophy,
  Award, Target, Zap, TrendingDown, CalendarDays, Hash
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import type { Quiz, QuizAttempt, User } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { LogoutHandler } from "@/components/logout-handler"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

interface QuizResultDetail {
  userId: string
  userName: string
  userEmail: string
  score: number
  correctAnswers: number
  totalQuestions: number
  completedAt: string
  timeSpent: number
  attemptNumber?: number
  userBestScore?: number
}

interface TopPerformer {
  userId: string
  userName: string
  userEmail: string
  avgScore: number
  totalAttempts: number
  bestScore: number
}

interface DailyActivity {
  date: string
  attempts: number
  avgScore: number
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
  
  // New states for enhanced features
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'results' | 'users'>('overview')
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>("")
  const [quizResults, setQuizResults] = useState<QuizResultDetail[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("score")
  
  // Analytics states
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([])
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "all">("7days")
  const [minScore, setMinScore] = useState<string>("")
  const [maxScore, setMaxScore] = useState<string>("")
  const [attemptFilter, setAttemptFilter] = useState<"all" | "first" | "last" | "best">("all")

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (selectedQuiz && allAttempts.length > 0) {
      loadQuizResults(selectedQuiz)
    }
  }, [selectedQuiz, allAttempts, allUsers])

  useEffect(() => {
    // Auto-select first quiz when data loads
    if (!selectedQuiz && allQuizzes.length > 0) {
      setSelectedQuiz(allQuizzes[0].id)
    }
  }, [allQuizzes])

  useEffect(() => {
    // Calculate analytics when data changes
    if (allAttempts.length > 0 && allUsers.length > 0) {
      calculateAnalytics()
    }
  }, [allAttempts, allUsers, dateRange])

  const calculateAnalytics = () => {
    // Calculate Top Performers
    const userStats = allUsers.map(user => {
      const userAttempts = allAttempts.filter(a => a.userId === user.id)
      if (userAttempts.length === 0) return null
      
      const avgScore = userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length
      const bestScore = Math.max(...userAttempts.map(a => a.score))
      
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        avgScore: Math.round(avgScore * 10) / 10,
        totalAttempts: userAttempts.length,
        bestScore
      }
    }).filter(Boolean) as TopPerformer[]
    
    setTopPerformers(userStats.sort((a, b) => b.avgScore - a.avgScore).slice(0, 10))
    
    // Calculate Daily Activities
    const now = new Date()
    const daysToShow = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90
    const activities: DailyActivity[] = []
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayAttempts = allAttempts.filter(a => {
        const attemptDate = new Date(a.completedAt)
        return attemptDate >= date && attemptDate < nextDate
      })
      
      const avgScore = dayAttempts.length > 0
        ? dayAttempts.reduce((sum, a) => sum + a.score, 0) / dayAttempts.length
        : 0
      
      activities.push({
        date: date.toISOString().split('T')[0],
        attempts: dayAttempts.length,
        avgScore: Math.round(avgScore * 10) / 10
      })
    }
    
    setDailyActivities(activities)
  }

  const loadQuizResults = (quizId: string) => {
    const quizAttempts = allAttempts.filter(a => a.quizId === quizId)
    const quiz = allQuizzes.find(q => q.id === quizId)
    
    const results: QuizResultDetail[] = quizAttempts.map(attempt => {
      const user = allUsers.find(u => u.id === attempt.userId)
      
      // Calculate attempt number for this user on this quiz
      const userQuizAttempts = quizAttempts
        .filter(a => a.userId === attempt.userId)
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      const attemptNumber = userQuizAttempts.findIndex(a => a.id === attempt.id) + 1
      
      // Get user's best score on this quiz
      const userBestScore = Math.max(...userQuizAttempts.map(a => a.score))
      
      return {
        userId: attempt.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        score: attempt.score,
        correctAnswers: attempt.correctAnswers || 0,
        totalQuestions: attempt.totalQuestions || quiz?.questions?.length || 0,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        attemptNumber,
        userBestScore
      }
    })
    
    setQuizResults(results)
  }

  const exportToCSV = () => {
    if (quizResults.length === 0) {
      error("Không có dữ liệu để xuất")
      return
    }

    const quiz = allQuizzes.find(q => q.id === selectedQuiz)
    const quizTitle = quiz?.title || "BaiThi"

    // Create CSV content
    const headers = ["STT", "Họ và tên", "Email", "Điểm", "Đúng/Tổng", "Thời gian", "Ngày hoàn thành"]
    const rows = sortedResults.map((result, index) => [
      index + 1,
      result.userName,
      result.userEmail,
      result.score,
      `${result.correctAnswers}/${result.totalQuestions}`,
      formatTime(result.timeSpent),
      new Date(result.completedAt).toLocaleString("vi-VN")
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Add BOM for Excel UTF-8 support
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${quizTitle}_KetQua_${new Date().toLocaleDateString("vi-VN").replace(/\//g, '-')}.csv`)
    link.click()
    URL.revokeObjectURL(url)

    success("Đã xuất file CSV thành công!")
  }

  const exportToExcel = () => {
    if (quizResults.length === 0) {
      error("Không có dữ liệu để xuất")
      return
    }

    const quiz = allQuizzes.find(q => q.id === selectedQuiz)
    const quizTitle = quiz?.title || "BaiThi"

    // Create Excel-friendly HTML
    const headers = ["STT", "Họ và tên", "Email", "Điểm", "Đúng/Tổng", "Thời gian", "Ngày hoàn thành"]
    const rows = sortedResults.map((result, index) => [
      index + 1,
      result.userName,
      result.userEmail,
      result.score,
      `${result.correctAnswers}/${result.totalQuestions}`,
      formatTime(result.timeSpent),
      new Date(result.completedAt).toLocaleString("vi-VN")
    ])

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Bảng điểm: ${quiz?.title || 'N/A'}</h2>
        <p>Ngày xuất: ${new Date().toLocaleString("vi-VN")}</p>
        <p>Tổng số học viên: ${rows.length}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${quizTitle}_KetQua_${new Date().toLocaleDateString("vi-VN").replace(/\//g, '-')}.xls`)
    link.click()
    URL.revokeObjectURL(url)

    success("Đã xuất file Excel thành công!")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Filter and sort results
  let filteredResults = quizResults.filter(result => {
    // Search filter
    const matchSearch = result.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       result.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Score range filter
    const matchScore = (minScore === "" || result.score >= parseInt(minScore)) &&
                      (maxScore === "" || result.score <= parseInt(maxScore))
    
    return matchSearch && matchScore
  })

  // Attempt filter (first/last/best)
  if (attemptFilter !== "all") {
    const userLastAttempts = new Map<string, QuizResultDetail>()
    
    filteredResults.forEach(result => {
      const key = result.userId
      const existing = userLastAttempts.get(key)
      
      if (!existing) {
        userLastAttempts.set(key, result)
      } else {
        if (attemptFilter === "first") {
          if (new Date(result.completedAt) < new Date(existing.completedAt)) {
            userLastAttempts.set(key, result)
          }
        } else if (attemptFilter === "last") {
          if (new Date(result.completedAt) > new Date(existing.completedAt)) {
            userLastAttempts.set(key, result)
          }
        } else if (attemptFilter === "best") {
          if (result.score > existing.score) {
            userLastAttempts.set(key, result)
          }
        }
      }
    })
    
    filteredResults = Array.from(userLastAttempts.values())
  }

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return b.score - a.score
      case "date":
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      case "name":
        return a.userName.localeCompare(b.userName)
      default:
        return 0
    }
  })

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load REAL data from Firebase
      const [quizzesData, usersData, attemptsData] = await Promise.all([
        AdminService.getAllQuizzes(),
        AdminService.getAllUsers(),
        AdminService.getAllAttempts()
      ])
      
      setAllQuizzes(quizzesData)
      setAllUsers(usersData)
      setAllAttempts(attemptsData)
      
      const allQuizzes = quizzesData
      const allAttempts = attemptsData
      const allUsers = usersData

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
          timestamp: attempt.completedAt,
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
    <div className="space-y-6 pb-20">
      <LogoutHandler />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading">Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-600 font-body">Tổng quan hệ thống quản lý bài thi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
          <Link href="/admin/quiz/create" className="flex-1 sm:flex-none">
            <Button variant="outline" className="btn-secondary w-full">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tạo bài thi</span>
            </Button>
          </Link>
          <Link href="/admin/quiz/quick" className="flex-1 sm:flex-none">
            <Button className="btn-primary w-full">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tạo nhanh</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics">Thống kê</TabsTrigger>
          <TabsTrigger value="results">Kết quả</TabsTrigger>
          <TabsTrigger value="users">Học viên</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">

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
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Phân tích chi tiết</h2>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Top Performers */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top 10 Học Viên Xuất Sắc
              </CardTitle>
              <CardDescription>Xếp hạng theo điểm trung bình</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop View */}
              <div className="hidden md:block space-y-3">
                {topPerformers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                ) : (
                  topPerformers.map((performer, index) => (
                    <div 
                      key={performer.userId} 
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        index < 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900">{performer.userName}</h4>
                        <p className="text-sm text-slate-600 truncate">{performer.userEmail}</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Điểm TB</p>
                          <Badge variant="default" className="text-base font-bold">
                            {performer.avgScore}%
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Cao nhất</p>
                          <Badge variant="secondary" className="text-base font-bold">
                            {performer.bestScore}%
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Số lần thi</p>
                          <div className="text-lg font-bold text-blue-600">
                            {performer.totalAttempts}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {topPerformers.slice(0, 5).map((performer, index) => (
                  <div 
                    key={performer.userId}
                    className={`p-4 rounded-lg ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{performer.userName}</h4>
                        <p className="text-xs text-slate-600 truncate">{performer.userEmail}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Điểm TB</p>
                        <p className="text-lg font-bold text-green-600">{performer.avgScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Cao nhất</p>
                        <p className="text-lg font-bold text-blue-600">{performer.bestScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Lần thi</p>
                        <p className="text-lg font-bold text-purple-600">{performer.totalAttempts}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily Activity Chart */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Hoạt động theo ngày
              </CardTitle>
              <CardDescription>Số lượt thi và điểm trung bình mỗi ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyActivities.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có hoạt động</p>
                  </div>
                ) : (
                  dailyActivities.map((activity) => {
                    const maxAttempts = Math.max(...dailyActivities.map(a => a.attempts))
                    const barWidth = maxAttempts > 0 ? (activity.attempts / maxAttempts) * 100 : 0
                    
                    return (
                      <div key={activity.date} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-medium">
                            {new Date(activity.date).toLocaleDateString('vi-VN', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: dateRange === "all" ? '2-digit' : undefined
                            })}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-700 font-bold">{activity.attempts} lượt</span>
                            {activity.attempts > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.avgScore}% TB
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Statistics */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Thống kê theo bài thi
              </CardTitle>
              <CardDescription>Điểm trung bình và số lượt thi mỗi bài</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có bài thi nào</p>
                  </div>
                ) : (
                  allQuizzes.map(quiz => {
                    const quizAttempts = allAttempts.filter(a => a.quizId === quiz.id)
                    const avgScore = quizAttempts.length > 0
                      ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
                      : 0
                    const maxScore = quizAttempts.length > 0
                      ? Math.max(...quizAttempts.map(a => a.score))
                      : 0
                    const minScore = quizAttempts.length > 0
                      ? Math.min(...quizAttempts.map(a => a.score))
                      : 0
                    
                    return (
                      <div key={quiz.id} className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">{quiz.title}</h4>
                            <p className="text-sm text-slate-600">{quiz.questions?.length || 0} câu hỏi</p>
                          </div>
                          <Badge variant={quiz.isActive ? "default" : "secondary"}>
                            {quiz.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center p-2 rounded bg-blue-50">
                            <p className="text-xs text-slate-600 mb-1">Lượt thi</p>
                            <p className="text-lg font-bold text-blue-600">{quizAttempts.length}</p>
                          </div>
                          <div className="text-center p-2 rounded bg-green-50">
                            <p className="text-xs text-slate-600 mb-1">Điểm TB</p>
                            <p className="text-lg font-bold text-green-600">{avgScore}%</p>
                          </div>
                          <div className="text-center p-2 rounded bg-purple-50">
                            <p className="text-xs text-slate-600 mb-1">Cao nhất</p>
                            <p className="text-lg font-bold text-purple-600">{maxScore}%</p>
                          </div>
                          <div className="text-center p-2 rounded bg-orange-50">
                            <p className="text-xs text-slate-600 mb-1">Thấp nhất</p>
                            <p className="text-lg font-bold text-orange-600">{minScore}%</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Phân bố điểm số
              </CardTitle>
              <CardDescription>Thống kê phân bố điểm của tất cả bài thi</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const excellent = allAttempts.filter(a => a.score >= 80).length
                const good = allAttempts.filter(a => a.score >= 50 && a.score < 80).length
                const poor = allAttempts.filter(a => a.score < 50).length
                const total = allAttempts.length
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Xuất sắc (≥80%)</span>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-700">{excellent}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {total > 0 ? Math.round((excellent / total) * 100) : 0}% tổng số
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-700">Khá (50-79%)</span>
                          <Star className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-700">{good}</p>
                        <p className="text-xs text-orange-600 mt-1">
                          {total > 0 ? Math.round((good / total) * 100) : 0}% tổng số
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-red-700">Yếu (&lt;50%)</span>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-700">{poor}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {total > 0 ? Math.round((poor / total) * 100) : 0}% tổng số
                        </p>
                      </div>
                    </div>
                    
                    {total > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Tổng số lượt thi:</span>
                          <span className="font-bold text-slate-900">{total}</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 h-full"
                            style={{ width: `${(excellent / total) * 100}%` }}
                            title={`Xuất sắc: ${excellent}`}
                          />
                          <div 
                            className="bg-orange-500 h-full"
                            style={{ width: `${(good / total) * 100}%` }}
                            title={`Khá: ${good}`}
                          />
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${(poor / total) * 100}%` }}
                            title={`Yếu: ${poor}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS TAB */}
        <TabsContent value="results" className="space-y-6 mt-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Bảng điểm chi tiết</CardTitle>
                  <CardDescription className="mt-1">Xem và xuất kết quả theo bài thi</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={quizResults.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={quizResults.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters Row 1 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Chọn bài thi" />
                  </SelectTrigger>
                  <SelectContent>
                    {allQuizzes.length === 0 ? (
                      <SelectItem value="none" disabled>Chưa có bài thi</SelectItem>
                    ) : (
                      allQuizzes.map(quiz => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm học viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-24 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Điểm</SelectItem>
                      <SelectItem value="date">Ngày</SelectItem>
                      <SelectItem value="name">Tên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters Row 2 - Advanced */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Điểm từ</label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Điểm đến</label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-600">Lọc lần thi</label>
                  <Select value={attemptFilter} onValueChange={(value: any) => setAttemptFilter(value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả lần thi</SelectItem>
                      <SelectItem value="first">Lần đầu tiên</SelectItem>
                      <SelectItem value="last">Lần gần nhất</SelectItem>
                      <SelectItem value="best">Điểm cao nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stats Summary for current filters */}
              {selectedQuiz && quizResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs text-slate-600 mb-1">Tổng lượt thi</p>
                    <p className="text-xl font-bold text-blue-700">{quizResults.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs text-slate-600 mb-1">Điểm TB</p>
                    <p className="text-xl font-bold text-green-700">
                      {Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-xs text-slate-600 mb-1">Cao nhất</p>
                    <p className="text-xl font-bold text-purple-700">
                      {Math.max(...quizResults.map(r => r.score))}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-xs text-slate-600 mb-1">Thấp nhất</p>
                    <p className="text-xl font-bold text-orange-700">
                      {Math.min(...quizResults.map(r => r.score))}%
                    </p>
                  </div>
                </div>
              )}

              {/* Results Table - Mobile Optimized */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-16">STT</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Lần thi</TableHead>
                        <TableHead className="text-center">Điểm</TableHead>
                        <TableHead className="text-center">Cao nhất</TableHead>
                        <TableHead className="text-center">Đúng/Tổng</TableHead>
                        <TableHead className="text-center">Thời gian</TableHead>
                        <TableHead>Hoàn thành</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedQuiz ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                            Vui lòng chọn bài thi
                          </TableCell>
                        </TableRow>
                      ) : sortedResults.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                            Chưa có kết quả nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedResults.map((result, index) => {
                          const isBestScore = result.score === result.userBestScore
                          const scoreImprovement = result.userBestScore && result.score < result.userBestScore
                          
                          return (
                            <TableRow key={`${result.userId}-${result.completedAt}-${index}`} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="font-medium">{result.userName}</TableCell>
                              <TableCell className="text-slate-600">{result.userEmail}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-medium">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {result.attemptNumber || 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Badge 
                                    variant={result.score >= 80 ? "default" : result.score >= 50 ? "secondary" : "destructive"}
                                    className="font-bold"
                                  >
                                    {result.score}
                                  </Badge>
                                  {isBestScore && result.attemptNumber && result.attemptNumber > 1 && (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                  )}
                                  {scoreImprovement && (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="font-semibold">
                                  {result.userBestScore || result.score}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-slate-600">
                                {result.correctAnswers}/{result.totalQuestions}
                              </TableCell>
                              <TableCell className="text-center text-slate-600">
                                {formatTime(result.timeSpent)}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {new Date(result.completedAt).toLocaleString("vi-VN")}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-200">
                  {!selectedQuiz ? (
                    <div className="p-8 text-center text-slate-500">
                      Vui lòng chọn bài thi
                    </div>
                  ) : sortedResults.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Chưa có kết quả nào
                    </div>
                  ) : (
                    sortedResults.map((result, index) => {
                      const isBestScore = result.score === result.userBestScore
                      
                      return (
                        <div key={`${result.userId}-${result.completedAt}-${index}`} className="p-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                                <h4 className="font-semibold text-slate-900 truncate">{result.userName}</h4>
                                {result.attemptNumber && result.attemptNumber > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    Lần {result.attemptNumber}
                                  </Badge>
                                )}
                                {isBestScore && result.attemptNumber && result.attemptNumber > 1 && (
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-slate-600 truncate">{result.userEmail}</p>
                            </div>
                            <div className="ml-2 flex flex-col gap-1">
                              <Badge 
                                variant={result.score >= 80 ? "default" : result.score >= 50 ? "secondary" : "destructive"}
                                className="font-bold"
                              >
                                {result.score}
                              </Badge>
                              {result.userBestScore && result.userBestScore !== result.score && (
                                <Badge variant="secondary" className="text-xs">
                                  Max: {result.userBestScore}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                            <span>✓ {result.correctAnswers}/{result.totalQuestions}</span>
                            <span>⏱️ {formatTime(result.timeSpent)}</span>
                            <span>{new Date(result.completedAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {sortedResults.length > 0 && (
                <div className="text-sm text-slate-600 text-center">
                  Hiển thị {sortedResults.length} kết quả
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Danh sách học viên
                  </CardTitle>
                  <CardDescription>Quản lý người dùng trong hệ thống</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm kiếm..."
                    className="w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">Tổng học viên</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {allUsers.filter(u => u.role === 1).length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
                  <p className="text-xs text-slate-600 mb-1">Admin</p>
                  <p className="text-2xl font-bold text-green-700">
                    {allUsers.filter(u => u.role === 0).length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">Hoạt động</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {allUsers.filter(u => allAttempts.some(a => a.userId === u.id)).length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                  <p className="text-xs text-slate-600 mb-1">Mới tháng này</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {allUsers.filter(u => {
                      const userDate = new Date(u.createdAt)
                      const now = new Date()
                      return userDate.getMonth() === now.getMonth() && 
                             userDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                      <TableHead className="w-16 font-bold">STT</TableHead>
                      <TableHead className="font-bold">Họ và tên</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="text-center font-bold">Vai trò</TableHead>
                      <TableHead className="text-center font-bold">Số bài thi</TableHead>
                      <TableHead className="text-center font-bold">Điểm TB</TableHead>
                      <TableHead className="font-bold">Ngày đăng ký</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p className="text-slate-500 font-medium">Chưa có người dùng nào</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allUsers
                        .filter(user => 
                          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((user, index) => {
                          const userAttempts = allAttempts.filter(a => a.userId === user.id)
                          const avgScore = userAttempts.length > 0
                            ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
                            : 0
                          
                          return (
                            <TableRow 
                              key={user.id} 
                              className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                            >
                              <TableCell className="font-medium text-slate-700">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800">{user.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {user.email}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={user.role === 0 ? "default" : "secondary"}
                                  className={user.role === 0 ? "bg-gradient-to-r from-blue-500 to-blue-600" : ""}
                                >
                                  {user.role === 0 ? "👑 Admin" : "👨‍🎓 Học viên"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                  {userAttempts.length}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {userAttempts.length > 0 ? (
                                  <Badge 
                                    variant={avgScore >= 80 ? "default" : avgScore >= 50 ? "secondary" : "destructive"}
                                    className="font-bold text-sm"
                                  >
                                    {avgScore}%
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">--</span>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: vi })}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {allUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Chưa có người dùng nào</p>
                  </div>
                ) : (
                  allUsers
                    .filter(user => 
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user, index) => {
                      const userAttempts = allAttempts.filter(a => a.userId === user.id)
                      const avgScore = userAttempts.length > 0
                        ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
                        : 0
                      
                      return (
                        <div 
                          key={user.id} 
                          className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                                <h4 className="font-bold text-slate-900 truncate">{user.name}</h4>
                              </div>
                              <p className="text-sm text-slate-600 truncate">{user.email}</p>
                              <Badge 
                                variant={user.role === 0 ? "default" : "secondary"}
                                className="mt-2"
                              >
                                {user.role === 0 ? "👑 Admin" : "👨‍🎓 Học viên"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">Bài thi</p>
                              <p className="text-lg font-bold text-blue-600">{userAttempts.length}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">Điểm TB</p>
                              {userAttempts.length > 0 ? (
                                <p className={`text-lg font-bold ${
                                  avgScore >= 80 ? 'text-green-600' : 
                                  avgScore >= 50 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {avgScore}%
                                </p>
                              ) : (
                                <p className="text-lg text-slate-300 font-bold">--</p>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">Đăng ký</p>
                              <p className="text-xs font-medium text-slate-600">
                                {new Date(user.createdAt).toLocaleDateString("vi-VN", { 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>

              {/* Footer */}
              {allUsers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
                  Hiển thị {allUsers.filter(user => 
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length} / {allUsers.length} người dùng
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}