"use client"

import React from "react"
import { LucideIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    className?: string
}

export function EmptyState({
    icon: Icon = Search,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-500",
            className
        )}>
            <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <Icon className="h-10 w-10 text-slate-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
