"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    animate?: 'pulse' | 'shimmer' | 'none'
}

export function Skeleton({
    className,
    variant = 'rectangular',
    animate = 'pulse'
}: SkeletonProps) {
    return (
        <div className={cn(
            "bg-slate-200",
            variant === 'circular' ? 'rounded-full' : 'rounded-md',
            animate === 'pulse' && "animate-pulse",
            animate === 'shimmer' && "animate-shimmer overflow-hidden",
            className
        )} />
    )
}

export function QuizCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 space-y-4">
            <div className="flex justify-between items-start">
                <Skeleton className="h-10 w-10" variant="circular" />
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
            </div>
        </div>
    )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-4 py-2 border-b border-slate-100">
                {[...Array(cols)].map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                    {[...Array(cols)].map((_, j) => (
                        <Skeleton key={j} className="h-8 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}
