import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50 border-t border-blue-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">QuizMaster</span>
            </div>
            <p className="text-slate-600 mb-4 max-w-md text-sm leading-relaxed">
              Nền tảng luyện thi trắc nghiệm thông minh, giúp học sinh và sinh viên 
              cải thiện kết quả học tập một cách hiệu quả và khoa học.
            </p>
            <div className="flex space-x-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <span className="text-base">📘</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <span className="text-base">📧</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <span className="text-base">🐙</span>
              </div>
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
        <div className="border-t border-slate-200 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="text-slate-500 mb-3 md:mb-0">
              © 2025 QuizMaster. Tất cả quyền được bảo lưu.
            </div>
            <div className="text-slate-600">
              <span className="mr-2">💻</span>
              Phát triển bởi: <span className="text-blue-600 font-medium">Nguyễn Huy Điền</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}