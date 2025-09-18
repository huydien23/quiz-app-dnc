"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Clock, Award, TrendingUp, Play, Eye, 
  Target, Calendar, Star, Trophy, CheckCircle,
  BarChart3, Users, Zap, ArrowRight, Brain, 
  Shield, Smartphone, Globe, Heart, Code, Lightbulb,
  ArrowLeft, CheckCircle2, AlertCircle, Info
} from "lucide-react"
import Link from "next/link"

export function GuidePage() {
  const steps = [
    {
      number: 1,
      title: "Đăng ký tài khoản",
      description: "Tạo tài khoản miễn phí với email của bạn",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      details: [
        "Nhấn nút 'Đăng ký' trên trang chủ",
        "Nhập email và mật khẩu",
        "Xác thực email qua link được gửi",
        "Hoàn tất thông tin cá nhân"
      ]
    },
    {
      number: 2,
      title: "Khám phá giao diện",
      description: "Làm quen với dashboard và các tính năng chính",
      icon: Eye,
      color: "bg-green-100 text-green-600",
      details: [
        "Xem thống kê học tập của bạn",
        "Khám phá danh sách bài thi có sẵn",
        "Kiểm tra lịch sử làm bài",
        "Theo dõi tiến độ học tập"
      ]
    },
    {
      number: 3,
      title: "Chọn bài thi",
      description: "Lựa chọn bài thi phù hợp với mục tiêu học tập",
      icon: Target,
      color: "bg-purple-100 text-purple-600",
      details: [
        "Duyệt qua danh sách bài thi",
        "Xem thông tin chi tiết (số câu, thời gian)",
        "Chọn bài thi theo chủ đề yêu thích",
        "Kiểm tra độ khó phù hợp"
      ]
    },
    {
      number: 4,
      title: "Làm bài thi",
      description: "Thực hiện bài thi với giao diện thân thiện",
      icon: Play,
      color: "bg-orange-100 text-orange-600",
      details: [
        "Đọc kỹ câu hỏi và các lựa chọn",
        "Chọn đáp án bạn cho là đúng",
        "Sử dụng nút 'Bỏ qua' nếu không chắc chắn",
        "Theo dõi thời gian còn lại"
      ]
    },
    {
      number: 5,
      title: "Xem kết quả",
      description: "Phân tích kết quả và rút kinh nghiệm",
      icon: BarChart3,
      color: "bg-cyan-100 text-cyan-600",
      details: [
        "Xem điểm số tổng thể",
        "Kiểm tra câu trả lời đúng/sai",
        "Đọc giải thích chi tiết cho mỗi câu",
        "Lưu lại để ôn tập sau này"
      ]
    },
    {
      number: 6,
      title: "Theo dõi tiến độ",
      description: "Sử dụng báo cáo để cải thiện kết quả học tập",
      icon: TrendingUp,
      color: "bg-red-100 text-red-600",
      details: [
        "Xem biểu đồ tiến độ theo thời gian",
        "So sánh với các lần làm bài trước",
        "Xác định điểm mạnh và điểm yếu",
        "Lập kế hoạch ôn tập hiệu quả"
      ]
    }
  ]

  const tips = [
    {
      icon: Clock,
      title: "Quản lý thời gian",
      description: "Làm bài thi trong thời gian quy định để rèn luyện kỹ năng quản lý thời gian",
      color: "bg-blue-50 border-blue-200"
    },
    {
      icon: Brain,
      title: "Đọc kỹ câu hỏi",
      description: "Đọc toàn bộ câu hỏi và các lựa chọn trước khi trả lời",
      color: "bg-green-50 border-green-200"
    },
    {
      icon: Target,
      title: "Luyện tập thường xuyên",
      description: "Làm bài thi đều đặn để duy trì kiến thức và cải thiện kỹ năng",
      color: "bg-purple-50 border-purple-200"
    },
    {
      icon: BookOpen,
      title: "Ôn tập lại",
      description: "Xem lại các câu sai để hiểu rõ hơn và tránh lặp lại lỗi",
      color: "bg-orange-50 border-orange-200"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="font-body text-slate-600">Quay lại trang chủ</span>
            </Link>
            <Link href="/login">
              <Button className="btn-primary">
                <Play className="h-4 w-4 mr-2" />
                Bắt đầu ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <BookOpen className="h-4 w-4 mr-2" />
            Hướng dẫn sử dụng
          </Badge>
          <h1 className="text-5xl font-bold text-slate-800 mb-6 font-heading">
            Hướng dẫn sử dụng
            <span className="text-gradient block mt-2">QuizMaster</span>
          </h1>
          <p className="text-xl text-slate-600 font-body max-w-2xl mx-auto">
            Hướng dẫn chi tiết từ A-Z để bạn có thể sử dụng QuizMaster một cách hiệu quả nhất
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 font-heading">
              Các bước sử dụng
            </h2>
            <p className="text-xl text-slate-600 font-body">
              Làm theo 6 bước đơn giản để bắt đầu hành trình học tập
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <Card key={step.number} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-4 rounded-2xl ${step.color}`}>
                          <step.icon className="h-8 w-8" />
                        </div>
                        <div className="text-4xl font-bold text-slate-300 font-heading">
                          {step.number.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 mb-3 font-heading">
                        {step.title}
                      </h3>
                      <p className="text-lg text-slate-600 font-body mb-6">
                        {step.description}
                      </p>
                      <div className="space-y-3">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 font-body">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 font-heading">
              Mẹo học tập hiệu quả
            </h2>
            <p className="text-xl text-slate-600 font-body">
              Những lời khuyên hữu ích để tối đa hóa hiệu quả học tập
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <Card key={index} className={`border-2 ${tip.color} hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white/80">
                      <tip.icon className="h-6 w-6 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                        {tip.title}
                      </h3>
                      <p className="text-slate-600 font-body">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 font-heading">
              Câu hỏi thường gặp
            </h2>
            <p className="text-xl text-slate-600 font-body">
              Giải đáp những thắc mắc phổ biến về QuizMaster
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                      QuizMaster có miễn phí không?
                    </h3>
                    <p className="text-slate-600 font-body">
                      Có, QuizMaster hoàn toàn miễn phí cho tất cả học sinh. Bạn có thể sử dụng 
                      tất cả tính năng mà không cần trả phí.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                      Làm sao để tạo tài khoản?
                    </h3>
                    <p className="text-slate-600 font-body">
                      Nhấn nút "Đăng ký" trên trang chủ, nhập email và mật khẩu, 
                      sau đó xác thực email qua link được gửi đến hộp thư của bạn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                      Có thể sử dụng trên điện thoại không?
                    </h3>
                    <p className="text-slate-600 font-body">
                      Có, QuizMaster được tối ưu hoàn toàn cho mobile. Bạn có thể học 
                      trên điện thoại, máy tính bảng hoặc máy tính một cách mượt mà.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                      Dữ liệu có được bảo mật không?
                    </h3>
                    <p className="text-slate-600 font-body">
                      Tuyệt đối có. Tất cả dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn 
                      quốc tế. Thông tin cá nhân của bạn được bảo mật tuyệt đối.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 font-heading">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-xl mb-8 font-body opacity-90">
              Áp dụng ngay những gì bạn đã học để cải thiện kết quả học tập
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                  <Play className="h-5 w-5 mr-2" />
                  Bắt đầu ngay
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
