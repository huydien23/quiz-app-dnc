"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    Target, Calendar, Plus, Trash2, CheckCircle, Clock,
    TrendingUp, BookOpen, Award, Flame, Edit2
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow, format, addDays, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"

import { StudyPlanService, type StudyGoal } from "@/lib/study-plan-service"

const GOAL_TYPES = [
    { value: 'quizzes', label: 'Số bài thi', icon: BookOpen, unit: 'bài' },
    { value: 'score', label: 'Điểm trung bình', icon: Target, unit: '%' },
    { value: 'streak', label: 'Chuỗi ngày', icon: Flame, unit: 'ngày' },
    { value: 'time', label: 'Thời gian học', icon: Clock, unit: 'phút' },
]

export function StudentStudyPlan() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [goals, setGoals] = useState<StudyGoal[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetType: 'quizzes' as StudyGoal['targetType'],
        targetValue: 10,
        deadlineDays: 7
    })

    useEffect(() => {
        if (user) {
            loadGoals()
        }
    }, [user])

    const loadGoals = async () => {
        try {
            setLoading(true)
            if (user) {
                const fetchedGoals = await StudyPlanService.getGoals(user.id)
                setGoals(fetchedGoals)
            }
        } catch (error) {
            console.error("Error loading goals:", error)
        } finally {
            setLoading(false)
        }
    }

    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')

    const handleCreateGoal = async () => {
        if (!formData.title.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên mục tiêu",
                variant: "destructive"
            })
            return
        }

        try {
            const newGoalData: Omit<StudyGoal, "id"> = {
                userId: user?.id || '',
                title: formData.title,
                description: formData.description,
                targetType: formData.targetType,
                targetValue: formData.targetValue,
                currentValue: 0,
                deadline: addDays(new Date(), formData.deadlineDays).toISOString(),
                status: 'active',
                createdAt: new Date().toISOString()
            }

            const id = await StudyPlanService.createGoal(newGoalData)
            setGoals(prev => [{ id, ...newGoalData }, ...prev])
            setIsDialogOpen(false)
            setFormData({
                title: '',
                description: '',
                targetType: 'quizzes',
                targetValue: 10,
                deadlineDays: 7
            })

            toast({
                title: "Thành công",
                description: "Đã tạo mục tiêu mới"
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tạo mục tiêu",
                variant: "destructive"
            })
        }
    }

    const handleDeleteGoal = async (id: string) => {
        try {
            await StudyPlanService.deleteGoal(id)
            setGoals(prev => prev.filter(g => g.id !== id))
            toast({
                title: "Đã xóa",
                description: "Đã xóa mục tiêu"
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa mục tiêu",
                variant: "destructive"
            })
        }
    }

    const handleCompleteGoal = async (id: string) => {
        try {
            const goal = goals.find(g => g.id === id)
            if (!goal) return

            await StudyPlanService.updateGoal(id, {
                status: 'completed' as const,
                currentValue: goal.targetValue
            })

            setGoals(prev => prev.map(g =>
                g.id === id ? { ...g, status: 'completed' as const, currentValue: g.targetValue } : g
            ))
            toast({
                title: "Chúc mừng!",
                description: "Bạn đã hoàn thành mục tiêu!"
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật mục tiêu",
                variant: "destructive"
            })
        }
    }

    const getGoalTypeInfo = (type: StudyGoal['targetType']) => {
        return GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[0]
    }

    const getProgressPercentage = (goal: StudyGoal) => {
        return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
    }

    const getDaysRemaining = (deadline: string) => {
        return Math.max(0, differenceInDays(new Date(deadline), new Date()))
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header Card */}
            <Card className="border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Target className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Kế hoạch học tập</h2>
                                <p className="text-sm text-slate-600">
                                    Đặt mục tiêu và theo dõi tiến độ học tập
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo mục tiêu
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                            <p className="text-xs text-slate-600">Đang thực hiện</p>
                            <p className="text-2xl font-bold text-indigo-600">{activeGoals.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                            <p className="text-xs text-slate-600">Hoàn thành</p>
                            <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                            <p className="text-xs text-slate-600">Tỉ lệ</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Goals */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Mục tiêu đang thực hiện
                </h3>

                {activeGoals.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                        <CardContent className="py-12 text-center">
                            <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600 font-medium">Chưa có mục tiêu nào</p>
                            <p className="text-sm text-slate-500 mt-1">Tạo mục tiêu đầu tiên để bắt đầu!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {activeGoals.map((goal) => {
                            const typeInfo = getGoalTypeInfo(goal.targetType)
                            const TypeIcon = typeInfo.icon
                            const progress = getProgressPercentage(goal)
                            const daysRemaining = getDaysRemaining(goal.deadline)

                            return (
                                <Card key={goal.id} className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                <TypeIcon className="h-6 w-6 text-indigo-600" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{goal.title}</h4>
                                                        {goal.description && (
                                                            <p className="text-sm text-slate-500 line-clamp-1">{goal.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleCompleteGoal(goal.id)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleDeleteGoal(goal.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">
                                                            {goal.currentValue} / {goal.targetValue} {typeInfo.unit}
                                                        </span>
                                                        <span className="font-medium text-indigo-600">{progress}%</span>
                                                    </div>
                                                    <Progress value={progress} className="h-2" />
                                                </div>

                                                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>Còn {daysRemaining} ngày</span>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                                                    >
                                                        {format(new Date(goal.deadline), 'dd/MM/yyyy')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-500" />
                        Đã hoàn thành ({completedGoals.length})
                    </h3>

                    <div className="space-y-2">
                        {completedGoals.slice(0, 5).map((goal) => {
                            const typeInfo = getGoalTypeInfo(goal.targetType)
                            const TypeIcon = typeInfo.icon

                            return (
                                <Card key={goal.id} className="border-0 shadow-md bg-green-50/50">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-700">{goal.title}</p>
                                                <p className="text-xs text-slate-500">
                                                    {goal.targetValue} {typeInfo.unit} đạt được
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Hoàn thành
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Create Goal Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold font-heading text-slate-800">Tạo mục tiêu mới</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Thiết lập mục tiêu để theo dõi và cải thiện kết quả học tập
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Tên mục tiêu</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="VD: Hoàn thành 10 bài thi"
                                className="h-11 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Mô tả (tùy chọn)</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Chi tiết về mục tiêu học tập..."
                                className="h-11 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-5 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Loại mục tiêu</Label>
                                <Select
                                    value={formData.targetType}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, targetType: v as StudyGoal['targetType'] }))}
                                >
                                    <SelectTrigger className="h-11 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {GOAL_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value} className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <type.icon className="h-4 w-4 text-slate-500" />
                                                    <span className="font-medium text-slate-700">{type.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="targetValue" className="text-sm font-semibold text-slate-700">Giá trị</Label>
                                <div className="relative">
                                    <Input
                                        id="targetValue"
                                        type="number"
                                        min={1}
                                        value={formData.targetValue}
                                        onChange={e => setFormData(prev => ({ ...prev, targetValue: parseInt(e.target.value) || 1 }))}
                                        className="h-11 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pr-10 font-bold"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        {getGoalTypeInfo(formData.targetType).unit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Thời hạn dự kiến</Label>
                            <Select
                                value={String(formData.deadlineDays)}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, deadlineDays: parseInt(v) }))}
                            >
                                <SelectTrigger className="h-11 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    <SelectItem value="3" className="rounded-lg">3 ngày</SelectItem>
                                    <SelectItem value="7" className="rounded-lg">1 tuần</SelectItem>
                                    <SelectItem value="14" className="rounded-lg">2 tuần</SelectItem>
                                    <SelectItem value="30" className="rounded-lg">1 tháng</SelectItem>
                                    <SelectItem value="90" className="rounded-lg">3 tháng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 gap-3 border-t">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-11 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreateGoal}
                            className="flex-[1.5] h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Tạo mục tiêu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
