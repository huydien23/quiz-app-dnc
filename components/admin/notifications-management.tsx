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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    Bell, Plus, Send, Trash2, Search, MoreHorizontal,
    Users, User, Eye, CheckCircle, AlertCircle, Info,
    Megaphone, BookOpen, Trophy, RefreshCw
} from "lucide-react"
import { NotificationService } from "@/lib/services"
import type { Notification, NotificationType } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

const NOTIFICATION_TYPES: { value: NotificationType; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'info', label: 'Thông tin', icon: Info, color: 'bg-blue-100 text-blue-700' },
    { value: 'success', label: 'Thành công', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'warning', label: 'Cảnh báo', icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
    { value: 'error', label: 'Lỗi', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
    { value: 'announcement', label: 'Thông báo chung', icon: Megaphone, color: 'bg-purple-100 text-purple-700' },
    { value: 'quiz_new', label: 'Quiz mới', icon: BookOpen, color: 'bg-cyan-100 text-cyan-700' },
    { value: 'achievement', label: 'Thành tựu', icon: Trophy, color: 'bg-amber-100 text-amber-700' },
]

interface NotificationFormData {
    title: string
    message: string
    type: NotificationType
    link: string
    targetType: 'all' | 'specific'
    userId: string
    expiresInDays: number
}

const defaultFormData: NotificationFormData = {
    title: '',
    message: '',
    type: 'info',
    link: '',
    targetType: 'all',
    userId: '',
    expiresInDays: 7
}

export function NotificationsManagement({ addTrigger, cleanupTrigger }: { addTrigger?: number, cleanupTrigger?: number }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<NotificationFormData>(defaultFormData)
    const [sending, setSending] = useState(false)
    const { toast } = useToast()

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        broadcast: 0,
        personal: 0
    })

    useEffect(() => {
        loadNotifications()
    }, [])

    useEffect(() => {
        if (addTrigger && addTrigger > 0) {
            setIsDialogOpen(true)
        }
    }, [addTrigger])

    useEffect(() => {
        if (cleanupTrigger && cleanupTrigger > 0) {
            handleCleanup()
        }
    }, [cleanupTrigger])

    const loadNotifications = async () => {
        try {
            if (notifications.length === 0) setLoading(true)
            const data = await NotificationService.getAllNotifications(200)
            setNotifications(data)

            // Calculate stats
            setStats({
                total: data.length,
                unread: data.filter(n => !n.isRead).length,
                broadcast: data.filter(n => n.userId === 'all').length,
                personal: data.filter(n => n.userId !== 'all').length
            })
        } catch (error) {
            console.error('Error loading notifications:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách thông báo",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tiêu đề và nội dung",
                variant: "destructive"
            })
            return
        }

        if (formData.targetType === 'specific' && !formData.userId.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập User ID",
                variant: "destructive"
            })
            return
        }

        try {
            setSending(true)

            const userId = formData.targetType === 'all' ? 'all' : formData.userId.trim()

            await NotificationService.createNotification(
                userId,
                formData.title,
                formData.message,
                formData.type,
                formData.link || undefined,
                formData.expiresInDays
            )

            toast({
                title: "Thành công",
                description: formData.targetType === 'all'
                    ? "Đã gửi thông báo đến tất cả người dùng"
                    : "Đã gửi thông báo"
            })

            setIsDialogOpen(false)
            setFormData(defaultFormData)
            loadNotifications()
        } catch (error) {
            console.error('Error sending notification:', error)
            toast({
                title: "Lỗi",
                description: "Không thể gửi thông báo",
                variant: "destructive"
            })
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async (notification: Notification) => {
        try {
            await NotificationService.deleteNotification(notification.id)
            toast({
                title: "Thành công",
                description: "Đã xóa thông báo"
            })
            loadNotifications()
        } catch (error) {
            console.error('Error deleting notification:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa thông báo",
                variant: "destructive"
            })
        }
    }

    const handleCleanup = async () => {
        if (!confirm("Xóa tất cả thông báo đã hết hạn?")) return

        try {
            const count = await NotificationService.cleanupExpiredNotifications()
            toast({
                title: "Thành công",
                description: `Đã xóa ${count} thông báo hết hạn`
            })
            loadNotifications()
        } catch (error) {
            console.error('Error cleaning up:', error)
        }
    }

    const getTypeInfo = (type: NotificationType) => {
        return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0]
    }

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || n.type === filterType
        return matchesSearch && matchesType
    })

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
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
                                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="hidden">
                {/* Actions handled by parent AdminDashboard */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Bell className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng thông báo</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <Eye className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Chưa đọc</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.unread}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Broadcast</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.broadcast}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                            <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Cá nhân</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.personal}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Tìm kiếm nội dung hoặc tiêu đề thông báo..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-slate-200 focus:border-indigo-500 transition-all h-10"
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-48 bg-white">
                        <SelectValue placeholder="Lọc theo loại" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {NOTIFICATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Notifications List */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">Chưa có thông báo nào</p>
                            <p className="text-sm text-slate-400 mt-1">Bấm "Tạo thông báo" để gửi mới</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((notification) => {
                                const typeInfo = getTypeInfo(notification.type)
                                const TypeIcon = typeInfo.icon

                                return (
                                    <div
                                        key={notification.id}
                                        className="p-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                                                <TypeIcon className="h-5 w-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                                                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(notification)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Xóa
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge variant="secondary" className={typeInfo.color}>
                                                        {typeInfo.label}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {notification.userId === 'all' ? 'Tất cả' : 'Cá nhân'}
                                                    </Badge>
                                                    {notification.isRead && (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                            Đã đọc
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-slate-500">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>

                                                {notification.link && (
                                                    <p className="text-xs text-blue-600 mt-2 truncate">
                                                        Link: {notification.link}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tạo thông báo mới</DialogTitle>
                        <DialogDescription>
                            Gửi thông báo đến tất cả hoặc một người dùng cụ thể
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Tiêu đề</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="VD: Thông báo quan trọng"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Nội dung</Label>
                            <Textarea
                                id="message"
                                value={formData.message}
                                onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Nhập nội dung thông báo..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Loại thông báo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v: NotificationType) => setFormData(prev => ({ ...prev, type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NOTIFICATION_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <type.icon className="h-4 w-4" />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Hết hạn sau</Label>
                                <Select
                                    value={String(formData.expiresInDays)}
                                    onValueChange={v => setFormData(prev => ({ ...prev, expiresInDays: Number(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 ngày</SelectItem>
                                        <SelectItem value="3">3 ngày</SelectItem>
                                        <SelectItem value="7">7 ngày</SelectItem>
                                        <SelectItem value="14">14 ngày</SelectItem>
                                        <SelectItem value="30">30 ngày</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Gửi đến</Label>
                            <Tabs
                                value={formData.targetType}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, targetType: v as 'all' | 'specific' }))}
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="all" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Tất cả
                                    </TabsTrigger>
                                    <TabsTrigger value="specific" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Cá nhân
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {formData.targetType === 'specific' && (
                                <Input
                                    placeholder="Nhập User ID"
                                    value={formData.userId}
                                    onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                                    className="mt-2"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link">Link (tùy chọn)</Label>
                            <Input
                                id="link"
                                value={formData.link}
                                onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="VD: /dashboard/quizzes"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSend} disabled={sending}>
                            <Send className="h-4 w-4 mr-2" />
                            {sending ? 'Đang gửi...' : 'Gửi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
