"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Eye, Trash2 } from "lucide-react"
import type { Question } from "@/lib/types"

interface QuizPreviewProps {
  questions: Question[]
  onRemoveQuestion: (index: number) => void
}

export function QuizPreview({ questions, onRemoveQuestion }: QuizPreviewProps) {
  if (questions.length === 0) {
    return null
  }

  const validQuestions = questions.filter(q => q.question.trim() !== "")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Preview Câu hỏi ({validQuestions.length})
        </CardTitle>
        <CardDescription>
          Xem trước các câu hỏi đã tạo hoặc import từ file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {validQuestions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Câu {index + 1}</Badge>
                  {question.explanation && (
                    <Badge variant="secondary" className="text-xs">
                      Có giải thích
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-foreground mb-3">{question.question}</h4>
                
                <div className="grid grid-cols-1 gap-2">
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex} 
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        optionIndex === question.correctAnswer 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      {optionIndex === question.correctAnswer ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">
                        {String.fromCharCode(65 + optionIndex)})
                      </span>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Giải thích: </span>
                    <span className="text-blue-700 dark:text-blue-300">{question.explanation}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveQuestion(index)}
                className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {validQuestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có câu hỏi nào để preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}