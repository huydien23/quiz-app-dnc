"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, File, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react"
import type { Question } from "@/lib/types"

// Import the libraries dynamically to avoid SSR issues
let mammoth: any = null
let pdfjs: any = null
let XLSX: any = null

interface QuizFileUploaderProps {
  onQuestionsImported: (questions: Question[]) => void
}

interface ParsedQuizData {
  title?: string
  description?: string
  timeLimit?: number
  questions: Question[]
}

export function QuizFileUploader({ onQuestionsImported }: QuizFileUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { type: "JSON", extension: ".json", icon: File, description: "Định dạng JSON chuẩn" },
    { type: "Word", extension: ".docx", icon: FileText, description: "Microsoft Word document" },
    { type: "PDF", extension: ".pdf", icon: FileText, description: "Portable Document Format" },
    { type: "Excel", extension: ".xlsx", icon: FileSpreadsheet, description: "Microsoft Excel spreadsheet" },
  ]

  const loadLibraries = async () => {
    try {
      if (!mammoth) {
        mammoth = await import('mammoth')
      }
      if (!pdfjs) {
        const pdfjsModule = await import('pdfjs-dist')
        pdfjs = pdfjsModule
        // Set the worker source
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
    setSuccess("")

    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB")
      }

      const fileExtension = file.name.toLowerCase().split('.').pop()
      if (!fileExtension) {
        throw new Error("File không có phần mở rộng")
      }

      let parsedData: ParsedQuizData

      switch (fileExtension) {
        case 'json':
          parsedData = await parseJsonFile(file)
          break
        case 'docx':
          await loadLibraries()
          parsedData = await parseWordFile(file)
          break
        case 'pdf':
          await loadLibraries()
          parsedData = await parsePdfFile(file)
          break
        case 'xlsx':
        case 'xls':
          await loadLibraries()
          parsedData = await parseExcelFile(file)
          break
        default:
          throw new Error(`Định dạng file .${fileExtension} không được hỗ trợ. Chỉ hỗ trợ: .json, .docx, .pdf, .xlsx`)
      }

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

      onQuestionsImported(validQuestions)
      setSuccess(`Đã import thành công ${validQuestions.length} câu hỏi từ file ${file.name}`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error('File upload error:', error)
      setError(error.message || "Có lỗi xảy ra khi xử lý file")
    } finally {
      setLoading(false)
    }
  }

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
          
          // Check if data is array (like your quiz-python.json) or object with questions property
          let questionsArray: any[] = []
          
          if (Array.isArray(data)) {
            // Direct array of questions
            questionsArray = data
          } else if (data && typeof data === 'object' && Array.isArray(data.questions)) {
            // Object with questions property
            questionsArray = data.questions
          } else {
            throw new Error("File JSON phải chứa mảng câu hỏi hoặc object với property 'questions'")
          }

          if (questionsArray.length === 0) {
            throw new Error("File JSON không chứa câu hỏi nào")
          }

          const questions: Question[] = questionsArray.map((q: any, index: number) => {
            // Validate required fields
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
            
            // Handle both 'correct' and 'correctAnswer' fields
            let correctAnswer = 0
            if (typeof q.correctAnswer === 'number') {
              correctAnswer = q.correctAnswer
            } else if (typeof q.correct === 'number') {
              correctAnswer = q.correct
            }
            
            // Validate correct answer index
            if (correctAnswer < 0 || correctAnswer >= q.options.length) {
              correctAnswer = 0 // Default to first option if invalid
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
            title: Array.isArray(data) ? "Quiz đã import" : (data.title || "Quiz đã import"),
            description: Array.isArray(data) ? "Đã import từ file JSON" : (data.description || "Đã import từ file JSON"),
            timeLimit: Array.isArray(data) ? 30 : (data.timeLimit || 30),
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

  const parseWordFile = async (file: File): Promise<ParsedQuizData> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value
        
        // Parse text format - expecting format like:
        // Question: What is 2+2?
        // A) 3
        // B) 4
        // C) 5
        // D) 6
        // Answer: B
        // Explanation: 2+2 equals 4
        
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
        
        // Expected Excel format:
        // Column A: Question
        // Column B: Option A
        // Column C: Option B  
        // Column D: Option C
        // Column E: Option D
        // Column F: Correct Answer (A, B, C, or D)
        // Column G: Explanation
        
        const questions: Question[] = []
        
        for (let i = 1; i < data.length; i++) { // Skip header row
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
        
        if (lines.length < 6) return // Not enough lines for a complete question
        
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

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Quiz từ File
        </CardTitle>
        <CardDescription>
          Upload file để tự động tạo câu hỏi. Hỗ trợ các định dạng: JSON, Word (.docx), PDF, Excel (.xlsx)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supported formats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {supportedFormats.map((format) => (
            <div key={format.type} className="flex items-center space-x-2 p-3 border rounded-lg">
              <format.icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Badge variant="outline">{format.extension}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload button */}
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <Button onClick={triggerFileUpload} disabled={loading} size="lg" className="mb-2">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Đang xử lý..." : "Chọn File để Upload"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Kéo thả file hoặc click để chọn • Tối đa 10MB
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ: .json, .docx, .pdf, .xlsx, .xls
          </p>
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Format examples */}
        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Ví dụ định dạng JSON:</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`// Format 1: Object với questions array
{
  "title": "Quiz Toán học",
  "description": "Bài kiểm tra kiến thức toán học",
  "timeLimit": 30,
  "questions": [
    {
      "id": 1,
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "explanation": "2 + 2 = 4"
    }
  ]
}

// Format 2: Array trực tiếp (như file quiz-python.json)
[
  {
    "id": 1,
    "question": "Python là gì?",
    "options": ["A. Ngôn ngữ lập trình", "B. Con rắn", "C. Framework", "D. Database"],
    "correct": 0,
    "explanation": "Python là ngôn ngữ lập trình bậc cao"
  }
]`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Định dạng Excel (.xlsx):</h4>
            <div className="text-xs bg-muted p-3 rounded-md">
              <p className="mb-2">Cấu trúc bảng tính:</p>
              <ul className="space-y-1">
                <li>Cột A: Câu hỏi</li>
                <li>Cột B: Lựa chọn A</li>
                <li>Cột C: Lựa chọn B</li>
                <li>Cột D: Lựa chọn C</li>
                <li>Cột E: Lựa chọn D</li>
                <li>Cột F: Đáp án đúng (A, B, C, hoặc D)</li>
                <li>Cột G: Giải thích (tùy chọn)</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Định dạng Word/PDF:</h4>
            <div className="text-xs bg-muted p-3 rounded-md">
              <pre>
{`Question: What is 2+2?
A) 3
B) 4
C) 5  
D) 6
Answer: B
Explanation: 2+2 equals 4

Question: Capital of Vietnam?
A) Hanoi
B) Ho Chi Minh City
C) Da Nang
D) Hue
Answer: A
Explanation: Hanoi is the capital`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}