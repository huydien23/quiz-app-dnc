"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, BookOpen, Award, Target, Calendar, 
  CheckCircle, AlertCircle, Info, Star, Trophy,
  X, Eye, EyeOff
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"

interface Notification {
  id: string
  type: 'achievement' | 'reminder' | 'update' | 'congratulation'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  actionUrl?: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, unread, read

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      // Mock data - in real app, this would come from API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'achievement',
          title: 'Chúc mừng! Bạn đã đạt điểm cao',
          message: 'Bạn vừa đạt 95% trong bài thi "Toán học cơ bản". Tiếp tục phát huy nhé!',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          actionUrl: '/dashboard/stats'
        },
        {
          id: '2',
          type: 'reminder',
          title: 'Nhắc nhở học tập',
          message: 'Bạn đã 3 ngày chưa làm bài thi nào. Hãy duy trì thói quen học tập nhé!',
          isRead: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          actionUrl: '/dashboard/quizzes'
        },
        {
          id: '3',
          type: 'congratulation',
          title: 'Hoàn thành 10 bài thi!',
          message: 'Chúc mừng bạn đã hoàn thành 10 bài thi đầu tiên. Bạn đang tiến bộ rất tốt!',
          isRead: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          actionUrl: '/dashboard/stats'
        },
        {
          id: '4',
          type: 'update',
          title: 'Cập nhật hệ thống',
          message: 'QuizMaster đã được cập nhật với nhiều tính năng mới. Hãy khám phá ngay!',
          isRead: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          actionUrl: '/guide'
        },
        {
          id: '5',
          type: 'achievement',
          title: 'Xếp hạng cao!',
          message: 'Bạn đã lên top 5 trong bảng xếp hạng tuần này. Xuất sắc!',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          actionUrl: '/dashboard/stats'
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (err) {
      console.error('Error loading notifications:', err)
      error("Không thể tải thông báo")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead)
      case 'read':
        return notifications.filter(n => n.isRead)
      default:
        return notifications
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
    success("Đã đánh dấu đã đọc")
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
    success("Đã đánh dấu tất cả đã đọc")
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
    success("Đã xóa thông báo")
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="h-5 w-5 text-yellow-600" />
      case 'reminder': return <Bell className="h-5 w-5 text-blue-600" />
      case 'update': return <Info className="h-5 w-5 text-cyan-600" />
      case 'congratulation': return <Trophy className="h-5 w-5 text-green-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-yellow-100 border-yellow-200'
      case 'reminder': return 'bg-blue-100 border-blue-200'
      case 'update': return 'bg-cyan-100 border-cyan-200'
      case 'congratulation': return 'bg-green-100 border-green-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Thông báo</h1>
            <p className="text-slate-600 font-body">Cập nhật và thông tin quan trọng</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {unreadCount} chưa đọc
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="btn-secondary"
              disabled={unreadCount === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-primary" : "btn-secondary"}
          >
            Tất cả ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "btn-primary" : "btn-secondary"}
          >
            Chưa đọc ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
            className={filter === "read" ? "btn-primary" : "btn-secondary"}
          >
            Đã đọc ({notifications.length - unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-2 transition-all duration-300 hover:shadow-xl ${
                notification.isRead 
                  ? 'border-0 bg-white/80 backdrop-blur-sm shadow-xl' 
                  : `${getNotificationColor(notification.type)} shadow-xl`
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-2 font-heading ${
                          notification.isRead ? 'text-slate-800' : 'text-slate-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-slate-600 font-body mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-body">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                          {!notification.isRead && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Mới
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-secondary"
                            onClick={() => window.location.href = notification.actionUrl!}
                          >
                            Xem
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mx-auto mb-4">
              <Bell className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2 font-heading">
              {filter === "all" ? 'Chưa có thông báo nào' : 'Không có thông báo phù hợp'}
            </h3>
            <p className="text-slate-600 font-body">
              {filter === "all" 
                ? 'Bạn sẽ nhận được thông báo khi có cập nhật mới' 
                : 'Thử thay đổi bộ lọc để xem thông báo khác'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
