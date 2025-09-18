"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizAttempt } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface StudentStats {
  totalAttempts: number
  averageScore: number
  bestScore: number
  quizzesCompleted: number
  rank: number
  totalStudents: number
  recentImprovement: number
}

interface RecentQuiz {
  quiz: Quiz
  attempt?: QuizAttempt
  status: 'not-started' | 'completed' | 'available'
}

export function StudentDashboard() {
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [stats, setStats] = useState<StudentStats>({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    quizzesCompleted: 0,
    rank: 0,
    totalStudents: 0,
    recentImprovement: 0
  })
  
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([])
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([])
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStudentData()
    }
  }, [user])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      
      const [allQuizzes, allAttempts, allUsers] = await Promise.all([
        QuizService.getAllQuizzes(),
        AdminService.getAllAttempts(),
        AdminService.getAllUsers()
      ])

      // Filter active quizzes
      const activeQuizzes = allQuizzes.filter(quiz => quiz.isActive)
      setAvailableQuizzes(activeQuizzes)

      // Get user's attempts
      const myAttempts = allAttempts.filter(attempt => attempt.userId === user?.id)
      setUserAttempts(myAttempts)

      // Calculate stats
      const totalAttempts = myAttempts.length
      const averageScore = totalAttempts > 0 
        ? myAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts 
        : 0
      const bestScore = totalAttempts > 0 
        ? Math.max(...myAttempts.map(attempt => attempt.score || 0))
        : 0
      const quizzesCompleted = new Set(myAttempts.map(attempt => attempt.quizId)).size

      // Calculate rank (simplified)
      const userScores = allAttempts.reduce((acc, attempt) => {
        if (!acc[attempt.userId]) acc[attempt.userId] = []
        acc[attempt.userId].push(attempt.score || 0)
        return acc
      }, {} as Record<string, number[]>)

      const userAverages = Object.entries(userScores).map(([userId, scores]) => ({
        userId,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length
      })).sort((a, b) => b.average - a.average)

      const myRank = userAverages.findIndex(u => u.userId === user?.id) + 1
      const totalStudents = new Set(allAttempts.map(attempt => attempt.userId)).size

      // Calculate recent improvement (last 3 vs previous 3 attempts)
      const sortedAttempts = myAttempts.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      
      let recentImprovement = 0
      if (sortedAttempts.length >= 6) {
        const recent3 = sortedAttempts.slice(0, 3).reduce((sum, a) => sum + (a.score || 0), 0) / 3
        const previous3 = sortedAttempts.slice(3, 6).reduce((sum, a) => sum + (a.score || 0), 0) / 3
        recentImprovement = recent3 - previous3
      }

      setStats({
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore,
        quizzesCompleted,
        rank: myRank || 0,
        totalStudents,
        recentImprovement: Math.round(recentImprovement * 100) / 100
      })

      // Prepare recent quizzes with attempt status
      const recentQuizzesWithStatus: RecentQuiz[] = activeQuizzes.slice(0, 6).map(quiz => {
        const attempt = myAttempts.find(a => a.quizId === quiz.id)
        return {
          quiz,
          attempt,
          status: attempt ? 'completed' : 'available'
        }
      })

      setRecentQuizzes(recentQuizzesWithStatus)

    } catch (err) {
      console.error('Error loading student data:', err)
      error("Không thể tải dữ liệu học tập")
    } finally {
      setLoading(false)
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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ElementType
    color: string
    trend?: number
  }) => (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm card-shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1 font-body">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1 font-heading">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 font-body">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="font-medium">{trend > 0 ? '+' : ''}{trend.toFixed(1)} điểm gần đây</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('bg-', 'bg-').replace('/10', '')} opacity-60`} />
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="space-y-8 p-6">
          {/* Loading Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-blue-600/5 rounded-2xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="animate-pulse">
                <div className="h-12 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Stats */}
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
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bài thi đã làm"
          value={stats.totalAttempts}
          subtitle={`${stats.quizzesCompleted} bài khác nhau`}
          icon={BookOpen}
          color="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        />
        <StatCard
          title="Điểm trung bình"
          value={`${stats.averageScore}%`}
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600 text-white"
          trend={stats.recentImprovement}
        />
        <StatCard
          title="Điểm cao nhất"
          value={`${stats.bestScore}%`}
          icon={Award}
          color="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
        />
        <StatCard
          title="Xếp hạng"
          value={stats.rank > 0 ? `#${stats.rank}` : 'N/A'}
          subtitle={`trong ${stats.totalStudents} học sinh`}
          icon={Trophy}
          color="bg-gradient-to-br from-orange-500 to-orange-600 text-white"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Quizzes */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 font-heading">Bài thi mới</CardTitle>
                <CardDescription className="text-slate-600 font-body">Những bài thi bạn có thể làm ngay</CardDescription>
              </div>
              <Link href="/quizzes">
                <Button variant="outline" size="sm" className="btn-secondary">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentQuizzes.map(({ quiz, attempt, status }) => (
                  <Card key={quiz.id} className="relative group hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm card-shadow hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 font-heading">
                            {quiz.title}
                          </h4>
                          {status === 'completed' && (
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-600 font-body">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-100">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{quiz.questions.length} câu</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-cyan-100">
                              <Clock className="h-4 w-4 text-cyan-600" />
                            </div>
                            <span className="font-medium">{quiz.timeLimit} phút</span>
                          </div>
                        </div>

                        {attempt && (
                          <div className="flex items-center justify-between">
                            <Badge variant={getScoreBadgeVariant(attempt.score || 0)}>
                              {attempt.score}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {status === 'completed' ? (
                            <>
                              <Link href={`/quiz/${quiz.id}/result`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full btn-secondary">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem kết quả
                                </Button>
                              </Link>
                              <Link href={`/quiz/${quiz.id}`} className="flex-1">
                                <Button size="sm" className="w-full btn-primary">
                                  <Play className="h-4 w-4 mr-2" />
                                  Làm lại
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Link href={`/quiz/${quiz.id}`} className="w-full">
                              <Button size="sm" className="w-full btn-primary">
                                <Play className="h-4 w-4 mr-2" />
                                Bắt đầu làm bài
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {recentQuizzes.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mx-auto mb-4">
                    <BookOpen className="h-12 w-12 text-blue-600" />
                  </div>
                  <p className="text-slate-600 font-body">Chưa có bài thi nào được tạo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Progress */}
        <div className="space-y-6">
          {/* Recent Performance */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Kết quả gần đây</CardTitle>
              <CardDescription className="text-slate-600 font-body">5 lần làm bài mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAttempts.slice(0, 5).map((attempt) => {
                  const quiz = availableQuizzes.find(q => q.id === attempt.quizId)
                  return (
                    <div key={attempt.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {quiz?.title || 'Bài thi không tồn tại'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                      <Badge variant={getScoreBadgeVariant(attempt.score || 0)}>
                        {attempt.score}%
                      </Badge>
                    </div>
                  )
                })}
                
                {userAttempts.length === 0 && (
                  <div className="text-center py-8">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 w-fit mx-auto mb-3">
                      <Clock className="h-8 w-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-600 font-body">Chưa có kết quả nào</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Tiến độ học tập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3 font-body">
                  <span className="text-slate-600">Bài thi đã hoàn thành</span>
                  <span className="font-semibold text-slate-800">{stats.quizzesCompleted}/{availableQuizzes.length}</span>
                </div>
                <Progress 
                  value={availableQuizzes.length > 0 ? (stats.quizzesCompleted / availableQuizzes.length) * 100 : 0} 
                  className="h-3" 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-3 font-body">
                  <span className="text-slate-600">Điểm trung bình</span>
                  <span className={`font-semibold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}%</span>
                </div>
                <Progress value={stats.averageScore} className="h-3" />
              </div>

              {stats.rank > 0 && (
                <div className="text-center pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-2 text-sm font-body">
                    <div className="p-1.5 rounded-lg bg-orange-100">
                      <Trophy className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-slate-600">Bạn đang xếp hạng <span className="font-semibold text-orange-600">#{stats.rank}</span> trong lớp</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 font-heading">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/quizzes">
                <Button variant="outline" className="w-full justify-start btn-secondary">
                  <BookOpen className="h-4 w-4 mr-3" />
                  Xem tất cả bài thi
                </Button>
              </Link>
              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full justify-start btn-secondary">
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Lịch sử làm bài
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}