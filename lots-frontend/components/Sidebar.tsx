"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Map,
  Package,
  Scale,
  FileBarChart,
  UserCog,
  LogOut,
  User,
} from "lucide-react"

const donneesLinks = [
  { href: "/producteurs", label: "Producteurs", badgeKey: "producteurs" },
  { href: "/parcelles", label: "Parcelles", badgeKey: "parcelles" },
  { href: "/collectes", label: "Collectes", badgeKey: "collectes" },
  { href: "/lots", label: "Lots", badgeKey: "lots" },
]

const gestionLinks = [
  { href: "/export", label: "DDS / Export", icon: FileBarChart },
  { href: "/utilisateurs", label: "Utilisateurs", icon: UserCog },
]

export default function Sidebar({ counts }: { counts?: Record<string, number> }) {
  const pathname = usePathname()
  const router = useRouter()

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
    <aside className="fixed top-0 left-0 h-screen w-[210px] bg-[#1A1A1A] flex flex-col z-50">
      <div className="px-5 pt-6 pb-8">
        <Image src="/logo.png" alt="ID Bassin Congo" width={140} height={44} priority />
      </div>

      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        <div>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition ${
              isActive("/dashboard")
                ? "bg-white/10 text-white font-medium"
                : "text-white/55 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2AC1A3]" />
            Tableau de bord
          </Link>
        </div>

        <div>
          <p className="px-3 mb-2 text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">
            Donnees
          </p>
          {donneesLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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

        <div>
          <p className="px-3 mb-2 text-[9px] font-semibold text-white/30 tracking-[0.15em] uppercase">
            Gestion
          </p>
          {gestionLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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
      </nav>

      <div className="px-3 pb-5 border-t border-white/5 pt-3">
        <Link
          href="/profil"
          className="flex items-center gap-3 px-2 py-2"
        >
          <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
            <User className="w-4 h-4 text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white font-medium truncate">Admin</p>
            <p className="text-[10px] text-[#2AC1A3] uppercase tracking-wider">Admin</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
