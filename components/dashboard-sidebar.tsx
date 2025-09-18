"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, BookOpen, Trophy, BarChart3, 
  History, Settings, User, LogOut
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const navigation = [
    {
      name: "Trang chủ",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard"
    },
    {
      name: "Bài thi",
      href: "/quizzes",
      icon: BookOpen,
      current: pathname === "/quizzes"
    },
    {
      name: "Bảng xếp hạng",
      href: "/leaderboard",
      icon: Trophy,
      current: pathname === "/leaderboard"
    },
    {
      name: "Thống kê",
      href: "/dashboard/stats",
      icon: BarChart3,
      current: pathname === "/dashboard/stats"
    },
    {
      name: "Lịch sử",
      href: "/dashboard/history",
      icon: History,
      current: pathname === "/dashboard/history"
    }
  ]


  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r border-slate-200", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link href="/" className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">QuizMaster</span>
            <p className="text-xs text-slate-600">Luyện thi trắc nghiệm</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                item.current
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link
              href="/dashboard/profile"
              className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <User className="mr-3 h-4 w-4" />
              Hồ sơ cá nhân
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Settings className="mr-3 h-4 w-4" />
              Cài đặt
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
