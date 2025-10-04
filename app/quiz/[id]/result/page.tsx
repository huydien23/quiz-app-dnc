"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz, QuizAttempt } from "@/lib/types"
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, ArrowUp } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
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
            <div className={`h-2 ${
              percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
              'bg-gradient-to-r from-red-500 to-pink-600'
            }`} />
            
            <CardHeader className="text-center pb-4">
              {/* Big score display */}
              <div className="mb-4">
                <div className={`text-5xl sm:text-6xl font-bold ${getResultColor()} mb-2 font-heading`}>
                  {correctCount}<span className="text-3xl sm:text-4xl text-slate-400">/</span>{total}
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${getResultColor()} mb-3`}>
                  {percentage}%
                </div>
              </div>
              
              {/* Badge */}
              <div className="flex justify-center mb-3">
                <Badge className={`px-4 py-1.5 text-sm sm:text-base font-semibold ${
                  percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
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
            <Link href={`/dashboard?tab=quizzes`} className="flex-1">
              <Button variant="outline" className="w-full h-11 sm:h-12 text-xs sm:text-base btn-secondary hover:shadow-lg transition-all">
                <Trophy className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bài thi khác</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full h-11 sm:h-12 text-xs sm:text-base bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          </div>

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
                    className={`border-0 shadow-xl overflow-hidden animate-in fade-in-50 duration-300 ${
                      item.isCorrect 
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
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                          item.isCorrect 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-red-500 to-pink-600'
                        }`}>
                          {item.isCorrect 
                            ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            : <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          }
                        </div>
                        
                        {/* Question */}
                        <CardTitle className="text-sm sm:text-base text-slate-800 flex-1">
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
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isCor 
                                  ? 'bg-white border-green-400 shadow-md' 
                                  : isSel 
                                  ? 'bg-white border-red-400 shadow-md' 
                                  : 'bg-white/50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <span className={`font-bold mr-2 ${isCor ? 'text-green-600' : isSel ? 'text-red-600' : 'text-slate-600'}`}>
                                    {label}.
                                  </span>
                                  <span className="text-sm sm:text-base text-slate-800">{opt}</span>
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
