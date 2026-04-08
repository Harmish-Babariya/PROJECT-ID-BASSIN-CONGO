"use client"
import Sidebar from "./Sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar />
      <main className="ml-56 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
