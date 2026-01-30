import { AdminLayout } from "@/components/admin-layout"
import { Suspense } from "react"

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400 font-medium">Đang tải ứng dụng...</div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  )
}