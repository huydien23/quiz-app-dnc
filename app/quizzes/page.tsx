"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz } from "@/lib/types"
import { Clock, BookOpen, Users, Play } from "lucide-react"

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const activeQuizzes = await QuizService.getActiveQuizzes()
        setQuizzes(activeQuizzes)
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    loadQuizzes()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải danh sách bài thi...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Danh sách bài thi</h1>
          <p className="text-muted-foreground">Chọn bài thi để bắt đầu luyện tập</p>
        </div>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài thi nào</h3>
              <p className="text-muted-foreground text-center">
                Hiện tại chưa có bài thi nào được tạo. Vui lòng quay lại sau.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 text-balance">{quiz.title}</CardTitle>
                      <CardDescription className="text-pretty">{quiz.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {quiz.questions?.length || 0} câu
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {quiz.timeLimit} phút
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Trắc nghiệm
                    </div>
                  </div>

                  <Link href={`/quiz/${quiz.id}`}>
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Bắt đầu làm bài
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
