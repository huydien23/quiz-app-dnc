"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminService } from "@/lib/admin-service"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz } from "@/lib/types"
import { Search, Plus, Edit, Trash2, ArrowLeft, BookOpen, Users, Clock, Eye, EyeOff } from "lucide-react"

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadQuizzes()
  }, [])

  useEffect(() => {
    const filtered = quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredQuizzes(filtered)
  }, [searchTerm, quizzes])

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await AdminService.getAllQuizzes()
      setQuizzes(allQuizzes)
      setFilteredQuizzes(allQuizzes)
    } catch (error) {
      console.error("Error loading quizzes:", error)
      setError("Có lỗi xảy ra khi tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const quiz = quizzes.find((q) => q.id === quizId)
      if (quiz) {
        await QuizService.updateQuiz(quizId, { ...quiz, isActive: !currentStatus })
        await loadQuizzes()
      }
    } catch (error) {
      console.error("Error updating quiz status:", error)
      setError("Có lỗi xảy ra khi cập nhật trạng thái bài thi")
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài thi này?")) {
      try {
        await QuizService.deleteQuiz(quizId)
        await loadQuizzes()
      } catch (error) {
        console.error("Error deleting quiz:", error)
        setError("Có lỗi xảy ra khi xóa bài thi")
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
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
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý bài thi</h1>
              <p className="text-muted-foreground">Tạo, chỉnh sửa và quản lý các bài thi</p>
            </div>
            <Link href="/admin/quiz/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo bài thi mới
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quizzes List */}
        {filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "Không tìm thấy bài thi" : "Chưa có bài thi nào"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Tạo bài thi đầu tiên để bắt đầu"}
              </p>
              {!searchTerm && (
                <Link href="/admin/quiz/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài thi mới
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <Badge variant={quiz.isActive ? "default" : "secondary"}>
                          {quiz.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                      <CardDescription>{quiz.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={quiz.isActive}
                        onCheckedChange={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                      />
                      {quiz.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {quiz.questions.length} câu hỏi
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {quiz.timeLimit} phút
                      </div>
                      <div>Tạo: {new Date(quiz.createdAt).toLocaleDateString("vi-VN")}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link href={`/quiz/${quiz.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteQuiz(quiz.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
