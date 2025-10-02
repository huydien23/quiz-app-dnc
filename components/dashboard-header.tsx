"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { BookOpen, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

function getTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/quizzes")) return "Bài thi"
  if (pathname.startsWith("/dashboard/history")) return "Lịch sử"
  if (pathname.startsWith("/dashboard/stats")) return "Thống kê"
  if (pathname.startsWith("/dashboard/profile")) return "Hồ sơ"
  if (pathname.startsWith("/dashboard/settings")) return "Cài đặt"
  if (pathname.startsWith("/leaderboard")) return "Bảng xếp hạng"
  return "QuizMaster"
}

export function DashboardHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const title = getTitle(pathname)

  return (
    <header className={cn(
      "sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200 safe-top",
      "h-16 flex items-center"
    )}>
      <div className="w-full px-4 flex items-center justify-between gap-3">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="leading-tight min-w-0">
            <div className="text-base font-semibold text-slate-900 truncate">{title}</div>
            {user?.name && (
              <div className="text-xs text-slate-600 truncate">Xin chào, {user.name}</div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="h-10 w-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100"
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="h-10 w-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100"
            aria-label="Hồ sơ"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}
