"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Bell, Check, CheckCheck, MoreHorizontal, Trash2,
    RefreshCw, ExternalLink, Info, AlertCircle, Trophy,
    BookOpen, Megaphone, CheckCircle
} from "lucide-react"
import { NotificationService } from "@/lib/services"
import type { Notification, NotificationType } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"

const NOTIFICATION_ICONS: Record<NotificationType, { icon: React.ElementType; color: string }> = {
    info: { icon: Info, color: 'bg-blue-100 text-blue-600' },
    success: { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    warning: { icon: AlertCircle, color: 'bg-amber-100 text-amber-600' },
    error: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    quiz_new: { icon: BookOpen, color: 'bg-cyan-100 text-cyan-600' },
    quiz_result: { icon: CheckCircle, color: 'bg-purple-100 text-purple-600' },
    achievement: { icon: Trophy, color: 'bg-amber-100 text-amber-600' },
    announcement: { icon: Megaphone, color: 'bg-indigo-100 text-indigo-600' },
}

export function StudentNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const { toast } = useToast()

    useEffect(() => {
        if (user) {
            loadNotifications()
        }
    }, [user])

    const loadNotifications = async () => {
        if (!user) return

        try {
            setLoading(true)
            const [data, count] = await Promise.all([
                NotificationService.getUserNotifications(user.id),
                NotificationService.getUnreadCount(user.id)
            ])
            setNotifications(data)
            setUnreadCount(count)
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (notification: Notification) => {
        if (notification.isRead) return

        try {
            await NotificationService.markAsRead(notification.id)
            loadNotifications()
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user || unreadCount === 0) return

        try {
            await NotificationService.markAllAsRead(user.id)
            toast({
                title: "Thành công",
                description: "Đã đánh dấu tất cả là đã đọc"
            })
            loadNotifications()
        } catch (error) {
            console.error('Error marking all as read:', error)
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
        }
    }

    const handleDeleteAllRead = async () => {
        if (!user) return

        try {
            await NotificationService.deleteReadNotifications(user.id)
            toast({
                title: "Thành công",
                description: "Đã xóa thông báo đã đọc"
            })
            loadNotifications()
        } catch (error) {
            console.error('Error deleting read notifications:', error)
        }
    }

    const getIconInfo = (type: NotificationType) => {
        return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg relative">
                        <Bell className="h-6 w-6 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Thông báo</h2>
                        <p className="text-sm text-slate-600">{unreadCount} chưa đọc</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={handleMarkAllAsRead} size="sm">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Đọc tất cả
                        </Button>
                    )}
                    <Button variant="outline" onClick={loadNotifications} size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                        <Bell className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-700">Không có thông báo</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Bạn sẽ nhận được thông báo khi có bài thi mới hoặc kết quả
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => {
                                    const iconInfo = getIconInfo(notification.type)
                                    const Icon = iconInfo.icon

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 transition-colors hover:bg-slate-50 ${!notification.isRead ? 'bg-blue-50/50' : ''
                                                }`}
                                            onClick={() => handleMarkAsRead(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconInfo.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-semibold truncate ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                                                    {notification.title}
                                                                </h4>
                                                                {!notification.isRead && (
                                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className={`text-sm mt-1 line-clamp-2 ${notification.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                                                                {notification.message}
                                                            </p>
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {!notification.isRead && (
                                                                    <DropdownMenuItem onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleMarkAsRead(notification)
                                                                    }}>
                                                                        <Check className="h-4 w-4 mr-2" />
                                                                        Đánh dấu đã đọc
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDelete(notification)
                                                                    }}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Xóa
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-slate-400">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                                                        </span>
                                                        {notification.link && (
                                                            <Link
                                                                href={notification.link}
                                                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                Xem chi tiết
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50">
                            <Button
                                variant="ghost"
                                className="w-full text-sm text-slate-600 hover:text-slate-800"
                                onClick={handleDeleteAllRead}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa thông báo đã đọc
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
