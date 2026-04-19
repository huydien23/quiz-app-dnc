"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  title?: string
  message: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  // Compatibility with shadcn toast API
  toast: (options: { title?: string; description: string; variant?: "default" | "destructive" }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: "success", message, title })
  }, [addToast])

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: "error", message, title, duration: 7000 })
  }, [addToast])

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: "warning", message, title })
  }, [addToast])

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: "info", message, title })
  }, [addToast])

  // Compatibility with shadcn toast API
  const toast = useCallback((options: { title?: string; description: string; variant?: "default" | "destructive" }) => {
    const type = options.variant === "destructive" ? "error" : "success"
    addToast({ type, message: options.description, title: options.title })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-[320px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const variants = {
    success: "from-emerald-50 to-teal-50 border-emerald-200/50 text-emerald-900 shadow-emerald-900/5",
    error: "from-rose-50 to-red-50 border-rose-200/50 text-rose-900 shadow-rose-900/5",
    warning: "from-amber-50 to-orange-50 border-amber-200/50 text-amber-900 shadow-amber-900/5",
    info: "from-sky-50 to-blue-50 border-sky-200/50 text-sky-900 shadow-sky-900/5",
  }

  const iconBg = {
    success: "bg-emerald-500 shadow-emerald-200 text-white",
    error: "bg-rose-500 shadow-rose-200 text-white",
    warning: "bg-amber-500 shadow-amber-200 text-white",
    info: "bg-sky-500 shadow-sky-200 text-white",
  }

  const Icon = icons[toast.type]

  return (
    <div className={cn(
      "animate-in slide-in-from-right-full fade-in duration-300 shadow-2xl border bg-gradient-to-br backdrop-blur-md rounded-2xl group relative overflow-hidden",
      variants[toast.type]
    )}>
      {/* Subtle progress bar at bottom */}
      <div className="absolute bottom-0 left-0 h-1 bg-current opacity-10 w-full animate-toast-progress" />

      <div className="p-4 flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-300",
          iconBg[toast.type]
        )}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title ? (
            <div className="font-bold text-sm tracking-tight mb-0.5">{toast.title}</div>
          ) : (
            <div className="font-bold text-sm tracking-tight mb-0.5">
              {toast.type === 'success' ? 'Thành công' :
                toast.type === 'error' ? 'Có lỗi xảy ra' :
                  toast.type === 'warning' ? 'Cảnh báo' : 'Thông tin'}
            </div>
          )}
          <div className="text-[13px] font-medium leading-relaxed opacity-90 break-words">{toast.message}</div>
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="mt-0.5 p-1.5 rounded-lg hover:bg-black/5 text-current opacity-40 hover:opacity-100 transition-all flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}