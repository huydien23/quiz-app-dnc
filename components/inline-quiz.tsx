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

  useEffect(() => {
    setSelectedAnswers(new Array(quiz.questions?.length || 0).fill(-1))
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

  const handleStartQuiz = () => {
    setIsActive(true)
    setStartTime(Date.now())
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

  const handleSubmitQuiz = () => {
    setIsActive(false)
    setIsCompleted(true)
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0)
    }, 0)
    const score = Math.round((correctAnswers / (quiz.questions?.length || 1)) * 100)
    
    onComplete(score, timeSpent)
  }

  const currentQ = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / (quiz.questions?.length || 1)) * 100
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
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

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
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
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
                {option}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Câu trước
        </Button>
        <div className="flex gap-2">
          {currentQuestion === (quiz.questions?.length || 0) - 1 ? (
            <Button onClick={handleSubmitQuiz} className="btn-primary">
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
    </div>
  )
}
