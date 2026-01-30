"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { EnhancedQuizFileUploader } from "@/components/enhanced-quiz-file-uploader"
import { QuizPreview } from "@/components/quiz-preview"
import { QuestionEditor } from "@/components/question-editor"
import { QuizService } from "@/lib/quiz-service"
import { CategoryService } from "@/lib/services/category-service"
import { useAuth } from "@/hooks/use-auth"
import {
  ArrowLeft, Save, Eye, Upload, FileText, List,
  BookOpen, Clock, Hash, AlertCircle, CheckCircle,
  FolderOpen, BarChart3, Plus, FilePlus2
} from "lucide-react"
import Link from "next/link"
import type { Quiz, Question, Category } from "@/lib/types"

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Dễ", color: "bg-emerald-100 text-emerald-700" },
  { value: "medium", label: "Trung bình", color: "bg-amber-100 text-amber-700" },
  { value: "hard", label: "Khó", color: "bg-red-100 text-red-700" },
]

export default function CreateQuizPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewMode, setPreviewMode] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [questionInputMode, setQuestionInputMode] = useState<"manual" | "upload">("manual")

  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: "",
    description: "",
    timeLimit: 60,
    isActive: true,
    questionCount: 40,
    questions: [],
    categoryId: "",
    difficulty: "medium",
    tags: []
  })

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await CategoryService.getActiveCategories()
      setCategories(cats)
    }
    loadCategories()
  }, [])

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
      setError(`Bài thi có ${incompleteQuestions.length} câu hỏi chưa có đáp án đúng. Vui lòng bỏ tích "Kích hoạt bài thi" để lưu nháp hoặc hoàn thành các câu hỏi.`)
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
        categoryId: quiz.categoryId || undefined,
        difficulty: quiz.difficulty,
        tags: quiz.tags,
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

  const questionsCount = quiz.questions?.length || 0
  const incompleteCount = quiz.questions?.filter(q => q.correctAnswer === -1).length || 0

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/quizzes">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Ngân hàng đề
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Tạo bài thi mới</h1>
              <p className="text-sm text-slate-500">Thiết kế và tạo bài thi trắc nghiệm chi tiết</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/quiz/quick">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <FilePlus2 className="h-4 w-4 mr-2" />
                  Tạo nhanh
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-slate-200"
                disabled={questionsCount === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Chỉnh sửa" : "Xem trước"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Đang lưu..." : "Lưu bài thi"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
          <div className="space-y-6">
            {/* Section 1: Basic Info */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Thông tin bài thi
                </CardTitle>
                <CardDescription>
                  Điền thông tin cơ bản về bài thi
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Title & Description */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Tiêu đề bài thi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={quiz.title || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="VD: Ôn tập Python cơ bản..."
                      className="h-11 border-slate-200 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Mô tả <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="description"
                      value={quiz.description || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả ngắn gọn về nội dung bài thi..."
                      className="h-11 border-slate-200 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Category, Difficulty, Time, Question Count */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
                      Danh mục
                    </Label>
                    <Select
                      value={quiz.categoryId || "none"}
                      onValueChange={(value) => setQuiz(prev => ({ ...prev, categoryId: value === "none" ? "" : value }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                      Độ khó
                    </Label>
                    <Select
                      value={quiz.difficulty || "medium"}
                      onValueChange={(value) => setQuiz(prev => ({ ...prev, difficulty: value as Quiz['difficulty'] }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${opt.color}`}>
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimit" className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Thời gian (phút)
                    </Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={quiz.timeLimit || 60}
                      onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                      className="h-10 border-slate-200"
                      min="1"
                      max="300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionCount" className="text-sm font-semibold flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      Số câu/lần thi
                    </Label>
                    <Input
                      id="questionCount"
                      type="number"
                      value={quiz.questionCount || 40}
                      onChange={(e) => setQuiz(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 40 }))}
                      className="h-10 border-slate-200"
                      min="1"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${quiz.isActive ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                      {quiz.isActive ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="isActive" className="font-semibold cursor-pointer">
                        Kích hoạt bài thi
                      </Label>
                      <p className="text-xs text-slate-500">
                        {quiz.isActive ? "Học sinh có thể làm bài" : "Lưu nháp, chưa công khai"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="isActive"
                    checked={quiz.isActive || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Questions */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <List className="h-5 w-5 text-indigo-600" />
                      Câu hỏi
                      {questionsCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                          {questionsCount} câu
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Thêm câu hỏi bằng cách nhập thủ công hoặc tải file
                    </CardDescription>
                  </div>

                  {/* Toggle between Manual and Upload */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <Button
                      variant={questionInputMode === "manual" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setQuestionInputMode("manual")}
                      className={questionInputMode === "manual" ? "bg-white shadow-sm" : "hover:bg-slate-200"}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Thủ công
                    </Button>
                    <Button
                      variant={questionInputMode === "upload" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setQuestionInputMode("upload")}
                      className={questionInputMode === "upload" ? "bg-white shadow-sm" : "hover:bg-slate-200"}
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Tải file
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {questionInputMode === "manual" ? (
                  <QuestionEditor
                    questions={quiz.questions || []}
                    onQuestionsChange={handleQuestionsUpdate}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Unified Upload Area */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                      <EnhancedQuizFileUploader onQuestionsImported={handleQuestionsUpdate} />
                    </div>

                    {/* Show existing questions */}
                    {quiz.questions && quiz.questions.length > 0 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-800">
                                Đã có {quiz.questions.length} câu hỏi
                              </h3>
                              <p className="text-sm text-emerald-600">
                                File đã được xử lý thành công
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuestionInputMode("manual")}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          >
                            Xem & Chỉnh sửa
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
