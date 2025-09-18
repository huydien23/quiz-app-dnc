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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Thống kê học tập</h1>
            <p className="text-slate-600 font-body">Phân tích chi tiết về tiến độ học tập của bạn</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
              className={timeRange === "all" ? "btn-primary" : "btn-secondary"}
            >
              Tất cả
            </Button>
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
              className={timeRange === "week" ? "btn-primary" : "btn-secondary"}
            >
              Tuần
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
              className={timeRange === "month" ? "btn-primary" : "btn-secondary"}
            >
              Tháng
            </Button>
            <Button
              variant={timeRange === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("year")}
              className={timeRange === "year" ? "btn-primary" : "btn-secondary"}
            >
              Năm
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Tổng số lần làm</p>
                  <p className="text-3xl font-bold text-slate-800 font-heading">{stats.totalAttempts}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Điểm trung bình</p>
                  <p className="text-3xl font-bold text-slate-800 font-heading">{stats.averageScore}%</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Điểm cao nhất</p>
                  <p className="text-3xl font-bold text-slate-800 font-heading">{stats.bestScore}%</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Thời gian học</p>
                  <p className="text-3xl font-bold text-slate-800 font-heading">{Math.round(stats.totalTimeSpent / 60)}h</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress and Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Tiến độ tuần</CardTitle>
              <CardDescription className="text-slate-600 font-body">Điểm trung bình theo ngày trong tuần</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weeklyProgress.map((score, index) => {
                  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 text-sm font-medium text-slate-600 font-body">
                        {days[index]}
                      </div>
                      <div className="flex-1">
                        <Progress value={score} className="h-2" />
                      </div>
                      <div className="w-12 text-sm font-medium text-slate-800 font-body">
                        {score}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Improvement */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Cải thiện</CardTitle>
              <CardDescription className="text-slate-600 font-body">Xu hướng học tập gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getTrendColor(stats.recentTrend)} font-heading`}>
                    {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                  </div>
                  <p className="text-slate-600 font-body mt-2">
                    {stats.improvement > 0 ? 'Đang cải thiện' : stats.improvement < 0 ? 'Cần cố gắng' : 'Ổn định'}
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  {getTrendIcon(stats.recentTrend)}
                  <span className="text-sm text-slate-600 font-body">
                    Xu hướng {stats.recentTrend === 'up' ? 'tăng' : stats.recentTrend === 'down' ? 'giảm' : 'ổn định'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Thống kê chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-body">Bài thi đã hoàn thành</span>
                <span className="font-semibold text-slate-800 font-heading">{stats.quizzesCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-body">Điểm thấp nhất</span>
                <span className="font-semibold text-slate-800 font-heading">{stats.worstScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-body">Thời gian trung bình/bài</span>
                <span className="font-semibold text-slate-800 font-heading">
                  {stats.totalAttempts > 0 ? Math.round(stats.totalTimeSpent / stats.totalAttempts / 60) : 0} phút
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Thành tích</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 font-heading">Học viên tích cực</p>
                  <p className="text-sm text-slate-600 font-body">{stats.totalAttempts} lần làm bài</p>
                </div>
              </div>
              
              {stats.bestScore >= 90 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 font-heading">Xuất sắc</p>
                    <p className="text-sm text-slate-600 font-body">Điểm cao nhất {stats.bestScore}%</p>
                  </div>
                </div>
              )}
              
              {stats.averageScore >= 80 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 font-heading">Học tập tốt</p>
                    <p className="text-sm text-slate-600 font-body">Điểm TB {stats.averageScore}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
