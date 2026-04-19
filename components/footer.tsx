import Link from "next/link"
import { BookOpen, Github, Facebook, Phone, BarChart3, Users, ArrowRight, Brain, Shield, Smartphone, Globe, Heart, Code, Lightbulb, Sparkles } from "lucide-react"
import { APP_CONFIG, FOUNDER_CONFIG } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 border-t border-slate-200/60 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-200">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">{APP_CONFIG.name}</span>
            </div>
            <p className="text-slate-600 max-w-md text-base leading-relaxed">
              Nền tảng luyện thi trắc nghiệm thông minh, đồng hành cùng sĩ tử
              trên con đường chinh phục tri thức và đạt kết quả cao nhất.
            </p>
            <div className="flex space-x-4">
              <a href={`https://github.com/${FOUNDER_CONFIG.socials.github}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md">
                <Github className="h-5 w-5" />
              </a>
              <a href={`https://facebook.com/${FOUNDER_CONFIG.socials.facebook}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={`tel:${FOUNDER_CONFIG.socials.zalo}`} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-slate-900">Liên kết nhanh</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/quizzes" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Danh sách bài thi
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Đăng ký
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-slate-900">Hỗ trợ</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/guide" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Liên hệ hỗ trợ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Báo lỗi
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Info */}
        <div className="border-t border-slate-200 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} {APP_CONFIG.name}. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex items-center space-x-2 text-slate-600 text-sm">
              <span>💻</span>
              <span>Phát triển bởi:</span>
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                {FOUNDER_CONFIG.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}