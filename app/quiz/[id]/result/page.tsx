"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import { LeaderboardService } from "@/lib/leaderboard-service"
import type { Quiz, QuizAttempt } from "@/lib/types"
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, ArrowUp, Crown, Medal, Award, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { StudentComments } from "@/components/student"

export const dynamic = 'force-dynamic'

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const quizId = params.id as string
  const attemptId = searchParams.get("attempt") || ""

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [showTopBtn, setShowTopBtn] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Hide review by default; user can reveal with a button
  const [showReview, setShowReview] = useState(false)

  // Leaderboard data
  const [quizLeaderboard, setQuizLeaderboard] = useState<any[]>([])
  const [userRankInfo, setUserRankInfo] = useState<any>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [q, a] = await Promise.all([
          QuizService.getQuizById(quizId),
          attemptId ? QuizService.getAttemptById(attemptId) : Promise.resolve(null)
        ])
        setQuiz(q)
        setAttempt(a)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId, attemptId])

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user || !quizId) {
        return
      }

      try {
        setLeaderboardLoading(true)
        const [leaderboard, rankInfo] = await Promise.all([
          LeaderboardService.getQuizLeaderboard(quizId, 50),
          LeaderboardService.getUserRankInQuiz(quizId, user.id)
        ])
        setQuizLeaderboard(leaderboard)
        setUserRankInfo(rankInfo)
      } catch (error) {
        console.error('❌ Error loading leaderboard:', error)
      } finally {
        setLeaderboardLoading(false)
      }
    }

    if (user && quizId) {
      loadLeaderboard()
    }
  }, [quizId, user])

  // show scroll-to-top on mobile after some scroll
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const computed = useMemo(() => {
    if (!quiz || !attempt) return null
    const mapped = attempt.answers.map((ans, i) => {
      const qIndex = attempt.questionIndices ? attempt.questionIndices[i] : i
      const question = quiz.questions[qIndex]
      const isCorrect = ans === question.correctAnswer
      return {
        index: i,
        originalIndex: qIndex,
        question: question.question,
        options: question.options,
        selected: ans,
        correct: question.correctAnswer,
        isCorrect,
      }
    })
    const correctCount = mapped.filter(m => m.isCorrect).length
    const total = mapped.length
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0
    return { mapped, correctCount, total, percentage }
  }, [quiz, attempt])

  if (!mounted || loading || !computed) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Trophy className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải kết quả...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const { mapped, correctCount, total, percentage } = computed

  const getResultColor = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getResultMessage = () => {
    if (percentage >= 80) return "Xuất sắc! Bạn đã làm rất tốt!"
    if (percentage >= 60) return "Tốt! Bạn cần cải thiện thêm một chút."
    return "Cần cố gắng hơn! Hãy ôn tập và thử lại."
  }

  const filtered = mapped.filter(m => filter === 'all' ? true : filter === 'correct' ? m.isCorrect : !m.isCorrect)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Header with animated trophy */}
          <div className="text-center mb-6 sm:mb-8 animate-in fade-in-50 duration-500">
            <div className="inline-block relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-2xl">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 font-heading">Kết quả bài thi</h1>
            <p className="text-sm sm:text-base text-slate-600 font-body">{quiz?.title}</p>
          </div>

          {/* Main Result Card - Redesigned */}
          <Card className="mb-6 border-0 bg-white/90 backdrop-blur-sm shadow-2xl animate-in fade-in-50 duration-500 delay-100 overflow-hidden">
            {/* Gradient top border */}
            <div className={`h-2 ${percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                'bg-gradient-to-r from-red-500 to-pink-600'
              }`} />

            <CardHeader className="text-center pb-4">
              {/* Big score display */}
              <div className="mb-4">
                <div className={`text-5xl sm:text-6xl font-bold ${getResultColor()} mb-2 font-heading`}>
                  {correctCount}<span className="text-3xl sm:text-4xl text-slate-400">/</span>{total}
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${getResultColor()} mb-1`}>
                  {percentage}%
                </div>
                <div className={`text-xl sm:text-2xl font-semibold text-slate-600`}>
                  {(correctCount * 0.25).toFixed(2)}<span className="text-slate-400">/</span>10 điểm
                </div>
              </div>

              {/* Badge */}
              <div className="flex justify-center mb-3">
                <Badge className={`px-4 py-1.5 text-sm sm:text-base font-semibold ${percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                  percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                    'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                  }`}>
                  {percentage >= 80 ? "🎉 Xuất sắc" : percentage >= 60 ? "👍 Khá tốt" : "💪 Cần cải thiện"}
                </Badge>
              </div>

              <CardDescription className="text-base sm:text-lg text-slate-700 font-medium">
                {getResultMessage()}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              {/* Progress bar with gradient */}
              <div className="mb-6">
                <Progress value={percentage} className="h-3 sm:h-4" />
              </div>

              {/* Stats Grid - Redesigned with gradients */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Correct answers */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-4 sm:p-6 group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{correctCount}</span>
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">Đúng</span>
                  </div>
                </div>

                {/* Wrong answers */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 p-4 sm:p-6 group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">{total - correctCount}</span>
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">Sai</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions - Redesigned */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 animate-in fade-in-50 duration-500 delay-200">
            <Link href={`/quiz/${quizId}`} className="flex-1">
              <Button variant="outline" className="w-full h-11 sm:h-12 text-xs sm:text-base btn-secondary hover:shadow-lg transition-all">
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Làm lại</span>
              </Button>
            </Link>
            <Button
              onClick={() => {
                const leaderboardSection = document.getElementById('quiz-leaderboard')
                leaderboardSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              variant="outline"
              className="w-full h-11 sm:h-12 text-xs sm:text-base btn-secondary hover:shadow-lg transition-all"
            >
              <Trophy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Xếp hạng</span>
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full h-11 sm:h-12 text-xs sm:text-base bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          </div>

          {/* Quiz Leaderboard Section */}
          <Card id="quiz-leaderboard" className="border-0 bg-white shadow-xl mb-6 animate-in fade-in-50 duration-500 delay-300 scroll-mt-4">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Xếp hạng bài thi này</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">So sánh điểm với người dùng khác</CardDescription>
                  </div>
                </div>
                {!leaderboardLoading && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    <Users className="h-3 w-3 mr-1" />
                    {quizLeaderboard.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">{leaderboardLoading ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 animate-pulse text-yellow-500 mx-auto mb-4" />
                <p className="text-slate-600">Đang tải bảng xếp hạng...</p>
              </div>
            ) : quizLeaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Chưa có người dùng nào hoàn thành bài thi này</p>
                <p className="text-slate-500 text-sm mt-2">Hãy là người đầu tiên xuất hiện trên bảng xếp hạng!</p>
              </div>
            ) : (
              <>
                {/* User's rank info */}
                {userRankInfo && (
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          #{userRankInfo.rank}
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Xếp hạng của bạn</p>
                          <p className="text-xs text-slate-500">Cao hơn {userRankInfo.percentile}% người dùng</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge className="bg-blue-600 text-white text-base px-3 py-1.5">
                          {userRankInfo.userScore}%
                        </Badge>
                        <p className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                          {userRankInfo.userFinalScore} điểm
                        </p>
                      </div>
                    </div>
                    <Progress value={userRankInfo.percentile} className="h-2 bg-blue-100" />
                  </div>
                )}

                {/* Top 3 compact podium */}
                {quizLeaderboard.length >= 3 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Top 3
                    </p>
                    <div className="space-y-2">
                      {quizLeaderboard.slice(0, 3).map((entry, index) => {
                        const getRankColor = (rank: number) => {
                          if (rank === 1) return 'from-yellow-400 to-yellow-600'
                          if (rank === 2) return 'from-gray-300 to-gray-500'
                          return 'from-amber-400 to-amber-600'
                        }

                        const getRankIcon = (rank: number) => {
                          if (rank === 1) return <Crown className="h-4 w-4 text-white" />
                          if (rank === 2) return <Medal className="h-4 w-4 text-white" />
                          return <Award className="h-4 w-4 text-white" />
                        }

                        const isCurrentUser = entry.userId === user?.id

                        return (
                          <div
                            key={entry.userId}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${isCurrentUser
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 shadow-md'
                              : index === 0
                                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200'
                                : 'bg-slate-50 border border-slate-200'
                              }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} flex items-center justify-center shadow-md flex-shrink-0`}>
                                {getRankIcon(entry.rank)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                                  {entry.userName} {isCurrentUser && '(Bạn)'}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {Math.floor(entry.timeSpent / 60)}:{(entry.timeSpent % 60).toString().padStart(2, '0')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <Badge className={`text-sm font-bold ${isCurrentUser ? 'bg-blue-600' : 'bg-slate-700'} text-white px-3 py-1`}>
                                {entry.score}%
                              </Badge>
                              <p className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                {entry.finalScore} điểm
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* View full leaderboard button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full h-11 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Users className="h-4 w-4 mr-2" />
                      Xem bảng xếp hạng đầy đủ
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] bg-white">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="flex items-center gap-2 text-xl">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Bảng xếp hạng đầy đủ
                      </SheetTitle>
                      <SheetDescription>
                        Top {quizLeaderboard.length} người dùng xuất sắc nhất
                      </SheetDescription>
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(100%-80px)] pr-2">
                      <div className="space-y-2">
                        {quizLeaderboard.map((entry) => {
                          const isCurrentUser = entry.userId === user?.id
                          const isTop3 = entry.rank <= 3

                          return (
                            <div
                              key={entry.userId}
                              className={`flex items-center justify-between p-3 rounded-lg transition-all ${isCurrentUser
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 shadow-md'
                                : isTop3
                                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200'
                                  : 'bg-slate-50 hover:bg-slate-100'
                                }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-full ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                  entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                    entry.rank === 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                      'bg-slate-300'
                                  } flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                                  {entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                                    {entry.userName} {isCurrentUser && '(Bạn)'}
                                  </p>
                                  <p className="text-xs text-slate-600 truncate">{entry.userEmail}</p>
                                  <p className="text-xs text-slate-500">
                                    ⏱️ {Math.floor(entry.timeSpent / 60)}:{(entry.timeSpent % 60).toString().padStart(2, '0')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <Badge className={`text-sm font-bold ${isCurrentUser ? 'bg-blue-600' : isTop3 ? 'bg-yellow-600' : 'bg-slate-600'} text-white px-3 py-1`}>
                                  {entry.score}%
                                </Badge>
                                <p className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                  {entry.finalScore} điểm
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
            </CardContent>
          </Card>

          {/* Toggle show/hide review - Enhanced */}
          <div className="flex justify-center mb-6 animate-in fade-in-50 duration-500 delay-300">
            <Button
              onClick={() => setShowReview((v) => !v)}
              variant={showReview ? 'outline' : 'default'}
              className="h-12 px-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {showReview ? '✕ Ẩn phần xem lại' : '👁️ Xem lại kết quả'}
            </Button>
          </div>

          {showReview && (
            <div className="animate-in fade-in-50 duration-500">
              {/* Review section tabs */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm border rounded-lg p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                    Tất cả ({mapped.length})
                  </TabsTrigger>
                  <TabsTrigger value="correct" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
                    Đúng ({correctCount})
                  </TabsTrigger>
                  <TabsTrigger value="incorrect" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                    Sai ({total - correctCount})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" />
                <TabsContent value="correct" />
                <TabsContent value="incorrect" />
              </Tabs>

              {/* Questions list - Enhanced */}
              <div className="space-y-4">
                {filtered.map((item, idx) => (
                  <Card
                    key={idx}
                    className={`border-0 shadow-xl overflow-hidden animate-in fade-in-50 duration-300 ${item.isCorrect
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                      : 'bg-gradient-to-br from-red-50 to-pink-50'
                      }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Colored top border */}
                    <div className={`h-1.5 ${item.isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`} />

                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {/* Icon badge */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${item.isCorrect
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : 'bg-gradient-to-br from-red-500 to-pink-600'
                          }`}>
                          {item.isCorrect
                            ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            : <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          }
                        </div>

                        {/* Question */}
                        <CardTitle className="text-sm sm:text-base text-slate-800 flex-1 break-words overflow-hidden">
                          <span className="font-bold text-slate-600">Câu {item.index + 1}.</span> {item.question}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="space-y-2">
                        {item.options.map((opt, oi) => {
                          const label = String.fromCharCode(65 + oi)
                          const isSel = oi === item.selected
                          const isCor = oi === item.correct
                          return (
                            <div
                              key={oi}
                              className={`p-3 rounded-lg border-2 transition-all ${isCor
                                ? 'bg-white border-green-400 shadow-md'
                                : isSel
                                  ? 'bg-white border-red-400 shadow-md'
                                  : 'bg-white/50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className={`font-bold mr-2 ${isCor ? 'text-green-600' : isSel ? 'text-red-600' : 'text-slate-600'}`}>
                                    {label}.
                                  </span>
                                  <span className="text-sm sm:text-base text-slate-800 break-all overflow-hidden">{opt}</span>
                                </div>
                                {isCor && (
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
                                    ✓ Đúng
                                  </Badge>
                                )}
                                {isSel && !isCor && (
                                  <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 text-xs">
                                    ✗ Đã chọn
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Section */}
          <div className="mt-8 animate-in fade-in-50 duration-500 delay-500">
            <StudentComments quizId={quizId} />
          </div>
        </div>
      </div>

      {/* Scroll to top - Enhanced */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 z-50 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-3 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all animate-bounce"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </ProtectedRoute>
  )
}
