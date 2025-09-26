"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, Clock, BookOpen, CheckCircle, 
  ArrowLeft, ArrowRight, RotateCcw, X
} from "lucide-react"
import { Flag } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Quiz, Question } from "@/lib/types"
import { formatTime } from "@/lib/utils"

interface InlineQuizProps {
  quiz: Quiz
  onClose: () => void
  onComplete: (score: number, timeSpent: number) => void
}

export function InlineQuiz({ quiz, onClose, onComplete }: InlineQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60)
  const [isActive, setIsActive] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
const [startTime, setStartTime] = useState<number>(0)
  const [flagged, setFlagged] = useState<boolean[]>([])
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [hasSavedProgress, setHasSavedProgress] = useState(false)

useEffect(() => {
    const qLen = quiz.questions?.length || 0
    setSelectedAnswers(new Array(qLen).fill(-1))
    setFlagged(new Array(qLen).fill(false))
    setTimeLeft(quiz.timeLimit * 60)
    // Check saved progress
    try {
      const saved = loadProgress()
      setHasSavedProgress(!!saved && (saved.selectedAnswers?.length === qLen) && (saved.timeLeft ?? 0) > 0)
    } catch {
      setHasSavedProgress(false)
    }
  }, [quiz])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  type SavedProgress = {
    selectedAnswers: number[]
    flagged: boolean[]
    currentQuestion: number
    timeLeft: number
    isActive: boolean
    timestamp: number
  }

  const getStorageKey = () => `quizProgress:${quiz.id}`

  const loadProgress = (): SavedProgress | null => {
    try {
      const raw = localStorage.getItem(getStorageKey())
      if (!raw) return null
      return JSON.parse(raw) as SavedProgress
    } catch {
      return null
    }
  }

  const saveProgress = () => {
    try {
      const data: SavedProgress = {
        selectedAnswers,
        flagged,
        currentQuestion,
        timeLeft,
        isActive,
        timestamp: Date.now(),
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(data))
    } catch {}
  }

  const clearProgress = () => {
    try { localStorage.removeItem(getStorageKey()) } catch {}
  }

  // Auto-save on relevant changes
  useEffect(() => {
    if (isActive && !isCompleted) {
      saveProgress()
    }
  }, [selectedAnswers, currentQuestion, timeLeft, isActive, isCompleted])

  // Warn before unload if quiz is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && !isCompleted) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isActive, isCompleted])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isActive || isCompleted) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextQuestion()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevQuestion()
      } else if (["1","2","3","4"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        const max = quiz.questions[currentQuestion]?.options?.length || 0
        if (idx >= 0 && idx < max) {
          e.preventDefault()
          handleAnswerSelect(idx)
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFlag(currentQuestion)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, isCompleted, currentQuestion, quiz.questions])

  const handleStartQuiz = () => {
    setIsActive(true)
    setStartTime(Date.now())
  }

  const stripOptionLabel = (raw: string, optionIndex: number): string => {
    const label = String.fromCharCode(65 + optionIndex)
    const regex = new RegExp(`^\\s*${label}\\s*[\u002E\uFF0E\)\:]?\\s*`, 'i')
    return raw.replace(regex, '')
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const toggleFlag = (index: number) => {
    setFlagged(prev => {
      const arr = [...prev]
      arr[index] = !arr[index]
      return arr
    })
  }

  const handleRequestSubmit = () => {
    const remaining = selectedAnswers.filter(a => a === -1).length
    if (remaining > 0) {
      setShowSubmitConfirm(true)
    } else {
      handleSubmitQuiz()
    }
  }

  const handleResume = () => {
    const saved = loadProgress()
    const qLen = quiz.questions?.length || 0
    if (saved) {
      setSelectedAnswers(saved.selectedAnswers || new Array(qLen).fill(-1))
      setFlagged(saved.flagged || new Array(qLen).fill(false))
      setCurrentQuestion(Math.min(saved.currentQuestion || 0, Math.max(0, qLen - 1)))
      setTimeLeft(saved.timeLeft || quiz.timeLimit * 60)
      setIsActive(true)
    }
  }

  const handleStartNew = () => {
    clearProgress()
    const qLen = quiz.questions?.length || 0
    setSelectedAnswers(new Array(qLen).fill(-1))
    setFlagged(new Array(qLen).fill(false))
    setTimeLeft(quiz.timeLimit * 60)
    setIsActive(true)
    setStartTime(Date.now())
  }

  const handleSubmitQuiz = () => {
    setIsActive(false)
    setIsCompleted(true)
    
    const timeSpent = Math.max(0, (quiz.timeLimit * 60) - timeLeft)
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0)
    }, 0)
    const score = Math.round((correctAnswers / (quiz.questions?.length || 1)) * 100)
    
    clearProgress()
    onComplete(score, timeSpent)
  }

