"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, Mail, Calendar, Award, Target, 
  BookOpen, Clock, Trophy, Star, Edit,
  Save, X, Camera, Shield, Bell
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  joinDate: string
  totalAttempts: number
  averageScore: number
  bestScore: number
  rank: number
  achievements: string[]
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    darkMode: boolean
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      // Build profile from auth context + placeholders
      const mockProfile: UserProfile = {
        id: user?.id || '',
        name: user?.name || 'Học sinh',
        email: user?.email || '',
        avatar: '',
        // Use actual createdAt from user record if available
        joinDate: user?.createdAt || new Date().toISOString(),
        totalAttempts: 25,
        averageScore: 78,
        bestScore: 95,
        rank: 3,
        achievements: [
          'Hoàn thành 10 bài thi đầu tiên',
          'Đạt điểm cao nhất 95%',
          'Học viên tích cực trong tuần',
          'Xếp hạng top 5'
        ],
        preferences: {
          notifications: true,
          emailUpdates: true,
          darkMode: false
        }
      }
      
      setProfile(mockProfile)
      setEditForm({
        name: mockProfile.name,
        email: mockProfile.email
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      error("Không thể tải thông tin cá nhân")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm({
      name: profile?.name || '',
      email: profile?.email || ''
    })
  }

  const handleSave = () => {
    // In real app, this would update the profile via API
    setProfile(prev => prev ? {
      ...prev,
      name: editForm.name,
      email: editForm.email
    } : null)
    setEditing(false)
    success("Đã cập nhật thông tin cá nhân")
  }

  const handleAvatarChange = () => {
    // In real app, this would upload avatar
    success("Tính năng đang phát triển")
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-32 bg-slate-200 rounded-full w-32 mx-auto mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded w-full mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 w-fit mx-auto mb-4">
            <User className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2 font-heading">
            Không thể tải thông tin cá nhân
          </h3>
          <p className="text-slate-600 font-body">
            Vui lòng thử lại sau
          </p>
        </div>
      </DashboardLayout>
    )
  }

  const safeFormatDistanceToNow = (value: any) => {
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return 'không rõ'
      return formatDistanceToNow(d, { addSuffix: true, locale: vi })
    } catch {
      return 'không rõ'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Hồ sơ cá nhân</h1>
            <p className="text-slate-600 font-body">Quản lý thông tin và cài đặt cá nhân</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Tài khoản xác thực
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="h-32 w-32 mx-auto">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-3xl font-bold">
                        {profile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full p-2"
                      onClick={handleAvatarChange}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 font-heading">
                    {profile.name}
                  </h2>
                  <p className="text-slate-600 font-body mb-4">
                    {profile.email}
                  </p>
                  
                  <div className="text-sm text-slate-500 font-body mb-6">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Tham gia {safeFormatDistanceToNow(profile.joinDate)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-body">Xếp hạng</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        #{profile.rank}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-body">Tổng lần làm</span>
                      <span className="font-semibold text-slate-800 font-heading">{profile.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-body">Điểm TB</span>
                      <span className="font-semibold text-slate-800 font-heading">{profile.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-body">Điểm cao nhất</span>
                      <span className="font-semibold text-slate-800 font-heading">{profile.bestScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 font-heading">Thành tích</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="text-sm text-slate-700 font-body">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 font-heading">Thông tin cá nhân</CardTitle>
                  <CardDescription className="text-slate-600 font-body">Cập nhật thông tin của bạn</CardDescription>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="btn-secondary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700 font-body">
                        Họ và tên
                      </Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700 font-body">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        className="btn-primary"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="btn-secondary"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 font-body">Họ và tên</Label>
                      <p className="text-slate-800 font-body mt-1">{profile.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 font-body">Email</Label>
                      <p className="text-slate-800 font-body mt-1">{profile.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 font-body">Ngày tham gia</Label>
                      <p className="text-slate-800 font-body mt-1">
                        {safeFormatDistanceToNow(profile.joinDate)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 font-heading">Cài đặt</CardTitle>
                <CardDescription className="text-slate-600 font-body">Tùy chỉnh trải nghiệm của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 font-heading">Thông báo</p>
                        <p className="text-sm text-slate-600 font-body">Nhận thông báo về hoạt động học tập</p>
                      </div>
                    </div>
                    <Button
                      variant={profile.preferences.notifications ? "default" : "outline"}
                      size="sm"
                      className={profile.preferences.notifications ? "btn-primary" : "btn-secondary"}
                    >
                      {profile.preferences.notifications ? 'Bật' : 'Tắt'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 font-heading">Email cập nhật</p>
                        <p className="text-sm text-slate-600 font-body">Nhận email về tiến độ học tập</p>
                      </div>
                    </div>
                    <Button
                      variant={profile.preferences.emailUpdates ? "default" : "outline"}
                      size="sm"
                      className={profile.preferences.emailUpdates ? "btn-primary" : "btn-secondary"}
                    >
                      {profile.preferences.emailUpdates ? 'Bật' : 'Tắt'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
