"use client"
import Sidebar from "./Sidebar"

export default function AdminLayout({
  children,
  counts,
  role,
  userName,
}: {
  children: React.ReactNode
  counts?: Record<string, number>
  role?: string
  userName?: string
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar counts={counts} role={role} userName={userName} />
      <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-52.5 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8">
        {children}
      </main>
    </div>
  )
}
