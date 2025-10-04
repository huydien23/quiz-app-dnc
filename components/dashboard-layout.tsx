"use client"

import React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardBottomNav } from "@/components/dashboard-bottom-nav"
import { DashboardHeader } from "@/components/dashboard-header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <DashboardSidebar className="hidden md:flex" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden">
          <DashboardHeader />
        </div>
        <main className="flex-1">
          <div className="p-4 md:p-6 pb-24 safe-bottom md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="md:hidden">
        <DashboardBottomNav />
      </div>
    </div>
  )
}
