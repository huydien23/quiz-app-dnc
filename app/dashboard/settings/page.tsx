"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, Bell, Mail, Shield, Palette, 
  Globe, Smartphone, Monitor, Moon, Sun,
  Save, RotateCcw, Trash2, AlertTriangle
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"
import { DashboardLayout } from "@/components/dashboard-layout"

interface SettingsData {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    achievements: boolean
    reminders: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends'
    showStats: boolean
    showRank: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    fontSize: 'small' | 'medium' | 'large'
  }
  security: {
    twoFactor: boolean
    loginAlerts: boolean
    sessionTimeout: number
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      achievements: true,
      reminders: true
    },
    privacy: {
      profileVisibility: 'public',
      showStats: true,
      showRank: true
    },
    appearance: {
      theme: 'light',
      language: 'vi',
      fontSize: 'medium'
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      sessionTimeout: 30
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Mock data - in real app, this would come from API
      // Settings are already initialized above
      setLoading(false)
    } catch (err) {
      console.error('Error loading settings:', err)
      error("Không thể tải cài đặt")
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // In real app, this would save settings via API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      success("Đã lưu cài đặt")
    } catch (err) {
      error("Không thể lưu cài đặt")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        email: true,
        push: true,
        sms: false,
        achievements: true,
        reminders: true
      },
      privacy: {
        profileVisibility: 'public',
        showStats: true,
        showRank: true
      },
      appearance: {
        theme: 'light',
        language: 'vi',
        fontSize: 'medium'
      },
      security: {
        twoFactor: false,
        loginAlerts: true,
        sessionTimeout: 30
      }
    })
    success("Đã đặt lại cài đặt mặc định")
  }

  const updateSetting = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded w-full mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-heading">Cài đặt</h1>
            <p className="text-slate-600 font-body">Tùy chỉnh trải nghiệm học tập của bạn</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="btn-secondary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>

        {/* Notifications Settings */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Thông báo
            </CardTitle>
            <CardDescription className="text-slate-600 font-body">
              Quản lý cách bạn nhận thông báo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Email thông báo</Label>
                <p className="text-sm text-slate-600 font-body">Nhận thông báo qua email</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Thông báo đẩy</Label>
                <p className="text-sm text-slate-600 font-body">Nhận thông báo trên thiết bị</p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">SMS</Label>
                <p className="text-sm text-slate-600 font-body">Nhận thông báo qua tin nhắn</p>
              </div>
              <Switch
                checked={settings.notifications.sms}
                onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Thành tích</Label>
                <p className="text-sm text-slate-600 font-body">Thông báo khi đạt thành tích mới</p>
              </div>
              <Switch
                checked={settings.notifications.achievements}
                onCheckedChange={(checked) => updateSetting('notifications', 'achievements', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Nhắc nhở học tập</Label>
                <p className="text-sm text-slate-600 font-body">Nhắc nhở khi không học trong thời gian dài</p>
              </div>
              <Switch
                checked={settings.notifications.reminders}
                onCheckedChange={(checked) => updateSetting('notifications', 'reminders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Quyền riêng tư
            </CardTitle>
            <CardDescription className="text-slate-600 font-body">
              Kiểm soát thông tin cá nhân của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium text-slate-800 font-heading">Hiển thị hồ sơ</Label>
              <p className="text-sm text-slate-600 font-body mb-3">Ai có thể xem hồ sơ của bạn</p>
              <div className="flex gap-2">
                <Button
                  variant={settings.privacy.profileVisibility === 'public' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('privacy', 'profileVisibility', 'public')}
                  className={settings.privacy.profileVisibility === 'public' ? 'btn-primary' : 'btn-secondary'}
                >
                  Công khai
                </Button>
                <Button
                  variant={settings.privacy.profileVisibility === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('privacy', 'profileVisibility', 'private')}
                  className={settings.privacy.profileVisibility === 'private' ? 'btn-primary' : 'btn-secondary'}
                >
                  Riêng tư
                </Button>
                <Button
                  variant={settings.privacy.profileVisibility === 'friends' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('privacy', 'profileVisibility', 'friends')}
                  className={settings.privacy.profileVisibility === 'friends' ? 'btn-primary' : 'btn-secondary'}
                >
                  Bạn bè
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Hiển thị thống kê</Label>
                <p className="text-sm text-slate-600 font-body">Cho phép người khác xem thống kê của bạn</p>
              </div>
              <Switch
                checked={settings.privacy.showStats}
                onCheckedChange={(checked) => updateSetting('privacy', 'showStats', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Hiển thị xếp hạng</Label>
                <p className="text-sm text-slate-600 font-body">Cho phép người khác xem xếp hạng của bạn</p>
              </div>
              <Switch
                checked={settings.privacy.showRank}
                onCheckedChange={(checked) => updateSetting('privacy', 'showRank', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Giao diện
            </CardTitle>
            <CardDescription className="text-slate-600 font-body">
              Tùy chỉnh giao diện và ngôn ngữ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium text-slate-800 font-heading">Chủ đề</Label>
              <p className="text-sm text-slate-600 font-body mb-3">Chọn chủ đề hiển thị</p>
              <div className="flex gap-2">
                <Button
                  variant={settings.appearance.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'theme', 'light')}
                  className={settings.appearance.theme === 'light' ? 'btn-primary' : 'btn-secondary'}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Sáng
                </Button>
                <Button
                  variant={settings.appearance.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'theme', 'dark')}
                  className={settings.appearance.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Tối
                </Button>
                <Button
                  variant={settings.appearance.theme === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'theme', 'auto')}
                  className={settings.appearance.theme === 'auto' ? 'btn-primary' : 'btn-secondary'}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Tự động
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-base font-medium text-slate-800 font-heading">Ngôn ngữ</Label>
              <p className="text-sm text-slate-600 font-body mb-3">Chọn ngôn ngữ hiển thị</p>
              <div className="flex gap-2">
                <Button
                  variant={settings.appearance.language === 'vi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'language', 'vi')}
                  className={settings.appearance.language === 'vi' ? 'btn-primary' : 'btn-secondary'}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Tiếng Việt
                </Button>
                <Button
                  variant={settings.appearance.language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'language', 'en')}
                  className={settings.appearance.language === 'en' ? 'btn-primary' : 'btn-secondary'}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  English
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-base font-medium text-slate-800 font-heading">Cỡ chữ</Label>
              <p className="text-sm text-slate-600 font-body mb-3">Điều chỉnh kích thước chữ</p>
              <div className="flex gap-2">
                <Button
                  variant={settings.appearance.fontSize === 'small' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'fontSize', 'small')}
                  className={settings.appearance.fontSize === 'small' ? 'btn-primary' : 'btn-secondary'}
                >
                  Nhỏ
                </Button>
                <Button
                  variant={settings.appearance.fontSize === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'fontSize', 'medium')}
                  className={settings.appearance.fontSize === 'medium' ? 'btn-primary' : 'btn-secondary'}
                >
                  Trung bình
                </Button>
                <Button
                  variant={settings.appearance.fontSize === 'large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('appearance', 'fontSize', 'large')}
                  className={settings.appearance.fontSize === 'large' ? 'btn-primary' : 'btn-secondary'}
                >
                  Lớn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Bảo mật
            </CardTitle>
            <CardDescription className="text-slate-600 font-body">
              Bảo vệ tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Xác thực 2 yếu tố</Label>
                <p className="text-sm text-slate-600 font-body">Thêm lớp bảo mật cho tài khoản</p>
              </div>
              <Switch
                checked={settings.security.twoFactor}
                onCheckedChange={(checked) => updateSetting('security', 'twoFactor', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-slate-800 font-heading">Cảnh báo đăng nhập</Label>
                <p className="text-sm text-slate-600 font-body">Thông báo khi có đăng nhập mới</p>
              </div>
              <Switch
                checked={settings.security.loginAlerts}
                onCheckedChange={(checked) => updateSetting('security', 'loginAlerts', checked)}
              />
            </div>
            
            <div>
              <Label className="text-base font-medium text-slate-800 font-heading">Thời gian hết hạn phiên</Label>
              <p className="text-sm text-slate-600 font-body mb-3">Tự động đăng xuất sau (phút)</p>
              <Input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-32"
                min="5"
                max="480"
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-2 border-red-200 bg-red-50/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-800 font-heading flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Vùng nguy hiểm
            </CardTitle>
            <CardDescription className="text-red-600 font-body">
              Các hành động không thể hoàn tác
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800 font-heading">Xóa tài khoản</h3>
                <p className="text-sm text-red-600 font-body">
                  Xóa vĩnh viễn tài khoản và tất cả dữ liệu
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tài khoản
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
