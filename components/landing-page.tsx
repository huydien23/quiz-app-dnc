"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollToTop } from "@/components/scroll-to-top"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight, Brain, 
  Shield, Smartphone, Globe, Heart, Code, Lightbulb,
  Sparkles
} from "lucide-react"
import Link from "next/link"

// Counter animation hook
function useCounter(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasStarted(true)
    }, delay)

    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!hasStarted) return

    let startTime: number | null = null
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const percentage = Math.min(progress / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4)
      setCount(Math.floor(easeOutQuart * end))

      if (percentage < 1) {
        requestAnimationFrame(animateCount)
      }
    }

    requestAnimationFrame(animateCount)
  }, [end, duration, hasStarted])

  return count
}

export function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Animated counters
  const questionsCount = useCounter(1000, 2000, 200)
  const studentsCount = useCounter(500, 2000, 400)
  const accuracyCount = useCounter(95, 2000, 600)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 overflow-hidden">
      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Navbar Spacer */}
      <div className="h-20"></div>
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-purple-600/10 animate-gradient-x"></div>
        
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Circle - Top Right */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float"></div>
          {/* Medium Circle - Bottom Left */}
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed"></div>
          {/* Small Circle - Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
          
          {/* Floating Education Icons - Centered distribution */}
          <BookOpen className="absolute top-20 right-[15%] w-10 h-10 sm:w-12 sm:h-12 text-blue-400/40 animate-float" />
          <Trophy className="absolute top-28 left-[15%] w-9 h-9 sm:w-11 sm:h-11 text-yellow-400/40 animate-twinkle-delayed" />
          <Lightbulb className="absolute bottom-32 right-[12%] w-9 h-9 sm:w-11 sm:h-11 text-purple-400/40 animate-pulse-slow" />
          <Target className="absolute bottom-24 left-[12%] w-8 h-8 sm:w-10 sm:h-10 text-cyan-400/40 animate-twinkle" />
        </div>

        <div className={`relative max-w-6xl mx-auto text-center z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-8 sm:mb-12">
            {/* Animated Badge */}
            <div className="inline-block mb-6 animate-bounce-gentle">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Hệ thống luyện thi thông minh
              </Badge>
            </div>
            
            {/* Main Heading with Gradient Animation */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-10 font-heading leading-tight">
              <span className="inline-block text-slate-800 hover:scale-105 transition-transform duration-300">
                QuizMaster
              </span>
              <span className="block mt-4 sm:mt-6 pt-2 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 animate-gradient-x bg-[length:200%_auto]">
                Luyện thi trắc nghiệm
              </span>
            </h1>
            
            {/* Subtitle with fade-in animation */}
            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 font-body max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
              Nền tảng luyện thi trắc nghiệm trực tuyến{" "}
              <span className="font-semibold text-blue-600">hiện đại</span>, giúp học sinh Việt Nam 
              chuẩn bị tốt nhất cho các kỳ thi quan trọng
            </p>
          </div>
          
          {/* CTA Buttons with enhanced hover effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link href="/login" className="group">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
                <Play className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                Bắt đầu ngay
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/guide" className="group">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Hướng dẫn sử dụng
              </Button>
            </Link>
          </div>

          {/* Stats with animated counters and glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
            {/* Questions Count */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent font-heading mb-2">
                  {questionsCount}+
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium font-body">Câu hỏi</div>
              </div>
            </div>

            {/* Students Count */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent font-heading mb-2">
                  {studentsCount}+
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium font-body">Học sinh</div>
              </div>
            </div>

            {/* Accuracy */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent font-heading mb-2">
                  {accuracyCount}%
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium font-body">Độ chính xác</div>
              </div>
            </div>

            {/* Support */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent font-heading mb-2">
                  24/7
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium font-body">Hỗ trợ</div>
              </div>
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

      {/* CTA Section - Full Width Hero */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Animated Background matching hero section - Full width */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 animate-gradient-x"></div>
        
        {/* Floating Shapes for consistency */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Larger shapes for full width impact */}
          <div className="absolute -top-20 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
          
          {/* Floating Education Icons - Centered around content */}
          <Brain className="absolute top-24 left-[15%] w-10 h-10 sm:w-12 sm:h-12 text-blue-400/40 animate-pulse-slow" />
          <Trophy className="absolute top-32 right-[15%] w-10 h-10 sm:w-12 sm:h-12 text-yellow-400/40 animate-twinkle-delayed" />
          <Award className="absolute bottom-28 right-[12%] w-9 h-9 sm:w-11 sm:h-11 text-cyan-400/40 animate-float" />
          <TrendingUp className="absolute bottom-32 left-[12%] w-9 h-9 sm:w-11 sm:h-11 text-green-400/40 animate-twinkle" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center z-10 px-4 sm:px-6">
          {/* Content with subtle card effect */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-20 shadow-2xl border border-white/50">
            {/* Badge similar to hero section */}
            <div className="inline-block mb-6 animate-bounce-gentle">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 text-sm shadow-lg">
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Bắt đầu ngay hôm nay
              </Badge>
            </div>

            {/* Heading with gradient text */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 font-heading leading-tight">
              <span className="text-slate-800">Sẵn sàng bắt đầu</span>
              <span className="block mt-3 sm:mt-4 pt-2 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 animate-gradient-x bg-[length:200%_auto]">
                hành trình học tập?
              </span>
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-8 sm:mb-10 font-body max-w-2xl mx-auto leading-relaxed">
              Tham gia cùng <span className="font-semibold text-blue-600">hàng nghìn học sinh</span> đã tin tưởng QuizMaster
            </p>
            
            {/* CTA Buttons matching hero section style */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-10">
              <Link href="/login" className="group">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
                  <Play className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Đăng nhập ngay
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/guide" className="group">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Xem hướng dẫn
                </Button>
              </Link>
            </div>

            {/* Trust indicators with icons */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm sm:text-base font-medium">Miễn phí 100%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="text-sm sm:text-base font-medium">Bảo mật tuyệt đối</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm sm:text-base font-medium">Cập nhật liên tục</span>
              </div>
            </div>
          </div>

          {/* Decorative quote or message */}
          <div className="mt-8 sm:mt-12">
            <p className="text-sm sm:text-base text-slate-500 font-body italic">
              "Thành công là tổng của những nỗ lực nhỏ, lặp đi lặp lại mỗi ngày" 💪
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
