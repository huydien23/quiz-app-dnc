"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, User, LogOut, Settings, Trophy, History, Shield, Menu, ChevronDown } from "lucide-react"

export function Navbar() {
  const { user, logout, refreshUser } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">QuizMaster</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-card" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="flex justify-between h-16" suppressHydrationWarning>
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">QuizMaster</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                  <Link href="/quizzes">
                    <Button variant="ghost">Bài Thi</Button>
                  </Link>
                  {user.role === 0 && (
                    <Link href="/admin">
                      <Button variant="ghost">Quản Trị</Button>
                    </Link>
                  )}
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden relative" ref={mobileMenuRef}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <Link 
                          href="/quizzes" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Bài Thi
                        </Link>
                        <Link 
                          href="/dashboard" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                        {user.role === 0 && (
                          <Link 
                            href="/admin" 
                            className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Quản Trị
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border rounded-md shadow-lg z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.role === 0 ? "🛡️ Admin" : "👤 User"}
                          </p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link 
                          href="/dashboard" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                        
                        <Link 
                          href="/dashboard/history" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Lịch sử thi
                        </Link>

                        {user.role === 0 && (
                          <>
                            <div className="border-t my-1"></div>
                            <Link 
                              href="/admin" 
                              className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Quản trị hệ thống
                            </Link>
                          </>
                        )}
                        
                        <div className="border-t my-1"></div>
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted"
                          onClick={async () => {
                            await refreshUser()
                            setIsUserMenuOpen(false)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Refresh Role
                        </button>
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Cài đặt
                        </button>
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted text-red-600"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button>Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}