"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz } from "@/lib/types"
import { Trophy, CheckCircle, XCircle, RotateCcw, Home } from "lucide-react"

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const quizId = params.id as string

  const score = Number.parseInt(searchParams.get("score") || "0")
  const total = Number.parseInt(searchParams.get("total") || "0")
  const percentage = Math.round((score / total) * 100)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await QuizService.getQuizById(quizId)
        setQuiz(quizData)
      } catch (error) {
        console.error("Error loading quiz:", error)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId])

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

  if (loading) {
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

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Kết quả bài thi</h1>
          <p className="text-muted-foreground">{quiz?.title}</p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className={`text-4xl font-bold ${getResultColor()}`}>
              {score}/{total}
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
                <span className="text-2xl font-bold text-green-600">{score}</span>
                <span className="text-sm text-muted-foreground">Đúng</span>
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-2xl font-bold text-red-600">{total - score}</span>
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

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/quiz/${quizId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm lại
            </Button>
          </Link>
          <Link href="/quizzes" className="flex-1">
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
    </ProtectedRoute>
  )
}