const currentQ = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / (quiz.questions?.length || 1)) * 100
  const answeredCount = selectedAnswers.filter(a => a !== -1).length
  const flaggedCount = flagged.filter(Boolean).length
  const timerColor = timeLeft <= 60 ? "text-red-600" : timeLeft <= 300 ? "text-amber-600" : "text-slate-600"
  const hasAnswered = selectedAnswers[currentQuestion] !== -1

  if (!isActive && !isCompleted) {
    // Quiz Info Screen
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
            <p className="text-slate-600">{quiz.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 bg-blue-50">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-blue-800">{quiz.questions?.length || 0} câu hỏi</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-green-50">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">{quiz.timeLimit} phút</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-purple-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-purple-800">Trắc nghiệm</p>
            </CardContent>
          </Card>
        </div>

        {hasSavedProgress && (
          <Card className="border-0 bg-yellow-50">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-amber-800">Phát hiện bài làm đang dở</p>
                <p className="text-sm text-amber-700">Bạn muốn tiếp tục hay bắt đầu lại?</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResume}>Tiếp tục</Button>
                <Button className="btn-primary" onClick={handleStartNew}>Bắt đầu lại</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button onClick={handleStartQuiz} size="lg" className="btn-primary">
            <Play className="h-5 w-5 mr-2" />
            Bắt đầu làm bài
          </Button>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    // Quiz Completed Screen
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0)
    }, 0)
    const score = Math.round((correctAnswers / (quiz.questions?.length || 1)) * 100)
const timeSpent = Math.max(0, (quiz.timeLimit * 60) - timeLeft)

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="p-6 bg-green-50 rounded-lg">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Hoàn thành!</h3>
            <p className="text-green-600 mb-4">Bạn đã hoàn thành bài thi thành công</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">{score}%</p>
                <p className="text-sm text-green-600">Điểm số</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">{correctAnswers}/{quiz.questions?.length || 0}</p>
                <p className="text-sm text-green-600">Câu đúng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">{formatTime(timeSpent)}</p>
                <p className="text-sm text-green-600">Thời gian</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
            <Button onClick={() => {
              setCurrentQuestion(0)
              setSelectedAnswers(new Array(quiz.questions?.length || 0).fill(-1))
              setTimeLeft(quiz.timeLimit * 60)
              setIsCompleted(false)
              setIsActive(false)
            }} className="btn-primary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Active Quiz Screen
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
          <p className="text-slate-600">Câu {currentQuestion + 1} / {quiz.questions?.length || 0}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${timerColor} font-semibold`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowCloseConfirm(true)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tiến độ</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap items-center justify-between text-sm text-slate-600">
        <div>Đã trả lời: <span className="font-semibold">{answeredCount}/{quiz.questions?.length || 0}</span></div>
        <div>Đánh dấu: <span className="font-semibold">{flaggedCount}</span></div>
      </div>

      {/* Question Map */}
      <Card className="border-0 bg-white/80">
        <CardContent className="p-4">
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {quiz.questions.map((_, idx) => {
              const isCurrent = idx === currentQuestion
              const answered = selectedAnswers[idx] !== -1
              const isFlagged = flagged[idx]
              const base = "text-xs h-8 w-8 flex items-center justify-center rounded-md border transition-all"
              const cls =
                isCurrent ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300" :
                isFlagged ? "border-amber-300 bg-amber-50 text-amber-700" :
                answered ? "border-green-300 bg-green-50 text-green-700" :
                "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              return (
                <button
                  key={idx}
                  title={`Câu ${idx + 1}${isFlagged ? ' • Đánh dấu' : ''}${answered ? ' • Đã trả lời' : ' • Chưa trả lời'}`}
                  className={`${base} ${cls}`}
                  onClick={() => setCurrentQuestion(idx)}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="border-0 bg-slate-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {stripOptionLabel(option, index)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Câu trước
          </Button>
          <Button 
            variant="outline"
            onClick={() => toggleFlag(currentQuestion)}
            className={flagged[currentQuestion] ? "border-amber-300 bg-amber-50 text-amber-700" : ""}
          >
            <Flag className="h-4 w-4 mr-2" />
            {flagged[currentQuestion] ? 'Bỏ đánh dấu' : 'Đánh dấu'}
          </Button>
        </div>
        <div className="flex gap-2">
          {currentQuestion === (quiz.questions?.length || 0) - 1 ? (
            <Button onClick={handleRequestSubmit} className="btn-primary">
              <CheckCircle className="h-4 w-4 mr-2" />
              Nộp bài
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="btn-primary">
              Câu tiếp
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Confirm dialogs */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đóng và tiếp tục sau?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiến trình làm bài sẽ được lưu tự động. Bạn có thể quay lại làm tiếp bất cứ lúc nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Đồng ý</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn còn {selectedAnswers.filter(a => a === -1).length} câu chưa trả lời. Bạn có chắc muốn nộp bài không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitQuiz}>Nộp bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
