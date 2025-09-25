"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, Clock, Award, Play, Eye, 
  Target, Search, Filter, Star, CheckCircle,
  ArrowRight, Calendar, Users
} from "lucide-react"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InlineQuiz } from "@/components/inline-quiz"
export default function QuizzesPage() {
  const { user } = useAuth()
  const { error } = useToast()
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      const allQuizzes = await QuizService.getAllQuizzes()
      const activeQuizzes = allQuizzes.filter(quiz => quiz.isActive)
      setQuizzes(activeQuizzes)
      setFilteredQuizzes(activeQuizzes)
    } catch (err) {
      console.error('Error loading quizzes:', err)
      error("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = quizzes.filter(quiz => 
      quiz.title?.toLowerCase().includes(term.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredQuizzes(filtered)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ'
      case 'medium': return 'Trung bình'
      case 'hard': return 'Khó'
      default: return 'Không xác định'
    }
  }

  const safeFormatDistanceToNow = (value: any) => {
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return 'không rõ'
      return formatDistanceToNow(d, { addSuffix: true, locale: vi })
    } catch {
      return 'không rõ'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Bài thi</h1>
            <p className="text-slate-600 font-body">Khám phá và làm các bài thi có sẵn</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-body">
            <BookOpen className="h-4 w-4" />
            <span>{filteredQuizzes.length} bài thi</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm bài thi..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm card-shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 font-heading">
                      {quiz.title}
                    </h3>
                    <Badge className={getDifficultyColor('medium')}>
                      {getDifficultyText('medium')}
                    </Badge>
                  </div>
                  
                  {quiz.description && (
                    <p className="text-sm text-slate-600 font-body line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-600 font-body">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{quiz.questions?.length || 0} câu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-100">
                        <Clock className="h-4 w-4 text-cyan-600" />
                      </div>
                      <span className="font-medium">{quiz.timeLimit} phút</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-body">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Tạo {safeFormatDistanceToNow(quiz.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>0 lượt làm</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/quiz/${quiz.id}`} className="flex-1">
                      <Button size="sm" className="w-full btn-primary">
                        <Play className="h-4 w-4 mr-2" />
                        Bắt đầu
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="btn-secondary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mx-auto mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2 font-heading">
              {searchTerm ? 'Không tìm thấy bài thi' : 'Chưa có bài thi nào'}
            </h3>
            <p className="text-slate-600 font-body">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy quay lại sau để xem các bài thi mới'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
