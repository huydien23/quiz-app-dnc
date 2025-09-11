"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import type { QuizResult } from "@/lib/types"
import Link from "next/link"
import { Trophy, Clock, Target, TrendingUp, BookOpen, Calendar, Award, BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    recentActivity: [] as QuizResult[],
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        const quizResults = await QuizService.getQuizResults(user.id)
        setResults(quizResults)

        // Calculate statistics
        const totalQuizzes = quizResults.length
        const averageScore =
          totalQuizzes > 0
            ? Math.round(quizResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes)
            : 0
        const bestScore = totalQuizzes > 0 ? Math.max(...quizResults.map((result) => result.percentage)) : 0
        const totalTimeSpent = quizResults.reduce((sum, result) => sum + result.attempt.timeSpent, 0)
        const recentActivity = quizResults.slice(0, 5)

        setStats({
          totalQuizzes,
          averageScore,
          bestScore,
          totalTimeSpent,
          recentActivity,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chào mừng, {user?.name}!</h1>
          <p className="text-muted-foreground">Theo dõi tiến độ học tập của bạn</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng bài thi</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground">Bài thi đã hoàn thành</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">Điểm số trung bình</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm cao nhất</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>{stats.bestScore}%</div>
              <p className="text-xs text-muted-foreground">Thành tích tốt nhất</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thời gian học</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</div>
              <p className="text-xs text-muted-foreground">Tổng thời gian luyện tập</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Hoạt động gần đây
                </CardTitle>
                <CardDescription>Kết quả các bài thi gần nhất của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Chưa có hoạt động nào</p>
                    <Link href="/quizzes">
                      <Button className="mt-4">Bắt đầu làm bài thi</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentActivity.map((result) => (
                      <div key={result.attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{result.quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.attempt.completedAt).toLocaleDateString("vi-VN")} •
                            {formatTime(result.attempt.timeSpent)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getScoreBadgeVariant(result.percentage)}>{result.percentage}%</Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.correctAnswers}/{result.totalQuestions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Tiến độ học tập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Điểm trung bình</span>
                      <span className={getScoreColor(stats.averageScore)}>{stats.averageScore}%</span>
                    </div>
                    <Progress value={stats.averageScore} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mục tiêu (80%)</span>
                      <span>{Math.min(100, Math.round((stats.averageScore / 80) * 100))}%</span>
                    </div>
                    <Progress value={Math.min(100, (stats.averageScore / 80) * 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Thành tích
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.totalQuizzes >= 1 && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">🎯</Badge>
                      <span className="text-sm">Bài thi đầu tiên</span>
                    </div>
                  )}
                  {stats.totalQuizzes >= 5 && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">📚</Badge>
                      <span className="text-sm">Học viên tích cực</span>
                    </div>
                  )}
                  {stats.bestScore >= 80 && (
                    <div className="flex items-center space-x-2">
                      <Badge>🏆</Badge>
                      <span className="text-sm">Điểm số xuất sắc</span>
                    </div>
                  )}
                  {stats.bestScore === 100 && (
                    <div className="flex items-center space-x-2">
                      <Badge>⭐</Badge>
                      <span className="text-sm">Điểm tuyệt đối</span>
                    </div>
                  )}
                  {stats.totalQuizzes === 0 && (
                    <p className="text-sm text-muted-foreground">Hoàn thành bài thi đầu tiên để mở khóa thành tích!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Hành động nhanh</CardTitle>
              <CardDescription>Các tính năng thường dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/quizzes">
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Làm bài thi mới
                  </Button>
                </Link>
                {results.length > 0 && (
                  <Link href="/dashboard/history">
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Xem lịch sử
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
