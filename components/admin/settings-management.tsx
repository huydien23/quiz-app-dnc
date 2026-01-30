"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings, Save, RotateCcw, Globe, BookOpen, Bell,
    Palette, Shield, Clock, Users, Star, AlertCircle
} from "lucide-react"
import { SettingsService } from "@/lib/services"
import type { SystemSetting } from "@/lib/types"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/hooks/use-auth"

interface SettingCategory {
    key: string
    label: string
    icon: React.ElementType
    description: string
}

const CATEGORIES: SettingCategory[] = [
    { key: 'general', label: 'Chung', icon: Globe, description: 'Cài đặt chung của hệ thống' },
    { key: 'quiz', label: 'Bài thi', icon: BookOpen, description: 'Cấu hình cho bài thi' },
    { key: 'notification', label: 'Thông báo', icon: Bell, description: 'Cài đặt thông báo' },
    { key: 'security', label: 'Bảo mật', icon: Shield, description: 'Cài đặt bảo mật' },
]

export function SettingsManagement() {
    const [settings, setSettings] = useState<Record<string, SystemSetting>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [activeCategory, setActiveCategory] = useState('general')
    const { toast } = useToast()
    const { user } = useAuth()

    // Local state for form values
    const [formValues, setFormValues] = useState<Record<string, any>>({})

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const data = await SettingsService.getAllSettings()
            setSettings(data)

            // Initialize form values
            const values: Record<string, any> = {}
            Object.entries(data).forEach(([key, setting]) => {
                values[key] = setting.value
            })
            setFormValues(values)
        } catch (error) {
            console.error('Error loading settings:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải cài đặt",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key: string, value: any) => {
        setFormValues(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!user) return

        try {
            setSaving(true)

            // Only save changed values
            const changedSettings: Record<string, any> = {}
            Object.entries(formValues).forEach(([key, value]) => {
                if (settings[key] && settings[key].value !== value) {
                    changedSettings[key] = value
                }
            })

            if (Object.keys(changedSettings).length > 0) {
                await SettingsService.updateSettings(changedSettings, user.id)
                toast({
                    title: "Thành công",
                    description: "Đã lưu cài đặt"
                })
                loadSettings()
            }

            setHasChanges(false)
        } catch (error) {
            console.error('Error saving settings:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lưu cài đặt",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        if (!user) return
        if (!confirm("Bạn có chắc muốn reset tất cả cài đặt về mặc định?")) return

        try {
            setSaving(true)
            await SettingsService.resetAllSettings(user.id)
            toast({
                title: "Thành công",
                description: "Đã reset cài đặt về mặc định"
            })
            loadSettings()
            setHasChanges(false)
        } catch (error) {
            console.error('Error resetting settings:', error)
            toast({
                title: "Lỗi",
                description: "Không thể reset cài đặt",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const getSettingsByCategory = (category: string) => {
        return Object.entries(settings).filter(([_, setting]) => setting.category === category)
    }

    const renderSettingInput = (key: string, setting: SystemSetting) => {
        const value = formValues[key] ?? setting.value

        switch (setting.type) {
            case 'boolean':
                return (
                    <Switch
                        checked={value}
                        onCheckedChange={(checked) => handleChange(key, checked)}
                    />
                )
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(key, Number(e.target.value))}
                        className="w-32"
                    />
                )
            case 'string':
            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-64"
                    />
                )
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {[...Array(6)].map((_, i) => (
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
            {/* Header Actions Only (Title handled by parent AdminDashboard) */}
            <div className="flex justify-end mb-2">

                <div className="flex flex-wrap gap-2 text-primary">
                    <Button
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 shadow-sm font-bold text-xs uppercase tracking-wider h-10"
                        onClick={async () => {
                            if (confirm("Xác nhận khởi tạo các bảng database mới? Việc này sẽ không xóa dữ liệu cũ nhưng sẽ ghi đè các settings mặc định.")) {
                                const { seedUpgradeDatabase } = await import("@/lib/seed-upgrade")
                                const result = await seedUpgradeDatabase()
                                toast({
                                    title: result.success ? "Thành công" : "Lỗi",
                                    description: result.message
                                })
                                if (result.success) loadSettings()
                            }
                        }}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Khởi tạo Database
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={saving}
                        className="h-10 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider shadow-sm"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-sm"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>

            {hasChanges && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-700">Có thay đổi chưa được lưu</p>
                </div>
            )}

            {/* Settings Tabs */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Category Sidebar */}
                <Card className="border-0 shadow-lg lg:w-64 flex-shrink-0">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {CATEGORIES.map((category) => {
                                const Icon = category.icon
                                const isActive = activeCategory === category.key

                                return (
                                    <button
                                        key={category.key}
                                        onClick={() => setActiveCategory(category.key)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm font-bold ring-1 ring-indigo-100'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <div>
                                            <p className="text-sm">{category.label}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </nav>
                    </CardContent>
                </Card>

                {/* Settings Content */}
                <Card className="border-slate-200/60 shadow-sm flex-1 overflow-hidden">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            {(() => {
                                const cat = CATEGORIES.find(c => c.key === activeCategory)
                                const Icon = cat?.icon || Settings
                                return (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                            <Icon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-slate-800 text-lg font-bold">{cat?.label}</CardTitle>
                                            <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">{cat?.description}</CardDescription>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {getSettingsByCategory(activeCategory).map(([key, setting]) => (
                                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div className="flex-1 pr-4">
                                        <Label className="text-base font-medium text-slate-700">
                                            {setting.description}
                                        </Label>
                                        <p className="text-xs text-slate-500 mt-0.5">{key}</p>
                                        {setting.updatedAt && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Cập nhật lần cuối: {new Date(setting.updatedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        {renderSettingInput(key, setting)}
                                    </div>
                                </div>
                            ))}

                            {getSettingsByCategory(activeCategory).length === 0 && (
                                <div className="text-center py-8">
                                    <Settings className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500">Chưa có cài đặt nào trong danh mục này</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Đăng ký mới</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cho phép đăng ký tài khoản</p>
                                </div>
                            </div>
                            <Switch
                                checked={formValues.allow_registration ?? true}
                                onCheckedChange={(checked) => handleChange('allow_registration', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                                    <Star className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Bảng xếp hạng</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiển thị bảng xếp hạng</p>
                                </div>
                            </div>
                            <Switch
                                checked={formValues.enable_leaderboard ?? true}
                                onCheckedChange={(checked) => handleChange('enable_leaderboard', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                                    <Star className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Thành tựu</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bật hệ thống thành tựu</p>
                                </div>
                            </div>
                            <Switch
                                checked={formValues.enable_achievements ?? true}
                                onCheckedChange={(checked) => handleChange('enable_achievements', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
