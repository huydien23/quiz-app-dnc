"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import {
    History, Search, RefreshCw, User, FileText, Settings,
    Plus, Pencil, Trash2, LogIn, LogOut, Play, CheckSquare,
    Download, Upload, Filter, Calendar, ChevronLeft, ChevronRight, Target
} from "lucide-react"
import { AuditLogService } from "@/lib/services"
import type { AuditLog, AuditAction, AuditTargetType } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { format, formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

const ACTION_INFO: Record<AuditAction, { label: string; icon: React.ElementType; color: string }> = {
    create: { label: 'Tạo mới', icon: Plus, color: 'bg-green-100 text-green-700' },
    update: { label: 'Cập nhật', icon: Pencil, color: 'bg-blue-100 text-blue-700' },
    delete: { label: 'Xóa', icon: Trash2, color: 'bg-red-100 text-red-700' },
    login: { label: 'Đăng nhập', icon: LogIn, color: 'bg-cyan-100 text-cyan-700' },
    logout: { label: 'Đăng xuất', icon: LogOut, color: 'bg-slate-100 text-slate-700' },
    quiz_start: { label: 'Bắt đầu thi', icon: Play, color: 'bg-purple-100 text-purple-700' },
    quiz_submit: { label: 'Nộp bài', icon: CheckSquare, color: 'bg-amber-100 text-amber-700' },
    password_change: { label: 'Đổi mật khẩu', icon: Settings, color: 'bg-orange-100 text-orange-700' },
    settings_change: { label: 'Thay đổi cài đặt', icon: Settings, color: 'bg-indigo-100 text-indigo-700' },
    export: { label: 'Xuất dữ liệu', icon: Download, color: 'bg-teal-100 text-teal-700' },
    import: { label: 'Nhập dữ liệu', icon: Upload, color: 'bg-pink-100 text-pink-700' },
}

const TARGET_INFO: Record<AuditTargetType, { label: string }> = {
    quiz: { label: 'Bài thi' },
    user: { label: 'Người dùng' },
    category: { label: 'Danh mục' },
    comment: { label: 'Bình luận' },
    notification: { label: 'Thông báo' },
    settings: { label: 'Cài đặt' },
    attempt: { label: 'Lần làm bài' },
}

const ITEMS_PER_PAGE = 20

export function AuditLogs({ cleanupTrigger }: { cleanupTrigger?: number }) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterAction, setFilterAction] = useState<string>("all")
    const [filterTarget, setFilterTarget] = useState<string>("all")
    const [page, setPage] = useState(1)
    const { toast } = useToast()

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        thisWeek: 0,
        topAction: ''
    })

    useEffect(() => {
        loadLogs()
    }, [])

    useEffect(() => {
        if (cleanupTrigger && cleanupTrigger > 0) {
            handleCleanup()
        }
    }, [cleanupTrigger])

    useEffect(() => {
        applyFilters()
    }, [logs, searchQuery, filterAction, filterTarget])

    const loadLogs = async () => {
        try {
            if (logs.length === 0) setLoading(true)
            const data = await AuditLogService.getLogs(1000)
            setLogs(data)

            // Calculate stats
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)

            const todayLogs = data.filter(l => new Date(l.timestamp) >= today)
            const weekLogs = data.filter(l => new Date(l.timestamp) >= weekAgo)

            // Find most common action
            const actionCounts = new Map<string, number>()
            data.forEach(l => {
                actionCounts.set(l.action, (actionCounts.get(l.action) || 0) + 1)
            })
            const topAction = Array.from(actionCounts.entries())
                .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

            setStats({
                total: data.length,
                today: todayLogs.length,
                thisWeek: weekLogs.length,
                topAction: ACTION_INFO[topAction as AuditAction]?.label || topAction
            })
        } catch (error) {
            console.error('Error loading logs:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải nhật ký",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = [...logs]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(log =>
                log.userName.toLowerCase().includes(query) ||
                log.targetId.toLowerCase().includes(query) ||
                log.details?.description?.toLowerCase().includes(query)
            )
        }

        if (filterAction !== 'all') {
            result = result.filter(log => log.action === filterAction)
        }

        if (filterTarget !== 'all') {
            result = result.filter(log => log.targetType === filterTarget)
        }

        setFilteredLogs(result)
        setPage(1)
    }

    const handleCleanup = async () => {
        if (!confirm("Xóa tất cả nhật ký cũ hơn 90 ngày?")) return

        try {
            const count = await AuditLogService.cleanupOldLogs(90)
            toast({
                title: "Thành công",
                description: `Đã xóa ${count} bản ghi`
            })
            loadLogs()
        } catch (error) {
            console.error('Error cleaning up:', error)
        }
    }

    const getActionInfo = (action: AuditAction) => {
        return ACTION_INFO[action] || { label: action, icon: FileText, color: 'bg-slate-100 text-slate-700' }
    }

    const getTargetLabel = (type: AuditTargetType) => {
        return TARGET_INFO[type]?.label || type
    }

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <History className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng bản ghi</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Hôm nay</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tuần này</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.thisWeek}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <FileText className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Phổ biến nhất</p>
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{stats.topAction || '-'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Tìm kiếm theo người dùng, mô tả hoạt động..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl transition-all shadow-sm"
                    />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-full sm:w-56 h-11 border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Lọc hành động" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="font-bold text-xs uppercase tracking-wider">Tất cả hành động</SelectItem>
                        {Object.entries(ACTION_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key} className="text-sm">{info.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterTarget} onValueChange={setFilterTarget}>
                    <SelectTrigger className="w-full sm:w-56 h-11 border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Lọc đối tượng" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="font-bold text-xs uppercase tracking-wider">Tất cả đối tượng</SelectItem>
                        {Object.entries(TARGET_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key} className="text-sm">{info.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Logs Table */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {paginatedLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">Không có bản ghi nào</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest pl-6">Thời gian</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Người dùng</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Hành động</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Đối tượng</TableHead>
                                        <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest hidden md:table-cell pr-6">Chi tiết</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLogs.map((log) => {
                                        const actionInfo = getActionInfo(log.action)
                                        const ActionIcon = actionInfo.icon

                                        return (
                                            <TableRow key={log.id} className="hover:bg-slate-50/50">
                                                <TableCell className="whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {format(new Date(log.timestamp), 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                            <User className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                                                            {log.userName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${actionInfo.color} border-0 text-[10px] font-extrabold uppercase px-2 py-0.5`}>
                                                        <ActionIcon className="h-3 w-3 mr-1" />
                                                        {actionInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium">{getTargetLabel(log.targetType)}</p>
                                                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{log.targetId}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <p className="text-sm text-slate-600 truncate max-w-[200px]">
                                                        {log.details?.description || '-'}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                    <p className="text-sm text-slate-500">
                                        Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredLogs.length)} / {filteredLogs.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-slate-600">
                                            Trang {page} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
