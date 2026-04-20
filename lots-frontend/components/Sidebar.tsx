"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import LanguageSwitcher from "./LanguageSwitcher"
import {
  FileBarChart,
  UserCog,
  LogOut,
  User,
  Globe,
  Menu,
  X,
} from "lucide-react"

export default function Sidebar({
  counts,
  role,
  userName,
}: {
  counts?: Record<string, number>
  role?: string
  userName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const s = t.sidebar
  const isAdmin = role === "admin"
  const closeDrawer = () => setOpen(false)

  // Lock body scroll when drawer open (mobile)
  useEffect(() => {
    if (typeof document === "undefined") return
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const donneesLinks = [
    { href: "/producteurs", label: s.producers, badgeKey: "producteurs" },
    { href: "/parcelles", label: s.parcels, badgeKey: "parcelles" },
    { href: "/collectes", label: s.collections, badgeKey: "collectes" },
    { href: "/lots", label: s.lots, badgeKey: "lots" },
  ]

  const gestionLinks = [
    { href: "/export", label: s.export, icon: FileBarChart },
    { href: "/utilisateurs", label: s.users, icon: UserCog },
  ]

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href) && href !== "/dashboard"
  }

  return (
    <>
      {/* Mobile top bar: visible only below lg */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#1A1A1A] flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 rounded-md flex items-center justify-center text-white/80 hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Image src="/logo.png" alt="ID Bassin Congo" width={110} height={34} priority />
        <div className="w-9" />
      </div>

      {/* Overlay: visible only when drawer is open on mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-dvh w-64 lg:w-52.5 bg-[#1A1A1A] flex flex-col z-50 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo + close (mobile) */}
        <div className="px-5 pt-6 pb-8 flex items-center justify-between shrink-0">
          <Image src="/logo.png" alt="ID Bassin Congo" width={140} height={44} priority />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-5 overflow-y-auto min-h-0">
          <div>
            <Link
              href="/dashboard"
              onClick={closeDrawer}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition ${
                isActive("/dashboard")
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2AC1A3]" />
              {s.dashboard}
            </Link>
          </div>

          <div>
            <p className="px-3 mb-2 text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">
              {s.data}
            </p>
            {donneesLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeDrawer}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition ${
                  isActive(link.href)
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2AC1A3]" />
                  {link.label}
                </span>
                {counts && counts[link.badgeKey] !== undefined && (
                  <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">
                    {counts[link.badgeKey].toLocaleString()}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div>
              <p className="px-3 mb-2 text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">
                {s.management}
              </p>
              {gestionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeDrawer}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition ${
                    isActive(link.href)
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/55 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2AC1A3]" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="px-3 pb-4 space-y-3">
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Globe className="w-3 h-3 text-white/30" />
              <span className="text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">
                {s.language}
              </span>
            </div>
            <LanguageSwitcher variant="sidebar" />
          </div>

          <div className="border-t border-white/5 pt-3 flex items-center gap-2">
            <Link href="/profil" onClick={closeDrawer} className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-white font-medium truncate">
                  {userName || (isAdmin ? "Admin" : "Point Focal")}
                </p>
                <p className="text-[10px] text-[#2AC1A3] uppercase tracking-wider truncate">
                  {isAdmin ? s.admin : "Point Focal"}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
