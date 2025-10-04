"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, Clock, Award, TrendingUp, Target, 
  BarChart3, Calendar, Users, Star, Trophy,
  ArrowUp, ArrowDown, Minus
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizAttempt } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"

interface StatsData {
  totalAttempts: number
  averageScore: number
  bestScore: number
  worstScore: number
  totalTimeSpent: number
  quizzesCompleted: number
  improvement: number
  weeklyProgress: number[]
  monthlyProgress: number[]
  subjectStats: { [key: string]: number }
  difficultyStats: { [key: string]: number }
  recentTrend: 'up' | 'down' | 'stable'
}

export default function StatsPage() {
  const { user } = useAuth()
  const { error } = useToast()
  const router = useRouter()
  
  const handleTabChange = (value: string) => {
    if (value === 'info') {
      router.push('/dashboard/profile?tab=info')
    }
  }
  
  const [stats, setStats] = useState<StatsData>({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0,
    totalTimeSpent: 0,
    quizzesCompleted: 0,
    improvement: 0,
    weeklyProgress: [],
    monthlyProgress: [],
    subjectStats: {},
    difficultyStats: {},
    recentTrend: 'stable'
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("all") // all, week, month, year

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user, timeRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [allAttempts, allQuizzes] = await Promise.all([
        AdminService.getAllAttempts(),
        QuizService.getAllQuizzes()
      ])
      
      const myAttempts = allAttempts
        .filter(attempt => attempt.userId === user?.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      // Filter by time range
      const now = new Date()
      let filteredAttempts = myAttempts
      
      if (timeRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredAttempts = myAttempts.filter(attempt => new Date(attempt.completedAt) >= weekAgo)
      } else if (timeRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredAttempts = myAttempts.filter(attempt => new Date(attempt.completedAt) >= monthAgo)
      } else if (timeRange === "year") {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        filteredAttempts = myAttempts.filter(attempt => new Date(attempt.completedAt) >= yearAgo)
      }

      // Calculate basic stats
      const totalAttempts = filteredAttempts.length
      const averageScore = totalAttempts > 0 
        ? filteredAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts 
        : 0
      const bestScore = totalAttempts > 0 
        ? Math.max(...filteredAttempts.map(attempt => attempt.score || 0))
        : 0
      const worstScore = totalAttempts > 0 
        ? Math.min(...filteredAttempts.map(attempt => attempt.score || 0))
        : 0
      const totalTimeSpent = filteredAttempts.reduce((total, attempt) => total + (attempt.timeSpent || 0), 0)
      const quizzesCompleted = new Set(filteredAttempts.map(attempt => attempt.quizId)).size

      // Calculate improvement
      let improvement = 0
      if (filteredAttempts.length >= 2) {
        const recent = filteredAttempts.slice(0, Math.min(5, filteredAttempts.length))
        const older = filteredAttempts.slice(Math.min(5, filteredAttempts.length))
        
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / recent.length
          const olderAvg = older.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / older.length
          improvement = recentAvg - olderAvg
        }
      }

      // Calculate trend
      let recentTrend: 'up' | 'down' | 'stable' = 'stable'
      if (filteredAttempts.length >= 3) {
        const last3 = filteredAttempts.slice(0, 3).map(attempt => attempt.score || 0)
        const first = last3[0]
        const last = last3[last3.length - 1]
        if (last > first) recentTrend = 'up'
        else if (last < first) recentTrend = 'down'
      }

      // Calculate weekly progress (last 7 days)
      const weeklyProgress = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayAttempts = filteredAttempts.filter(attempt => {
          const attemptDate = new Date(attempt.completedAt)
          return attemptDate.toDateString() === date.toDateString()
        })
        const dayAvg = dayAttempts.length > 0 
          ? dayAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / dayAttempts.length
          : 0
        weeklyProgress.push(Math.round(dayAvg))
      }

      setStats({
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore,
        worstScore,
        totalTimeSpent,
        quizzesCompleted,
        improvement: Math.round(improvement * 100) / 100,
        weeklyProgress,
        monthlyProgress: [],
        subjectStats: {},
        difficultyStats: {},
        recentTrend
      })

    } catch (err) {
      console.error('Error loading stats:', err)
      error("Không thể tải thống kê")
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="pb-24">
        {/* Tabs Navigation */}
        <Tabs value="stats" onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm h-11">
            <TabsTrigger 
              value="info"
              className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium">Thông tin</span>
              <span className="sm:hidden text-sm font-medium">Hồ sơ</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Thống kê</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Time Range Filters - Compact mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          <Button
            variant={timeRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("all")}
            className={cn(
              "flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4",
              timeRange === "all" 
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md" 
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            Tất cả
          </Button>
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
            className={cn(
              "flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4",
              timeRange === "week" 
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md" 
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            7 ngày
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
            className={cn(
              "flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4",
              timeRange === "month" 
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md" 
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            30 ngày
          </Button>
          <Button
            variant={timeRange === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("year")}
            className={cn(
              "flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4",
              timeRange === "year" 
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md" 
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            1 năm
          </Button>
        </div>

        {/* Key Metrics - 2x2 Grid on mobile, horizontal layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Tổng lần làm</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 font-heading">{stats.totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Điểm TB</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 font-heading">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Cao nhất</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 font-heading">{stats.bestScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Thời gian</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 font-heading">{Math.round(stats.totalTimeSpent / 60)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress and Trends - Mobile optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Weekly Progress - Compact mobile */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Tiến độ tuần</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 font-body">Điểm TB theo ngày</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 sm:space-y-3">
                {stats.weeklyProgress.map((score, index) => {
                  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                  return (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 sm:w-8 text-xs sm:text-sm font-medium text-slate-600 font-body flex-shrink-0">
                        {days[index]}
                      </div>
                      <div className="flex-1">
                        <Progress value={score} className="h-1.5 sm:h-2" />
                      </div>
                      <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-slate-800 font-body text-right">
                        {score}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Improvement - Compact mobile */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Cải thiện</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 font-body">Xu hướng gần đây</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center py-2">
                  <div className={`text-3xl sm:text-4xl font-bold ${getTrendColor(stats.recentTrend)} font-heading`}>
                    {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-body mt-1.5 sm:mt-2">
                    {stats.improvement > 0 ? 'Đang cải thiện' : stats.improvement < 0 ? 'Cần cố gắng' : 'Ổn định'}
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 rounded-lg">
                  {getTrendIcon(stats.recentTrend)}
                  <span className="text-xs sm:text-sm text-slate-600 font-body">
                    Xu hướng {stats.recentTrend === 'up' ? 'tăng' : stats.recentTrend === 'down' ? 'giảm' : 'ổn định'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats - Mobile optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Chi tiết</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs sm:text-sm text-slate-600 font-body">Bài đã hoàn thành</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 font-heading">{stats.quizzesCompleted}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs sm:text-sm text-slate-600 font-body">Điểm thấp nhất</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 font-heading">{stats.worstScore}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs sm:text-sm text-slate-600 font-body">TB thời gian/bài</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 font-heading">
                  {stats.totalAttempts > 0 ? Math.round(stats.totalTimeSpent / stats.totalAttempts / 60) : 0} phút
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Thành tích</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 font-heading">Học viên tích cực</p>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">{stats.totalAttempts} lần làm bài</p>
                </div>
              </div>
              
              {stats.bestScore >= 90 && (
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 font-heading">Xuất sắc</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Cao nhất {stats.bestScore}%</p>
                  </div>
                </div>
              )}
              
              {stats.averageScore >= 80 && (
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 font-heading">Học tập tốt</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 font-body truncate">Điểm TB {stats.averageScore}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
