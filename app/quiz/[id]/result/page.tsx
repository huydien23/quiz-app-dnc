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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Kết quả bài thi</h1>
          <p className="text-muted-foreground">{quiz?.title}</p>
        </div>

        {/* Quick actions (mobile) */}
        <div className="flex md:hidden gap-3 mb-4">
          <Link href={`/quiz/${quizId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm lại
            </Button>
          </Link>
          <Link href={`/dashboard?tab=quizzes`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Bài thi khác
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className={`text-4xl font-bold ${getResultColor()}`}>
              {correctCount}/{total}
            </CardTitle>
            <CardDescription className="text-lg">
              {percentage}% - {getResultMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={percentage} className="h-4 mb-4" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-2xl font-bold text-green-600">{correctCount}</span>
                <span className="text-sm text-muted-foreground">Đúng</span>
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-2xl font-bold text-red-600">{total - correctCount}</span>
                <span className="text-sm text-muted-foreground">Sai</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Badge variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}>
                {percentage >= 80 ? "Xuất sắc" : percentage >= 60 ? "Khá" : "Cần cải thiện"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Toggle show/hide review */}
        <div className="flex justify-center mb-6">
          <Button onClick={() => setShowReview((v) => !v)} variant={showReview ? 'outline' : 'default'}>
            {showReview ? 'Ẩn phần xem lại' : 'Xem lại kết quả'}
          </Button>
        </div>

        {showReview && (
          <>
            {/* Review section */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="correct">Đúng</TabsTrigger>
                <TabsTrigger value="incorrect">Sai</TabsTrigger>
              </TabsList>
              <TabsContent value="all" />
              <TabsContent value="correct" />
              <TabsContent value="incorrect" />
            </Tabs>

            <div className="space-y-4">
              {filtered.map((item, idx) => (
                <Card key={idx} className={`border-2 ${item.isCorrect ? 'border-green-300' : 'border-red-300'}`}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Câu {item.index + 1}. {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {item.options.map((opt, oi) => {
                        const label = String.fromCharCode(65 + oi)
                        const isSel = oi === item.selected
                        const isCor = oi === item.correct
                        return (
                          <div key={oi} className={`p-3 rounded-md border ${isCor ? 'bg-green-50 border-green-300' : isSel ? 'bg-red-50 border-red-300' : 'border-slate-200'}`}>
                            <span className="font-semibold mr-2">{label}.</span>{opt}
                            {isCor && <Badge className="ml-2" variant="secondary">Đáp án đúng</Badge>}
                            {isSel && !isCor && <Badge className="ml-2" variant="destructive">Bạn đã chọn</Badge>}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 hidden md:flex flex-col sm:flex-row gap-4">
          <Link href={`/quiz/${quizId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm lại
            </Button>
          </Link>
          <Link href={`/dashboard?tab=quizzes`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Bài thi khác
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll to top (mobile) */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 z-50 md:hidden rounded-full bg-blue-600 text-white p-3 shadow-lg"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </ProtectedRoute>
  )
}
