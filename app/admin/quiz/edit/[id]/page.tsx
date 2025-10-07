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
import type { Quiz } from "@/lib/types"
import { ArrowLeft, Save } from "lucide-react"

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
      })
      router.push("/admin/quizzes")
    } catch {
      setError("Không thể lưu thay đổi")
    } finally {
      setSaving(false)
    }
  }

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
      <div className="space-y-6 max-w-4xl">
        <div className="mb-6">
          <Link href="/admin/quizzes">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Chỉnh sửa bài thi</h1>
              <p className="text-muted-foreground">Cập nhật thông tin cơ bản của bài thi</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Cập nhật tiêu đề, mô tả, thời gian và số câu hỏi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" rows={3} value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeLimit">Thời gian (phút)</Label>
                <Input id="timeLimit" type="number" value={quiz.timeLimit} onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })} className="mt-1" min={1} max={300} />
              </div>
              <div>
                <Label htmlFor="questionCount">Số câu hỏi mỗi lần thi (random)</Label>
                <Input id="questionCount" type="number" value={quiz.questionCount ?? 40} onChange={(e) => setQuiz({ ...quiz, questionCount: parseInt(e.target.value) })} className="mt-1" min={1} />
                <p className="text-xs text-muted-foreground mt-1">Mỗi lần làm, hệ thống sẽ lấy ngẫu nhiên số câu này từ tổng số {quiz.questions?.length || 0} câu.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch id="isActive" checked={quiz.isActive} onCheckedChange={(checked) => setQuiz({ ...quiz, isActive: checked })} />
              <Label htmlFor="isActive">Kích hoạt bài thi</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
