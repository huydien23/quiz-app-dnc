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
        quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredQuizzes(filtered)
  }, [quizzes, searchTerm])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      const allQuizzes = await QuizService.getAllQuizzes()
      setQuizzes(allQuizzes)
      setFilteredQuizzes(allQuizzes)
    } catch (err) {
      setError("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (quizId: string, isActive: boolean) => {
    try {
      await QuizService.updateQuiz(quizId, { isActive })
      setQuizzes(prev =>
        prev.map(quiz =>
          quiz.id === quizId ? { ...quiz, isActive } : quiz
        )
      )
    } catch (err) {
      setError("Không thể cập nhật trạng thái bài thi")
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài thi này?")) return

    try {
      await QuizService.deleteQuiz(quizId)
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
    } catch (err) {
      setError("Không thể xóa bài thi")
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
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
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài thi nào</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Không tìm thấy bài thi phù hợp" : "Hãy tạo bài thi đầu tiên của bạn"}
              </p>
              <Link href="/admin/quiz/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo bài thi mới
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {quiz.description || "Không có mô tả"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={quiz.isActive}
                        onCheckedChange={(checked) => handleToggleActive(quiz.id, checked)}
                      />
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>
                        {quiz.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{quiz.questions.length} câu</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.timeLimit} phút</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex gap-2">
                        <Link href={`/quiz/${quiz.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/quiz/edit/${quiz.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tạo {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                      </div>
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
