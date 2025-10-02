"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Trophy, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Trang chủ", icon: Home },
  { href: "/dashboard/quizzes", label: "Bài thi", icon: BookOpen },
  { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
  { href: "/dashboard/history", label: "Lịch sử", icon: History },
  { href: "/dashboard/profile", label: "Hồ sơ", icon: User },
]

export function DashboardBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={
        cn(
          "fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-bottom",
        )
      }
      aria-label="Điều hướng nhanh"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-xs",
                  active ? "text-blue-600" : "text-slate-600 hover:text-slate-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", active ? "" : "opacity-80")}/>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
