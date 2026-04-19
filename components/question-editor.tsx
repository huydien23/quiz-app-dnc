"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Plus, Edit2, Trash2, GripVertical, Check, X, AlertCircle,
    ChevronUp, ChevronDown, Copy, Search, ChevronLeft, ChevronRight
} from "lucide-react"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

interface QuestionEditorProps {
    questions: Question[]
    onQuestionsChange: (questions: Question[]) => void
    readOnly?: boolean
}

const OPTION_LABELS = ["A", "B", "C", "D"]

export function QuestionEditor({ questions, onQuestionsChange, readOnly = false }: QuestionEditorProps) {
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [editingIndex, setEditingIndex] = useState<number>(-1)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number>(-1)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Form state for new/edit question
    const [formData, setFormData] = useState<{
        question: string
        options: string[]
        correctAnswer: number
        explanation: string
    }>({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: -1,
        explanation: ""
    })

    const resetForm = () => {
        setFormData({
            question: "",
            options: ["", "", "", ""],
            correctAnswer: -1,
            explanation: ""
        })
    }

    const handleAddNew = () => {
        resetForm()
        setEditingQuestion(null)
        setEditingIndex(-1)
        setIsDialogOpen(true)
    }

    const handleEdit = (question: Question, index: number) => {
        setFormData({
            question: question.question,
            options: [...question.options],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || ""
        })
        setEditingQuestion(question)
        setEditingIndex(index)
        setIsDialogOpen(true)
    }

    const handleSaveQuestion = () => {
        // Validation
        if (!formData.question.trim()) return
        if (formData.options.some(opt => !opt.trim())) return
        if (formData.correctAnswer === -1) return

        const newQuestion: Question = {
            id: editingQuestion?.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question: formData.question.trim(),
            options: formData.options.map(opt => opt.trim()),
            correctAnswer: formData.correctAnswer,
            explanation: formData.explanation.trim() || undefined
        }

        if (editingIndex >= 0) {
            // Update existing
            const updated = [...questions]
            updated[editingIndex] = newQuestion
            onQuestionsChange(updated)
        } else {
            // Add new
            onQuestionsChange([...questions, newQuestion])
        }

        setIsDialogOpen(false)
        resetForm()
    }

    const handleDelete = (index: number) => {
        const updated = questions.filter((_, i) => i !== index)
        onQuestionsChange(updated)
        setDeleteConfirmIndex(-1)
    }

    const handleDuplicate = (question: Question) => {
        const duplicated: Question = {
            ...question,
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        onQuestionsChange([...questions, duplicated])
    }

    const handleMoveUp = (index: number) => {
        if (index === 0) return
        const updated = [...questions]
            ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
        onQuestionsChange(updated)
    }

    const handleMoveDown = (index: number) => {
        if (index === questions.length - 1) return
        const updated = [...questions]
            ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
        onQuestionsChange(updated)
    }

    // Filter questions by search
    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const isFormValid = formData.question.trim() &&
        formData.options.every(opt => opt.trim()) &&
        formData.correctAnswer !== -1

    // Pagination calculations
    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)

    // Reset to page 1 when search changes
    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm font-bold px-3 py-1 bg-indigo-100 text-indigo-700">
                        {questions.length} câu hỏi
                    </Badge>
                    {questions.filter(q => q.correctAnswer === -1).length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {questions.filter(q => q.correctAnswer === -1).length} chưa có đáp án
                        </Badge>
                    )}
                </div>
                {!readOnly && (
                    <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm câu hỏi
                    </Button>
                )}
            </div>

            {/* Search */}
            {questions.length > 5 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            {searchTerm ? "Không tìm thấy câu hỏi" : "Chưa có câu hỏi nào"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {searchTerm ? "Thử từ khóa khác" : "Nhấn \"Thêm câu hỏi\" để bắt đầu"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {paginatedQuestions.map((question, displayIndex) => {
                        const actualIndex = questions.findIndex(q => q.id === question.id)
                        return (
                            <Card
                                key={question.id}
                                className={cn(
                                    "border-slate-200 hover:border-indigo-300 transition-all",
                                    question.correctAnswer === -1 && "border-amber-300 bg-amber-50/50"
                                )}
                            >
                                <CardContent className="py-4">
                                    <div className="flex gap-3">
                                        {/* Drag Handle & Number */}
                                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                            {!readOnly && (
                                                <div className="flex flex-col gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleMoveUp(actualIndex)}
                                                        disabled={actualIndex === 0}
                                                    >
                                                        <ChevronUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleMoveDown(actualIndex)}
                                                        disabled={actualIndex === questions.length - 1}
                                                    >
                                                        <ChevronDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                                                {actualIndex + 1}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 mb-3 leading-relaxed">
                                                {question.question}
                                            </p>

                                            {/* Options Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {question.options.map((option, optIndex) => (
                                                    <div
                                                        key={optIndex}
                                                        className={cn(
                                                            "flex items-start gap-2 px-3 py-2 rounded-lg text-sm",
                                                            question.correctAnswer === optIndex
                                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                                : "bg-slate-50 text-slate-600"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "font-bold flex-shrink-0",
                                                            question.correctAnswer === optIndex ? "text-emerald-600" : "text-slate-400"
                                                        )}>
                                                            {OPTION_LABELS[optIndex]}.
                                                        </span>
                                                        <span className="flex-1">{option}</span>
                                                        {question.correctAnswer === optIndex && (
                                                            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Warning for missing answer */}
                                            {question.correctAnswer === -1 && (
                                                <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>Chưa chọn đáp án đúng</span>
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {question.explanation && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                                    <span className="font-semibold">Giải thích:</span> {question.explanation}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => handleEdit(question, actualIndex)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleDuplicate(question)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setDeleteConfirmIndex(actualIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {filteredQuestions.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} trong tổng số {filteredQuestions.length} câu hỏi
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-9 px-3"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Trước
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "h-9 w-9 p-0",
                                            currentPage === pageNum && "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        )}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 px-3"
                        >
                            Sau
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingIndex >= 0 ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                        </DialogTitle>
                        <DialogDescription>
                            Nhập nội dung câu hỏi và chọn đáp án đúng
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Question Text */}
                        <div className="space-y-2">
                            <Label htmlFor="question" className="text-sm font-semibold">
                                Nội dung câu hỏi <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="question"
                                value={formData.question}
                                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                placeholder="Nhập câu hỏi..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                Các đáp án <span className="text-red-500">*</span>
                            </Label>
                            <RadioGroup
                                value={formData.correctAnswer.toString()}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                            >
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <RadioGroupItem
                                            value={index.toString()}
                                            id={`option-${index}`}
                                            className="flex-shrink-0"
                                        />
                                        <Label
                                            htmlFor={`option-${index}`}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 cursor-pointer transition-colors",
                                                formData.correctAnswer === index
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                            )}
                                        >
                                            {OPTION_LABELS[index]}
                                        </Label>
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...formData.options]
                                                newOptions[index] = e.target.value
                                                setFormData(prev => ({ ...prev, options: newOptions }))
                                            }}
                                            placeholder={`Đáp án ${OPTION_LABELS[index]}...`}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </RadioGroup>
                            <p className="text-xs text-slate-500">
                                Chọn radio button để đánh dấu đáp án đúng
                            </p>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-2">
                            <Label htmlFor="explanation" className="text-sm font-semibold">
                                Giải thích (tùy chọn)
                            </Label>
                            <Textarea
                                id="explanation"
                                value={formData.explanation}
                                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                                placeholder="Giải thích tại sao đáp án này đúng..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSaveQuestion}
                            disabled={!isFormValid}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {editingIndex >= 0 ? "Cập nhật" : "Thêm câu hỏi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmIndex >= 0} onOpenChange={() => setDeleteConfirmIndex(-1)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDelete(deleteConfirmIndex)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
