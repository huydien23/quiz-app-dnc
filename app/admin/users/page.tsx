"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminService } from "@/lib/admin-service"
import { ArrowLeft, Plus, Search, Users, Mail, Calendar, Shield, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { QuizAttempt } from "@/lib/types"

interface User {
  id: string
  name: string
  email: string
  role: number
  createdAt: string
  lastLogin?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const [allUsers, allAttempts] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllAttempts()
      ])
      setUsers(allUsers)
      setFilteredUsers(allUsers)
      setAttempts(allAttempts)
    } catch (err) {
      setError("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: number) => {
    if (role === 0) {
      return (
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase font-bold">
          <Shield className="h-3 w-3 mr-1" /> Admin
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase font-bold">
        <Users className="h-3 w-3 mr-1" /> Học sinh
      </Badge>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        {/* Header (Synchronized with Dashboard) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                Quản lý học viên
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-500 ml-3.5">
              Xem và quản lý hệ thống tài khoản học viên chuyên nghiệp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/users/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-indigo-100 shadow-lg border-none">
                <Plus className="h-4 w-4 mr-2" />
                Tạo người dùng mới
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Tổng học viên</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => u.role === 1).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Admin</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => u.role === 0).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Dưới 30 ngày</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => attempts.some(a => a.userId === u.id)).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Mới tháng này</p>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => {
                    const userDate = new Date(u.createdAt)
                    const now = new Date()
                    return userDate.getMonth() === now.getMonth() &&
                      userDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6 relative group max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Tìm kiếm người dùng nhanh (tên hoặc email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 focus:border-indigo-500 transition-all h-11"
          />
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-y border-slate-100">
                    <TableHead className="w-16 font-bold text-slate-600 uppercase text-[10px] tracking-widest pl-6 italic">STT</TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Họ và tên</TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Tài khoản</TableHead>
                    <TableHead className="text-center font-bold text-slate-600 uppercase text-[10px] tracking-widest">Vai trò</TableHead>
                    <TableHead className="text-center font-bold text-slate-600 uppercase text-[10px] tracking-widest">Số bài thi</TableHead>
                    <TableHead className="text-center font-bold text-slate-600 uppercase text-[10px] tracking-widest">Điểm TB</TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Ngày đăng ký</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium mb-4">
                          {searchTerm ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"}
                        </p>
                        <Link href="/admin/users/create">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo người dùng mới
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const userAttempts = attempts.filter(a => a.userId === user.id)
                      const avgScore = userAttempts.length > 0
                        ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
                        : 0

                      return (
                        <TableRow
                          key={user.id}
                          className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                          <TableCell className="font-medium text-slate-700">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold flex-shrink-0 shadow-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-center">
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                              {userAttempts.length}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {userAttempts.length > 0 ? (
                              <Badge
                                variant="secondary"
                                className={`font-extrabold text-[10px] px-1.5 h-5 ${avgScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  avgScore >= 50 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                    "bg-rose-50 text-rose-700 border-rose-100"
                                  }`}
                              >
                                {avgScore}%
                              </Badge>
                            ) : (
                              <span className="text-slate-300 text-xs italic">Chưa thi</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: vi })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 p-4">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium mb-4">
                    {searchTerm ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"}
                  </p>
                  <Link href="/admin/users/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo người dùng mới
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredUsers.map((user, index) => {
                  const userAttempts = attempts.filter(a => a.userId === user.id)
                  const avgScore = userAttempts.length > 0
                    ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
                    : 0

                  return (
                    <div
                      key={user.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                            <h4 className="font-bold text-slate-900 truncate">{user.name}</h4>
                          </div>
                          <p className="text-sm text-slate-600 truncate">{user.email}</p>
                          {getRoleBadge(user.role)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Bài thi</p>
                          <p className="text-lg font-bold text-blue-600">{userAttempts.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Điểm TB</p>
                          {userAttempts.length > 0 ? (
                            <p className={`text-lg font-bold ${avgScore >= 80 ? 'text-green-600' :
                              avgScore >= 50 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                              {avgScore}%
                            </p>
                          ) : (
                            <p className="text-lg text-slate-300 font-bold">--</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Đăng ký</p>
                          <p className="text-xs font-medium text-slate-600">
                            {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {filteredUsers.length > 0 && (
              <div className="p-4 border-t border-slate-200 text-center text-sm text-slate-600 bg-slate-50">
                Hiển thị {filteredUsers.length} / {users.length} người dùng
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
