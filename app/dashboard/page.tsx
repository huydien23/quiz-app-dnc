"use client"

import { StudentDashboard } from "@/components/student-dashboard"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <StudentDashboard />
    </ProtectedRoute>
  )
}