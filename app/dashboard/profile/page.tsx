"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, Mail, Calendar, Award, Target, 
  BookOpen, Clock, Trophy, Star, Edit,
  Save, X, Camera, Shield, Bell, BarChart3
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter, useSearchParams } from "next/navigation"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'info'
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  })

  const handleTabChange = (value: string) => {
    if (value === 'stats') {
      router.push('/dashboard/stats')
    } else {
      router.push('/dashboard/profile?tab=info')
    }
  }

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
      <div className="pb-24">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm h-11">
            <TabsTrigger 
              value="info"
              className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium">Thông tin</span>
              <span className="sm:hidden text-sm font-medium">Hồ sơ</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Thống kê</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
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
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-slate-700 font-body">Xếp hạng</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1">
                        #{profile.rank}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 font-body">Tổng lần làm</span>
                      </div>
                      <span className="font-bold text-slate-800 font-heading text-lg">{profile.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-700 font-body">Điểm TB</span>
                      </div>
                      <span className="font-bold text-green-600 font-heading text-lg">{profile.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700 font-body">Cao nhất</span>
                      </div>
                      <span className="font-bold text-purple-600 font-heading text-lg">{profile.bestScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements - Mobile optimized */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  Thành tích
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-100 flex-shrink-0">
                        <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-body leading-relaxed">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    Thông tin cá nhân
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 font-body mt-1">Cập nhật thông tin của bạn</CardDescription>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="btn-secondary h-9 sm:h-10 self-start sm:self-auto"
                  >
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Chỉnh sửa</span>
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

            {/* Preferences - Mobile optimized */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl mt-6 mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  Cài đặt
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-600 font-body">Tùy chỉnh trải nghiệm của bạn</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start sm:items-center gap-3 flex-1">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-blue-100 flex-shrink-0">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-slate-800 font-heading">Thông báo</p>
                        <p className="text-xs sm:text-sm text-slate-600 font-body mt-0.5">Nhận thông báo về hoạt động học tập</p>
                      </div>
                    </div>
                    <Button
                      variant={profile.preferences.notifications ? "default" : "outline"}
                      size="sm"
                      className={`${profile.preferences.notifications ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 px-4 sm:px-6 flex-shrink-0 self-end sm:self-auto`}
                    >
                      {profile.preferences.notifications ? 'Bật' : 'Tắt'}
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start sm:items-center gap-3 flex-1">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-green-100 flex-shrink-0">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-slate-800 font-heading">Email cập nhật</p>
                        <p className="text-xs sm:text-sm text-slate-600 font-body mt-0.5">Nhận email về tiến độ học tập</p>
                      </div>
                    </div>
                    <Button
                      variant={profile.preferences.emailUpdates ? "default" : "outline"}
                      size="sm"
                      className={`${profile.preferences.emailUpdates ? "btn-primary" : "btn-secondary"} h-9 sm:h-10 px-4 sm:px-6 flex-shrink-0 self-end sm:self-auto`}
                    >
                      {profile.preferences.emailUpdates ? 'Bật' : 'Tắt'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
