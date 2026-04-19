"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz, Question } from "@/lib/types"
import { ArrowLeft, Save, Eye, Upload, ListTodo, Edit, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuizPreview } from "@/components/quiz-preview"
import { EnhancedQuizFileUploader } from "@/components/enhanced-quiz-file-uploader"
import { QuizTemplateDownloader } from "@/components/quiz-template-downloader"
import { Badge } from "@/components/ui/badge"

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        console.log("Loading quiz with ID:", quizId)
        const q = await QuizService.getQuizById(quizId)
        console.log("Loaded quiz:", q)
        if (!q) {
          setError("Không tìm thấy bài thi")
          return
        }
        setQuiz(q)
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Không thể tải bài thi: " + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const handleSave = async () => {
    if (!quiz) return

    if (!quiz.title || !quiz.description) {
      setError("Vui lòng điền đầy đủ thông tin bài thi")
      return
    }

    // If activating, ensure no incomplete questions
    if (quiz.isActive && quiz.questions?.some(q => q.correctAnswer === -1)) {
      setError("Bài thi có câu hỏi chưa có đáp án đúng. Vui lòng tắt kích hoạt hoặc bổ sung đáp án.")
      return
    }

    try {
      setSaving(true)
      setError("")
      await QuizService.updateQuiz(quiz.id, {
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        isActive: quiz.isActive,
        questionCount: quiz.questionCount,
        questions: quiz.questions,
      })
      router.push("/admin/quizzes")
    } catch {
      setError("Không thể lưu thay đổi")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveQuestion = (index: number) => {
    if (!quiz) return
    const updatedQuestions = [...quiz.questions]
    updatedQuestions.splice(index, 1)
    setQuiz({ ...quiz, questions: updatedQuestions })
  }

  const handleQuestionsImported = (newQuestions: Question[]) => {
    if (!quiz) return
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, ...newQuestions]
    })
  }

  const [activeTab, setActiveTab] = useState("basic")

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!quiz) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="p-6">
          <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy bài thi"}</AlertDescription></Alert>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6 max-w-5xl">
        <div className="mb-0">
          <Link href="/admin/quizzes">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-full px-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Edit className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">CHỈNH SỬA BÀI THI</h1>
                <p className="text-sm font-medium text-slate-500">Cập nhật thông tin và quản lý bộ câu hỏi</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-8 shadow-indigo-200 shadow-lg rounded-xl border-none transition-all hover:scale-[1.02] active:scale-95"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50 text-red-800">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100/50 p-1 rounded-xl border border-slate-200 h-12">
            <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-wider px-6 h-full transition-all">
              Thông tin cơ bản
            </TabsTrigger>
            <TabsTrigger value="questions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-wider px-6 h-full transition-all flex items-center gap-2">
              Bộ câu hỏi <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 h-5 px-1.5">{quiz.questions?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-wider px-6 h-full transition-all">
              Tải thêm câu hỏi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-6">
                <CardTitle className="text-lg font-bold text-slate-800">Thông tin chi tiết</CardTitle>
                <CardDescription className="text-slate-500">Cài đặt các thông số vận hành của bài thi</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Tiêu đề bài thi</Label>
                  <Input
                    id="title"
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    className="h-11 border-slate-200 focus:border-indigo-500 transition-all rounded-xl"
                    placeholder="VD: Kiểm tra Python nâng cao"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả bài thi</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={quiz.description}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                    className="border-slate-200 focus:border-indigo-500 transition-all rounded-xl placeholder:text-slate-400"
                    placeholder="Nhập phần giới thiệu ngắn gọn cho bài thi này..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit" className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời lượng (Phút)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={quiz.timeLimit}
                      onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
                      className="h-11 border-slate-200 focus:border-indigo-500 transition-all rounded-xl"
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="questionCount" className="text-xs font-bold uppercase tracking-wider text-slate-500">Số câu xuất hiện (Random)</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      value={quiz.questionCount ?? 40}
                      onChange={(e) => setQuiz({ ...quiz, questionCount: parseInt(e.target.value) })}
                      className="h-11 border-slate-200 focus:border-indigo-500 transition-all rounded-xl"
                      min={1}
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Lưu ý: Hệ thống sẽ bốc ngẫu nhiên số câu này từ tổng số {quiz.questions?.length || 0} câu hiện có.</p>
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <Label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-slate-800">Trạng thái phát hành</Label>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">Cho phép học viên bắt đầu thực hiện bài thi này</span>
                  </div>
                  <Switch
                    id="isActive"
                    checked={quiz.isActive}
                    onCheckedChange={(checked) => setQuiz({ ...quiz, isActive: checked })}
                    className="data-[state=active]:bg-indigo-600"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <QuizPreview
              questions={quiz.questions || []}
              onRemoveQuestion={handleRemoveQuestion}
            />
          </TabsContent>

          <TabsContent value="upload">
            <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-6">
                <CardTitle className="text-lg font-bold text-slate-800">Tải lên bộ câu hỏi mới</CardTitle>
                <CardDescription className="text-slate-500">Thêm hàng loạt câu hỏi từ file Excel hoặc CSV</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Download className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900">Tải Template Chuẩn</h4>
                      <p className="text-[11px] text-indigo-700 font-medium">Sử dụng đúng định dạng để hệ thống nhận diện câu hỏi chính xác nhất</p>
                    </div>
                  </div>
                  <QuizTemplateDownloader />
                </div>
                <EnhancedQuizFileUploader onQuestionsImported={handleQuestionsImported} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
