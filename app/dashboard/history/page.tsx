"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Clock, Award, Play, Eye, 
  Target, Calendar, TrendingUp, CheckCircle,
  ArrowRight, BarChart3, Filter
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizAttempt } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow, format } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function HistoryPage() {
  const { user } = useAuth()
  const { error } = useToast()
  
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, recent, high-score, low-score

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const [allAttempts, allQuizzes] = await Promise.all([
        AdminService.getAllAttempts(),
        QuizService.getAllQuizzes()
      ])
      
      const myAttempts = allAttempts
        .filter(attempt => attempt.userId === user?.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      
      setAttempts(myAttempts)
      setQuizzes(allQuizzes)
    } catch (err) {
      console.error('Error loading history:', err)
      error("Không thể tải lịch sử làm bài")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAttempts = () => {
    switch (filter) {
      case 'recent':
        return attempts.slice(0, 10)
      case 'high-score':
        return attempts.filter(attempt => (attempt.score || 0) >= 80)
      case 'low-score':
        return attempts.filter(attempt => (attempt.score || 0) < 60)
      default:
        return attempts
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getQuizTitle = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    return quiz?.title || 'Bài thi không tồn tại'
  }

  const getAverageScore = () => {
    if (attempts.length === 0) return 0
    const total = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0)
    return Math.round(total / attempts.length)
  }

  const getBestScore = () => {
    if (attempts.length === 0) return 0
    return Math.max(...attempts.map(attempt => attempt.score || 0))
  }

  const getTotalTime = () => {
    return attempts.reduce((total, attempt) => total + (attempt.timeSpent || 0), 0)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const filteredAttempts = getFilteredAttempts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Lịch sử làm bài</h1>
            <p className="text-slate-600 font-body">Theo dõi tiến độ và kết quả học tập của bạn</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-body">
            <BarChart3 className="h-4 w-4" />
            <span>{attempts.length} lần làm bài</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Tổng số lần làm</p>
                  <p className="text-2xl font-bold text-slate-800 font-heading">{attempts.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Điểm trung bình</p>
                  <p className="text-2xl font-bold text-slate-800 font-heading">{getAverageScore()}%</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Điểm cao nhất</p>
                  <p className="text-2xl font-bold text-slate-800 font-heading">{getBestScore()}%</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-body">Thời gian học</p>
                  <p className="text-2xl font-bold text-slate-800 font-heading">{Math.round(getTotalTime() / 60)}h</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-primary" : "btn-secondary"}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("recent")}
            className={filter === "recent" ? "btn-primary" : "btn-secondary"}
          >
            Gần đây
          </Button>
          <Button
            variant={filter === "high-score" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("high-score")}
            className={filter === "high-score" ? "btn-primary" : "btn-secondary"}
          >
            Điểm cao
          </Button>
          <Button
            variant={filter === "low-score" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low-score")}
            className={filter === "low-score" ? "btn-primary" : "btn-secondary"}
          >
            Cần cải thiện
          </Button>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => (
            <Card key={attempt.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 font-heading">
                        {getQuizTitle(attempt.quizId)}
                      </h3>
                      <Badge variant={getScoreBadgeVariant(attempt.score || 0)}>
                        {attempt.score}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 font-body">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(attempt.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round((attempt.timeSpent || 0) / 60)} phút</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{attempt.correctAnswers || 0}/{attempt.totalQuestions || 0} câu đúng</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/quiz/${attempt.quizId}/result`}>
                      <Button variant="outline" size="sm" className="btn-secondary">
                        <Eye className="h-4 w-4 mr-2" />
                        Xem kết quả
                      </Button>
                    </Link>
                    <Link href={`/quiz/${attempt.quizId}`}>
                      <Button size="sm" className="btn-primary">
                        <Play className="h-4 w-4 mr-2" />
                        Làm lại
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAttempts.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mx-auto mb-4">
              <BarChart3 className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2 font-heading">
              {filter === "all" ? 'Chưa có lịch sử làm bài' : 'Không có kết quả phù hợp'}
            </h3>
            <p className="text-slate-600 font-body mb-4">
              {filter === "all" ? 'Hãy bắt đầu làm bài thi để xem lịch sử ở đây' : 'Thử thay đổi bộ lọc để xem kết quả khác'}
            </p>
            {filter === "all" && (
              <Link href="/dashboard/quizzes">
                <Button className="btn-primary">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Khám phá bài thi
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}