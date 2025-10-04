"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Show button when page is scrolled down & calculate progress
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const toggleVisibility = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        const scrolled = window.pageYOffset || window.scrollY || document.documentElement.scrollTop
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
        const progress = height > 0 ? (scrolled / height) * 100 : 0

        setScrollProgress(progress)
        
        if (scrolled > 300) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }, 10)
    }

    // Initial check
    toggleVisibility()

    window.addEventListener("scroll", toggleVisibility, { passive: true })

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  // Smooth scroll to top
  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0)
    }
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      )}
    >
      <div className="relative group">
        {/* Circular Progress Ring */}
        <svg
          className="absolute inset-0 -rotate-90 h-11 w-11 sm:h-12 sm:w-12 pointer-events-none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-gray-700 opacity-30"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={125.6}
            strokeDashoffset={125.6 * (1 - scrollProgress / 100)}
            className="text-white transition-all duration-150 ease-out"
            strokeLinecap="round"
          />
        </svg>

        {/* Button */}
        <Button
          onClick={scrollToTop}
          size="icon"
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all duration-300 hover:scale-110 active:scale-95 group-hover:shadow-2xl"
          aria-label="Cuộn lên đầu trang"
          type="button"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
