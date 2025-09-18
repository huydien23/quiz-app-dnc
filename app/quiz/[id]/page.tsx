"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizAttempt, Question } from "@/lib/types"
import { Clock, AlertCircle, CheckCircle, Circle, BookOpen, Target, Trophy, Users, Timer, Play, Pause, RotateCcw } from "lucide-react"

// Number of questions to show in exam
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
    const questionCount = Math.min(EXAM_QUESTION_COUNT, quizData.questions.length)
    
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
          setTimeLeft(quizData.timeLimit * 60) // Convert minutes to seconds
          
          // Create exam session with random questions
          const session = createExamSession(quizData)
          setExamSession(session)
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
    setExamSession({
      ...examSession,
      answers: newAnswers
    })
  }

  const handleSubmit = useCallback(async () => {
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

      await QuizService.submitQuizAttempt(attempt)
      router.push(`/quiz/${quizId}/result?score=${scorePercentage}&correct=${correctAnswers}&total=${examSession.selectedQuestions.length}`)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }, [quiz, user, examSession, quizId, router, submitting])

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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Enhanced Sticky Header - Mobile Optimized */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl z-10 rounded-b-2xl mb-4 md:mb-8">
          <div className="px-4 md:px-6 py-4 md:py-6">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate">{quiz.title}</h1>
                    <p className="text-blue-100 text-sm">
                      {examSession.selectedQuestions.length}/{quiz.questions.length} câu
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Timer className="h-4 w-4" />
                    <span className={`text-xl font-bold ${getTimeColor(timeLeft).replace('text-', 'text-')}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs">Thời gian</p>
                </div>
              </div>
              
              {/* Mobile Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100 text-sm font-medium">Tiến độ</span>
                  <span className="text-blue-100 text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
                    <p className="text-blue-100 text-lg">
                      Đã chọn ngẫu nhiên {examSession.selectedQuestions.length} câu từ tổng số {quiz.questions.length} câu
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
                    <p className="text-blue-100 text-sm">Thời gian còn lại</p>
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
                  <span className="text-blue-100 font-medium">Tiến độ làm bài</span>
                  <span className="text-blue-100 font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Question Navigation - Mobile Optimized */}
        <div className="mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-slate-800">Điều hướng câu hỏi</h3>
              <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <span>Chưa trả lời</span>
                </div>
              </div>
            </div>
            
            {/* Mobile Legend */}
            <div className="md:hidden flex items-center justify-center space-x-4 mb-4 text-xs text-slate-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <span>Chưa trả lời</span>
              </div>
            </div>
            
            <div className="grid grid-cols-8 md:grid-cols-10 gap-1 md:gap-2">
              {examSession.selectedQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`question-${index}`)
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl border-2 flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    examSession.answers[index] !== -1
                      ? 'bg-gradient-to-br from-green-400 to-green-500 border-green-500 text-white shadow-lg'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  {examSession.answers[index] !== -1 ? (
                    <CheckCircle className="h-3 w-3 md:h-5 md:w-5" />
                  ) : (
                    <span className="text-xs md:text-sm">{index + 1}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Questions List - Mobile Optimized */}
        <div className="space-y-6 md:space-y-8 mb-8">
          {examSession.selectedQuestions.map((question, index) => (
            <Card key={index} id={`question-${index}`} className="scroll-mt-32 border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 md:pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base md:text-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg md:text-xl leading-relaxed text-slate-800 mb-2">
                        {question.question}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-xs md:text-sm text-slate-600">
                        <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Câu hỏi trắc nghiệm</span>
                        {examSession.answers[index] !== -1 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">Đã trả lời</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {examSession.answers[index] !== -1 && (
                    <div className="flex-shrink-0">
                      <div className="p-1.5 md:p-2 rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <RadioGroup
                  value={examSession.answers[index]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(index, Number.parseInt(value))}
                  className="space-y-3 md:space-y-4"
                >
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex} 
                      className={`flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        examSession.answers[index] === optionIndex
                          ? 'bg-blue-50 border-blue-300 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <RadioGroupItem 
                        value={optionIndex.toString()} 
                        id={`q${index}-option-${optionIndex}`} 
                        className="mt-1 w-4 h-4 md:w-5 md:h-5" 
                      />
                      <Label 
                        htmlFor={`q${index}-option-${optionIndex}`} 
                        className="flex-1 cursor-pointer leading-relaxed text-slate-700"
                      >
                        <div className="flex items-start space-x-2 md:space-x-3">
                          <span className="font-bold text-blue-600 text-base md:text-lg">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="text-sm md:text-base">{option}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Submit Section - Mobile Optimized */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-white shadow-2xl border-t border-slate-200 pt-4 md:pt-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-6">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-slate-800">
                      {answeredQuestions}/{examSession.selectedQuestions.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Đã trả lời</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Timer className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-slate-800">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Thời gian</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-secondary flex-1 text-sm"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Lên đầu
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 text-sm font-semibold"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Nộp bài
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-slate-800">
                      {answeredQuestions}/{examSession.selectedQuestions.length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Câu đã trả lời</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold text-slate-800">
                      {examSession.selectedQuestions.length - answeredQuestions}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Câu chưa trả lời</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Timer className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-slate-800">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Thời gian còn lại</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-secondary"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Lên đầu
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Đang nộp bài...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-3" />
                      Nộp bài thi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
