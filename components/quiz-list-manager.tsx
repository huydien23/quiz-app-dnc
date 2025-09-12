"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, Filter, Plus, MoreHorizontal, Edit, Trash2, Copy, 
  Eye, Users, Clock, Calendar, BarChart3, Download, Share,
  CheckCircle, XCircle, AlertCircle, Loader2, X
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface QuizListManagerProps {
  onQuizSelect?: (quiz: Quiz) => void
  selectable?: boolean
}

export function QuizListManager({ onQuizSelect, selectable = false }: QuizListManagerProps) {
  const router = useRouter()
  
  // Data states
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "questions">("newest")
  
  // Selection states
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([])
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Load quizzes
  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      const allQuizzes = await QuizService.getAllQuizzes() // We'll need to add this method
      setQuizzes(allQuizzes)
    } catch (error) {
      setError("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort quizzes
  const filteredQuizzes = React.useMemo(() => {
    let filtered = quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && quiz.isActive) ||
                           (statusFilter === "inactive" && !quiz.isActive)
      
      return matchesSearch && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "questions":
          return b.questions.length - a.questions.length
        default:
          return 0
      }
    })

    return filtered
  }, [quizzes, searchTerm, statusFilter, sortBy])

  const handleDeleteQuiz = async (quiz: Quiz) => {
    try {
      await QuizService.deleteQuiz(quiz.id)
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id))
      setShowDeleteDialog(false)
      setQuizToDelete(null)
    } catch (error) {
      setError("Không thể xóa bài thi")
    }
  }

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    try {
      const duplicatedQuiz: Omit<Quiz, "id"> = {
        ...quiz,
        title: `${quiz.title} (Copy)`,
        createdAt: new Date().toISOString(),
        isActive: false
      }
      
      const newQuizId = await QuizService.createQuiz(duplicatedQuiz)
      loadQuizzes() // Reload to show the new quiz
    } catch (error) {
      setError("Không thể sao chép bài thi")
    }
  }

  const handleToggleStatus = async (quiz: Quiz) => {
    try {
      await QuizService.updateQuiz(quiz.id, { isActive: !quiz.isActive })
      setQuizzes(prev => prev.map(q => 
        q.id === quiz.id ? { ...q, isActive: !quiz.isActive } : q
      ))
    } catch (error) {
      setError("Không thể cập nhật trạng thái")
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedQuizzes.map(id => QuizService.deleteQuiz(id)))
      setQuizzes(prev => prev.filter(q => !selectedQuizzes.includes(q.id)))
      setSelectedQuizzes([])
      setShowBulkActions(false)
    } catch (error) {
      setError("Không thể xóa các bài thi đã chọn")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuizzes(filteredQuizzes.map(q => q.id))
    } else {
      setSelectedQuizzes([])
    }
  }

  const getQuizStatusBadge = (quiz: Quiz) => {
    if (quiz.isActive) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Hoạt động</Badge>
    } else {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Tạm dừng</Badge>
    }
  }

  const getQuizStats = (quiz: Quiz) => {
    return {
      questions: quiz.questions.length,
      timeLimit: quiz.timeLimit,
      hasExplanations: quiz.questions.filter(q => q.explanation?.trim()).length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải danh sách bài thi...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý bài thi</h2>
          <p className="text-muted-foreground">
            {filteredQuizzes.length} bài thi {selectedQuizzes.length > 0 && `(${selectedQuizzes.length} đã chọn)`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedQuizzes.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBulkActions(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa ({selectedQuizzes.length})
            </Button>
          )}
          <Button onClick={() => router.push('/admin/quiz/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo bài thi mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm bài thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="title">Theo tên</SelectItem>
                <SelectItem value="questions">Số câu hỏi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quiz List */}
      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy bài thi nào</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Thử điều chỉnh bộ lọc hoặc tạo bài thi mới"
                : "Bắt đầu bằng cách tạo bài thi đầu tiên của bạn"
              }
            </p>
            <Button onClick={() => router.push('/admin/quiz/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài thi mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedQuizzes.length === filteredQuizzes.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Bài thi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thống kê</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.map((quiz) => {
                const stats = getQuizStats(quiz)
                return (
                  <TableRow key={quiz.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedQuizzes.includes(quiz.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedQuizzes(prev => [...prev, quiz.id])
                          } else {
                            setSelectedQuizzes(prev => prev.filter(id => id !== quiz.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{quiz.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {quiz.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getQuizStatusBadge(quiz)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {stats.questions} câu
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {stats.timeLimit} phút
                        </Badge>
                        {stats.hasExplanations > 0 && (
                          <Badge variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            {stats.hasExplanations} giải thích
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(quiz.createdAt), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => router.push(`/admin/quiz/edit/${quiz.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/quiz/${quiz.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem trước
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateQuiz(quiz)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(quiz)}>
                            {quiz.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Tạm dừng
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setQuizToDelete(quiz)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài thi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài thi "{quizToDelete?.title}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => quizToDelete && handleDeleteQuiz(quizToDelete)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Dialog */}
      <AlertDialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhiều bài thi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedQuizzes.length} bài thi đã chọn? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkDelete}
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800">{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError("")}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}