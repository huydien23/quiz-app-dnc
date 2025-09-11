"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizService } from "@/lib/quiz-service"
import { useAuth } from "@/hooks/use-auth"
import type { QuizResult } from "@/lib/types"
import Link from "next/link"
import { Calendar, Search, Trophy, Clock, ArrowLeft } from "lucide-react"

export default function HistoryPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<QuizResult[]>([])
  const [filteredResults, setFilteredResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return

      try {
        const quizResults = await QuizService.getQuizResults(user.id)
        setResults(quizResults)
        setFilteredResults(quizResults)
      } catch (error) {
        console.error("Error loading history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user])

  useEffect(() => {
    const filtered = results.filter((result) => result.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredResults(filtered)
  }, [searchTerm, results])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Calendar className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải lịch sử...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Lịch sử làm bài</h1>
          <p className="text-muted-foreground">Xem lại tất cả các bài thi đã hoàn thành</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "Không tìm thấy kết quả" : "Chưa có lịch sử"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm
                  ? "Thử tìm kiếm với từ khóa khác"
                  : "Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu làm bài thi đầu tiên!"}
              </p>
              {!searchTerm && (
                <Link href="/quizzes">
                  <Button>Làm bài thi ngay</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.attempt.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{result.quiz.title}</CardTitle>
                      <CardDescription>{result.quiz.description}</CardDescription>
                    </div>
                    <Badge variant={getScoreBadgeVariant(result.percentage)} className="ml-4">
                      {result.percentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {result.correctAnswers}/{result.totalQuestions} đúng
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatTime(result.attempt.timeSpent)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{new Date(result.attempt.completedAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex justify-end">
                      <Link href={`/quiz/${result.quiz.id}`}>
                        <Button variant="outline" size="sm">
                          Làm lại
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
