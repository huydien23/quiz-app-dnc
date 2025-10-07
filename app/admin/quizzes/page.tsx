"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminService } from "@/lib/admin-service"
import { QuizService } from "@/lib/quiz-service"
import type { Quiz } from "@/lib/types"
import { 
  Search, Plus, Edit, Trash2, ArrowLeft, BookOpen, Users, Clock, Eye,
  Grid3x3, List, Copy, Download, Filter, TrendingUp, BarChart3,
  CheckCircle, XCircle, AlertCircle, Calendar, Hash, Award
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface QuizWithStats extends Quiz {
  totalAttempts: number
  avgScore: number
  uniqueUsers: number
  lastAttempt?: string
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "draft">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "attempts" | "score">("newest")
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadQuizzes()
  }, [])

  useEffect(() => {
    filterAndSortQuizzes()
  }, [quizzes, searchTerm, statusFilter, sortBy])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await AdminService.getAllQuizzes()
      const attempts = await AdminService.getAllAttempts()
      
      // Calculate stats for each quiz
      const quizzesWithStats: QuizWithStats[] = data.map(quiz => {
        const quizAttempts = attempts.filter(a => a.quizId === quiz.id)
        const uniqueUsers = new Set(quizAttempts.map(a => a.userId)).size
        const totalAttempts = quizAttempts.length
        const avgScore = totalAttempts > 0
          ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
          : 0
        const lastAttempt = quizAttempts.length > 0
          ? new Date(Math.max(...quizAttempts.map(a => new Date(a.completedAt).getTime()))).toISOString()
          : undefined

        return {
          ...quiz,
          totalAttempts,
          avgScore,
          uniqueUsers,
          lastAttempt
        }
      })
      
      setQuizzes(quizzesWithStats)
    } catch (err) {
      console.error("Error loading quizzes:", err)
      setError("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortQuizzes = () => {
    let filtered = [...quizzes]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((quiz) =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quiz) => {
        if (statusFilter === "active") return quiz.isActive
        if (statusFilter === "inactive") return !quiz.isActive
        if (statusFilter === "draft") return quiz.isDraft
        return true
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name":
          return a.title.localeCompare(b.title)
        case "attempts":
          return b.totalAttempts - a.totalAttempts
        case "score":
          return b.avgScore - a.avgScore
        default:
          return 0
      }
    })

    setFilteredQuizzes(filtered)
  }

  const handleToggleActive = async (quizId: string, currentActive: boolean) => {
    try {
      await QuizService.updateQuiz(quizId, { isActive: !currentActive })
      setQuizzes(prev =>
        prev.map(quiz =>
          quiz.id === quizId ? { ...quiz, isActive: !currentActive } : quiz
        )
      )
      toast({
        title: "Thành công",
        description: `Đã ${!currentActive ? 'kích hoạt' : 'tắt'} bài thi`,
      })
    } catch (err) {
      console.error("Error toggling quiz:", err)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái bài thi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài thi này?")) {
      try {
        await QuizService.deleteQuiz(quizId)
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
        toast({
          title: "Thành công",
          description: "Đã xóa bài thi",
        })
      } catch (err) {
        console.error("Error deleting quiz:", err)
        toast({
          title: "Lỗi",
          description: "Không thể xóa bài thi",
          variant: "destructive",
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedQuizzes.map(id => QuizService.deleteQuiz(id)))
      setQuizzes(prev => prev.filter(quiz => !selectedQuizzes.includes(quiz.id)))
      setSelectedQuizzes([])
      setShowBulkDelete(false)
      toast({
        title: "Thành công",
        description: `Đã xóa ${selectedQuizzes.length} bài thi`,
      })
    } catch (err) {
      console.error("Error bulk deleting:", err)
      toast({
        title: "Lỗi",
        description: "Không thể xóa các bài thi",
        variant: "destructive",
      })
    }
  }

  const handleBulkActivate = async (active: boolean) => {
    try {
      await Promise.all(
        selectedQuizzes.map(id => QuizService.updateQuiz(id, { isActive: active }))
      )
      setQuizzes(prev =>
        prev.map(quiz =>
          selectedQuizzes.includes(quiz.id) ? { ...quiz, isActive: active } : quiz
        )
      )
      setSelectedQuizzes([])
      toast({
        title: "Thành công",
        description: `Đã ${active ? 'kích hoạt' : 'tắt'} ${selectedQuizzes.length} bài thi`,
      })
    } catch (err) {
      console.error("Error bulk activating:", err)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateQuiz = async (quiz: QuizWithStats) => {
    try {
      const newQuiz = {
        ...quiz,
        id: undefined,
        title: `${quiz.title} (Bản sao)`,
        createdAt: new Date().toISOString(),
        isActive: false,
        isDraft: true
      }
      delete (newQuiz as any).totalAttempts
      delete (newQuiz as any).avgScore
      delete (newQuiz as any).uniqueUsers
      delete (newQuiz as any).lastAttempt
      
      await QuizService.createQuiz(newQuiz as any)
      loadQuizzes()
      toast({
        title: "Thành công",
        description: "Đã tạo bản sao bài thi",
      })
    } catch (err) {
      console.error("Error duplicating quiz:", err)
      toast({
        title: "Lỗi",
        description: "Không thể tạo bản sao",
        variant: "destructive",
      })
    }
  }

  const handleExportQuizzes = () => {
    const csv = [
      ["Tên bài thi", "Số câu hỏi", "Thời gian (phút)", "Lượt thi", "Điểm TB", "Số người", "Trạng thái"],
      ...filteredQuizzes.map(q => [
        q.title,
        q.questions?.length || 0,
        q.timeLimit || 0,
        q.totalAttempts,
        q.avgScore.toFixed(1),
        q.uniqueUsers,
        q.isActive ? "Đang hoạt động" : "Tạm dừng"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `danh-sach-bai-thi-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast({
      title: "Thành công",
      description: "Đã xuất danh sách bài thi",
    })
  }

  const toggleSelectAll = () => {
    if (selectedQuizzes.length === filteredQuizzes.length) {
      setSelectedQuizzes([])
    } else {
      setSelectedQuizzes(filteredQuizzes.map(q => q.id))
    }
  }

  const toggleSelectQuiz = (quizId: string) => {
    setSelectedQuizzes(prev =>
      prev.includes(quizId)
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 50) return "bg-yellow-100"
    return "bg-red-100"
  }

  // Calculate summary stats
  const totalQuizzes = quizzes.length
  const activeQuizzes = quizzes.filter(q => q.isActive).length
  const totalAttempts = quizzes.reduce((sum, q) => sum + q.totalAttempts, 0)
  const avgQuizScore = totalAttempts > 0
    ? quizzes.reduce((sum, q) => sum + (q.avgScore * q.totalAttempts), 0) / totalAttempts
    : 0

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Quản lý bài thi</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalQuizzes} bài thi • {activeQuizzes} đang hoạt động
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportQuizzes} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
            <Link href="/admin/quiz/create">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tạo bài thi mới
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng bài thi</p>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Đang hoạt động</p>
                  <p className="text-2xl font-bold">{activeQuizzes}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng lượt thi</p>
                  <p className="text-2xl font-bold">{totalAttempts}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Điểm TB chung</p>
                  <p className={`text-2xl font-bold ${getScoreColor(avgQuizScore)}`}>
                    {avgQuizScore.toFixed(1)}
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm bài thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="name">Theo tên</SelectItem>
                  <SelectItem value="attempts">Nhiều lượt thi</SelectItem>
                  <SelectItem value="score">Điểm cao nhất</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedQuizzes.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <p className="text-sm font-medium">
                  Đã chọn {selectedQuizzes.length} bài thi
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkActivate(true)}
                  >
                    Kích hoạt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkActivate(false)}
                  >
                    Tắt
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowBulkDelete(true)}
                  >
                    Xóa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedQuizzes([])}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy bài thi nào</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={selectedQuizzes.includes(quiz.id)}
                          onCheckedChange={() => toggleSelectQuiz(quiz.id)}
                        />
                        <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                      </div>
                      {quiz.description && (
                        <CardDescription className="line-clamp-2">
                          {quiz.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={quiz.isActive ? "default" : "secondary"}>
                      {quiz.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đang hoạt động
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Tạm dừng
                        </>
                      )}
                    </Badge>
                    {quiz.isDraft && (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bản nháp
                      </Badge>
                    )}
                    {quiz.totalAttempts > 50 && (
                      <Badge variant="destructive" className="bg-orange-500">
                        🔥 Hot
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Quiz Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.questions?.length || 0} câu hỏi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.timeLimit || 0} phút</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.totalAttempts} lượt thi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.uniqueUsers} người</span>
                    </div>
                  </div>

                  {/* Stats */}
                  {quiz.totalAttempts > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Điểm trung bình</span>
                        <span className={`font-bold ${getScoreColor(quiz.avgScore)}`}>
                          {quiz.avgScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            quiz.avgScore >= 80
                              ? "bg-green-500"
                              : quiz.avgScore >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${quiz.avgScore}%` }}
                        />
                      </div>
                      {quiz.lastAttempt && (
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Thi gần nhất: {formatDistanceToNow(new Date(quiz.lastAttempt), {
                            addSuffix: true,
                            locale: vi
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/quiz/${quiz.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Xem
                        </Button>
                      </Link>
                      <Link href={`/admin/quiz/edit/${quiz.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Sửa
                        </Button>
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDuplicateQuiz(quiz)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {quiz.isActive ? "Đang mở" : "Đã đóng"}
                      </span>
                      <Switch
                        checked={quiz.isActive}
                        onCheckedChange={() => handleToggleActive(quiz.id, quiz.isActive)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Table View
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedQuizzes.length === filteredQuizzes.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tên bài thi</TableHead>
                    <TableHead className="text-center">Câu hỏi</TableHead>
                    <TableHead className="text-center">Thời gian</TableHead>
                    <TableHead className="text-center">Lượt thi</TableHead>
                    <TableHead className="text-center">Người thi</TableHead>
                    <TableHead className="text-center">Điểm TB</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedQuizzes.includes(quiz.id)}
                          onCheckedChange={() => toggleSelectQuiz(quiz.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{quiz.title}</span>
                          {quiz.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {quiz.description}
                            </span>
                          )}
                          {quiz.totalAttempts > 50 && (
                            <Badge variant="destructive" className="w-fit mt-1 bg-orange-500">
                              🔥 Hot
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {quiz.questions?.length || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {quiz.timeLimit || 0} phút
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{quiz.totalAttempts}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{quiz.uniqueUsers}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {quiz.totalAttempts > 0 ? (
                          <Badge className={getScoreBgColor(quiz.avgScore)}>
                            <span className={getScoreColor(quiz.avgScore)}>
                              {quiz.avgScore.toFixed(1)}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={quiz.isActive}
                            onCheckedChange={() => handleToggleActive(quiz.id, quiz.isActive)}
                          />
                          {quiz.isDraft && (
                            <Badge variant="outline" className="text-xs">
                              Nháp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/quiz/${quiz.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/quiz/edit/${quiz.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateQuiz(quiz)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Bulk Delete Confirmation */}
        <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa {selectedQuizzes.length} bài thi đã chọn?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete}>
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
