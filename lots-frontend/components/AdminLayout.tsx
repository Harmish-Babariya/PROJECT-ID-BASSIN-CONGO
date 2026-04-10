"use client"
import Sidebar from "./Sidebar"

export default function AdminLayout({
  children,
  counts,
}: {
  children: React.ReactNode
  counts?: Record<string, number>
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar counts={counts} />
      <main className="ml-[180px] flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
