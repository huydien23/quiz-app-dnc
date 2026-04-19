"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Trophy, Star, Flame, Award, Crown, Medal, Target, Timer,
    BookOpen, Moon, Sun, TrendingUp, CheckCircle, Lock
} from "lucide-react"
import { AchievementService } from "@/lib/services"
import type { Achievement, AchievementType, ACHIEVEMENT_DEFINITIONS } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
    Sparkles: Star,
    Star: Star,
    Flame: Flame,
    Trophy: Trophy,
    Medal: Medal,
    Crown: Crown,
    BookOpen: BookOpen,
    Award: Award,
    Timer: Timer,
    Moon: Moon,
    Sun: Sun,
    TrendingUp: TrendingUp,
    Target: Target,
}

const RARITY_LABELS: Record<string, string> = {
    common: 'Phổ biến',
    rare: 'Hiếm',
    epic: 'Sử thi',
    legendary: 'Huyền thoại',
}

const RARITY_COLORS = {
    common: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-500', icon: 'bg-slate-500' },
    rare: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-500', icon: 'bg-blue-500' },
    epic: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-500', icon: 'bg-purple-500' },
    legendary: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-500', icon: 'bg-amber-500' },
}

export function StudentAchievements() {
    const { user } = useAuth()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<{
        earned: number
        total: number
        percentage: number
        byRarity: Record<string, { earned: number; total: number }>
    } | null>(null)
    const [allDefinitions, setAllDefinitions] = useState<Record<AchievementType, any>>({} as any)
    const [activeTab, setActiveTab] = useState('earned')

    useEffect(() => {
        if (user) {
            loadAchievements()
        }
    }, [user])

    const loadAchievements = async () => {
        if (!user) return

        try {
            setLoading(true)

            const [userAchievements, progressData] = await Promise.all([
                AchievementService.getUserAchievements(user.id),
                AchievementService.getAchievementProgress(user.id)
            ])

            // Load definitions
            const { ACHIEVEMENT_DEFINITIONS } = await import('@/lib/types')
            setAllDefinitions(ACHIEVEMENT_DEFINITIONS)

            setAchievements(userAchievements)
            setProgress(progressData)
        } catch (error) {
            console.error('Error loading achievements:', error)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (iconName: string) => {
        return ICON_MAP[iconName] || Star
    }

    const earnedTypes = new Set(achievements.map(a => a.type))

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Progress Overview */}
            <Card className="border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-lg overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Thành tựu</h2>
                                <p className="text-sm text-slate-600">
                                    Bạn đã đạt được {progress?.earned || 0}/{progress?.total || 0} thành tựu
                                </p>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-600">Tiến độ</span>
                                <span className="text-sm font-bold text-amber-600">{progress?.percentage || 0}%</span>
                            </div>
                            <Progress value={progress?.percentage || 0} className="h-3 bg-amber-100" />
                        </div>
                    </div>

                    {/* Rarity Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                        {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => {
                            const data = progress?.byRarity[rarity] || { earned: 0, total: 0 }
                            const colors = RARITY_COLORS[rarity]
                            const percentage = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0

                            return (
                                <div
                                    key={rarity}
                                    className={`relative group overflow-hidden p-4 rounded-2xl bg-white border ${colors.border} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
                                >
                                    <p className={`text-xs font-bold uppercase tracking-wider ${colors.text} mb-1`}>{RARITY_LABELS[rarity]}</p>
                                    <div className="flex items-end justify-between">
                                        <h4 className="text-2xl font-black text-slate-800">
                                            {data.earned}<span className="text-slate-300 text-lg font-medium mx-1">/</span><span className="text-slate-400 text-lg font-medium">{data.total}</span>
                                        </h4>
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.bg.replace('from-', 'bg-')} ${colors.text}`}>
                                            {percentage}%
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${colors.icon}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                    <TabsTrigger
                        value="earned"
                        className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                        <Trophy className="h-4 w-4 mr-2" />
                        Đã đạt ({achievements.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="all"
                        className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-600 data-[state=active]:text-white"
                    >
                        <Star className="h-4 w-4 mr-2" />
                        Tất cả
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="earned" className="mt-6">
                    {achievements.length === 0 ? (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="py-12 text-center">
                                <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-semibold text-slate-700">Chưa có thành tựu</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Hoàn thành bài thi để mở khóa thành tựu đầu tiên!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.map((achievement) => {
                                const Icon = getIcon(achievement.icon)
                                const def = allDefinitions[achievement.type]
                                const rarityColors = RARITY_COLORS[(def?.rarity as keyof typeof RARITY_COLORS) || 'common']

                                return (
                                    <Card
                                        key={achievement.id}
                                        className={`border-2 ${rarityColors.border} shadow-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl`}
                                    >
                                        <div className={`h-2 bg-gradient-to-r ${rarityColors.bg.replace('from-', 'from-').replace('to-', 'to-')}`}
                                            style={{ background: `linear-gradient(to right, ${achievement.color}, ${achievement.color}dd)` }}
                                        />
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                                                    style={{ backgroundColor: `${achievement.color}20` }}
                                                >
                                                    <Icon className="h-6 w-6" style={{ color: achievement.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-800 truncate">{achievement.title}</h4>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-xs capitalize ${rarityColors.text} ${rarityColors.bg.replace('from-', 'bg-').split(' ')[0]}`}
                                                        >
                                                            {def?.rarity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Đạt được {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true, locale: vi })}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(allDefinitions).map(([type, def]) => {
                            const isEarned = earnedTypes.has(type as AchievementType)
                            const Icon = getIcon(def.icon)
                            const rarityColors = RARITY_COLORS[def.rarity as keyof typeof RARITY_COLORS]
                            const earnedAchievement = achievements.find(a => a.type === type)

                            return (
                                <Card
                                    key={type}
                                    className={`border-2 ${isEarned ? rarityColors.border : 'border-slate-200'} shadow-lg overflow-hidden transition-all ${isEarned ? 'hover:scale-[1.02] hover:shadow-xl' : 'opacity-70'
                                        }`}
                                >
                                    <div
                                        className="h-2"
                                        style={{
                                            background: isEarned
                                                ? `linear-gradient(to right, ${def.color}, ${def.color}dd)`
                                                : '#e2e8f0'
                                        }}
                                    />
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative ${isEarned ? '' : 'grayscale'
                                                    }`}
                                                style={{ backgroundColor: isEarned ? `${def.color}20` : '#f1f5f9' }}
                                            >
                                                <Icon
                                                    className="h-6 w-6"
                                                    style={{ color: isEarned ? def.color : '#94a3b8' }}
                                                />
                                                {!isEarned && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                                                        <Lock className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold truncate ${isEarned ? 'text-slate-800' : 'text-slate-500'}`}>
                                                        {def.title}
                                                    </h4>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-xs capitalize ${isEarned ? rarityColors.text : 'text-slate-400'}`}
                                                    >
                                                        {def.rarity}
                                                    </Badge>
                                                </div>
                                                <p className={`text-sm mt-1 ${isEarned ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {def.description}
                                                </p>
                                                {isEarned && earnedAchievement && (
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        <p className="text-xs text-green-600">
                                                            Đạt được {formatDistanceToNow(new Date(earnedAchievement.earnedAt), { addSuffix: true, locale: vi })}
                                                        </p>
                                                    </div>
                                                )}
                                                {!isEarned && (
                                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        Chưa mở khóa
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
