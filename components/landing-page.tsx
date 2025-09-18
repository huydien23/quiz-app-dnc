"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight, Brain, 
  Shield, Smartphone, Globe, Heart, Code, Lightbulb
} from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-blue-600/5 rounded-2xl"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              <Brain className="h-4 w-4 mr-2" />
              Hệ thống luyện thi thông minh
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 font-heading">
              QuizMaster
              <span className="text-gradient block mt-2">Luyện thi trắc nghiệm</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 font-body max-w-3xl mx-auto mb-8">
              Nền tảng luyện thi trắc nghiệm trực tuyến hiện đại, giúp học sinh Việt Nam 
              chuẩn bị tốt nhất cho các kỳ thi quan trọng
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login">
              <Button size="lg" className="btn-primary text-lg px-8 py-4">
                <Play className="h-5 w-5 mr-2" />
                Bắt đầu ngay
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" size="lg" className="btn-secondary text-lg px-8 py-4">
                <Eye className="h-5 w-5 mr-2" />
                Hướng dẫn sử dụng
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 font-heading">1000+</div>
              <div className="text-sm text-slate-600 font-body">Câu hỏi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 font-heading">500+</div>
              <div className="text-sm text-slate-600 font-body">Học sinh</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 font-heading">95%</div>
              <div className="text-sm text-slate-600 font-body">Độ chính xác</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 font-heading">24/7</div>
              <div className="text-sm text-slate-600 font-body">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 font-heading">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-slate-600 font-body max-w-2xl mx-auto">
              Công nghệ hiện đại, giao diện thân thiện, phù hợp với học sinh Việt Nam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-blue-100 w-fit mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-heading">AI Thông minh</CardTitle>
                <CardDescription className="font-body">
                  Hệ thống AI phân tích điểm mạnh, yếu và đưa ra lộ trình học tập cá nhân hóa
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-green-100 w-fit mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-heading">Luyện tập có mục tiêu</CardTitle>
                <CardDescription className="font-body">
                  Hàng nghìn câu hỏi được phân loại theo chủ đề, độ khó và kỳ thi cụ thể
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-purple-100 w-fit mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-heading">Báo cáo chi tiết</CardTitle>
                <CardDescription className="font-body">
                  Theo dõi tiến độ học tập với biểu đồ và thống kê chi tiết, dễ hiểu
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-orange-100 w-fit mb-4">
                  <Smartphone className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-heading">Học mọi lúc mọi nơi</CardTitle>
                <CardDescription className="font-body">
                  Tối ưu cho mobile, học trên điện thoại, máy tính bảng, máy tính
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-cyan-100 w-fit mb-4">
                  <Users className="h-8 w-8 text-cyan-600" />
                </div>
                <CardTitle className="text-xl font-heading">Cộng đồng học tập</CardTitle>
                <CardDescription className="font-body">
                  Kết nối với bạn bè, so sánh kết quả, tạo động lực học tập
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-red-100 w-fit mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-heading">Bảo mật cao</CardTitle>
                <CardDescription className="font-body">
                  Dữ liệu được mã hóa, bảo vệ thông tin cá nhân và kết quả học tập
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6 font-heading">
                Về chúng tôi
              </h2>
              <p className="text-lg text-slate-600 font-body mb-6">
                QuizMaster được phát triển bởi đội ngũ chuyên gia giáo dục và công nghệ Việt Nam, 
                với mong muốn mang đến giải pháp luyện thi hiệu quả cho học sinh.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-body">Tâm huyết với giáo dục Việt Nam</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Code className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-body">Công nghệ tiên tiến, dễ sử dụng</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-body">Đổi mới liên tục, cải tiến không ngừng</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 rounded-2xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Globe className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 font-heading">
                    Made in Vietnam
                  </h3>
                  <p className="text-slate-600 font-body">
                    Sản phẩm được phát triển 100% tại Việt Nam, 
                    hiểu rõ nhu cầu và đặc thù của học sinh Việt Nam
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 font-heading">
              Sẵn sàng bắt đầu hành trình học tập?
            </h2>
            <p className="text-xl mb-8 font-body opacity-90">
              Tham gia cùng hàng nghìn học sinh đã tin tưởng QuizMaster
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                  <Play className="h-5 w-5 mr-2" />
                  Đăng nhập ngay
                </Button>
              </Link>
              <Link href="/guide">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                  <Eye className="h-5 w-5 mr-2" />
                  Xem hướng dẫn
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
