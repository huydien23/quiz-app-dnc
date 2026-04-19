"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Bookmark, BookmarkX, Search, MoreHorizontal, Play,
    Clock, Users, Star, Trash2, FileText, RefreshCw
} from "lucide-react"
import { BookmarkService } from "@/lib/services"
import type { Bookmark as BookmarkType, Quiz } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface BookmarkWithQuiz extends BookmarkType {
    quiz: Quiz | null
}

export function StudentBookmarks() {
    const { user } = useAuth()
    const [bookmarks, setBookmarks] = useState<BookmarkWithQuiz[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        if (user) {
            loadBookmarks()
        }
    }, [user])

    const loadBookmarks = async () => {
        if (!user) return

        try {
            setLoading(true)
            const data = await BookmarkService.getUserBookmarksWithQuizzes(user.id)
            setBookmarks(data)
        } catch (error) {
            console.error('Error loading bookmarks:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách đã lưu",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (bookmark: BookmarkWithQuiz) => {
        try {
            await BookmarkService.removeBookmark(bookmark.id)
            toast({
                title: "Thành công",
                description: "Đã bỏ lưu bài thi"
            })
            loadBookmarks()
        } catch (error) {
            console.error('Error removing bookmark:', error)
            toast({
                title: "Lỗi",
                description: "Không thể bỏ lưu",
                variant: "destructive"
            })
        }
    }

    const handleStartQuiz = (quizId: string) => {
        window.location.href = `/quiz/${quizId}`
    }

    const filteredBookmarks = bookmarks.filter(b =>
        b.quiz?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.quiz?.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                        <Bookmark className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Đã lưu</h2>
                        <p className="text-sm text-slate-600">{bookmarks.length} bài thi</p>
                    </div>
                </div>

                <Button variant="outline" onClick={loadBookmarks} className="flex-shrink-0">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Tìm kiếm bài thi đã lưu..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                />
            </div>

            {/* Bookmarks List */}
            {filteredBookmarks.length === 0 ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                        <Bookmark className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-700">
                            {searchQuery ? 'Không tìm thấy bài thi' : 'Chưa lưu bài thi nào'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-2">
                            {searchQuery
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Bấm vào biểu tượng bookmark để lưu bài thi yêu thích'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredBookmarks.map((bookmark) => {
                        const quiz = bookmark.quiz

                        if (!quiz) {
                            return (
                                <Card key={bookmark.id} className="border-0 shadow-md opacity-60">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-500">Bài thi không còn tồn tại</p>
                                                    <p className="text-xs text-slate-400">ID: {bookmark.quizId}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(bookmark)}
                                            >
                                                <Trash2 className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        }

                        return (
                            <Card key={bookmark.id} className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                                    <FileText className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 truncate">{quiz.title}</h4>
                                                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">{quiz.description}</p>

                                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            {quiz.questions?.length || 0} câu
                                                        </Badge>
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {quiz.timeLimit} phút
                                                        </Badge>
                                                        {quiz.isActive ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                Hoạt động
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                                                                Tạm dừng
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Đã lưu {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true, locale: vi })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                            <Button
                                                onClick={() => handleStartQuiz(quiz.id)}
                                                disabled={!quiz.isActive}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Làm bài
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleRemove(bookmark)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <BookmarkX className="h-4 w-4 mr-2" />
                                                        Bỏ lưu
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
