"use client"
import Sidebar from "./Sidebar"

export default function AdminLayout({
  children,
  counts,
  role,
}: {
  children: React.ReactNode
  counts?: Record<string, number>
  role?: string
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar counts={counts} role={role} />
      <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-52.5 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8">
        {children}
      </main>
    </div>
  )
}
