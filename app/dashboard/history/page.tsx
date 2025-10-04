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
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Overview - Mobile optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 animate-fade-in">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="order-2 sm:order-1">
                  <p className="text-xs sm:text-sm text-slate-600 font-body">Tổng số lần làm</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">{attempts.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md order-1 sm:order-2">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="order-2 sm:order-1">
                  <p className="text-xs sm:text-sm text-slate-600 font-body">Điểm TB</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">{getAverageScore()}%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md order-1 sm:order-2">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="order-2 sm:order-1">
                  <p className="text-xs sm:text-sm text-slate-600 font-body">Cao nhất</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">{getBestScore()}%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md order-1 sm:order-2">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="order-2 sm:order-1">
                  <p className="text-xs sm:text-sm text-slate-600 font-body">Học tập</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">{Math.round(getTotalTime() / 60)}h</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md order-1 sm:order-2">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter - Mobile optimized */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={`${filter === "all" ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 text-xs sm:text-sm`}
          >
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
            <span className="hidden xs:inline">Tất cả</span>
          </Button>
          <Button
            variant={filter === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("recent")}
            className={`${filter === "recent" ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 text-xs sm:text-sm`}
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
            <span>Gần đây</span>
          </Button>
          <Button
            variant={filter === "high-score" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("high-score")}
            className={`${filter === "high-score" ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 text-xs sm:text-sm`}
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
            <span>Điểm cao</span>
          </Button>
          <Button
            variant={filter === "low-score" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low-score")}
            className={`${filter === "low-score" ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 text-xs sm:text-sm`}
          >
            <Target className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
            <span className="hidden xs:inline">Cần cải thiện</span>
            <span className="xs:hidden">Cải thiện</span>
          </Button>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => (
            <Card key={attempt.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: `${attempts.indexOf(attempt) * 50}ms` }}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="font-semibold text-base sm:text-lg text-slate-800 font-heading flex-1 min-w-0">
                        {getQuizTitle(attempt.quizId)}
                      </h3>
                      <Badge variant={getScoreBadgeVariant(attempt.score || 0)} className="flex-shrink-0 text-sm font-bold">
                        {attempt.score}%
                      </Badge>
                    </div>
                    
                    {/* Mobile: Stack vertically */}
                    <div className="flex flex-col sm:hidden gap-2 text-sm text-slate-600 font-body">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-xs">{format(new Date(attempt.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="text-xs">{Math.round((attempt.timeSpent || 0) / 60)} phút</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-xs">{attempt.correctAnswers || 0}/{attempt.totalQuestions || 0} câu</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop: Horizontal */}
                    <div className="hidden sm:flex items-center gap-4 text-sm text-slate-600 font-body">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{format(new Date(attempt.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>{Math.round((attempt.timeSpent || 0) / 60)} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{attempt.correctAnswers || 0}/{attempt.totalQuestions || 0} câu đúng</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Link href={`/quiz/${attempt.quizId}/result`} className="flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="btn-secondary w-full sm:w-auto h-10">
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Xem kết quả</span>
                      </Button>
                    </Link>
                    <Link href={`/quiz/${attempt.quizId}`} className="flex-1 sm:flex-initial">
                      <Button size="sm" className="btn-primary w-full sm:w-auto h-10">
                        <Play className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Làm lại</span>
                        <span className="sm:hidden">Làm lại</span>
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