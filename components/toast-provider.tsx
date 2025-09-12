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

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
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

  const colors = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }

  const Icon = icons[toast.type]

  return (
    <Card className={cn("animate-in slide-in-from-right-full duration-300", colors[toast.type])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColors[toast.type])} />
          <div className="flex-1 space-y-1">
            {toast.title && (
              <div className="font-medium text-sm">{toast.title}</div>
            )}
            <div className="text-sm opacity-90">{toast.message}</div>
            {toast.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={toast.action.onClick}
                className="mt-2 h-7 text-xs"
              >
                {toast.action.label}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(toast.id)}
            className="h-6 w-6 p-0 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}