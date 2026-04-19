"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { Save, Settings, Shield, Bell, Palette, Database } from "lucide-react"
import { APP_CONFIG } from "@/lib/constants"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Settings states
  const [systemSettings, setSystemSettings] = useState<{
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    maxQuizTime: number;
    maxQuestionsPerQuiz: number;
  }>({
    siteName: APP_CONFIG.name,
    siteDescription: APP_CONFIG.description,
    maintenanceMode: false,
    allowRegistration: true,
    maxQuizTime: 120,
    maxQuestionsPerQuiz: 50
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    quizCompletionAlerts: true,
    systemUpdates: true
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6"
  })

  const handleSave = async () => {
    try {
      setLoading(true)
      setError("")

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess("Đã lưu cài đặt thành công!")
    } catch (err) {
      setError("Không thể lưu cài đặt. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6 p-6">
        {/* Header (Synchronized with Dashboard) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                Cấu hình hệ thống
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-500 ml-3.5">
              Quản lý cấu hình vận hành và tùy chỉnh thông số hệ thống chuyên nghiệp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-indigo-100 shadow-lg border-none">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList>
            <TabsTrigger value="system">Hệ thống</TabsTrigger>
            <TabsTrigger value="notifications">Thông báo</TabsTrigger>
            <TabsTrigger value="appearance">Giao diện</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Cài đặt chung
                </CardTitle>
                <CardDescription>
                  Cấu hình các thông số cơ bản của hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Tên trang web</Label>
                    <Input
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxQuizTime">Thời gian tối đa (phút)</Label>
                    <Input
                      id="maxQuizTime"
                      type="number"
                      value={systemSettings.maxQuizTime}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxQuizTime: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="siteDescription">Mô tả trang web</Label>
                  <Textarea
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                      <p className="text-sm text-slate-600">Tạm dừng truy cập từ người dùng</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistration">Cho phép đăng ký</Label>
                      <p className="text-sm text-slate-600">Người dùng có thể tự đăng ký tài khoản</p>
                    </div>
                    <Switch
                      id="allowRegistration"
                      checked={systemSettings.allowRegistration}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, allowRegistration: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>
                  Quản lý các loại thông báo hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Thông báo email</Label>
                      <p className="text-sm text-slate-600">Gửi thông báo qua email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newUserAlerts">Thông báo người dùng mới</Label>
                      <p className="text-sm text-slate-600">Thông báo khi có người dùng đăng ký mới</p>
                    </div>
                    <Switch
                      id="newUserAlerts"
                      checked={notificationSettings.newUserAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newUserAlerts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="quizCompletionAlerts">Thông báo hoàn thành bài thi</Label>
                      <p className="text-sm text-slate-600">Thông báo khi có bài thi được hoàn thành</p>
                    </div>
                    <Switch
                      id="quizCompletionAlerts"
                      checked={notificationSettings.quizCompletionAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, quizCompletionAlerts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemUpdates">Thông báo cập nhật hệ thống</Label>
                      <p className="text-sm text-slate-600">Thông báo về các cập nhật và bảo trì</p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemUpdates: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Cài đặt giao diện
                </CardTitle>
                <CardDescription>
                  Tùy chỉnh màu sắc và giao diện hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Màu chính</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Màu phụ</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="theme">Chủ đề</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={appearanceSettings.theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "light" }))}
                    >
                      Sáng
                    </Button>
                    <Button
                      variant={appearanceSettings.theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "dark" }))}
                    >
                      Tối
                    </Button>
                    <Button
                      variant={appearanceSettings.theme === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: "auto" }))}
                    >
                      Tự động
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
