"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus, Pencil, Trash2, MoreHorizontal, FolderOpen, Search,
    GripVertical, BookOpen, Beaker, Calculator, Globe, History,
    Music, Palette, Code, Lightbulb, Heart, Star, Sparkles, Target, Activity, Power
} from "lucide-react"
import { CategoryService } from "@/lib/services"
import type { Category } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

// Available icons for categories
const CATEGORY_ICONS = [
    { name: 'BookOpen', icon: BookOpen, label: 'Sách' },
    { name: 'Beaker', icon: Beaker, label: 'Khoa học' },
    { name: 'Calculator', icon: Calculator, label: 'Toán học' },
    { name: 'Globe', icon: Globe, label: 'Địa lý' },
    { name: 'History', icon: History, label: 'Lịch sử' },
    { name: 'Music', icon: Music, label: 'Âm nhạc' },
    { name: 'Palette', icon: Palette, label: 'Nghệ thuật' },
    { name: 'Code', icon: Code, label: 'Lập trình' },
    { name: 'Lightbulb', icon: Lightbulb, label: 'Kiến thức' },
    { name: 'Heart', icon: Heart, label: 'Sức khỏe' },
    { name: 'Star', icon: Star, label: 'Đặc biệt' },
    { name: 'Sparkles', icon: Sparkles, label: 'Nổi bật' },
    { name: 'Target', icon: Target, label: 'Mục tiêu' },
]

// Predefined colors
const CATEGORY_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#14b8a6', // Teal
]

interface CategoryFormData {
    name: string
    description: string
    icon: string
    color: string
    isActive: boolean
}

const defaultFormData: CategoryFormData = {
    name: '',
    description: '',
    icon: 'BookOpen',
    color: '#3b82f6',
    isActive: true
}

export function CategoriesManagement({ addTrigger }: { addTrigger?: number }) {
    const [categories, setCategories] = useState<(Category & { activeQuizzes: number })[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        if (addTrigger && addTrigger > 0) {
            handleOpenDialog()
        }
    }, [addTrigger])

    const loadCategories = async () => {
        try {
            if (categories.length === 0) setLoading(true)
            const data = await CategoryService.getCategoriesWithStats()
            setCategories(data)
        } catch (error) {
            console.error('Error loading categories:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách danh mục",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name,
                description: category.description,
                icon: category.icon,
                color: category.color,
                isActive: category.isActive
            })
        } else {
            setEditingCategory(null)
            setFormData(defaultFormData)
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên danh mục",
                variant: "destructive"
            })
            return
        }

        try {
            setSaving(true)

            if (editingCategory) {
                await CategoryService.updateCategory(editingCategory.id, formData)
                toast({
                    title: "Thành công",
                    description: "Đã cập nhật danh mục"
                })
            } else {
                await CategoryService.createCategory({
                    ...formData,
                    parentId: null,
                    order: categories.length
                })
                toast({
                    title: "Thành công",
                    description: "Đã tạo danh mục mới"
                })
            }

            setIsDialogOpen(false)
            loadCategories()
        } catch (error) {
            console.error('Error saving category:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lưu danh mục",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (category: Category) => {
        if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
            return
        }

        try {
            await CategoryService.deleteCategory(category.id)
            toast({
                title: "Thành công",
                description: "Đã xóa danh mục"
            })
            loadCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa danh mục",
                variant: "destructive"
            })
        }
    }

    const handleToggleActive = async (category: Category) => {
        try {
            await CategoryService.updateCategory(category.id, { isActive: !category.isActive })
            loadCategories()
        } catch (error) {
            console.error('Error toggling category:', error)
        }
    }

    const getIconComponent = (iconName: string) => {
        const iconDef = CATEGORY_ICONS.find(i => i.name === iconName)
        if (!iconDef) return BookOpen
        return iconDef.icon
    }

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-md !bg-white border-slate-200/60 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0 focus:outline-none">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    {editingCategory
                                        ? 'Cập nhật thông tin danh mục để tổ chức bài thi tốt hơn'
                                        : 'Tạo danh mục mới để phân loại và quản lý bài thi chuyên nghiệp'
                                    }
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên danh mục</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="VD: Toán học, Lập trình..."
                                    className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Mô tả ngắn về danh mục..."
                                    rows={3}
                                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Biểu tượng</Label>
                                <div className="grid grid-cols-6 gap-2">
                                    {CATEGORY_ICONS.map(({ name, icon: Icon, label }) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                                            className={`p-2.5 rounded-xl border-2 transition-all ${formData.icon === name
                                                ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                                                }`}
                                            title={label}
                                        >
                                            <Icon className={`h-5 w-5 mx-auto ${formData.icon === name ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Màu sắc</Label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === color
                                                ? 'border-slate-400 ring-2 ring-offset-2 ring-slate-400'
                                                : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="active" className="text-xs font-bold uppercase tracking-wider text-slate-500">Kích hoạt danh mục</Label>
                                <Switch
                                    id="active"
                                    checked={formData.isActive}
                                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-10 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider px-6 transition-colors"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-indigo-200 shadow-lg transition-all"
                            >
                                {saving ? 'Đang xử lý...' : editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <FolderOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng danh mục</p>
                            <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                            <Activity className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {categories.filter(c => c.isActive).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                            <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng quiz</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {categories.reduce((sum, c) => sum + c.activeQuizzes, 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <Star className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Trung bình</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {categories.length > 0
                                    ? Math.round(categories.reduce((sum, c) => sum + c.activeQuizzes, 0) / categories.length)
                                    : 0
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                    placeholder="Tìm kiếm danh mục nhanh..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-slate-200 focus:border-indigo-500 transition-all h-11"
                />
            </div>

            {/* Categories Table */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">
                                {searchQuery ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bấm "Thêm danh mục" để tạo mới'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Danh mục</TableHead>
                                    <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                                    <TableHead className="text-center">Số Quiz</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.map((category) => {
                                    const IconComponent = getIconComponent(category.icon)

                                    return (
                                        <TableRow key={category.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${category.color}20` }}
                                                >
                                                    <IconComponent
                                                        className="h-5 w-5"
                                                        style={{ color: category.color }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{category.name}</p>
                                                    <p className="text-xs text-slate-500 md:hidden">{category.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <p className="text-sm text-slate-600 line-clamp-2">{category.description}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase font-bold">
                                                    {category.activeQuizzes} quiz
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={category.isActive
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-bold"
                                                        : "bg-slate-50 text-slate-500 border-slate-100 text-[10px] uppercase font-bold"
                                                    }
                                                >
                                                    {category.isActive ? 'Hoạt động' : 'Đã ẩn'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(category)}>
                                                            <Power className="h-4 w-4 mr-2" />
                                                            {category.isActive ? 'Tắt' : 'Bật'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(category)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
