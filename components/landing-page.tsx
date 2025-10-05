"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollToTop } from "@/components/scroll-to-top"
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
      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Navbar Spacer */}
      <div className="h-20"></div>
      
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-blue-600/5 rounded-2xl -z-10"></div>
        <div className="relative max-w-6xl mx-auto text-center z-10">
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
      <section id="features" className="py-20 px-6">
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
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-soft-xl card-hover group">
              <CardHeader>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-heading mb-2">AI Thông minh</CardTitle>
                <CardDescription className="font-body text-base">
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
      <section id="about" className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6 font-heading">
                Về tác giả
              </h2>
              <p className="text-lg text-slate-600 font-body mb-6">
                Tôi là <strong>Nguyễn Huy Điền</strong>, sinh viên năm cuối ngành Công nghệ thông tin 
                tại Đại học Nam Cần Thơ. Chuyên về phát triển Web Fullstack với 
                niềm đam mê tạo ra những sản phẩm công nghệ hữu ích cho cộng đồng.
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
                  <span className="font-body">Fullstack Developer - Next.js, TypeScript</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-body">Đang sinh sống và học tập tại Cần Thơ</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 rounded-2xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Code className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 font-heading">
                    Dự án cá nhân
                  </h3>
                  <p className="text-slate-600 font-body mb-4">
                    Được phát triển với công nghệ hiện đại: Next.js 14, 
                    TypeScript, Firebase và Tailwind CSS
                  </p>
                  <div className="text-sm text-slate-500">
                    🎓 Đại học Nam Cần Thơ<br/>
                    📍 Cần Thơ, Việt Nam
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 font-heading">
              Liên hệ
            </h2>
            <p className="text-xl text-slate-600 font-body">
              Kết nối với tôi qua các kênh sau
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GitHub */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Code className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="font-bold text-lg mb-2">GitHub</h3>
                <p className="text-slate-600 mb-4 font-mono text-sm">huydien23</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/huydien23" target="_blank" rel="noopener noreferrer">
                    Xem Profile
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Facebook */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Facebook</h3>
                <p className="text-slate-600 mb-4">Nguyễn Huy Điền</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.facebook.com/huydien203/" target="_blank" rel="noopener noreferrer">
                    Kết bạn
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Zalo */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Zalo</h3>
                <p className="text-slate-600 mb-4 font-mono">0945700813</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="tel:0945700813">
                    Gọi điện
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-4 font-heading">
                Cảm ơn bạn đã quan tâm!
              </h3>
              <p className="text-slate-600 font-body max-w-2xl mx-auto">
                QuizMaster là dự án Portfolio của tôi, được phát triển với mong muốn 
                tạo ra công cụ hữu ích cho việc luyện thi trắc nghiệm. Mọi góp ý và 
                phản hồi đều rất được hoan nghênh!
              </p>
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
