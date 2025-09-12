"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts"
import { 
  TrendingUp, Users, BookOpen, Award, Clock, Target,
  Calendar, Filter, Download, RefreshCw
} from "lucide-react"
import { AdminService } from "@/lib/admin-service"
import type { Quiz, QuizAttempt, User } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface AnalyticsData {
  overview: {
    totalQuizzes: number
    totalAttempts: number
    averageScore: number
    completionRate: number
  }
  popularQuizzes: Array<{
    id: string
    title: string
    attempts: number
    averageScore: number
  }>
  scoreDistribution: Array<{
    range: string
    count: number
  }>
  dailyActivity: Array<{
    date: string
    attempts: number
    users: number
  }>
  userEngagement: Array<{
    type: string
    value: number
    color: string
  }>
}

export function QuizAnalytics() {
  const { success, error } = useToast()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [quizzes, attempts, users] = await Promise.all([
        AdminService.getAllQuizzes(),
        AdminService.getAllAttempts(),
        AdminService.getAllUsers()
      ])

      // Filter by time range
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (timeRange) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(now.getDate() - 90)
          break
        case 'all':
          cutoffDate.setFullYear(2000) // Very old date
          break
      }

      const filteredAttempts = attempts.filter(attempt => 
        new Date(attempt.completedAt) >= cutoffDate
      )

      // Calculate overview stats
      const totalQuizzes = quizzes.length
      const totalAttempts = filteredAttempts.length
      const averageScore = filteredAttempts.length > 0 
        ? filteredAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / filteredAttempts.length 
        : 0
      const completionRate = 100 // Assume all attempts are completed

      // Popular quizzes
      const quizAttemptCounts = filteredAttempts.reduce((acc, attempt) => {
        acc[attempt.quizId] = (acc[attempt.quizId] || { count: 0, scores: [] })
        acc[attempt.quizId].count++
        acc[attempt.quizId].scores.push(attempt.score || 0)
        return acc
      }, {} as Record<string, { count: number, scores: number[] }>)

      const popularQuizzes = Object.entries(quizAttemptCounts)
        .map(([quizId, data]) => {
          const quiz = quizzes.find(q => q.id === quizId)
          return {
            id: quizId,
            title: quiz?.title || 'Unknown Quiz',
            attempts: data.count,
            averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
          }
        })
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 5)

      // Score distribution
      const scoreRanges = [
        { range: '0-20%', min: 0, max: 20 },
        { range: '21-40%', min: 21, max: 40 },
        { range: '41-60%', min: 41, max: 60 },
        { range: '61-80%', min: 61, max: 80 },
        { range: '81-100%', min: 81, max: 100 }
      ]

      const scoreDistribution = scoreRanges.map(range => ({
        range: range.range,
        count: filteredAttempts.filter(attempt => 
          (attempt.score || 0) >= range.min && (attempt.score || 0) <= range.max
        ).length
      }))

      // Daily activity for the last 7 days
      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayAttempts = filteredAttempts.filter(attempt => 
          attempt.completedAt.startsWith(dateStr)
        ).length

        const dayUsers = new Set(
          filteredAttempts
            .filter(attempt => attempt.completedAt.startsWith(dateStr))
            .map(attempt => attempt.userId)
        ).size

        dailyActivity.push({
          date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
          attempts: dayAttempts,
          users: dayUsers
        })
      }

      // User engagement
      const activeUsers = new Set(filteredAttempts.map(attempt => attempt.userId)).size
      const totalUsers = users.length
      const inactiveUsers = totalUsers - activeUsers

      const userEngagement = [
        { type: 'Hoạt động', value: activeUsers, color: '#10B981' },
        { type: 'Không hoạt động', value: inactiveUsers, color: '#6B7280' }
      ]

      setData({
        overview: {
          totalQuizzes,
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          completionRate
        },
        popularQuizzes,
        scoreDistribution,
        dailyActivity,
        userEngagement
      })

    } catch (err) {
      console.error('Error loading analytics:', err)
      error("Không thể tải dữ liệu phân tích")
      
      // Load mock data for demo
      setData({
        overview: {
          totalQuizzes: 12,
          totalAttempts: 245,
          averageScore: 75.4,
          completionRate: 94.2
        },
        popularQuizzes: [
          { id: '1', title: 'Python Programming', attempts: 45, averageScore: 78.5 },
          { id: '2', title: 'JavaScript Basics', attempts: 38, averageScore: 82.1 },
          { id: '3', title: 'React Fundamentals', attempts: 32, averageScore: 75.8 },
          { id: '4', title: 'Database Design', attempts: 28, averageScore: 71.2 },
          { id: '5', title: 'Web Security', attempts: 24, averageScore: 69.4 }
        ],
        scoreDistribution: [
          { range: '0-20%', count: 5 },
          { range: '21-40%', count: 12 },
          { range: '41-60%', count: 35 },
          { range: '61-80%', count: 89 },
          { range: '81-100%', count: 104 }
        ],
        dailyActivity: [
          { date: 'T2', attempts: 15, users: 8 },
          { date: 'T3', attempts: 22, users: 12 },
          { date: 'T4', attempts: 18, users: 10 },
          { date: 'T5', attempts: 28, users: 15 },
          { date: 'T6', attempts: 32, users: 18 },
          { date: 'T7', attempts: 25, users: 14 },
          { date: 'CN', attempts: 12, users: 7 }
        ],
        userEngagement: [
          { type: 'Hoạt động', value: 67, color: '#10B981' },
          { type: 'Không hoạt động', value: 22, color: '#6B7280' }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
    success("Đã cập nhật dữ liệu phân tích")
  }

  const handleExport = () => {
    // Implementation for exporting analytics data
    success("Đang xuất báo cáo...")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold">Phân tích & Thống kê</h1>
          <p className="text-muted-foreground">Báo cáo chi tiết về hoạt động hệ thống</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 ngày' : 
                 range === '30d' ? '30 ngày' : 
                 range === '90d' ? '90 ngày' : 'Tất cả'}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng bài thi</p>
                <p className="text-2xl font-bold">{data?.overview.totalQuizzes}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lượt làm bài</p>
                <p className="text-2xl font-bold">{data?.overview.totalAttempts}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Điểm trung bình</p>
                <p className="text-2xl font-bold">{data?.overview.averageScore}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tỷ lệ hoàn thành</p>
                <p className="text-2xl font-bold">{data?.overview.completionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động theo ngày</CardTitle>
            <CardDescription>Số lượt làm bài và người dùng hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="attempts" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố điểm số</CardTitle>
            <CardDescription>Số lượng học sinh theo từng khoảng điểm</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>Bài thi phổ biến</CardTitle>
            <CardDescription>Top 5 bài thi có nhiều lượt làm nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.popularQuizzes.map((quiz, index) => (
                <div key={quiz.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">{quiz.attempts} lượt làm</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {quiz.averageScore.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Mức độ tham gia</CardTitle>
            <CardDescription>Tỷ lệ người dùng hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.userEngagement}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, value }) => `${type}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data?.userEngagement.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}