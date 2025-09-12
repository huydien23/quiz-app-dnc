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
import { Clock, AlertCircle, CheckCircle, Circle } from "lucide-react"

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
        {/* Sticky Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 pb-4 mb-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                Đã chọn ngẫu nhiên {examSession.selectedQuestions.length} câu từ tổng số {quiz.questions.length} câu
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center text-lg font-bold ${getTimeColor(timeLeft)}`}>
                <Clock className="h-5 w-5 mr-2" />
                {formatTime(timeLeft)}
              </div>
              <Badge variant="outline" className="text-sm">
                {answeredQuestions}/{examSession.selectedQuestions.length} câu
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {examSession.selectedQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  const element = document.getElementById(`question-${index}`)
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                  examSession.answers[index] !== -1
                    ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {examSession.answers[index] !== -1 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6 mb-8">
          {examSession.selectedQuestions.map((question, index) => (
            <Card key={index} id={`question-${index}`} className="scroll-mt-32">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-relaxed">
                    <Badge variant="outline" className="mr-3">
                      {index + 1}
                    </Badge>
                    {question.question}
                  </CardTitle>
                  {examSession.answers[index] !== -1 && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={examSession.answers[index]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(index, Number.parseInt(value))}
                  className="space-y-3"
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={optionIndex.toString()} id={`q${index}-option-${optionIndex}`} className="mt-1" />
                      <Label 
                        htmlFor={`q${index}-option-${optionIndex}`} 
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Section */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    Đã trả lời: {answeredQuestions}/{examSession.selectedQuestions.length} câu
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Còn lại: {examSession.selectedQuestions.length - answeredQuestions} câu chưa trả lời
                  </p>
                  <Progress value={progress} className="w-64 h-2" />
                </div>
                <Button 
                  size="lg"
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="min-w-32"
                >
                  {submitting ? "Đang nộp bài..." : "Nộp bài thi"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
