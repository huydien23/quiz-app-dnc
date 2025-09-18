"use client"

import React from "react"
import { Leaderboard } from "@/components/leaderboard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/use-auth"

export default function LeaderboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <Leaderboard userId={user?.id} />
    </DashboardLayout>
  )
}
