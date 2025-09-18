"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentDashboard } from "@/components/student-dashboard"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <StudentDashboard />
    </DashboardLayout>
  )
}