"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClientOnly } from "@/components/client-only"
import { BookOpen, User, LogOut, Settings, Trophy, History, Shield, Menu, ChevronDown, X } from "lucide-react"
import { APP_CONFIG } from "@/lib/constants"

export function Navbar() {
  const { user, logout, refreshUser } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center min-w-0 flex-shrink-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-100 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 truncate">
                {APP_CONFIG.name}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link href="/#features" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Tính năng</Link>
            <Link href="/#about" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Giới thiệu</Link>
            <Link href="/#contact" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Liên hệ</Link>
            <Link href="/guide" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Hướng dẫn</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ClientOnly fallback={<div className="h-9 w-20 bg-slate-100 animate-pulse rounded-xl"></div>}>
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 mr-2">
                    <Link href="/quizzes">
                      <Button variant="ghost" size="sm" className="font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50">
                        Bài Thi
                      </Button>
                    </Link>
                    {user.role === 0 && (
                      <Link href="/admin">
                        <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50/50">
                          Quản Trị
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all outline-none"
                    >
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-100 mb-2">
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                          <div className="mt-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${user.role === 0 ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}>
                              <User className="h-3 w-3 mr-1" />
                              {user.role === 0 ? "Admin" : "Student"}
                            </span>
                          </div>
                        </div>

                        <div className="px-2 space-y-0.5">
                          <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                              <Trophy className="h-4 w-4" />
                              Dashboard
                            </div>
                          </Link>
                          <Link href="/dashboard/history" onClick={() => setIsUserMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                              <History className="h-4 w-4" />
                              Lịch sử thi
                            </div>
                          </Link>
                          {user.role === 0 && (
                            <Link href="/admin" onClick={() => setIsUserMenuOpen(false)}>
                              <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                <Shield className="h-4 w-4" />
                                Quản trị hệ thống
                              </div>
                            </Link>
                          )}
                          <div className="h-px bg-slate-100 my-1 mx-2" />
                          <button
                            onClick={async () => {
                              await refreshUser()
                              setIsUserMenuOpen(false)
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                          >
                            <Settings className="h-4 w-4" />
                            Cập nhật vai trò
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <LogOut className="h-4 w-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-bold text-slate-600 hover:text-blue-600 rounded-xl px-4">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 px-4">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </ClientOnly>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-xl transition-all outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white/95 backdrop-blur-xl z-[40] md:hidden animate-in fade-in slide-in-from-top-5 duration-300" ref={mobileMenuRef}>
          <div className="p-6 space-y-8 h-full overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">Trang chủ</Link>
              <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">Tính năng</Link>
              <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">Giới thiệu</Link>
              <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">Liên hệ</Link>
              <Link href="/guide" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">Hướng dẫn</Link>
            </div>

            <div className="pt-6 border-t border-slate-100">
              {user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 px-4 py-2">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-1 ring-slate-100">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/quizzes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-lg font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                      <BookOpen className="h-5 w-5" />
                      Bài Thi
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-lg font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                      <Trophy className="h-5 w-5" />
                      Dashboard
                    </Link>
                    {user.role === 0 && (
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-lg font-bold text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                        <Shield className="h-5 w-5" />
                        Quản trị hệ thống
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-lg font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                      <LogOut className="h-5 w-5" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl font-bold border-slate-200">Đăng nhập</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="lg" className="w-full h-14 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-100">Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}