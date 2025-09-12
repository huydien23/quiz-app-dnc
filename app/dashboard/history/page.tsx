"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import type { QuizAttempt, Quiz } from "@/lib/types"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { 
  BookOpen, Clock, Award, Eye, Calendar,
  TrendingUp, Target, ArrowLeft
} from "lucide-react"

export default function HistoryPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserHistory()
    }
  }, [user])

  const loadUserHistory = async () => {
    try {
      setLoading(true)
      const [allAttempts, allQuizzes] = await Promise.all([
        AdminService.getAllAttempts(),
        QuizService.getAllQuizzes()
      ])

      // Filter user attempts
      const userAttempts = allAttempts
        .filter(attempt => attempt.userId === user?.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      setAttempts(userAttempts)
      setQuizzes(allQuizzes)
    } catch (error) {
      console.error("Error loading history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getQuizTitle = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    return quiz?.title || "Bài thi không tồn tại"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const calculateStats = () => {
    if (attempts.length === 0) return { total: 0, average: 0, best: 0, recent: 0 }
    
    const total = attempts.length
    const average = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / total
    const best = Math.max(...attempts.map(a => a.score || 0))
    
    // Recent improvement (last 5 vs previous 5)
    let recent = 0
    if (attempts.length >= 10) {
      const recent5 = attempts.slice(0, 5).reduce((sum, a) => sum + (a.score || 0), 0) / 5
      const previous5 = attempts.slice(5, 10).reduce((sum, a) => sum + (a.score || 0), 0) / 5
      recent = recent5 - previous5
    }

    return {
      total,
      average: Math.round(average * 100) / 100,
      best,
      recent: Math.round(recent * 100) / 100
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lịch sử làm bài</h1>
            <p className="text-muted-foreground">Xem lại các bài thi đã hoàn thành</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng bài thi</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Điểm trung bình</p>
                  <p className="text-2xl font-bold">{stats.average}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Điểm cao nhất</p>
                  <p className="text-2xl font-bold">{stats.best}%</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cải thiện gần đây</p>
                  <p className={`text-2xl font-bold ${stats.recent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.recent > 0 ? "+" : ""}{stats.recent}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts List */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết các lần làm bài</CardTitle>
            <CardDescription>
              Danh sách tất cả {attempts.length} bài thi đã hoàn thành
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có bài thi nào được hoàn thành</p>
                <Link href="/quizzes">
                  <Button className="mt-4">
                    Bắt đầu làm bài thi đầu tiên
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-2">
                            {getQuizTitle(attempt.quizId)}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(attempt.completedAt), { 
                                addSuffix: true, 
                                locale: vi 
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.floor((attempt.timeSpent || 0) / 60)} phút {(attempt.timeSpent || 0) % 60} giây
                            </div>
                            {attempt.correctAnswers !== undefined && attempt.totalQuestions !== undefined && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {attempt.correctAnswers}/{attempt.totalQuestions} câu đúng
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getScoreBadgeVariant(attempt.score || 0)} className="text-lg px-3 py-1">
                            {attempt.score}%
                          </Badge>
                          <Link href={`/quiz/${attempt.quizId}/result?attemptId=${attempt.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}