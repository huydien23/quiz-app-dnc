"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, FileSpreadsheet, File } from "lucide-react"

export function QuizTemplateDownloader() {
  const downloadJsonTemplate = () => {
    const template = {
      title: "Tiêu đề bài thi",
      description: "Mô tả bài thi",
      timeLimit: 30,
      questions: [
        {
          question: "Câu hỏi mẫu?",
          options: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
          correctAnswer: 0,
          explanation: "Giải thích đáp án"
        }
      ]
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quiz-template.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadExcelTemplate = () => {
    // Create Excel template data
    const csvContent = [
      ['Câu hỏi', 'Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D', 'Đáp án', 'Giải thích'],
      ['2 + 2 = ?', '3', '4', '5', '6', 'B', '2 + 2 = 4'],
      ['Thủ đô Việt Nam?', 'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Huế', 'A', 'Hà Nội là thủ đô'],
      ['10 - 7 = ?', '2', '3', '4', '5', 'B', '10 - 7 = 3']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quiz-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadWordTemplate = () => {
    const wordContent = `
TEMPLATE TẠO QUIZ

Question: Câu hỏi mẫu 1?
A) Lựa chọn A
B) Lựa chọn B
C) Lựa chọn C
D) Lựa chọn D
Answer: A
Explanation: Giải thích đáp án

Question: Câu hỏi mẫu 2?
A) Lựa chọn A
B) Lựa chọn B
C) Lựa chọn C
D) Lựa chọn D
Answer: B
Explanation: Giải thích đáp án

HƯỚNG DẪN:
- Mỗi câu hỏi bắt đầu bằng "Question:"
- Các lựa chọn được đánh dấu A), B), C), D)
- Đáp án được chỉ định bằng "Answer:" theo sau là chữ cái A, B, C, hoặc D
- Giải thích được thêm vào với "Explanation:"
- Để trống một dòng giữa các câu hỏi
    `.trim()

    const blob = new Blob([wordContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quiz-template.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Tải Template
        </CardTitle>
        <CardDescription>
          Tải các file mẫu để tạo quiz theo định dạng chuẩn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <File className="h-8 w-8 text-blue-500" />
            <Badge variant="outline">JSON</Badge>
            <p className="text-xs text-muted-foreground text-center">
              Định dạng JSON chuẩn với đầy đủ metadata
            </p>
            <Button onClick={downloadJsonTemplate} size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Tải JSON
            </Button>
          </div>

          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-green-500" />
            <Badge variant="outline">CSV</Badge>
            <p className="text-xs text-muted-foreground text-center">
              Bảng tính dễ chỉnh sửa với Excel
            </p>
            <Button onClick={downloadExcelTemplate} size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Tải CSV
            </Button>
          </div>

          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <FileText className="h-8 w-8 text-orange-500" />
            <Badge variant="outline">TXT</Badge>
            <p className="text-xs text-muted-foreground text-center">
              Template văn bản cho Word/PDF
            </p>
            <Button onClick={downloadWordTemplate} size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Tải TXT
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">💡 Gợi ý</h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Sử dụng JSON cho việc import/export hoàn chỉnh</li>
            <li>• Sử dụng CSV/Excel để tạo nhiều câu hỏi nhanh chóng</li>
            <li>• Sử dụng TXT template cho Word/PDF khi có sẵn nội dung</li>
            <li>• Luôn kiểm tra preview trước khi lưu bài thi</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}