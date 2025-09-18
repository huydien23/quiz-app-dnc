import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-gradient">QuizMaster</span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
              Nền tảng luyện thi trắc nghiệm thông minh, giúp học sinh và sinh viên 
              cải thiện kết quả học tập một cách hiệu quả và khoa học.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-sm">📘</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-sm">📧</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-sm">🐙</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Liên kết nhanh</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/quizzes" className="text-slate-300 hover:text-white transition-colors">
                  Danh sách bài thi
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-300 hover:text-white transition-colors">
                  Đăng ký
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Hướng dẫn sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Liên hệ hỗ trợ
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">
                  Báo lỗi
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Info */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 QuizMaster. Tất cả quyền được bảo lưu.
            </div>
            <div className="text-slate-400 text-sm">
              <span className="mr-2">💻</span>
              Phát triển bởi: <span className="text-blue-400 font-medium">Nguyễn Huy Điền</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}