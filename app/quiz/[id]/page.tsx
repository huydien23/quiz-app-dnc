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
import type { Quiz, QuizAttempt, Question } from "@/lib/types"
import { Clock, AlertCircle, CheckCircle, Circle, BookOpen, Target, Trophy, Users, Timer, Play, Pause, RotateCcw } from "lucide-react"

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
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [examSession, setExamSession] = useState<ExamSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [protectUnload, setProtectUnload] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAnswerStatus, setShowAnswerStatus] = useState(true)
  const [showMiniHeader, setShowMiniHeader] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)

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
              const data = JSON.parse(stored) as { questionIndices: number[]; answers: number[]; startTime: number }
              const selectedQuestions = data.questionIndices.map((i) => quizData.questions[i])
              setExamSession({ selectedQuestions, questionIndices: data.questionIndices, answers: data.answers, startTime: data.startTime })
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
        } else {
          router.push("/quizzes")
        }
      } catch (error) {
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
      localStorage.setItem(key, JSON.stringify({ questionIndices: updated.questionIndices, answers: updated.answers, startTime: updated.startTime }))
    } catch {}

    // auto-advance to next question if enabled
    if (autoAdvance) {
      const nextId = `question-${questionIndex + 1}`
      setTimeout(() => document.getElementById(nextId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    }
  }

  const doSubmit = useCallback(async () => {
    if (!quiz || !user || !examSession || submitting) return

    setSubmitting(true)

    try {
      const timeSpent = Math.floor((Date.now() - examSession.startTime) / 1000)
      
      // Calculate score based on original quiz questions
      const correctAnswers = examSession.answers.reduce((total, answer, examQuestionIndex) => {
        if (answer === -1) return total // Unanswered
        
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
      // Clear persisted session when finished
      try { localStorage.removeItem(`exam_session_${quizId}`) } catch {}
      // Allow page unload when navigating to result
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = (seconds: number) => {
    if (seconds > 300) return "text-green-600" // > 5 minutes
    if (seconds > 60) return "text-yellow-600"  // > 1 minute
    return "text-red-600" // < 1 minute
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

  // Track current question by IntersectionObserver (scroll spy)
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

  // Mini header appearance on scroll (mobile)
  useEffect(() => {
    const onScroll = () => setShowMiniHeader(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải bài thi...</p>
            <p className="text-sm text-muted-foreground mt-2">Đang random {EXAM_QUESTION_COUNT} câu hỏi...</p>
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

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6 pb-32 md:pb-6 max-w-6xl">
        {/* Enhanced Sticky Header - Mobile Optimized */}
<div className="sticky top-0 bg-white/98 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-soft z-20 mb-4 md:mb-8 safe-top">
          <div className="px-3 md:px-6 py-3 md:py-6">
            {/* Mobile Layout - Compact */}
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold truncate">{quiz.title}</h1>
<p className="text-slate-500 text-xs">
                      {examSession.selectedQuestions.length} câu
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-slate-600" />
                    <span className={`text-lg font-bold ${getTimeColor(timeLeft)}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile Progress - Simplified */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
<span className="text-slate-600 font-medium">Đã làm: {answeredQuestions}/{examSession.selectedQuestions.length}</span>
<span className="text-slate-600 font-semibold">{Math.round(progress)}%</span>
                </div>
<div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
<div className="p-3 rounded-xl bg-slate-100">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
<p className="text-slate-500 text-lg">
                      Đã chọn ngẫu nhiên {examSession.selectedQuestions.length} câu từ tổng số {quiz.questions?.length || 0} câu
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  {/* Timer */}
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Timer className="h-6 w-6" />
                      <span className={`text-3xl font-bold ${getTimeColor(timeLeft).replace('text-', 'text-')}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
<p className="text-slate-500 text-sm">Thời gian còn lại</p>
                  </div>
                  
                  {/* Progress */}
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Target className="h-6 w-6" />
                      <span className="text-3xl font-bold">
                        {answeredQuestions}/{examSession.selectedQuestions.length}
                      </span>
                    </div>
                    <p className="text-blue-100 text-sm">Câu đã trả lời</p>
                  </div>
                </div>
              </div>
              
              {/* Desktop Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
<span className="text-slate-600 font-medium">Tiến độ làm bài</span>
<span className="text-slate-600 font-medium">{Math.round(progress)}%</span>
                </div>
<div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini top bar on mobile */}
        {showMiniHeader && (
          <div className="fixed top-0 left-0 right-0 z-20 md:hidden bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
            <div className="px-4 py-2 flex items-center justify-between text-sm">
              <div className="font-semibold truncate max-w-[50%]">{quiz.title}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-700">
                  <Target className="h-4 w-4" />
                  <span>{answeredQuestions}/{examSession.selectedQuestions.length}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Timer className="h-4 w-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <Button size="sm" variant="outline" className="btn-secondary" onClick={() => setDrawerOpen(true)}>Điều hướng</Button>
              </div>
            </div>
          </div>
        )}

        {/* Questions layout: Left content, Right navigation */}
        <div className="md:grid md:grid-cols-12 md:gap-8">
        {/* Enhanced Question Navigation - Compact and accessible */}
<div className="hidden md:block md:mb-0 md:col-span-4 lg:col-span-3 md:order-2">
          <div className="bg-white rounded-2xl shadow-soft-xl p-5 border border-slate-200 md:sticky md:top-24 transition-all duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">#</span>
                </div>
                Điều hướng
              </h3>
            </div>
            
            {/* Compact Legend */}
            <div className="flex items-center gap-4 mb-4 px-2 py-2 bg-slate-50 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-green-400 to-green-500"></div>
                <span className="text-slate-600 font-medium">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <span className="text-slate-600 font-medium">Chưa trả lời</span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2.5">
              {examSession.selectedQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`question-${index}`)
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 active:scale-95 ${
                    (showAnswerStatus && examSession.answers[index] !== -1)
                      ? 'bg-gradient-to-br from-green-400 to-green-500 border-green-500 text-white shadow-md hover:shadow-lg'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md'
                  } ${activeQuestion === index ? 'ring-3 ring-blue-500 ring-offset-2 scale-105' : ''}`}
                  aria-current={activeQuestion === index ? 'true' : undefined}
                  aria-label={`Câu hỏi ${index + 1}${examSession.answers[index] !== -1 ? ' - Đã trả lời' : ''}`}
                >
                    {examSession.answers[index] !== -1 ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>Tiến độ</span>
                <span className="font-bold">{Math.round((answeredQuestions / examSession.selectedQuestions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(answeredQuestions / examSession.selectedQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Questions List - Mobile Optimized */}
        <div className="space-y-6 md:space-y-8 mb-8 md:col-span-8 lg:col-span-9 md:order-1">
          {examSession.selectedQuestions.map((question, index) => (
            <Card key={index} id={`question-${index}`} className="scroll-mt-28 border-0 shadow-soft-xl bg-white animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base md:text-lg shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-xl leading-relaxed text-slate-900 mb-2 font-heading">
                        {question.question}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                        <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span>Trắc nghiệm</span>
                        {examSession.answers[index] !== -1 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-semibold">Đã chọn</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {examSession.answers[index] !== -1 && (
                    <div className="flex-shrink-0 animate-scale-in">
                      <div className="p-2 rounded-full bg-gradient-to-br from-green-100 to-green-50">
                        <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <RadioGroup
                  value={examSession.answers[index]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(index, Number.parseInt(value))}
className="space-y-3"
                >
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex} 
className={`flex items-start gap-3 md:gap-4 p-4 md:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                        examSession.answers[index] === optionIndex
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 active:bg-blue-50'
                      }`}
                    >
                      <RadioGroupItem 
                        value={optionIndex.toString()} 
                        id={`q${index}-option-${optionIndex}`} 
className="mt-0.5 w-5 h-5 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`q${index}-option-${optionIndex}`} 
                        className="flex-1 cursor-pointer leading-relaxed text-slate-800 font-body"
                      >
                        <div className="flex items-start gap-2">
                          <span className={`font-bold text-base md:text-lg flex-shrink-0 ${
                            examSession.answers[index] === optionIndex ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="text-base leading-relaxed">{stripOptionLabel(option, optionIndex)}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>

        {/* Enhanced Submit Section - Mobile Optimized */}
<div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 shadow-sm pt-4 md:pt-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-6">
            {/* Mobile Layout - Enhanced visual design */}
            <div className="md:hidden">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-700">{answeredQuestions}/{examSession.selectedQuestions.length}</div>
                  <div className="text-xs text-blue-700 mt-1 font-medium">Đã trả lời</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center border border-orange-200">
                  <div className="flex items-center justify-center mb-1">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-xl font-bold text-orange-700">
                    {examSession.selectedQuestions.length - answeredQuestions}
                  </div>
                  <div className="text-xs text-orange-700 mt-1 font-medium">Chưa làm</div>
                </div>
                
                <div className={`bg-gradient-to-br rounded-xl p-3 text-center border ${
                  timeLeft < 60 
                    ? 'from-red-50 to-red-100 border-red-200' 
                    : 'from-green-50 to-green-100 border-green-200'
                }`}>
                  <div className="flex items-center justify-center mb-1">
                    <Timer className={`h-4 w-4 ${timeLeft < 60 ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  <div className={`text-xl font-bold ${timeLeft < 60 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-xs mt-1 font-medium ${timeLeft < 60 ? 'text-red-700' : 'text-green-700'}`}>
                    Còn lại
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile Question Navigator (controlled) */}
                <Button variant="outline" className="btn-secondary flex-1 h-12" onClick={() => setDrawerOpen(true)}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">#</span>
                    </div>
                    <span className="text-base font-medium">Điều hướng</span>
                  </div>
                </Button>
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Điều hướng câu hỏi</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <span>Hiện trạng thái</span>
                          <Switch checked={showAnswerStatus} onCheckedChange={setShowAnswerStatus} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <span>Tự chuyển câu</span>
                          <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                        <span>Đã trả lời: {answeredQuestions}</span>
                        <span>Chưa trả lời: {examSession.selectedQuestions.length - answeredQuestions}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {examSession.selectedQuestions.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const element = document.getElementById(`question-${index}`)
                              element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }}
                            className={`w-10 h-10 rounded-md border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                              (showAnswerStatus && examSession.answers[index] !== -1)
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-slate-300 text-slate-700'
                            } ${activeQuestion === index ? 'ring-2 ring-blue-500' : ''}`}
                            aria-current={activeQuestion === index ? 'true' : undefined}
                          >
                            {examSession.answers[index] !== -1 ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <DrawerClose asChild>
                          <Button variant="outline" className="btn-secondary">Đóng</Button>
                        </DrawerClose>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
                <Button 
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-secondary h-12 px-4"
                  aria-label="Lên đầu trang"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 h-12 text-base font-semibold group"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Nộp bài
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Desktop Layout - Enhanced spacing and hierarchy */}
            <div className="hidden md:flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 lg:gap-8">
                <div className="text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-2xl lg:text-3xl font-bold text-slate-800">
                      {answeredQuestions}/{examSession.selectedQuestions.length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Câu đã trả lời</p>
                </div>
                
                <div className="h-12 w-px bg-slate-200"></div>
                
                <div className="text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-2xl lg:text-3xl font-bold text-slate-800">
                      {examSession.selectedQuestions.length - answeredQuestions}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Câu chưa trả lời</p>
                </div>
                
                <div className="h-12 w-px bg-slate-200"></div>
                
                <div className="text-center group">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Timer className="h-5 w-5 text-green-600" />
                    </div>
                    <span className={`text-2xl lg:text-3xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Thời gian còn lại</p>
                </div>
                
                <div className="h-12 w-px bg-slate-200 hidden lg:block"></div>
                
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-sm text-slate-700 font-medium">Tự chuyển câu</span>
                  <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-secondary h-12 px-5"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Lên đầu
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 h-12 text-base font-semibold group"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Đang nộp bài...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      Nộp bài thi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit dialog - Enhanced with solid background */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md bg-white">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl font-bold text-slate-800">
              Xác nhận nộp bài?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base leading-relaxed">
              <div className="space-y-4">
                {/* Stats Display */}
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <div className="flex-1 text-center p-3 sm:p-4 rounded-xl bg-green-50 border-2 border-green-200">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">{answeredQuestions}</div>
                    <div className="text-xs sm:text-sm text-slate-700 font-medium mt-1">Đã trả lời</div>
                  </div>
                  <div className="text-2xl text-slate-300 font-bold">/</div>
                  <div className="flex-1 text-center p-3 sm:p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-800">{examSession.selectedQuestions.length}</div>
                    <div className="text-xs sm:text-sm text-slate-700 font-medium mt-1">Tổng câu</div>
                  </div>
                </div>
                
                {/* Warning Message */}
                {examSession.selectedQuestions.length - answeredQuestions > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4 text-left shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-base text-orange-900 font-semibold mb-1">
                          Lưu ý:
                        </p>
                        <p className="text-sm sm:text-base text-orange-800">
                          Vẫn còn <span className="font-bold text-lg text-orange-600">{examSession.selectedQuestions.length - answeredQuestions} câu</span> chưa trả lời. Bạn có chắc chắn muốn nộp không?
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
            <AlertDialogCancel className="w-full sm:w-auto h-12 text-base font-semibold border-2 hover:bg-slate-50">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSubmit} 
              className="w-full sm:w-auto h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Đồng ý nộp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
