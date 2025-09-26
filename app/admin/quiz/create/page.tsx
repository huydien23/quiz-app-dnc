"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { EnhancedQuizFileUploader } from "@/components/enhanced-quiz-file-uploader"
import { QuizTemplateDownloader } from "@/components/quiz-template-downloader"
import { QuizPreview } from "@/components/quiz-preview"
import { QuickQuizCreator } from "@/components/quick-quiz-creator"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Save, Eye, Upload, Download } from "lucide-react"
import Link from "next/link"
import type { Quiz, Question } from "@/lib/types"

export default function CreateQuizPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewMode, setPreviewMode] = useState(false)
  
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: "",
    description: "",
    timeLimit: 60,
    isActive: true,
    questionCount: 40,
    questions: []
  })

  const handleSave = async () => {
    if (!quiz.title || !quiz.description) {
      setError("Vui lòng điền đầy đủ thông tin bài thi")
      return
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      setError("Vui lòng thêm ít nhất một câu hỏi")
      return
    }

    // Check for incomplete questions
    const incompleteQuestions = quiz.questions.filter(q => q.correctAnswer === -1)
    if (incompleteQuestions.length > 0 && quiz.isActive) {
      setError(`Bài thi có ${incompleteQuestions.length} câu hỏi chưa có đáp án đúng. Vui lòng boả tích "Kích hoạt bài thi" để lưu nháp hoặc hoàn thành các câu hỏi.`)
      return
    }

    try {
      setLoading(true)
      setError("")
      
      const newQuiz = await QuizService.createQuiz({
        title: quiz.title!,
        description: quiz.description!,
        timeLimit: quiz.timeLimit!,
        isActive: quiz.isActive!,
        questionCount: quiz.questionCount,
        questions: quiz.questions!,
        createdBy: user?.id || 'unknown',
        createdAt: new Date().toISOString()
      })

      router.push("/admin/quizzes")
    } catch (err) {
      setError("Không thể tạo bài thi. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionsUpdate = (questions: Question[]) => {
    setQuiz(prev => ({ ...prev, questions }))
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6 max-w-6xl">
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Tạo bài thi mới</h1>
              <p className="text-muted-foreground">Thiết kế và tạo bài thi trắc nghiệm</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Chỉnh sửa" : "Xem trước"}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Đang lưu..." : "Lưu bài thi"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewMode ? (
          <QuizPreview 
            questions={quiz.questions || []}
            onRemoveQuestion={(index) => {
              const updatedQuestions = [...(quiz.questions || [])]
              updatedQuestions.splice(index, 1)
              setQuiz(prev => ({ ...prev, questions: updatedQuestions }))
            }}
          />
        ) : (
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="questions">Câu hỏi</TabsTrigger>
              <TabsTrigger value="quick">Tạo nhanh</TabsTrigger>
              <TabsTrigger value="upload">Tải lên file</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin bài thi</CardTitle>
                  <CardDescription>
                    Điền thông tin cơ bản về bài thi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề bài thi *</Label>
                    <Input
                      id="title"
                      value={quiz.title || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề bài thi..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={quiz.description || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả về bài thi..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeLimit">Thời gian (phút)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={quiz.timeLimit || 60}
                        onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                        className="mt-1"
                        min="1"
                        max="300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="questionCount">Số câu hỏi mỗi lần thi (random)</Label>
                      <Input
                        id="questionCount"
                        type="number"
                        value={quiz.questionCount || 40}
                        onChange={(e) => setQuiz(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                        className="mt-1"
                        min="1"
                        placeholder="VD: 20 hoặc 40"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Hệ thống sẽ ngẫu nhiên chọn số câu này từ toàn bộ bộ đề mỗi lần làm.</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={quiz.isActive || false}
                        onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Kích hoạt bài thi</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Câu hỏi</CardTitle>
                  <CardDescription>
                    Thêm và quản lý các câu hỏi cho bài thi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Tính năng chỉnh sửa câu hỏi đang được phát triển
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hãy sử dụng tính năng tải lên file để thêm câu hỏi
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick" className="space-y-6">
              <QuickQuizCreator />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tải lên file câu hỏi</CardTitle>
                  <CardDescription>
                    Tải lên file Excel hoặc CSV chứa câu hỏi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Tải template mẫu</h3>
                      <p className="text-sm text-muted-foreground">
                        Tải file template để biết cách định dạng câu hỏi
                      </p>
                    </div>
                    <QuizTemplateDownloader />
                  </div>
                  
                  <EnhancedQuizFileUploader onQuestionsImported={handleQuestionsUpdate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  )
}
