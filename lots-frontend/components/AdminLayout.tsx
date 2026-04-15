"use client"
import Sidebar from "./Sidebar"
import { LanguageProvider } from "@/contexts/LanguageContext"

export default function AdminLayout({
  children,
  counts,
}: {
  children: React.ReactNode
  counts?: Record<string, number>
}) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-[#f5f7fa]">
        <Sidebar counts={counts} />
        <main className="ml-52.5 flex-1 p-8">
          {children}
        </main>
      </div>
    </LanguageProvider>
  )
}
