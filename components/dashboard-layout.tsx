"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight, Brain, 
  Shield, Smartphone, Globe, Heart, Code, Lightbulb,
  Menu, X, Home, Settings, LogOut, User, Bell
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const sidebarItems = [
    {
      name: "Trang chủ",
      href: "/dashboard",
      icon: Home,
      current: true
    },
    {
      name: "Bài thi",
      href: "/quizzes",
      icon: BookOpen,
      current: false
    },
    {
      name: "Lịch sử",
      href: "/dashboard/history",
      icon: BarChart3,
      current: false
    },
    {
      name: "Thống kê",
      href: "/dashboard/stats",
      icon: TrendingUp,
      current: false
    },
    {
      name: "Thông báo",
      href: "/dashboard/notifications",
      icon: Bell,
      current: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 font-heading">QuizMaster</h1>
                <p className="text-xs text-slate-500 font-body">Luyện thi trắc nghiệm</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    item.current 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 font-heading truncate">
                  {user?.name || 'Học sinh'}
                </p>
                <p className="text-xs text-slate-500 font-body truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link href="/dashboard/profile">
                <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100">
                  <User className="h-4 w-4 mr-3" />
                  Hồ sơ cá nhân
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100">
                  <Settings className="h-4 w-4 mr-3" />
                  Cài đặt
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-slate-800 font-heading">
                  Chào mừng trở lại, {user?.name || 'Học sinh'}!
                </h2>
                <p className="text-sm text-slate-600 font-body">
                  Tiếp tục hành trình học tập của bạn
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 font-body">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Trực tuyến
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
