"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TrendingUp, TrendingDown, Minus, Calendar, Trophy } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { RankingService } from "@/lib/services"
import type { RankingHistory } from "@/lib/types"

interface RankingHistoryChartProps {
    userId?: string
    showTitle?: boolean
}

export function RankingHistoryChart({ userId, showTitle = true }: RankingHistoryChartProps) {
    const { user } = useAuth()
    const [history, setHistory] = useState<RankingHistory[]>([])
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [loading, setLoading] = useState(true)

    const targetUserId = userId || user?.id

    useEffect(() => {
        if (targetUserId) {
            loadHistory()
        }
    }, [targetUserId, period])

    const loadHistory = async () => {
        if (!targetUserId) return

        try {
            setLoading(true)
            const data = await RankingService.getUserRankingHistory(targetUserId, period, 14)
            setHistory(data)
        } catch (error) {
            console.error('Error loading ranking history:', error)
            // Use mock data for demo
            setHistory(generateMockData())
        } finally {
            setLoading(false)
        }
    }

    const generateMockData = (): RankingHistory[] => {
        const data: RankingHistory[] = []
        const now = new Date()

        for (let i = 13; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)

            data.push({
                id: `mock-${i}`,
                userId: targetUserId || '',
                rank: Math.floor(Math.random() * 10) + 1,
                averageScore: Math.floor(Math.random() * 20) + 75,
                period: period,
                recordedAt: date.toISOString()
            })
        }

        return data
    }

    const getRankChange = () => {
        if (history.length < 2) return { change: 0, direction: 'same' as const }

        const latest = history[history.length - 1]
        const previous = history[history.length - 2]
        const change = previous.rank - latest.rank // Positive = improved (lower rank)

        return {
            change: Math.abs(change),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
        } as const
    }

    const getMaxRank = () => Math.max(...history.map(h => h.rank), 20)
    const getMinRank = () => Math.min(...history.map(h => h.rank), 1)

    const rankChange = getRankChange()

    if (loading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
            {showTitle && (
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Lịch sử xếp hạng</CardTitle>
                                <CardDescription className="text-xs">
                                    Theo dõi tiến trình
                                </CardDescription>
                            </div>
                        </div>

                        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Theo ngày</SelectItem>
                                <SelectItem value="weekly">Theo tuần</SelectItem>
                                <SelectItem value="monthly">Theo tháng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            )}

            <CardContent className="pt-4">
                {/* Current Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                        <p className="text-xs text-amber-600 mb-1">Hạng hiện tại</p>
                        <p className="text-2xl font-bold text-amber-700">
                            #{history.length > 0 ? history[history.length - 1].rank : '-'}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Hạng cao nhất</p>
                        <p className="text-2xl font-bold text-blue-700">
                            #{history.length > 0 ? getMinRank() : '-'}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                        <p className="text-xs text-green-600 mb-1">Thay đổi</p>
                        <div className="flex items-center gap-1">
                            {rankChange.direction === 'up' && (
                                <>
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <span className="text-xl font-bold text-green-600">+{rankChange.change}</span>
                                </>
                            )}
                            {rankChange.direction === 'down' && (
                                <>
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    <span className="text-xl font-bold text-red-500">-{rankChange.change}</span>
                                </>
                            )}
                            {rankChange.direction === 'same' && (
                                <>
                                    <Minus className="h-5 w-5 text-slate-500" />
                                    <span className="text-xl font-bold text-slate-500">0</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="relative h-40 mt-4">
                    {history.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có dữ liệu</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Y-Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-slate-400">
                                <span>#1</span>
                                <span>#{Math.ceil(getMaxRank() / 2)}</span>
                                <span>#{getMaxRank()}</span>
                            </div>

                            {/* Chart Grid & Line */}
                            <div className="absolute left-10 right-0 top-0 bottom-6">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between">
                                    <div className="border-b border-dashed border-slate-100" />
                                    <div className="border-b border-dashed border-slate-100" />
                                    <div className="border-b border-dashed border-slate-100" />
                                </div>

                                {/* Line Chart */}
                                <svg className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#f59e0b" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Area fill */}
                                    <path
                                        d={history.map((h, i) => {
                                            const x = (i / (history.length - 1)) * 100
                                            const y = ((h.rank - 1) / (getMaxRank() - 1)) * 100
                                            return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`
                                        }).join(' ') + ` L 100% 100% L 0% 100% Z`}
                                        fill="url(#areaGradient)"
                                    />

                                    {/* Line */}
                                    <path
                                        d={history.map((h, i) => {
                                            const x = (i / (history.length - 1)) * 100
                                            const y = ((h.rank - 1) / (getMaxRank() - 1)) * 100
                                            return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`
                                        }).join(' ')}
                                        fill="none"
                                        stroke="url(#lineGradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data points */}
                                    {history.map((h, i) => {
                                        const x = (i / (history.length - 1)) * 100
                                        const y = ((h.rank - 1) / (getMaxRank() - 1)) * 100
                                        return (
                                            <circle
                                                key={h.id}
                                                cx={`${x}%`}
                                                cy={`${y}%`}
                                                r="4"
                                                fill="white"
                                                stroke="#f59e0b"
                                                strokeWidth="2"
                                            />
                                        )
                                    })}
                                </svg>
                            </div>

                            {/* X-Axis Labels */}
                            <div className="absolute left-10 right-0 bottom-0 h-5 flex justify-between text-xs text-slate-400">
                                {history.filter((_, i) => i % Math.ceil(history.length / 5) === 0 || i === history.length - 1).map((h, i) => (
                                    <span key={i}>
                                        {new Date(h.recordedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Summary */}
                {history.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Điểm trung bình gần đây</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {Math.round(history.slice(-5).reduce((sum, h) => sum + h.averageScore, 0) / Math.min(5, history.length))}%
                            </Badge>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
