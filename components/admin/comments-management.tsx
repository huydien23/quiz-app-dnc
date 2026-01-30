"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    MessageSquare, Search, MoreHorizontal, Check, X,
    Star, Clock, User, Reply, Trash2, Eye, Filter
} from "lucide-react"
import { CommentService } from "@/lib/services"
import type { Comment } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export function CommentsManagement() {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending')
    const [searchQuery, setSearchQuery] = useState("")
    const [replyDialogOpen, setReplyDialogOpen] = useState(false)
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [replying, setReplying] = useState(false)
    const { toast } = useToast()

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        averageRating: 0
    })

    useEffect(() => {
        loadComments()
        loadStats()
    }, [])

    const loadComments = async () => {
        try {
            if (comments.length === 0) setLoading(true)
            const data = await CommentService.getAllComments(500)
            setComments(data)
        } catch (error) {
            console.error('Error loading comments:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách bình luận",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const data = await CommentService.getCommentsStats()
            setStats(data)
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    const handleApprove = async (comment: Comment) => {
        try {
            await CommentService.approveComment(comment.id)
            toast({
                title: "Thành công",
                description: "Đã duyệt bình luận"
            })
            loadComments()
            loadStats()
        } catch (error) {
            console.error('Error approving comment:', error)
            toast({
                title: "Lỗi",
                description: "Không thể duyệt bình luận",
                variant: "destructive"
            })
        }
    }

    const handleReject = async (comment: Comment) => {
        try {
            await CommentService.rejectComment(comment.id)
            toast({
                title: "Thành công",
                description: "Đã từ chối bình luận"
            })
            loadComments()
            loadStats()
        } catch (error) {
            console.error('Error rejecting comment:', error)
            toast({
                title: "Lỗi",
                description: "Không thể từ chối bình luận",
                variant: "destructive"
            })
        }
    }

    const handleDelete = async (comment: Comment) => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return

        try {
            await CommentService.deleteComment(comment.id)
            toast({
                title: "Thành công",
                description: "Đã xóa bình luận"
            })
            loadComments()
            loadStats()
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa bình luận",
                variant: "destructive"
            })
        }
    }

    const handleReply = async () => {
        if (!selectedComment || !replyContent.trim()) return

        try {
            setReplying(true)
            await CommentService.addAdminReply(selectedComment.id, replyContent)
            toast({
                title: "Thành công",
                description: "Đã gửi phản hồi"
            })
            setReplyDialogOpen(false)
            setReplyContent("")
            setSelectedComment(null)
            loadComments()
        } catch (error) {
            console.error('Error replying:', error)
            toast({
                title: "Lỗi",
                description: "Không thể gửi phản hồi",
                variant: "destructive"
            })
        } finally {
            setReplying(false)
        }
    }

    const openReplyDialog = (comment: Comment) => {
        setSelectedComment(comment)
        setReplyContent(comment.adminReply || "")
        setReplyDialogOpen(true)
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                ))}
            </div>
        )
    }

    const filteredComments = comments.filter(c => {
        const matchesSearch = c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.userName.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === 'pending') return !c.isApproved && matchesSearch
        if (activeTab === 'approved') return c.isApproved && matchesSearch
        return matchesSearch
    })

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Actions Only (Title handled by parent AdminDashboard) */}
            <div className="flex justify-end mb-2">
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng bình luận</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Chờ duyệt</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Đã duyệt</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                            <Star className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Đánh giá TB</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.averageRating}/5</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Chờ duyệt
                            {stats.pending > 0 && (
                                <Badge className="ml-1 bg-amber-500">{stats.pending}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Đã duyệt
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Tất cả
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative sm:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Tìm kiếm nội dung bình luận..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-slate-200 focus:border-indigo-500 transition-all h-10"
                    />
                </div>
            </div>

            {/* Comments List */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {filteredComments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">
                                {activeTab === 'pending' ? 'Không có bình luận chờ duyệt' : 'Chưa có bình luận nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredComments.map((comment) => (
                                <div key={comment.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold flex-shrink-0 shadow-sm">
                                            {comment.userName.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-900">{comment.userName}</h4>
                                                        {renderStars(comment.rating)}
                                                        <Badge
                                                            className={comment.isApproved
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-extrabold"
                                                                : "bg-amber-50 text-amber-700 border-amber-100 text-[10px] uppercase font-extrabold"
                                                            }
                                                        >
                                                            {comment.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {!comment.isApproved && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => handleApprove(comment)}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleReject(comment)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openReplyDialog(comment)}>
                                                                <Reply className="h-4 w-4 mr-2" />
                                                                Phản hồi
                                                            </DropdownMenuItem>
                                                            {comment.isApproved && (
                                                                <DropdownMenuItem onClick={() => handleReject(comment)}>
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Bỏ duyệt
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(comment)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Xóa
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-700 mt-2">{comment.content}</p>

                                            {comment.adminReply && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <p className="text-xs font-medium text-blue-700 mb-1">Phản hồi từ Admin:</p>
                                                    <p className="text-sm text-blue-800">{comment.adminReply}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent className="sm:max-w-md !bg-white border-slate-200/60 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0 focus:outline-none">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Phản hồi bình luận</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Gửi phản hồi chính thức từ quản trị viên đến người dùng
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {selectedComment && (
                        <div className="p-6 space-y-5">
                            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-slate-800 text-sm">{selectedComment.userName}</span>
                                    {renderStars(selectedComment.rating)}
                                </div>
                                <p className="text-sm text-slate-600 italic">"{selectedComment.content}"</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung phản hồi</Label>
                                <Textarea
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    placeholder="Nhập phản hồi của bạn..."
                                    rows={4}
                                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl transition-all resize-none shadow-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setReplyDialogOpen(false)}
                            className="h-10 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider px-6 transition-colors shadow-none"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleReply}
                            disabled={replying || !replyContent.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-indigo-200 shadow-lg transition-all border-none"
                        >
                            <Reply className="h-4 w-4 mr-2" />
                            {replying ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
