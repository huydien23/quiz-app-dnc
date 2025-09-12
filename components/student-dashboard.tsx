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
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend > 0 ? '+' : ''}{trend.toFixed(1)} điểm gần đây
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('bg-', 'bg-').replace('/10', '')}`} />
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
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
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chào mừng, {user?.name || 'Học sinh'}!</h1>
          <p className="text-muted-foreground">Tiếp tục hành trình học tập của bạn</p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={""} />
            <AvatarFallback>
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bài thi đã làm"
          value={stats.totalAttempts}
          subtitle={`${stats.quizzesCompleted} bài khác nhau`}
          icon={BookOpen}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Điểm trung bình"
          value={`${stats.averageScore}%`}
          icon={Target}
          color="bg-green-100 text-green-600"
          trend={stats.recentImprovement}
        />
        <StatCard
          title="Điểm cao nhất"
          value={`${stats.bestScore}%`}
          icon={Award}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Xếp hạng"
          value={stats.rank > 0 ? `#${stats.rank}` : 'N/A'}
          subtitle={`trong ${stats.totalStudents} học sinh`}
          icon={Trophy}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Quizzes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bài thi mới</CardTitle>
                <CardDescription>Những bài thi bạn có thể làm ngay</CardDescription>
              </div>
              <Link href="/quizzes">
                <Button variant="outline" size="sm">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentQuizzes.map(({ quiz, attempt, status }) => (
                  <Card key={quiz.id} className="relative group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {quiz.title}
                          </h4>
                          {status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {quiz.questions.length} câu
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.timeLimit} phút
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

                        <div className="flex gap-2">
                          {status === 'completed' ? (
                            <>
                              <Link href={`/quiz/${quiz.id}/result`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem kết quả
                                </Button>
                              </Link>
                              <Link href={`/quiz/${quiz.id}`} className="flex-1">
                                <Button size="sm" className="w-full">
                                  <Play className="h-4 w-4 mr-2" />
                                  Làm lại
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Link href={`/quiz/${quiz.id}`} className="w-full">
                              <Button size="sm" className="w-full">
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
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Chưa có bài thi nào được tạo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Progress */}
        <div className="space-y-6">
          {/* Recent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Kết quả gần đây</CardTitle>
              <CardDescription>5 lần làm bài mới nhất</CardDescription>
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
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có kết quả nào</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ học tập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Bài thi đã hoàn thành</span>
                  <span>{stats.quizzesCompleted}/{availableQuizzes.length}</span>
                </div>
                <Progress 
                  value={availableQuizzes.length > 0 ? (stats.quizzesCompleted / availableQuizzes.length) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Điểm trung bình</span>
                  <span className={getScoreColor(stats.averageScore)}>{stats.averageScore}%</span>
                </div>
                <Progress value={stats.averageScore} className="h-2" />
              </div>

              {stats.rank > 0 && (
                <div className="text-center pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <span>Bạn đang xếp hạng #{stats.rank} trong lớp</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/quizzes">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Xem tất cả bài thi
                </Button>
              </Link>
              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
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