"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { QuizListManager } from "@/components/quiz-list-manager"
import { ArrowLeft } from "lucide-react"

export default function AdminQuizzesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
        </div>

        {/* Quiz List Manager */}
        <QuizListManager />
      </div>
    </ProtectedRoute>
  )
}