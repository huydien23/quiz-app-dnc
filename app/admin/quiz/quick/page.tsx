"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { QuickQuizCreator } from "@/components/quick-quiz-creator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuickQuizPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/quiz/create">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tạo bài thi nhanh</h1>
            <p className="text-slate-600">Copy-paste nội dung và tạo bài thi ngay lập tức</p>
          </div>
        </div>

        {/* Quick Quiz Creator */}
        <QuickQuizCreator />
      </div>
    </ProtectedRoute>
  )
}
