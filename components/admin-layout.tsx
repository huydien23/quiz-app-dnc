"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  FolderOpen,
  Bell,
  MessageSquare,
  History,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { APP_CONFIG } from "@/lib/constants"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { user, logout } = useAuth()

  const navigationGroups = [
    {
      title: "QUẢN TRỊ",
      items: [
        {
          name: "Bảng tổng quan",
          href: "/admin",
          icon: LayoutDashboard,
          current: pathname === "/admin" && !currentTab
        },
        {
          name: "Phân tích số liệu",
          href: "/admin/analytics",
          icon: BarChart3,
          current: pathname.startsWith("/admin/analytics")
        },
        {
          name: "Kết quả bài thi",
          href: "/admin?tab=results",
          icon: FileText,
          current: pathname === "/admin" && currentTab === 'results'
        }
      ]
    },
    {
      title: "NỘI DUNG",
      items: [
        {
          name: "Ngân hàng đề",
          href: "/admin/quizzes",
          icon: BookOpen,
          current: pathname.startsWith("/admin/quizzes") || pathname.startsWith("/admin/quiz")
        },
        {
          name: "Danh mục",
          href: "/admin?tab=categories",
          icon: FolderOpen,
          current: pathname === "/admin" && currentTab === 'categories'
        }
      ]
    },
    {
      title: "TƯƠNG TÁC",
      items: [
        {
          name: "Bình luận",
          href: "/admin?tab=comments",
          icon: MessageSquare,
          current: pathname === "/admin" && currentTab === 'comments'
        },
        {
          name: "Thông báo",
          href: "/admin?tab=notifications",
          icon: Bell,
          current: pathname === "/admin" && currentTab === 'notifications'
        }
      ]
    },
    {
      title: "HỆ THỐNG",
      items: [
        {
          name: "Người dùng",
          href: "/admin/users",
          icon: Users,
          current: pathname.startsWith("/admin/users")
        },
        {
          name: "Nhật ký",
          href: "/admin?tab=logs",
          icon: History,
          current: pathname === "/admin" && currentTab === 'logs'
        },
        {
          name: "Cấu hình",
          href: "/admin/settings",
          icon: Settings,
          current: pathname.startsWith("/admin/settings")
        }
      ]
    }
  ]

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Sharp & Clean Design - FIXED */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-64'}
      `}>
        <div className="flex flex-col h-screen overflow-hidden relative">
          {/* Collapse Toggle Button - Desktop Only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-slate-200 bg-white p-0 shadow-sm hidden lg:flex items-center justify-center text-slate-400 hover:text-indigo-600"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Brand Header */}
          <div className={`flex items-center gap-3 p-6 mb-2 transition-all duration-300 ${isCollapsed ? 'justify-center px-4' : ''}`} suppressHydrationWarning>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-md shadow-indigo-200" suppressHydrationWarning>
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="text-base font-bold text-slate-900 tracking-tight uppercase">{APP_CONFIG.name}</h1>
                <p className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Management</p>
              </div>
            )}
          </div>

          {/* Navigation with Groups */}
          <nav className="flex-1 px-3 space-y-7 overflow-y-auto overflow-x-hidden pt-2 pb-6 no-scrollbar">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isCollapsed ? (
                  <h3 className="px-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 animate-in fade-in duration-300">
                    {group.title}
                  </h3>
                ) : (
                  <div className="h-px bg-slate-100 mx-3 my-4" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = item.current
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={isCollapsed ? item.name : ""}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                          ${isActive
                            ? 'bg-indigo-50 text-indigo-700 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-5 after:bg-indigo-600 after:rounded-full'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                          ${isCollapsed ? 'justify-center px-0 w-10 mx-auto' : ''}
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {!isCollapsed && (
                          <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile - Clean & Minimal */}
          <div className={`p-4 border-t border-slate-100 bg-slate-50/50 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <div className={`flex items-center gap-3 p-2 mb-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <Avatar className="h-9 w-9 border border-white shadow-sm flex-shrink-0">
                <AvatarFallback className="bg-white text-indigo-600 font-bold text-xs">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-bold text-slate-900 truncate tracking-tight">
                    {user?.name || 'Administrator'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">
                      Admin
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              className={`bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 shadow-sm rounded-lg transition-all duration-200 ${isCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center' : 'w-full h-9 px-3 text-xs font-bold uppercase'
                }`}
            >
              <LogOut className={`h-3.5 w-3.5 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && "Đăng xuất"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content Area */}
      {/* Main Content Area - Scrollable with margin for fixed sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-64'}`}>
        {/* Mobile header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm tracking-tight uppercase">Admin Panel</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">A</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Dynamic Page Content - Scrollable */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
