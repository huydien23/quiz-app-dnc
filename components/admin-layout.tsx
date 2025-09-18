"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Shield
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: pathname === "/admin"
    },
    {
      name: "Quản lý bài thi",
      href: "/admin/quizzes",
      icon: BookOpen,
      current: pathname.startsWith("/admin/quizzes")
    },
    {
      name: "Người dùng",
      href: "/admin/users",
      icon: Users,
      current: pathname.startsWith("/admin/users")
    },
    {
      name: "Thống kê",
      href: "/admin/analytics",
      icon: BarChart3,
      current: pathname.startsWith("/admin/analytics")
    },
    {
      name: "Cài đặt",
      href: "/admin/settings",
      icon: Settings,
      current: pathname.startsWith("/admin/settings")
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50" style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-slate-200/50
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-600">QuizMaster</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${item.current 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
                <Badge variant="destructive" className="text-xs mt-1">
                  Admin
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64" style={{ marginTop: '-500px', paddingTop: '24px' }}>
        {/* Mobile header */}
        <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-slate-200/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Admin Panel</span>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="p-6" style={{ marginTop: 0, paddingTop: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
