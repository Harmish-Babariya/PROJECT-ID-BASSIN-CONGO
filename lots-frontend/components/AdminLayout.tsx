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
      <main className="ml-52.5 flex-1 min-w-0 p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
