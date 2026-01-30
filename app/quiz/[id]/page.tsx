"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import { StudyPlanService } from "@/lib/study-plan-service"
import { BookmarkService } from "@/lib/services"
import type { Quiz, QuizAttempt, Question } from "@/lib/types"
import { Clock, AlertCircle, CheckCircle, Circle, BookOpen, Target, Trophy, Users, Timer, Play, Pause, RotateCcw, X, Flag, ChevronLeft, ChevronRight, ArrowUp, Bookmark } from "lucide-react"
import { AchievementService, NotificationService, AuditLogService } from "@/lib/services"
import { useToast } from "@/components/toast-provider"

// Default number of questions to show in exam if quiz.questionCount is not set
const EXAM_QUESTION_COUNT = 40

interface ExamSession {
  selectedQuestions: Question[]
  questionIndices: number[] // Original indices for scoring
  answers: number[]
  startTime: number
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [examSession, setExamSession] = useState<ExamSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [protectUnload, setProtectUnload] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  const [showAnswerStatus, setShowAnswerStatus] = useState(true)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Create exam session with random questions
  const createExamSession = (quizData: Quiz): ExamSession => {
    const configuredCount = quizData.questionCount ?? EXAM_QUESTION_COUNT
    const questionCount = Math.min(configuredCount, quizData.questions.length)

    // Create array of indices and shuffle them
    const indices = Array.from({ length: quizData.questions.length }, (_, i) => i)
    const shuffledIndices = shuffleArray(indices)
    const selectedIndices = shuffledIndices.slice(0, questionCount)

    // Get the selected questions
    const selectedQuestions = selectedIndices.map(index => quizData.questions[index])

    return {
      selectedQuestions,
      questionIndices: selectedIndices,
      answers: new Array(questionCount).fill(-1),
      startTime: Date.now()
    }
  }

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await QuizService.getQuizById(quizId)
        if (quizData) {
          setQuiz(quizData)

          // Try restore from localStorage
          const key = `exam_session_${quizId}`
          const stored = (typeof window !== 'undefined') ? localStorage.getItem(key) : null
          if (stored) {
            try {
              const data = JSON.parse(stored) as { questionIndices: number[]; answers: number[]; startTime: number; flagged?: number[] }
              const selectedQuestions = data.questionIndices.map((i) => quizData.questions[i])
              setExamSession({ selectedQuestions, questionIndices: data.questionIndices, answers: data.answers, startTime: data.startTime })
              if (data.flagged) setFlaggedQuestions(new Set(data.flagged))
              const elapsed = Math.floor((Date.now() - data.startTime) / 1000)
              setTimeLeft(Math.max(0, quizData.timeLimit * 60 - elapsed))
            } catch {
              // fallback create new session
              const session = createExamSession(quizData)
              setExamSession(session)
              setTimeLeft(quizData.timeLimit * 60)
            }
          } else {
            // Create new session
            const session = createExamSession(quizData)
            setExamSession(session)
            setTimeLeft(quizData.timeLimit * 60) // Convert minutes to seconds
          }

          if (user) {
            AuditLogService.logQuizStart(quizId, user.id, user.name)
            // Check if bookmarked
            BookmarkService.isBookmarked(user.id, quizId).then(setIsBookmarked)
          }
        } else {
          router.push("/quizzes")
        }
      } catch (err) {
        router.push("/quizzes")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, router])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && quiz && examSession) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && quiz && examSession) {
      handleSubmit()
    }
  }, [timeLeft, quiz, examSession])

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    if (!examSession) return

    const newAnswers = [...examSession.answers]
    newAnswers[questionIndex] = answerIndex
    const updated = {
      ...examSession,
      answers: newAnswers
    }
    setExamSession(updated)

    // persist to storage quickly
    try {
      const key = `exam_session_${quizId}`
      localStorage.setItem(key, JSON.stringify({
        questionIndices: updated.questionIndices,
        answers: updated.answers,
        startTime: updated.startTime,
        flagged: Array.from(flaggedQuestions)
      }))
    } catch { }
  }

  const toggleFlagged = (index: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const goToQuestion = (index: number) => {
    setActiveQuestion(index)
    const element = document.getElementById(`question-${index}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const doSubmit = useCallback(async () => {
    if (!quiz || !user || !examSession || submitting) return

    setSubmitting(true)

    try {
      const timeSpent = Math.floor((Date.now() - examSession.startTime) / 1000)

      // Tính điểm dựa trên các câu hỏi trắc nghiệm
      const correctAnswers = examSession.answers.reduce((total, answer, examQuestionIndex) => {
        if (answer === -1) return total
        const originalQuestionIndex = examSession.questionIndices[examQuestionIndex]
        const originalQuestion = quiz.questions[originalQuestionIndex]

        return total + (answer === originalQuestion.correctAnswer ? 1 : 0)
      }, 0)

      const scorePercentage = Math.round((correctAnswers / examSession.selectedQuestions.length) * 100)

      const attempt: Omit<QuizAttempt, "id"> = {
        userId: user.id,
        quizId: quiz.id,
        answers: examSession.answers,
        score: scorePercentage,
        correctAnswers,
        totalQuestions: examSession.selectedQuestions.length,
        completedAt: new Date().toISOString(),
        timeSpent,
      }


      const attemptId = await QuizService.submitQuizAttempt({ ...attempt, questionIndices: examSession.questionIndices })

      // Check for achievements
      try {
        const allAttempts = await QuizService.getUserAttempts(user.id)
        await AchievementService.checkAndAwardAfterQuiz(user.id, { ...attempt, id: attemptId } as QuizAttempt, allAttempts)

        // Update study plan goals
        await StudyPlanService.updateProgressAfterQuiz(user.id, {
          quizId,
          score: scorePercentage,
          timeSpent
        }, allAttempts)

        // Send notification
        await NotificationService.sendQuizResultNotification(
          user.id,
          quiz.title,
          scorePercentage,
          quiz.id
        )

        // Log audit
        await AuditLogService.logQuizSubmit(
          attemptId,
          user.id,
          user.name,
          scorePercentage
        )
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError)
      }

      try { localStorage.removeItem(`exam_session_${quizId}`) } catch { }
      // Cho phép tải trang khi điều hướng đến kết quả
      setProtectUnload(false)
      router.push(`/quiz/${quizId}/result?attempt=${attemptId}`)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }, [quiz, user, examSession, quizId, router, submitting])

  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSubmit = () => setConfirmOpen(true)
  const confirmSubmit = () => {
    setConfirmOpen(false)
    doSubmit()
  }

  const handleToggleBookmark = async () => {
    if (!user || !quiz) return
    try {
      setBookmarking(true)
      const result = await BookmarkService.toggleBookmark(user.id, quiz.id)
      setIsBookmarked(result.isBookmarked)
      success(result.isBookmarked ? "Đã lưu vào dấu trang" : "Đã bỏ lưu dấu trang")
    } catch (err) {
      error("Không thể thực hiện thao tác")
    } finally {
      setBookmarking(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = (seconds: number) => {
    if (seconds > 300) return "text-emerald-600" // > 5 minutes
    if (seconds > 60) return "text-amber-600"  // > 1 minute
    return "text-red-600 animate-pulse" // < 1 minute
  }

  const getTimeBg = (seconds: number) => {
    if (seconds > 300) return "bg-emerald-50 border-emerald-200"
    if (seconds > 60) return "bg-amber-50 border-amber-200"
    return "bg-red-50 border-red-200"
  }

  // Remove duplicated option label like "A.", "A)", etc. if present in raw text
  const stripOptionLabel = (raw: string, optionIndex: number): string => {
    const label = String.fromCharCode(65 + optionIndex)
    const regex = new RegExp(`^\\s*${label}\\s*[\u002E\uFF0E\)\:]?\\s*`, 'i') // dot (fullwidth/half), ) or :
    return raw.replace(regex, '')
  }

  // Warn before leaving if exam in progress
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!protectUnload) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [protectUnload])

  // Track scroll to update active question
  useEffect(() => {
    const elements = Array.from({ length: examSession?.selectedQuestions.length || 0 }, (_, i) => document.getElementById(`question-${i}`))
      .filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          const id = visible.target.id
          const idx = Number(id.split('-')[1])
          if (!Number.isNaN(idx)) setActiveQuestion(idx)
        }
      },
      { root: null, rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.25, 0.5, 0.75] }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [examSession])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <p className="text-slate-800 font-semibold text-lg">Đang tải bài thi...</p>
            <p className="text-slate-500 text-sm mt-2">Đang random {EXAM_QUESTION_COUNT} câu hỏi</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!quiz || !examSession) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Không tìm thấy bài thi này.</AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    )
  }

  const answeredQuestions = examSession.answers.filter((answer) => answer !== -1).length
  const progress = (answeredQuestions / examSession.selectedQuestions.length) * 100
  const currentQuestion = examSession.selectedQuestions[activeQuestion]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Compact Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left: Quiz Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-800 truncate text-lg">{quiz.title}</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {examSession.selectedQuestions.length} câu • {quiz.timeLimit} phút
                  </p>
                </div>
              </div>

              {/* Center: Timer (Desktop) */}
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border ${getTimeBg(timeLeft)}`}>
                <Timer className={`h-5 w-5 ${getTimeColor(timeLeft)}`} />
                <span className={`text-xl font-bold tabular-nums ${getTimeColor(timeLeft)}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Right: Progress & Actions */}
              <div className="flex items-center gap-3">
                {/* Mobile Timer */}
                <div className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getTimeBg(timeLeft)}`}>
                  <Timer className={`h-4 w-4 ${getTimeColor(timeLeft)}`} />
                  <span className={`font-bold tabular-nums ${getTimeColor(timeLeft)}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Progress Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                  <Target className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold text-slate-700">
                    {answeredQuestions}/{examSession.selectedQuestions.length}
                  </span>
                </div>

                {/* Mobile Nav Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setDrawerOpen(true)}
                >
                  <span className="text-xs font-medium">Câu {activeQuestion + 1}</span>
                </Button>

                {/* Bookmark Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleBookmark}
                  disabled={bookmarking}
                  className={isBookmarked ? "text-amber-500 hover:text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-600"}
                >
                  <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pb-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Tiến độ</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Split View */}
        <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="flex gap-6 lg:gap-8">
            {/* Left: Question Area - Constrained Width */}
            <div className="flex-1 min-w-0 max-w-3xl">
              <div className="space-y-6">
                {examSession.selectedQuestions.map((question, index) => (
                  <Card
                    key={index}
                    id={`question-${index}`}
                    className={`scroll-mt-32 border-0 shadow-lg transition-all duration-300 ${activeQuestion === index
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : 'hover:shadow-xl'
                      }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        {/* Question Number */}
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md transition-colors ${examSession.answers[index] !== -1
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                            : flaggedQuestions.has(index)
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base lg:text-xl leading-relaxed text-slate-800 mb-2 break-words">
                            {question.question}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-slate-500">Trắc nghiệm</span>
                            {examSession.answers[index] !== -1 && (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs px-2 py-0.5">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Đã chọn
                              </Badge>
                            )}
                            {flaggedQuestions.has(index) && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 text-xs px-2 py-0.5">
                                <Flag className="h-3 w-3 mr-1" />
                                Đánh dấu
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Flag Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFlagged(index)
                          }}
                          className={`flex-shrink-0 h-9 w-9 rounded-full ${flaggedQuestions.has(index)
                            ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <RadioGroup
                        value={examSession.answers[index]?.toString() || ""}
                        onValueChange={(value) => handleAnswerChange(index, Number.parseInt(value))}
                        className="space-y-3"
                      >
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${examSession.answers[index] === optionIndex
                              ? 'bg-blue-50 border-blue-500 shadow-md'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                            onClick={() => handleAnswerChange(index, optionIndex)}
                          >
                            <RadioGroupItem
                              value={optionIndex.toString()}
                              id={`q${index}-option-${optionIndex}`}
                              className="mt-0.5 w-5 h-5 flex-shrink-0"
                            />
                            <Label
                              htmlFor={`q${index}-option-${optionIndex}`}
                              className="flex-1 min-w-0 cursor-pointer leading-relaxed text-slate-700"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <span className={`font-bold text-lg flex-shrink-0 ${examSession.answers[index] === optionIndex
                                  ? 'text-blue-600'
                                  : 'text-slate-400 group-hover:text-blue-500'
                                  }`}>
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-base break-all overflow-hidden">{stripOptionLabel(option, optionIndex)}</span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {/* Question Navigation */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => goToQuestion(Math.max(0, index - 1))}
                          disabled={index === 0}
                          className="text-slate-600"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Câu trước
                        </Button>

                        <span className="text-sm text-slate-500">
                          {index + 1} / {examSession.selectedQuestions.length}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => goToQuestion(Math.min(examSession.selectedQuestions.length - 1, index + 1))}
                          disabled={index === examSession.selectedQuestions.length - 1}
                          className="text-slate-600"
                        >
                          Câu tiếp
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Navigation Sidebar - Desktop Only */}
            <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-slate-800">
                        Điều hướng
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {answeredQuestions}/{examSession.selectedQuestions.length}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Đã trả lời</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span>Đánh dấu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        <span>Chưa làm</span>
                      </div>
                    </div>

                    {/* Question Grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {examSession.selectedQuestions.map((_, index) => {
                        const isAnswered = examSession.answers[index] !== -1
                        const isFlagged = flaggedQuestions.has(index)
                        const isCurrent = activeQuestion === index

                        return (
                          <button
                            key={index}
                            onClick={() => goToQuestion(index)}
                            className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all duration-200 ${isCurrent
                              ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
                              : 'hover:scale-105'
                              } ${isAnswered
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : isFlagged
                                  ? 'bg-amber-400 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                          >
                            {isAnswered ? (
                              <CheckCircle className="h-4 w-4 mx-auto" />
                            ) : isFlagged ? (
                              <Flag className="h-4 w-4 mx-auto" />
                            ) : (
                              index + 1
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                      <div className="text-center p-2 rounded-lg bg-emerald-50">
                        <div className="text-lg font-bold text-emerald-600">{answeredQuestions}</div>
                        <div className="text-xs text-emerald-700">Đã làm</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50">
                        <div className="text-lg font-bold text-amber-600">{flaggedQuestions.size}</div>
                        <div className="text-xs text-amber-700">Đánh dấu</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100">
                        <div className="text-lg font-bold text-slate-600">
                          {examSession.selectedQuestions.length - answeredQuestions}
                        </div>
                        <div className="text-xs text-slate-600">Còn lại</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                        <span>Tiến độ hoàn thành</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Đang nộp...
                        </>
                      ) : (
                        <>
                          <Trophy className="h-5 w-5 mr-2" />
                          Nộp bài thi
                        </>
                      )}
                    </Button>

                    {/* Scroll to top */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="w-full"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Lên đầu trang
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </main>

        {/* Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg z-40">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDrawerOpen(true)}
                className="flex-1 h-12"
              >
                <span className="font-medium">Câu {activeQuestion + 1}/{examSession.selectedQuestions.length}</span>
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Đang nộp
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    Nộp bài
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer - Enhanced UX */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b border-slate-100 pb-4">
              <DrawerTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">#</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-left">Điều hướng</p>
                    <p className="text-sm text-slate-500 font-normal text-left">Chọn câu hỏi để chuyển đến</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {answeredQuestions}/{examSession.selectedQuestions.length}
                </Badge>
              </DrawerTitle>
            </DrawerHeader>

            <div className="px-4 py-4 overflow-y-auto">
              {/* Quick Stats - Large & Clear */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <button
                  onClick={() => {
                    const firstUnanswered = examSession.answers.findIndex(a => a === -1)
                    if (firstUnanswered !== -1) {
                      goToQuestion(firstUnanswered)
                      setDrawerOpen(false)
                    }
                  }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 active:scale-95 transition-transform"
                >
                  <div className="text-2xl font-bold text-slate-700">
                    {examSession.selectedQuestions.length - answeredQuestions}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Chưa làm</div>
                </button>
                <button
                  onClick={() => {
                    const firstAnswered = examSession.answers.findIndex(a => a !== -1)
                    if (firstAnswered !== -1) {
                      goToQuestion(firstAnswered)
                      setDrawerOpen(false)
                    }
                  }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 active:scale-95 transition-transform"
                >
                  <div className="text-2xl font-bold text-emerald-600">{answeredQuestions}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">Đã làm</div>
                </button>
                <button
                  onClick={() => {
                    const firstFlagged = Array.from(flaggedQuestions)[0]
                    if (firstFlagged !== undefined) {
                      goToQuestion(firstFlagged)
                      setDrawerOpen(false)
                    }
                  }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 active:scale-95 transition-transform"
                >
                  <div className="text-2xl font-bold text-amber-600">{flaggedQuestions.size}</div>
                  <div className="text-xs text-amber-700 font-medium mt-1">Đánh dấu</div>
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm text-slate-600 mb-4 py-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-emerald-500" />
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-amber-400" />
                  <span>Đánh dấu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300" />
                  <span>Chưa làm</span>
                </div>
              </div>

              {/* Question Grid - 5 columns, larger touch targets */}
              <div className="grid grid-cols-5 gap-2.5">
                {examSession.selectedQuestions.map((_, index) => {
                  const isAnswered = examSession.answers[index] !== -1
                  const isFlagged = flaggedQuestions.has(index)
                  const isCurrent = activeQuestion === index

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        goToQuestion(index)
                        setDrawerOpen(false)
                      }}
                      className={`
                        w-full aspect-square rounded-xl font-bold text-base
                        flex items-center justify-center
                        transition-all duration-150 active:scale-90
                        min-h-[48px]
                        ${isCurrent ? 'ring-3 ring-blue-500 ring-offset-2 scale-105' : ''}
                        ${isAnswered
                          ? 'bg-emerald-500 text-white shadow-md'
                          : isFlagged
                            ? 'bg-amber-400 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 border-2 border-slate-200'
                        }
                      `}
                    >
                      {/* Always show number for clarity */}
                      <span className="relative">
                        {index + 1}
                        {isAnswered && (
                          <CheckCircle className="absolute -top-1 -right-3 h-3 w-3 text-white" />
                        )}
                        {isFlagged && !isAnswered && (
                          <Flag className="absolute -top-1 -right-3 h-3 w-3 text-white" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Tiến độ hoàn thành</span>
                  <span className="font-bold text-emerald-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <DrawerClose asChild>
                  <Button variant="outline" className="h-12 font-medium">
                    Đóng
                  </Button>
                </DrawerClose>
                <Button
                  onClick={() => {
                    setDrawerOpen(false)
                    handleSubmit()
                  }}
                  className="h-12 font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Nộp bài
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <AlertDialogTitle className="text-center text-xl font-bold">
                Xác nhận nộp bài?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex-1">
                      <div className="text-2xl font-bold text-emerald-600">{answeredQuestions}</div>
                      <div className="text-xs text-emerald-700 mt-1">Đã trả lời</div>
                    </div>
                    <div className="text-xl text-slate-300 font-bold">/</div>
                    <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200 flex-1">
                      <div className="text-2xl font-bold text-slate-700">{examSession.selectedQuestions.length}</div>
                      <div className="text-xs text-slate-600 mt-1">Tổng câu</div>
                    </div>
                  </div>

                  {examSession.selectedQuestions.length - answeredQuestions > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Vẫn còn <strong>{examSession.selectedQuestions.length - answeredQuestions} câu</strong> chưa trả lời.
                          Bạn có chắc muốn nộp?
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-3 mt-4">
              <AlertDialogCancel className="flex-1 h-12 font-semibold">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSubmit}
                className="flex-1 h-12 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Nộp bài
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
