"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        label: string
        isPositive: boolean
    }
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink' | 'indigo' | 'amber'
    className?: string
    loading?: boolean
}

const COLOR_MAP = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    cyan: "from-cyan-500 to-cyan-600",
    pink: "from-pink-500 to-pink-600",
    indigo: "from-indigo-500 to-indigo-600",
    amber: "from-amber-500 to-amber-600",
}

const BG_COLOR_MAP = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    cyan: "bg-cyan-50",
    pink: "bg-pink-50",
    indigo: "bg-indigo-50",
    amber: "bg-amber-50",
}

const TEXT_COLOR_MAP = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    cyan: "text-cyan-600",
    pink: "text-pink-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    color = 'blue',
    className,
    loading = false
}: StatCardProps) {
    if (loading) {
        return (
            <Card className={cn("border-0 shadow-lg animate-pulse", className)}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                            <div className="h-6 bg-slate-200 rounded w-3/4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 card-hover-lift", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                            {value}
                        </h3>
                        {description && (
                            <p className="text-xs text-slate-400 mt-1">{description}</p>
                        )}
                    </div>

                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                        "bg-gradient-to-br", COLOR_MAP[color]
                    )}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>

                {trend && (
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                            trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                            {trend.isPositive ? '+' : '-'}{trend.value}%
                        </span>
                        <span className="text-xs text-slate-400">{trend.label}</span>
                    </div>
                )}
            </CardContent>

            {/* Background design elements */}
            <div className={cn(
                "absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150",
                BG_COLOR_MAP[color]
            )} />
        </Card>
    )
}
