"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Upload, FileText, File, FileSpreadsheet, Loader2, CheckCircle, 
  Eye, Save, AlertTriangle, X, Download, Copy, Edit3,
  BarChart3, Clock, Users, Star, FileCheck
} from "lucide-react"
import type { Question, Quiz } from "@/lib/types"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { useRouter } from "next/navigation"

// Import the libraries dynamically to avoid SSR issues
let mammoth: any = null
let pdfjs: any = null
let XLSX: any = null

interface EnhancedQuizFileUploaderProps {
  onQuizCreated?: (quiz: Quiz) => void
}

interface ParsedQuizData {
  title?: string
  description?: string
  timeLimit?: number
  questions: Question[]
  metadata?: {
    source: string
    importedAt: string
    questionCount: number
    hasExplanations: number
    avgOptionsPerQuestion: number
  }
}

interface QuizMetadata {
  title: string
  description: string
  timeLimit: number
  subject: string
  grade: string
  isActive: boolean
}

export function EnhancedQuizFileUploader({ onQuizCreated }: EnhancedQuizFileUploaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { success, error: showError, warning, info } = useToast()
  
  // Upload states
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  
  // Data states
  const [parsedData, setParsedData] = useState<ParsedQuizData | null>(null)
  const [quizMetadata, setQuizMetadata] = useState<QuizMetadata>({
    title: "",
    description: "",
    timeLimit: 30,
    subject: "",
    grade: "",
    isActive: true
  })
  
  // UI states
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { 
      type: "JSON", 
      extension: ".json", 
      icon: File, 
      description: "Định dạng JSON chuẩn",
      color: "bg-blue-100 text-blue-800"
    },
    { 
      type: "Word", 
      extension: ".docx", 
      icon: FileText, 
      description: "Microsoft Word document",
      color: "bg-blue-100 text-blue-800"
    },
    { 
      type: "PDF", 
      extension: ".pdf", 
      icon: FileText, 
      description: "Portable Document Format",
      color: "bg-red-100 text-red-800"
    },
    { 
      type: "Excel", 
      extension: ".xlsx", 
      icon: FileSpreadsheet, 
      description: "Microsoft Excel spreadsheet",
      color: "bg-green-100 text-green-800"
    },
  ]

  const loadLibraries = async () => {
    try {
      if (!mammoth) {
        mammoth = await import('mammoth')
      }
      if (!pdfjs) {
        const pdfjsModule = await import('pdfjs-dist')
        pdfjs = pdfjsModule
        if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
        }
      }
      if (!XLSX) {
        XLSX = await import('xlsx')
      }
    } catch (error) {
      console.warn('Error loading libraries:', error)
      throw new Error('Không thể load thư viện cần thiết')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB")
      }

      setUploadProgress(10)

      const fileExtension = file.name.toLowerCase().split('.').pop()
      if (!fileExtension) {
        throw new Error("File không có phần mở rộng")
      }

      setUploadProgress(20)

      let parsedData: ParsedQuizData

      switch (fileExtension) {
        case 'json':
          parsedData = await parseJsonFile(file)
          break
        case 'docx':
          await loadLibraries()
          setUploadProgress(40)
          parsedData = await parseWordFile(file)
          break
        case 'pdf':
          await loadLibraries()
          setUploadProgress(40)
          parsedData = await parsePdfFile(file)
          break
        case 'xlsx':
        case 'xls':
          await loadLibraries()
          setUploadProgress(40)
          parsedData = await parseExcelFile(file)
          break
        default:
          throw new Error(`Định dạng file .${fileExtension} không được hỗ trợ. Chỉ hỗ trợ: .json, .docx, .pdf, .xlsx`)
      }

      setUploadProgress(80)

      if (!parsedData || !parsedData.questions || parsedData.questions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi nào trong file")
      }

      // Validate questions
      const validQuestions = parsedData.questions.filter(q => 
        q.question && q.options && q.options.length >= 2
      )

      if (validQuestions.length === 0) {
        throw new Error("Không có câu hỏi hợp lệ nào trong file")
      }

      // Add metadata
      parsedData.metadata = {
        source: file.name,
        importedAt: new Date().toISOString(),
        questionCount: validQuestions.length,
        hasExplanations: validQuestions.filter(q => q.explanation?.trim()).length,
        avgOptionsPerQuestion: validQuestions.reduce((sum, q) => sum + q.options.length, 0) / validQuestions.length
      }

      // Auto-fill metadata
      setQuizMetadata(prev => ({
        ...prev,
        title: parsedData.title || `Quiz từ ${file.name}`,
        description: parsedData.description || `Bài thi được import từ file ${file.name}`,
        timeLimit: parsedData.timeLimit || Math.max(30, validQuestions.length * 1) // 1 min per question minimum
      }))

      setUploadProgress(100)
      setParsedData(parsedData)
      
      // Show success toast
      success(`Đã phân tích thành công ${validQuestions.length} câu hỏi từ file ${file.name}`)
      
      // Auto-open preview after successful import
      setTimeout(() => {
        setShowPreviewModal(true)
      }, 500)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error('File upload error:', error)
      showError(error.message || "Có lỗi xảy ra khi xử lý file")
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  // File parsing functions (same as before but with progress updates)
  const parseJsonFile = async (file: File): Promise<ParsedQuizData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          if (!content) {
            throw new Error("File rỗng hoặc không đọc được")
          }

          const data = JSON.parse(content)
          
          let questionsArray: any[] = []
          
          if (Array.isArray(data)) {
            questionsArray = data
          } else if (data && typeof data === 'object' && Array.isArray(data.questions)) {
            questionsArray = data.questions
          } else {
            throw new Error("File JSON phải chứa mảng câu hỏi hoặc object với property 'questions'")
          }

          if (questionsArray.length === 0) {
            throw new Error("File JSON không chứa câu hỏi nào")
          }

          const questions: Question[] = questionsArray.map((q: any, index: number) => {
            if (!q || typeof q !== 'object') {
              throw new Error(`Câu hỏi ${index + 1} không hợp lệ`)
            }
            
            if (!q.question || typeof q.question !== 'string') {
              throw new Error(`Câu hỏi ${index + 1} thiếu 'question' hoặc không phải chuỗi`)
            }
            
            if (!q.options || !Array.isArray(q.options)) {
              throw new Error(`Câu hỏi ${index + 1} thiếu 'options' hoặc không phải mảng`)
            }

            if (q.options.length < 2) {
              throw new Error(`Câu hỏi ${index + 1} cần ít nhất 2 lựa chọn`)
            }
            
            let correctAnswer = 0
            if (typeof q.correctAnswer === 'number') {
              correctAnswer = q.correctAnswer
            } else if (typeof q.correct === 'number') {
              correctAnswer = q.correct
            }
            
            if (correctAnswer < 0 || correctAnswer >= q.options.length) {
              correctAnswer = 0
            }
            
            return {
              id: q.id ? String(q.id) : `${Date.now()}-${index}`,
              question: String(q.question).trim(),
              options: q.options.map((opt: any) => String(opt).trim()),
              correctAnswer,
              explanation: q.explanation ? String(q.explanation).trim() : "",
            }
          })

          resolve({
            title: Array.isArray(data) ? undefined : data.title,
            description: Array.isArray(data) ? undefined : data.description,
            timeLimit: Array.isArray(data) ? undefined : data.timeLimit,
            questions,
          })
        } catch (error: any) {
          reject(new Error(`Lỗi parse JSON: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error("Không thể đọc file"))
      reader.readAsText(file, 'utf-8')
    })
  }

  // Other parsing functions remain the same...
  const parseWordFile = async (file: File): Promise<ParsedQuizData> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value
        
        const questions = parseTextToQuestions(text)
        
        resolve({
          questions,
          title: "Quiz từ Word file",
          description: "Đã import từ file Word",
          timeLimit: 30,
        })
      } catch (error: any) {
        reject(new Error(`Lỗi parse Word file: ${error.message}`))
      }
    })
  }

  const parsePdfFile = async (file: File): Promise<ParsedQuizData> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
        
        let fullText = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(' ')
          fullText += pageText + "\n"
        }
        
        const questions = parseTextToQuestions(fullText)
        
        resolve({
          questions,
          title: "Quiz từ PDF file",
          description: "Đã import từ file PDF",
          timeLimit: 30,
        })
      } catch (error: any) {
        reject(new Error(`Lỗi parse PDF file: ${error.message}`))
      }
    })
  }

  const parseExcelFile = async (file: File): Promise<ParsedQuizData> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        const questions: Question[] = []
        
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[]
          if (row && row[0] && row[1] && row[2] && row[3] && row[4]) {
            const question = String(row[0]).trim()
            const options = [
              String(row[1] || "").trim(),
              String(row[2] || "").trim(),
              String(row[3] || "").trim(),
              String(row[4] || "").trim(),
            ]
            
            let correctAnswer = 0
            const correctAnswerLetter = String(row[5] || "A").trim().toUpperCase()
            switch (correctAnswerLetter) {
              case "A": correctAnswer = 0; break
              case "B": correctAnswer = 1; break
              case "C": correctAnswer = 2; break
              case "D": correctAnswer = 3; break
              default: correctAnswer = 0
            }
            
            const explanation = String(row[6] || "").trim()
            
            questions.push({
              id: Date.now().toString() + i,
              question,
              options,
              correctAnswer,
              explanation,
            })
          }
        }
        
        resolve({
          questions,
          title: "Quiz từ Excel file",
          description: "Đã import từ file Excel",
          timeLimit: 30,
        })
      } catch (error: any) {
        reject(new Error(`Lỗi parse Excel file: ${error.message}`))
      }
    })
  }

  const parseTextToQuestions = (text: string): Question[] => {
    const questions: Question[] = []
    const questionBlocks = text.split(/(?=Question:|Câu hỏi:)/i).filter(block => block.trim())
    
    questionBlocks.forEach((block, index) => {
      try {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line)
        
        if (lines.length < 6) return
        
        const questionLine = lines.find(line => 
          line.toLowerCase().startsWith('question:') || 
          line.toLowerCase().startsWith('câu hỏi:')
        )
        
        if (!questionLine) return
        
        const question = questionLine.replace(/^(question:|câu hỏi:)/i, '').trim()
        
        const options: string[] = []
        const optionRegex = /^[A-D]\)?\s*(.+)$/i
        
        lines.forEach(line => {
          const optionMatch = line.match(optionRegex)
          if (optionMatch && options.length < 4) {
            options.push(optionMatch[1].trim())
          }
        })
        
        if (options.length !== 4) return
        
        let correctAnswer = 0
        const answerLine = lines.find(line => 
          line.toLowerCase().startsWith('answer:') || 
          line.toLowerCase().startsWith('đáp án:')
        )
        
        if (answerLine) {
          const answerLetter = answerLine.replace(/^(answer:|đáp án:)/i, '').trim().toUpperCase()
          switch (answerLetter) {
            case "A": correctAnswer = 0; break
            case "B": correctAnswer = 1; break
            case "C": correctAnswer = 2; break
            case "D": correctAnswer = 3; break
          }
        }
        
        const explanationLine = lines.find(line => 
          line.toLowerCase().startsWith('explanation:') || 
          line.toLowerCase().startsWith('giải thích:')
        )
        
        const explanation = explanationLine ? 
          explanationLine.replace(/^(explanation:|giải thích:)/i, '').trim() : ""
        
        questions.push({
          id: Date.now().toString() + index,
          question,
          options,
          correctAnswer,
          explanation,
        })
      } catch (error) {
        // Skip this question if parsing fails
      }
    })
    
    return questions
  }

  const handleSaveQuiz = async (asDraft: boolean = false) => {
    if (!parsedData || !user) return

    setSaving(true)
    try {
      const quiz: Omit<Quiz, "id"> = {
        title: quizMetadata.title,
        description: quizMetadata.description,
        timeLimit: quizMetadata.timeLimit,
        questions: parsedData.questions,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        isActive: !asDraft && quizMetadata.isActive
      }

      const quizId = await QuizService.createQuiz(quiz)
      
      setShowPreviewModal(false)
      setShowMetadataModal(false)
      setParsedData(null)
      
      if (onQuizCreated) {
        // Get the full quiz object
        const fullQuiz = await QuizService.getQuizById(quizId)
        if (fullQuiz) {
          onQuizCreated(fullQuiz)
        }
      }
      
      // Redirect to quiz list or edit page
      router.push(asDraft ? `/admin/quiz/edit/${quizId}` : "/admin/quizzes")
      
      // Show success toast
      success(asDraft ? "Đã lưu bài thi dưới dạng nháp" : "Đã xuất bản bài thi thành công")
      
    } catch (error) {
      showError("Có lỗi khi lưu bài thi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Quiz từ File
            {parsedData && (
              <Badge variant="secondary" className="ml-auto">
                {parsedData.questions.length} câu hỏi
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload file để tự động tạo câu hỏi. Hỗ trợ các định dạng: JSON, Word (.docx), PDF, Excel (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supported formats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {supportedFormats.map((format) => (
              <div key={format.type} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <format.icon className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1">
                  <Badge variant="outline" className={format.color}>
                    {format.extension}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload area */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-all duration-200 bg-gradient-to-br from-background to-muted/20">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="w-64">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center mt-2">Đang xử lý... {uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <Button onClick={() => fileInputRef.current?.click()} size="lg" className="mb-2">
                  <FileCheck className="mr-2 h-4 w-4" />
                  Chọn File để Upload
                </Button>
                <p className="text-sm text-muted-foreground">
                  Kéo thả file hoặc click để chọn • Tối đa 10MB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hỗ trợ: .json, .docx, .pdf, .xlsx, .xls
                </p>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.docx,.pdf,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Status messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import statistics */}
          {parsedData?.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Thống kê Import
                  <div className="ml-auto flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem trước
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setShowMetadataModal(true)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Xuất bản
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{parsedData.metadata.questionCount}</div>
                    <div className="text-sm text-muted-foreground">Câu hỏi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{parsedData.metadata.hasExplanations}</div>
                    <div className="text-sm text-muted-foreground">Có giải thích</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{parsedData.metadata.avgOptionsPerQuestion.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Lựa chọn TB</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{quizMetadata.timeLimit}</div>
                    <div className="text-sm text-muted-foreground">Phút</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem trước Quiz</DialogTitle>
            <DialogDescription>
              Kiểm tra lại câu hỏi trước khi xuất bản
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {parsedData?.questions.map((question, index) => (
              <Card key={question.id} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">Câu {index + 1}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-3">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`p-2 rounded border ${
                          optIndex === question.correctAnswer 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        {option}
                        {optIndex === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 inline ml-2 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800">
                        <strong>Giải thích:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              setShowPreviewModal(false)
              setShowMetadataModal(true)
            }}>
              <Edit3 className="h-4 w-4 mr-2" />
              Chỉnh sửa thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metadata Modal */}
      <Dialog open={showMetadataModal} onOpenChange={setShowMetadataModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thông tin bài thi</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho bài thi trước khi xuất bản
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề bài thi *</Label>
              <Input
                id="title"
                value={quizMetadata.title}
                onChange={(e) => setQuizMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề bài thi"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={quizMetadata.description}
                onChange={(e) => setQuizMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả nội dung bài thi"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeLimit">Thời gian (phút)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={quizMetadata.timeLimit}
                  onChange={(e) => setQuizMetadata(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Môn học</Label>
                <Input
                  id="subject"
                  value={quizMetadata.subject}
                  onChange={(e) => setQuizMetadata(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="VD: Toán, Lý, Hóa..."
                />
              </div>
              
              <div>
                <Label htmlFor="grade">Lớp/Cấp độ</Label>
                <Input
                  id="grade"
                  value={quizMetadata.grade}
                  onChange={(e) => setQuizMetadata(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="VD: Lớp 10, Beginner..."
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={quizMetadata.isActive}
                onCheckedChange={(checked) => setQuizMetadata(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Kích hoạt ngay sau khi tạo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetadataModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSaveQuiz(true)}
              disabled={saving || !quizMetadata.title.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Lưu nháp
            </Button>
            <Button 
              onClick={() => handleSaveQuiz(false)}
              disabled={saving || !quizMetadata.title.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Xuất bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}