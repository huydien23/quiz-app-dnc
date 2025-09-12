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
import { QuizFileUploader } from "@/components/quiz-file-uploader"
import { QuizTemplateDownloader } from "@/components/quiz-template-downloader"
import { QuizPreview } from "@/components/quiz-preview"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, Question } from "@/lib/types"
import { Plus, Trash2, ArrowLeft, Save, Upload, Edit } from "lucide-react"
import Link from "next/link"

export default function CreateQuizPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    isActive: true,
    questions: [
      {
        id: "1",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      },
    ] as Question[],
  })

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    }
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const handleQuestionsImported = (importedQuestions: Question[]) => {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions.filter(q => q.question.trim() !== ""), // Keep existing non-empty questions
        ...importedQuestions
      ],
    }))
  }

  const removeQuestionFromPreview = (index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const removeQuestion = (index: number) => {
    if (quiz.questions.length > 1) {
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }))
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, options: q.options.map((opt, j) => (j === optionIndex ? value : opt)) } : q,
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!quiz.title.trim()) {
      setError("Vui lòng nhập tiêu đề bài thi")
      return
    }

    if (!quiz.description.trim()) {
      setError("Vui lòng nhập mô tả bài thi")
      return
    }

    if (quiz.timeLimit < 1) {
      setError("Thời gian làm bài phải lớn hơn 0")
      return
    }

    // Validate questions
    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      if (!question.question.trim()) {
        setError(`Câu hỏi ${i + 1} không được để trống`)
        return
      }

      const filledOptions = question.options.filter((opt) => opt.trim())
      if (filledOptions.length < 2) {
        setError(`Câu hỏi ${i + 1} phải có ít nhất 2 lựa chọn`)
        return
      }

      if (!question.options[question.correctAnswer]?.trim()) {
        setError(`Câu hỏi ${i + 1} phải có đáp án đúng hợp lệ`)
        return
      }
    }

    setLoading(true)

    try {
      const newQuiz: Omit<Quiz, "id"> = {
        title: quiz.title.trim(),
        description: quiz.description.trim(),
        timeLimit: quiz.timeLimit,
        isActive: quiz.isActive,
        questions: quiz.questions.map((q, index) => ({
          ...q,
          id: (index + 1).toString(),
          question: q.question.trim(),
          options: q.options.map((opt) => opt.trim()).filter((opt) => opt),
          explanation: q.explanation?.trim() || "",
        })),
        createdBy: user!.id,
        createdAt: new Date().toISOString(),
      }

      await QuizService.createQuiz(newQuiz)
      router.push("/admin/quizzes")
    } catch (error) {
      setError("Có lỗi xảy ra khi tạo bài thi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tạo bài thi mới</h1>
          <p className="text-muted-foreground">Tạo bài thi trắc nghiệm cho học sinh</p>
        </div>

        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Tạo thủ công
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import từ file
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuizTemplateDownloader />
              <Card>
                <CardHeader>
                  <CardTitle>Hướng dẫn nhanh</CardTitle>
                  <CardDescription>Tips để import thành công</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <h4 className="font-medium mb-2">📝 Format JSON:</h4>
                    <p className="text-muted-foreground">Hỗ trợ cả array trực tiếp và object có property 'questions'</p>
                  </div>
                  <div className="text-sm">
                    <h4 className="font-medium mb-2">🔄 Auto convert:</h4>
                    <p className="text-muted-foreground">Tự động chuyển 'correct' thành 'correctAnswer'</p>
                  </div>
                  <div className="text-sm">
                    <h4 className="font-medium mb-2">👀 Preview & Edit:</h4>
                    <p className="text-muted-foreground">Xem trước và chỉnh sửa trước khi xuất bản</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Enhanced File Uploader - replaces old QuizFileUploader */}
            <div className="mt-6">
              <div className="space-y-6">
                <QuizFileUploader onQuestionsImported={handleQuestionsImported} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">{error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                  <CardDescription>Nhập thông tin chung về bài thi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề bài thi</Label>
                    <Input
                      id="title"
                      value={quiz.title}
                      onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ví dụ: Kiểm tra Toán học lớp 10"
                      required
                    />
                  </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={quiz.description}
                  onChange={(e) => setQuiz((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về nội dung bài thi"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeLimit">Thời gian (phút)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    value={quiz.timeLimit}
                    onChange={(e) => setQuiz((prev) => ({ ...prev, timeLimit: Number.parseInt(e.target.value) || 30 }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={quiz.isActive}
                    onCheckedChange={(checked) => setQuiz((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Kích hoạt bài thi</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Câu hỏi ({quiz.questions.length})</CardTitle>
              <CardDescription>Thêm các câu hỏi trắc nghiệm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.questions.map((question, questionIndex) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Câu {questionIndex + 1}</h4>
                    {quiz.questions.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeQuestion(questionIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Câu hỏi</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                      placeholder="Nhập câu hỏi..."
                    />
                  </div>

                  <div>
                    <Label>Các lựa chọn</Label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() => updateQuestion(questionIndex, "correctAnswer", optionIndex)}
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            placeholder={`Lựa chọn ${optionIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Chọn radio button để đánh dấu đáp án đúng</p>
                  </div>

                  <div>
                    <Label>Giải thích (tùy chọn)</Label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)}
                      placeholder="Giải thích đáp án đúng..."
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addQuestion} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Đang tạo..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Tạo bài thi
                </>
              )}
            </Button>
          </div>
        </form>
          </TabsContent>
        </Tabs>

        {/* Summary of imported questions */}
        {quiz.questions.filter(q => q.question.trim() !== "").length > 0 && (
          <QuizPreview 
            questions={quiz.questions} 
            onRemoveQuestion={removeQuestionFromPreview}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
