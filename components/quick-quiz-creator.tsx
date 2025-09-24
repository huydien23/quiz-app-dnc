"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Clock,
  HelpCircle
} from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuickQuizData {
  title: string
  description: string
  timeLimit: number
  questions: Question[]
}

export function QuickQuizCreator() {
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [quizData, setQuizData] = useState<QuickQuizData>({
    title: "",
    description: "",
    timeLimit: 30,
    questions: []
  })
  
  const [rawText, setRawText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Parse text input to questions
  const parseTextToQuestions = (text: string): Question[] => {
    const lines = text.split('\n').filter(line => line.trim())
    const questions: Question[] = []
    let currentQuestion: Partial<Question> = { options: [] }
    let questionId = 1

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines
      if (!trimmedLine) continue
      
      // Question line (starts with number or Q)
      if (/^\d+[\.\)]\s/.test(trimmedLine) || /^Q\d*[\.\)]\s/.test(trimmedLine)) {
        // Save previous question if exists
        if (currentQuestion.question && currentQuestion.options && currentQuestion.options.length > 0) {
          questions.push({
            id: questionId.toString(),
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer || 0
          })
          questionId++
        }
        
        // Start new question
        currentQuestion = {
          question: trimmedLine.replace(/^\d+[\.\)]\s/, '').replace(/^Q\d*[\.\)]\s/, ''),
          options: [],
          correctAnswer: 0
        }
      }
      // Option line (starts with letter or number)
      else if (/^[A-D][\.\)]\s/.test(trimmedLine) || /^\d+[\.\)]\s/.test(trimmedLine)) {
        const optionText = trimmedLine.replace(/^[A-D][\.\)]\s/, '').replace(/^\d+[\.\)]\s/, '')
        currentQuestion.options?.push(optionText)
      }
      // Answer line (contains "Đáp án" or "Answer")
      else if (trimmedLine.toLowerCase().includes('đáp án') || trimmedLine.toLowerCase().includes('answer')) {
        const answerMatch = trimmedLine.match(/([A-D]|\d+)/i)
        if (answerMatch) {
          const answer = answerMatch[1].toUpperCase()
          currentQuestion.correctAnswer = answer === 'A' ? 0 : answer === 'B' ? 1 : answer === 'C' ? 2 : answer === 'D' ? 3 : parseInt(answer) - 1
        }
      }
    }

    // Add last question
    if (currentQuestion.question && currentQuestion.options && currentQuestion.options.length > 0) {
      questions.push({
        id: questionId.toString(),
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer || 0
      })
    }

    return questions
  }

  const handleParseText = () => {
    if (!rawText.trim()) {
      error("Vui lòng nhập nội dung bài thi")
      return
    }

    setIsProcessing(true)
    try {
      const questions = parseTextToQuestions(rawText)
      
      if (questions.length === 0) {
        error("Không thể phân tích được câu hỏi nào. Vui lòng kiểm tra định dạng.")
        return
      }

      setQuizData(prev => ({
        ...prev,
        questions
      }))
      
      success(`Đã phân tích được ${questions.length} câu hỏi!`)
    } catch (err) {
      error("Lỗi khi phân tích nội dung. Vui lòng thử lại.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!quizData.title.trim()) {
      error("Vui lòng nhập tiêu đề bài thi")
      return
    }

    if (quizData.questions.length === 0) {
      error("Vui lòng thêm ít nhất 1 câu hỏi")
      return
    }

    try {
      const quiz = {
        title: quizData.title,
        description: quizData.description,
        timeLimit: quizData.timeLimit,
        questions: quizData.questions.map(q => ({
          id: q.id || `${Date.now()}-${Math.random()}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        })),
        isActive: true,
        createdBy: user?.id || "",
        createdAt: new Date().toISOString()
      }

      await QuizService.createQuiz(quiz)
      success("Tạo bài thi thành công!")
      
      // Reset form
      setQuizData({
        title: "",
        description: "",
        timeLimit: 30,
        questions: []
      })
      setRawText("")
    } catch (err) {
      error("Lỗi khi tạo bài thi. Vui lòng thử lại.")
    }
  }

  const sampleText = `1. Python là gì?
A. Một ngôn ngữ lập trình
B. Một hệ điều hành
C. Một database
D. Một framework
Đáp án: A

2. Cú pháp nào đúng để in "Hello World" trong Python?
A. print("Hello World")
B. echo "Hello World"
C. console.log("Hello World")
D. System.out.println("Hello World")
Đáp án: A

3. Biến nào sau đây là hợp lệ trong Python?
A. 123variable
B. _variable
C. variable-name
D. variable name
Đáp án: B`

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Tạo bài thi nhanh
          </CardTitle>
          <CardDescription>
            Copy-paste nội dung bài thi và để hệ thống tự động phân tích
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Tiêu đề bài thi *</Label>
              <Input
                id="title"
                value={quizData.title}
                onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề bài thi..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timeLimit">Thời gian (phút)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={quizData.timeLimit}
                onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={quizData.description}
              onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn về bài thi..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Text Input */}
          <div>
            <Label htmlFor="rawText">Nội dung bài thi</Label>
            <Textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Copy-paste nội dung bài thi ở đây..."
              className="mt-1"
              rows={8}
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                onClick={handleParseText}
                disabled={isProcessing || !rawText.trim()}
                size="sm"
                className="btn-primary"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Phân tích câu hỏi
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRawText(sampleText)}
                className="btn-secondary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Dùng mẫu
              </Button>
            </div>
          </div>

          {/* Format Guide */}
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Định dạng hỗ trợ:</strong><br />
              • Câu hỏi: Bắt đầu bằng số (1., 2., ...) hoặc Q1., Q2., ...<br />
              • Đáp án: Bắt đầu bằng A., B., C., D. hoặc 1., 2., 3., 4.<br />
              • Đáp án đúng: Dòng chứa "Đáp án: A" hoặc "Answer: A"
            </AlertDescription>
          </Alert>

          {/* Questions Preview */}
          {quizData.questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Câu hỏi đã phân tích ({quizData.questions.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? "Ẩn chi tiết" : "Xem chi tiết"}
                  </Button>
                </div>
              </div>

              {previewMode && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {quizData.questions.map((q, index) => (
                    <Card key={q.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <p className="font-medium">{q.question}</p>
                          </div>
                          
                          <div className="space-y-2">
                            {q.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  optIndex === q.correctAnswer 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-slate-50'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  optIndex === q.correctAnswer 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className={optIndex === q.correctAnswer ? 'text-green-700 font-medium' : 'text-slate-700'}>
                                  {option}
                                </span>
                                {optIndex === q.correctAnswer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setQuizData({
                  title: "",
                  description: "",
                  timeLimit: 30,
                  questions: []
                })
                setRawText("")
              }}
              className="btn-secondary"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa tất cả
            </Button>
            
            <Button
              onClick={handleSaveQuiz}
              disabled={!quizData.title.trim() || quizData.questions.length === 0}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              Tạo bài thi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
