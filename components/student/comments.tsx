"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Send, ThumbsUp, Trash2, Clock, AlertCircle, Award, Edit2, Reply } from "lucide-react"
import { CommentService, SettingsService } from "@/lib/services"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import type { Comment } from "@/lib/types"

interface CommentSectionProps {
    quizId: string
}

export function CommentSection({ quizId }: CommentSectionProps) {
    const { user } = useAuth()
    const { success, error, warning } = useToast()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [content, setContent] = useState("")
    const [rating, setRating] = useState<number>(5)
    const [hoveredRating, setHoveredRating] = useState<number>(0)
    const [requireApproval, setRequireApproval] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")

    useEffect(() => {
        if (quizId) {
            loadComments()
            loadSettings()
        }
    }, [quizId])

    const loadSettings = async () => {
        const approval = await SettingsService.getSettingWithDefault('require_comment_approval', true)
        setRequireApproval(approval)
    }

    const loadComments = async () => {
        try {
            setLoading(true)
            const data = await CommentService.getQuizComments(quizId)
            setComments(data)
        } catch (err) {
            console.error("Error loading comments:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user) {
            warning("Vui lòng đăng nhập để bình luận")
            return
        }

        if (!content.trim()) {
            warning("Vui lòng nhập nội dung bình luận")
            return
        }

        try {
            setSubmitting(true)
            await CommentService.createComment(
                quizId,
                user.id,
                user.name,
                content,
                rating as 1 | 2 | 3 | 4 | 5,
                user.avatar,
                !requireApproval // auto approve if not required
            )

            setContent("")
            setRating(5)

            if (requireApproval) {
                success("Bình luận của bạn đã được gửi và đang chờ phê duyệt!")
            } else {
                success("Cảm ơn bạn đã đóng góp ý kiến!")
                loadComments() // Reload list if auto-approved
            }
        } catch (err) {
            error("Không thể gửi bình luận. Vui lòng thử lại.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return

        try {
            await CommentService.deleteComment(commentId)
            success("Đã xóa bình luận")
            loadComments()
        } catch (err) {
            error("Không thể xóa bình luận")
        }
    }

    const handleUpdate = async (commentId: string) => {
        if (!editContent.trim()) return

        try {
            setSubmitting(true)
            const comment = comments.find(c => c.id === commentId)
            if (!comment) return

            await CommentService.updateComment(commentId, editContent, comment.rating)
            success("Đã cập nhật bình luận")
            setEditingId(null)
            loadComments()
        } catch (err) {
            error("Không thể cập nhật bình luận")
        } finally {
            setSubmitting(false)
        }
    }

    const handleReplySubmit = async (parentId: string) => {
        if (!user) {
            warning("Vui lòng đăng nhập để phản hồi")
            return
        }

        if (!replyContent.trim()) {
            warning("Vui lòng nhập nội dung phản hồi")
            return
        }

        try {
            setSubmitting(true)
            await CommentService.createComment(
                quizId,
                user.id,
                user.name,
                replyContent,
                5, // Default rating for replies
                user.avatar,
                !requireApproval,
                parentId
            )

            setReplyContent("")
            setReplyingToId(null)

            if (requireApproval) {
                success("Phản hồi của bạn đang chờ phê duyệt!")
            } else {
                success("Đã gửi phản hồi!")
                loadComments()
            }
        } catch (err) {
            error("Không thể gửi phản hồi")
        } finally {
            setSubmitting(false)
        }
    }

    // Process comments into tree
    const mainComments = comments.filter(c => !c.parentId)
    const repliesMap = comments.reduce((acc, c) => {
        if (c.parentId) {
            if (!acc[c.parentId]) acc[c.parentId] = []
            acc[c.parentId].push(c)
        }
        return acc
    }, {} as Record<string, Comment[]>)

    return (
        <Card className="border-0 bg-white/50 backdrop-blur-sm shadow-xl mt-8">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        Thảo luận & Đánh giá
                    </CardTitle>
                    <CardDescription>Chia sẻ ý kiến của bạn về bài thi này</CardDescription>
                </div>
                {!loading && (
                    <Badge variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-600 border-blue-100">
                        {comments.length} bình luận
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="pt-6">
                {/* Submit Form */}
                {user ? (
                    <div className="mb-8 space-y-4 p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm transition-all focus-within:border-blue-200">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onMouseEnter={() => setHoveredRating(s)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            onClick={() => setRating(s)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`h-4 w-4 ${s <= (hoveredRating || rating)
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-slate-200"
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-[10px] text-slate-400 ml-2 uppercase font-bold tracking-wider">
                                        Đánh giá của bạn
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Textarea
                            placeholder="Chia sẻ suy nghĩ của bạn về bài thi..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[100px] border-0 focus-visible:ring-0 p-0 text-slate-700 placeholder:text-slate-400"
                        />

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-medium">
                                {requireApproval && "Bình luận sẽ được kiểm duyệt trước khi hiển thị."}
                            </p>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !content.trim()}
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-md transition-all hover:shadow-lg rounded-xl h-10 px-6"
                            >
                                {submitting ? (
                                    <Clock className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Gửi bình luận
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 font-medium">Vui lòng đăng nhập để bình luận và đánh giá bài thi này.</p>
                        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => window.location.href = '/login'}>
                            Đăng nhập ngay
                        </Button>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                    {loading ? (
                        [1, 2, 3].map((n) => (
                            <div key={n} className="flex gap-4 animate-pulse">
                                <div className="h-10 w-10 bg-slate-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                                    <div className="h-4 bg-slate-100 rounded w-full" />
                                </div>
                            </div>
                        ))
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium italic">Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
                        </div>
                    ) : (
                        mainComments.map((comment, index) => (
                            <div key={comment.id} className="space-y-4">
                                <div
                                    className="group flex gap-4 animate-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <Avatar className="h-10 w-10 shadow-sm border border-slate-100">
                                        <AvatarImage src={comment.userAvatar} />
                                        <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-sm font-bold text-slate-800">{comment.userName}</h5>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            className={`h-3 w-3 ${s <= comment.rating
                                                                ? "text-yellow-400 fill-yellow-400"
                                                                : "text-slate-200"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>

                                        {editingId === comment.id ? (
                                            <div className="space-y-3 p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-sm">
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="min-h-[80px] border-0 focus-visible:ring-0 p-0 text-sm"
                                                />
                                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-8 rounded-lg text-xs">Hủy</Button>
                                                    <Button size="sm" onClick={() => handleUpdate(comment.id)} disabled={submitting} className="h-8 rounded-lg text-xs bg-blue-600">Cập nhật</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-600 leading-relaxed break-words bg-white/70 p-3 rounded-2xl rounded-tl-none border border-slate-100 group-hover:bg-white transition-colors">
                                                {comment.content}
                                            </p>
                                        )}

                                        {comment.adminReply && (
                                            <div className="mt-3 ml-4 p-3 rounded-2xl bg-blue-50/50 border-l-4 border-blue-400 flex gap-3 animate-in slide-in-from-left-4 duration-500">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Award className="h-3 w-3 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700 mb-0.5">Phản hồi từ quản trị viên</p>
                                                    <p className="text-sm text-slate-700 italic">{comment.adminReply}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-2">
                                            <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-wider">
                                                <ThumbsUp className="h-3 w-3" />
                                                Thích
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setReplyingToId(comment.id)
                                                    setReplyContent("")
                                                }}
                                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-wider"
                                            >
                                                <Reply className="h-3 w-3" />
                                                Trả lời
                                            </button>
                                            {user?.id === comment.userId && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(comment.id)
                                                            setEditContent(comment.content)
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-green-500 transition-colors uppercase tracking-wider"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(comment.id)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Reply input */}
                                        {replyingToId === comment.id && (
                                            <div className="mt-4 ml-8 space-y-3 p-3 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Reply className="h-3 w-3 text-indigo-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phản hồi {comment.userName}</span>
                                                </div>
                                                <Textarea
                                                    placeholder="Viết phản hồi của bạn..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    className="min-h-[80px] border-0 focus-visible:ring-0 p-0 text-sm"
                                                />
                                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                                    <Button variant="ghost" size="sm" onClick={() => setReplyingToId(null)} className="h-8 rounded-lg text-xs">Hủy</Button>
                                                    <Button size="sm" onClick={() => handleReplySubmit(comment.id)} disabled={submitting} className="h-8 rounded-lg text-xs bg-indigo-600">Gửi</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Render Replies */}
                                        {repliesMap[comment.id] && (
                                            <div className="mt-4 ml-8 space-y-4 border-l-2 border-slate-100 pl-4">
                                                {repliesMap[comment.id].map((reply) => (
                                                    <div key={reply.id} className="flex gap-3 group/reply">
                                                        <Avatar className="h-8 w-8 shadow-sm">
                                                            <AvatarImage src={reply.userAvatar} />
                                                            <AvatarFallback>{reply.userName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h6 className="text-xs font-bold text-slate-800">{reply.userName}</h6>
                                                                <span className="text-[9px] text-slate-400 font-medium">
                                                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: vi })}
                                                                </span>
                                                            </div>
                                                            {editingId === reply.id ? (
                                                                <div className="space-y-2 p-2 bg-white border border-blue-100 rounded-xl shadow-sm">
                                                                    <Textarea
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="min-h-[60px] border-0 focus-visible:ring-0 p-0 text-xs"
                                                                    />
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 rounded-lg text-[10px]">Hủy</Button>
                                                                        <Button size="sm" onClick={() => handleUpdate(reply.id)} disabled={submitting} className="h-7 rounded-lg text-[10px] bg-blue-600">Lưu</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl rounded-tl-none border border-slate-50 group-hover/reply:bg-white transition-colors">
                                                                    {reply.content}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                {user?.id === reply.userId && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingId(reply.id)
                                                                                setEditContent(reply.content)
                                                                            }}
                                                                            className="text-[9px] font-bold text-slate-400 hover:text-green-500 uppercase tracking-wider"
                                                                        >
                                                                            Sửa
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(reply.id)}
                                                                            className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider"
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
