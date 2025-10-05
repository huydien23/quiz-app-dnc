"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight, X
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { AdminService } from "@/lib/admin-service"
import { LeaderboardService } from "@/lib/leaderboard-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizAttempt, LeaderboardEntry } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { InlineQuiz } from "@/components/inline-quiz"
import { useSearchParams } from "next/navigation"

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const searchParams = useSearchParams()
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user) {
      loadStudentData()
    }
  }, [user])

  // Read initial tab from query (?tab=quizzes|dashboard|leaderboard)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'dashboard' || tab === 'quizzes' || tab === 'leaderboard') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      
      const [allQuizzes, allAttempts, allUsers, leaderboardData, activityData] = await Promise.all([
        QuizService.getAllQuizzes(),
        AdminService.getAllAttempts(),
        AdminService.getAllUsers(),
        LeaderboardService.getLeaderboard(20),
        LeaderboardService.getRecentActivity(10)
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
      const quizzesCompleted = Math.min(
        new Set(myAttempts.map(attempt => attempt.quizId)).size,
        activeQuizzes.length
      )

      // Build attempt counts by quiz for display
      const attemptCountsMap = allAttempts.reduce((acc, attempt) => {
        acc[attempt.quizId] = (acc[attempt.quizId] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      setAttemptCounts(attemptCountsMap)

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

      // Set leaderboard and activity data
      setLeaderboard(leaderboardData)
      setRecentActivity(activityData)

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

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setShowQuiz(true)
  }

  const handleViewResult = (quizId: string) => {
    // Navigate to result page
    window.location.href = `/quiz/${quizId}/result`
  }

  const handleQuizComplete = (score: number, timeSpent: number) => {
    // Handle quiz completion
    setShowQuiz(false)
    setSelectedQuiz(null)
    // You can add logic here to save the quiz attempt
  }

  const handleCloseQuiz = () => {
    setShowQuiz(false)
    setSelectedQuiz(null)
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ElementType
    color: string
    trend?: number
  }) => (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:-translate-y-1">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {/* Icon với gradient background */}
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 font-body mb-0.5">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">{value}</p>
              {subtitle && (
                <p className="text-xs text-slate-500 font-body truncate">{subtitle}</p>
              )}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                <span className="font-medium">{trend > 0 ? '+' : ''}{trend.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {/* Colored bottom border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('bg-gradient-to-br', 'bg-gradient-to-r')} opacity-80`} />
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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Progress Stats - 2x2 Grid Mobile, 4 cols Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-in fade-in-50 duration-500">
        <StatCard
          title="Bài thi"
          value={stats.totalAttempts}
          subtitle={`${stats.quizzesCompleted} khác nhau`}
          icon={BookOpen}
          color="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        />
        <StatCard
          title="Điểm TB"
          value={`${stats.averageScore}%`}
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-emerald-600 text-white"
          trend={stats.recentImprovement}
        />
        <StatCard
          title="Cao nhất"
          value={`${stats.bestScore}%`}
          icon={Award}
          color="bg-gradient-to-br from-purple-500 to-pink-600 text-white"
        />
        <StatCard
          title="Xếp hạng"
          value={stats.rank > 0 ? `#${stats.rank}` : 'N/A'}
          subtitle={stats.rank > 0 ? `/${stats.totalStudents}` : ''}
          icon={Trophy}
          color="bg-gradient-to-br from-orange-500 to-amber-600 text-white"
        />
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-in fade-in-50 duration-500 delay-100">
        <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border rounded-lg h-12 sm:h-auto p-1">
          <TabsTrigger value="dashboard" className="py-2 sm:py-3 text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="py-2 sm:py-3 text-xs sm:text-sm">
            <Play className="h-4 w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Bài thi</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="py-2 sm:py-3 text-xs sm:text-sm">
            <Trophy className="h-4 w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Xếp hạng</span>
          </TabsTrigger>
        </TabsList>
        

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mb-6">
          {/* Mobile: Vertical Stack, Desktop: Original Grid */}
          <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            
            {/* Quick Actions - Priority #1 on Mobile */}
            <div className="lg:order-2 lg:col-span-1 animate-in fade-in-50 duration-500 delay-100">
              <Card className="border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-white font-heading">Thao tác nhanh</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-11 bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white backdrop-blur-sm transition-all"
                    onClick={() => setActiveTab("quizzes")}
                  >
                    <BookOpen className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">Xem tất cả bài thi</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-11 bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white backdrop-blur-sm transition-all"
                    onClick={() => setActiveTab("leaderboard")}
                  >
                    <Trophy className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">Bảng xếp hạng</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Column */}
            <div className="lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Recent Performance - Compact Mobile Version */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl animate-in fade-in-50 duration-500 delay-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Kết quả gần đây</CardTitle>
                        <CardDescription className="text-xs text-slate-600 font-body hidden sm:block">5 lần làm bài mới nhất</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 text-xs">
                      {userAttempts.length > 0 ? `${Math.min(userAttempts.length, 5)}` : '0'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2 sm:space-y-3">
                    {userAttempts.slice(0, 3).map((attempt, index) => {
                      const quiz = availableQuizzes.find(q => q.id === attempt.quizId)
                      return (
                        <div 
                          key={attempt.id} 
                          className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors animate-in fade-in-50 duration-300"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2.5">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              (attempt.score || 0) >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                              (attempt.score || 0) >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                              'bg-gradient-to-br from-red-500 to-pink-600'
                            }`}>
                              <span className="text-white text-xs sm:text-sm font-bold">{attempt.score}%</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs sm:text-sm line-clamp-1 text-slate-800">
                                {quiz?.title || 'Bài thi không tồn tại'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                <p className="text-xs text-slate-500 truncate">
                                  {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true, locale: vi })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        </div>
                      )
                    })}
                    
                    {userAttempts.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 w-fit mx-auto mb-2">
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-slate-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 font-body">Chưa có kết quả nào</p>
                      </div>
                    )}
                    
                    {userAttempts.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setActiveTab("quizzes")}
                      >
                        Xem tất cả {userAttempts.length} kết quả
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Overview - Compact */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl animate-in fade-in-50 duration-500 delay-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Tiến độ học tập</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2 font-body">
                        <span className="text-slate-600">Bài thi đã hoàn thành</span>
                        <span className="font-semibold text-slate-800">{stats.quizzesCompleted}/{availableQuizzes.length}</span>
                      </div>
                      <Progress 
                        value={availableQuizzes.length > 0 ? Math.min((stats.quizzesCompleted / availableQuizzes.length) * 100, 100) : 0} 
                        className="h-2.5" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2 font-body">
                        <span className="text-slate-600">Điểm trung bình</span>
                        <span className={`font-semibold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}%</span>
                      </div>
                      <Progress value={stats.averageScore} className="h-2.5" />
                    </div>
                  </div>

                  {/* Rank Badge */}
                  {stats.rank > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-600">
                          <Trophy className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm text-slate-700 font-medium">
                          Xếp hạng <span className="font-bold text-orange-600">#{stats.rank}</span> / {stats.totalStudents}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity - Compact Mobile */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl mb-6 animate-in fade-in-50 duration-500 delay-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading">Hoạt động lớp</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0 text-xs">
                      Mới
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2 sm:space-y-3">
                    {recentActivity.slice(0, 3).map((activity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors animate-in fade-in-50 duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {activity.userName.substring(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm line-clamp-1 text-slate-800">
                            <span className="text-purple-600">{activity.userName.split(' ')[0]}</span> đạt {activity.score}%
                          </p>
                          <p className="text-xs text-slate-500 truncate">{activity.quizTitle}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            {formatDistanceToNow(new Date(activity.completedAt), { addSuffix: true, locale: vi }).replace('khoảng ', '')}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {recentActivity.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 w-fit mx-auto mb-2">
                          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-slate-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 font-body">Chưa có hoạt động nào</p>
                      </div>
                    )}
                    
                    {recentActivity.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        Xem thêm hoạt động
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6 mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">Bài thi có sẵn</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 font-body">Những bài thi bạn có thể làm ngay</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {availableQuizzes.map((quiz) => {
                  const attempt = userAttempts.find(a => a.quizId === quiz.id)
                  const status = attempt ? 'completed' : 'available'
                  
                  return (
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
                              <span className="font-medium">{quiz.questions?.length || 0} câu</span>
                            </div>
                          <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-cyan-100">
                                <Clock className="h-4 w-4 text-cyan-600" />
                              </div>
                              <span className="font-medium">{quiz.timeLimit} phút</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-100">
                                <Users className="h-4 w-4 text-slate-600" />
                              </div>
                              <span className="font-medium">{attemptCounts[quiz.id] || 0} lượt làm</span>
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 btn-secondary"
                                  onClick={() => handleViewResult(quiz.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem kết quả
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1 btn-primary"
                                  onClick={() => handleStartQuiz(quiz)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Làm lại
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                className="w-full btn-primary"
                                onClick={() => handleStartQuiz(quiz)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Bắt đầu làm bài
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {availableQuizzes.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mx-auto mb-4">
                    <BookOpen className="h-12 w-12 text-blue-600" />
                  </div>
                  <p className="text-slate-600 font-body">Chưa có bài thi nào được tạo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6 mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">Bảng xếp hạng</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 font-body">Top người dùng xuất sắc nhất</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-3 sm:space-y-4">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có dữ liệu xếp hạng</p>
                  </div>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div 
                      key={entry.userId} 
                      className={`p-3 rounded-lg transition-colors ${
                        entry.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' 
                          : 'bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* User Info Row */}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 ${
                            entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            entry.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                            entry.rank === 3 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                            'bg-slate-200'
                          } flex items-center justify-center text-white text-sm font-bold`}>
                            {entry.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 text-sm truncate">{entry.userName}</h4>
                            <p className="text-xs text-slate-500 truncate">{entry.userEmail}</p>
                          </div>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex justify-between text-center px-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{entry.averageScore}%</p>
                            <p className="text-xs text-slate-500">Điểm TB</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{entry.totalQuizzes}</p>
                            <p className="text-xs text-slate-500">Bài thi</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{entry.bestScore}%</p>
                            <p className="text-xs text-slate-500">Tốt nhất</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inline Quiz */}
{showQuiz && selectedQuiz && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedQuiz.title}</h2>
                <Button onClick={handleCloseQuiz} variant="ghost">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <InlineQuiz
                quiz={selectedQuiz}
                onClose={handleCloseQuiz}
                onComplete={handleQuizComplete}
              />
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}