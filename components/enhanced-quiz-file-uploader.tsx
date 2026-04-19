"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, File, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Edit, Save, ArrowLeft } from "lucide-react"
import type { Question } from "@/lib/types"

interface QuizFileUploaderProps {
  onQuestionsImported: (questions: Question[]) => void
}

interface ParsedQuizData {
  title?: string
  description?: string
  timeLimit?: number
  questions: Question[]
  warnings?: string[]
}

export function EnhancedQuizFileUploader({ onQuestionsImported }: QuizFileUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedQuizData | null>(null)
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { type: "JSON", extension: ".json", icon: File, description: "Định dạng JSON chuẩn" },
    { type: "Word", extension: ".docx", icon: FileText, description: "Microsoft Word document" },
    { type: "PDF", extension: ".pdf", icon: FileText, description: "Portable Document Format" },
    { type: "Excel", extension: ".xlsx", icon: FileSpreadsheet, description: "Microsoft Excel spreadsheet" },
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError("")
    setSuccess("")
    setFileInfo({ name: file.name, size: file.size })

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
          parsedData = await parseWordFile(file)
          break
        case 'pdf':
          parsedData = await parsePdfFile(file)
          break
        case 'xlsx':
        case 'xls':
          parsedData = await parseExcelFile(file)
          break
        default:
          throw new Error(`Định dạng file .${fileExtension} không được hỗ trợ. Chỉ hỗ trợ: .json, .docx, .pdf, .xlsx`)
      }

      if (!parsedData || !parsedData.questions || parsedData.questions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi nào trong file")
      }

      // Validate questions but don't filter out incomplete ones
      const processedQuestions = parsedData.questions.map((q, index) => {
        const hasValidOptions = q.options && q.options.length >= 2
        const hasMissingAnswer = q.correctAnswer === -1
        const hasValidQuestion = q.question && q.question.trim().length > 0

        let warning = ''
        let hasWarning = false

        if (!hasValidQuestion) {
          warning = 'Thiếu nội dung câu hỏi'
          hasWarning = true
        } else if (!hasValidOptions) {
          warning = 'Cần ít nhất 2 lựa chọn'
          hasWarning = true
        } else if (hasMissingAnswer) {
          warning = 'Chưa có đáp án đúng'
          hasWarning = true
        }

        return {
          ...q,
          hasWarning,
          warningMessage: warning
        }
      })

      // Show preview mode instead of directly importing
      setParsedData({ ...parsedData, questions: processedQuestions })
      setEditingQuestions(processedQuestions)
      setPreviewMode(true)
      setSuccess(`Đã phân tích ${processedQuestions.length} câu hỏi từ file ${file.name}. Vui lòng kiểm tra và xác nhận.`)
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

            // Handle both 'correct' and 'correctAnswer' fields - default to -1 (unknown)
            let correctAnswer = -1
            if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0) {
              correctAnswer = q.correctAnswer
            } else if (typeof q.correct === 'number' && q.correct >= 0) {
              correctAnswer = q.correct
            }

            // Validate correct answer index - keep -1 if invalid
            if (correctAnswer >= 0 && (correctAnswer < 0 || correctAnswer >= q.options.length)) {
              correctAnswer = -1 // Set to unknown if invalid index
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
        // Try to load mammoth dynamically
        let mammoth: any
        try {
          mammoth = await import('mammoth')
        } catch (e) {
          throw new Error('Thư viện xử lý Word file chưa được cài đặt. Vui lòng liên hệ admin.')
        }

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
        // Try to load PDF.js dynamically
        let pdfjsLib: any
        try {
          pdfjsLib = await import('pdfjs-dist')
        } catch (e) {
          throw new Error('Thư viện xử lý PDF chưa được cài đặt. Vui lòng liên hệ admin.')
        }

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

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
        // Try to load XLSX dynamically
        let XLSX: any
        try {
          XLSX = await import('xlsx')
        } catch (e) {
          throw new Error('Thư viện xử lý Excel chưa được cài đặt. Vui lòng liên hệ admin.')
        }

        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

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

            let correctAnswer = -1 // Default to unknown
            if (row[5] && String(row[5]).trim()) {
              const correctAnswerLetter = String(row[5]).trim().toUpperCase()
              switch (correctAnswerLetter) {
                case "A": correctAnswer = 0; break
                case "B": correctAnswer = 1; break
                case "C": correctAnswer = 2; break
                case "D": correctAnswer = 3; break
                default: correctAnswer = -1 // Keep unknown if invalid
              }
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

    // Normalize line breaks
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Try multiple splitting strategies
    let questionBlocks: string[] = []

    // Strategy 1: Split by numbered questions (1. 2. 3. etc)
    const numberedPattern = /(?=^\d+[.)\s]+)/gm
    const numberedBlocks = normalizedText.split(numberedPattern).filter(block => block.trim())

    // Strategy 2: Split by "Question:" or "Câu hỏi:" or "Câu"
    const labeledPattern = /(?=(?:Question|Câu hỏi|Câu)\s*\d*\s*[:.)]?\s*)/gi
    const labeledBlocks = normalizedText.split(labeledPattern).filter(block => block.trim())

    // Use whichever strategy produces more valid blocks
    questionBlocks = numberedBlocks.length >= labeledBlocks.length ? numberedBlocks : labeledBlocks

    // If still no good splits, try splitting by double newlines
    if (questionBlocks.length <= 1) {
      questionBlocks = normalizedText.split(/\n\s*\n/).filter(block => block.trim())
    }

    questionBlocks.forEach((block, index) => {
      try {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line)

        if (lines.length < 3) return // Need at least question + 2 options

        // Find question text - first non-empty line that's not an option
        let questionText = ''
        let questionLineIndex = 0

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip if it's an option line (starts with A. B. C. D.)
          if (/^[A-Da-d][.):\s]/i.test(line)) continue
          // Skip if it's an answer line
          if (/^(đáp án|answer|correct|trả lời)/i.test(line)) continue

          // Remove leading number and question prefix
          questionText = line
            .replace(/^\d+[.):\s]+/, '') // Remove "1." "2)" "3:" etc
            .replace(/^(question|câu hỏi|câu)\s*\d*\s*[:.)]?\s*/i, '') // Remove "Question:", "Câu hỏi:" etc
            .trim()

          if (questionText.length > 10) { // Valid question should be longer than 10 chars
            questionLineIndex = i
            break
          }
        }

        if (!questionText) return

        // Find options - support multiple formats: A. A) A: a.
        const options: string[] = []
        const optionPatterns = [
          /^[Aa][.):\s]\s*(.+)$/,
          /^[Bb][.):\s]\s*(.+)$/,
          /^[Cc][.):\s]\s*(.+)$/,
          /^[Dd][.):\s]\s*(.+)$/,
        ]

        lines.forEach(line => {
          for (let i = 0; i < optionPatterns.length; i++) {
            const match = line.match(optionPatterns[i])
            if (match && options.length === i) {
              options.push(match[1].trim())
              break
            }
          }
        })

        // If we didn't find 4 options with strict matching, try flexible matching
        if (options.length < 4) {
          const flexOptions: string[] = []
          const flexPattern = /^[A-Da-d][.):\s]\s*(.+)$/

          lines.forEach(line => {
            const match = line.match(flexPattern)
            if (match && flexOptions.length < 4) {
              flexOptions.push(match[1].trim())
            }
          })

          if (flexOptions.length >= 2) {
            options.length = 0
            options.push(...flexOptions)
          }
        }

        if (options.length < 2) return // Need at least 2 options

        // Find correct answer - support multiple formats
        let correctAnswer = -1
        let explanation = ''

        const answerPatterns = [
          /^đáp án\s*[:.]\s*([A-Da-d])/i,
          /^answer\s*[:.]\s*([A-Da-d])/i,
          /^correct\s*[:.]\s*([A-Da-d])/i,
          /^trả lời\s*[:.]\s*([A-Da-d])/i,
          /đáp án\s*[:.]\s*([A-Da-d])/i,
        ]

        for (const line of lines) {
          for (const pattern of answerPatterns) {
            const match = line.match(pattern)
            if (match) {
              const letter = match[1].toUpperCase()
              correctAnswer = letter.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3

              // Try to extract explanation from the same line (after the answer)
              // Format: "Đáp án: A. explanation text (more explanation)"
              const explanationMatch = line.match(/^đáp án\s*[:.]\s*[A-Da-d][.):\s]*(.+?)(?:\((.+)\))?$/i)
              if (explanationMatch) {
                explanation = (explanationMatch[2] || explanationMatch[1] || '').trim()
              }
              break
            }
          }
          if (correctAnswer !== -1) break
        }

        // Also look for separate explanation lines
        if (!explanation) {
          const explanationLine = lines.find(line =>
            /^(explanation|giải thích|lý do)\s*[:.]/i.test(line)
          )
          if (explanationLine) {
            explanation = explanationLine.replace(/^(explanation|giải thích|lý do)\s*[:.]\s*/i, '').trim()
          }
        }

        questions.push({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          question: questionText,
          options: options.slice(0, 4), // Max 4 options
          correctAnswer: correctAnswer >= 0 && correctAnswer < options.length ? correctAnswer : -1,
          explanation,
        })
      } catch (error) {
        console.error('Error parsing question block:', error)
        // Skip this question if parsing fails
      }
    })

    return questions
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleQuestionUpdate = (index: number, field: string, value: any) => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    }

    // Update warnings
    if (field === 'correctAnswer' && value !== -1) {
      updatedQuestions[index].hasWarning = false
      updatedQuestions[index].warningMessage = ''
    }

    setEditingQuestions(updatedQuestions)
  }

  const handleConfirmImport = () => {
    if (editingQuestions.length === 0) return

    onQuestionsImported(editingQuestions)
    setSuccess(`Đã import thành công ${editingQuestions.length} câu hỏi!`)
    setPreviewMode(false)
    setParsedData(null)
    setEditingQuestions([])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCancelPreview = () => {
    setPreviewMode(false)
    setParsedData(null)
    setEditingQuestions([])
    setError("")
    setSuccess("")
  }

  if (previewMode && parsedData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Kiểm tra và chỉnh sửa câu hỏi
              </CardTitle>
              <CardDescription>
                Đã phân tích {editingQuestions.length} câu hỏi. Vui lòng kiểm tra và sửa lỗi trước khi import.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelPreview}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button onClick={handleConfirmImport} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Xác nhận import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{editingQuestions.length}</div>
                <div className="text-sm text-slate-600">Tổng câu hỏi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {editingQuestions.filter(q => q.hasWarning).length}
                </div>
                <div className="text-sm text-slate-600">Câu cần sửa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {editingQuestions.filter(q => !q.hasWarning).length}
                </div>
                <div className="text-sm text-slate-600">Câu hoàn chỉnh</div>
              </div>
            </div>

            {/* Questions Table */}
            <div className="border rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Câu hỏi</TableHead>
                      <TableHead className="w-32">Đáp án đúng</TableHead>
                      <TableHead className="w-24">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editingQuestions.map((question, index) => (
                      <TableRow key={index} className={question.hasWarning ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {question.question || <span className="text-red-500 italic">Thiếu câu hỏi</span>}
                            </div>
                            <div className="text-xs text-slate-500">
                              {question.options?.length || 0} lựa chọn
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={question.correctAnswer.toString()}
                            onValueChange={(value) => handleQuestionUpdate(index, 'correctAnswer', parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {question.correctAnswer === -1 ? 'Chưa chọn' : `Lựa chọn ${String.fromCharCode(65 + question.correctAnswer)}`}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1">Chưa chọn</SelectItem>
                              {question.options?.map((option, optIndex) => (
                                <SelectItem key={optIndex} value={optIndex.toString()}>
                                  {String.fromCharCode(65 + optIndex)}: {option.substring(0, 30)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {question.hasWarning ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Lỗi
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                          {question.warningMessage && (
                            <div className="text-xs text-red-600 mt-1">
                              {question.warningMessage}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Warnings */}
            {editingQuestions.some(q => q.hasWarning) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Có {editingQuestions.filter(q => q.hasWarning).length} câu hỏi cần kiểm tra. Vui lòng chọn đáp án đúng cho các câu thiếu thông tin.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      {/* File info when selected */}
      {fileInfo && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">{fileInfo.name}</span>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">{formatFileSize(fileInfo.size)}</Badge>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        className="flex flex-col items-center justify-center p-8 cursor-pointer"
        onClick={triggerFileUpload}
      >
        <div className="p-4 bg-indigo-100 rounded-full mb-4">
          <Upload className="h-8 w-8 text-indigo-600" />
        </div>
        <Button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white mb-3">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Đang xử lý..." : "Chọn file để upload"}
        </Button>
        <p className="text-sm text-slate-500 text-center">
          Kéo thả hoặc click để chọn file
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Hỗ trợ: JSON, Excel (.xlsx), Word (.docx), PDF • Tối đa 10MB
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
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !previewMode && (
        <Alert className="mt-4 bg-emerald-50 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}