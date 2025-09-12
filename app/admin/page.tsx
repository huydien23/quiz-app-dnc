"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminService } from "@/lib/admin-service"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Users, BookOpen, BarChart3, Plus, Settings, Activity, Target } from "lucide-react"

interface SystemStats {
  totalUsers: number
  totalQuizzes: number
  activeQuizzes: number
  totalAttempts: number
  averageScore: number
  recentAttempts: number
  recentUsers: number
  users: any[]
  attempts: any[]
}

"use client"

import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminHomePage() {
  return <AdminDashboard />
}
