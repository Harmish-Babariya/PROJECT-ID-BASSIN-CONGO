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

const dataLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

const donneesLinks = [
  { href: "/producteurs", label: "Producteurs", icon: Users },
  { href: "/parcelles", label: "Parcelles", icon: Map },
  { href: "/collectes", label: "Collectes", icon: Scale },
  { href: "/lots", label: "Lots", icon: Package },
]

const gestionLinks = [
  { href: "/export", label: "DDS / Export", icon: FileBarChart },
  { href: "/utilisateurs", label: "Utilisateurs", icon: UserCog },
]

export default function Sidebar() {
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
    <aside className="fixed top-0 left-0 h-screen w-56 bg-[#1a1f25] flex flex-col z-50">
      <div className="px-5 pt-6 pb-8">
        <Image src="/logo.png" alt="ID Bassin Congo" width={160} height={50} priority />
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          {dataLinks.map((link) => (
            <NavItem key={link.href} {...link} active={isActive(link.href)} />
          ))}
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
            Donnees
          </p>
          {donneesLinks.map((link) => (
            <NavItem key={link.href + link.label} {...link} active={isActive(link.href)} />
          ))}
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
            Gestion
          </p>
          {gestionLinks.map((link) => (
            <NavItem key={link.href + link.label} {...link} active={isActive(link.href)} />
          ))}
        </div>
      </nav>

      <div className="px-3 pb-4 space-y-1">
        <Link
          href="/profil"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
            pathname === "/profil"
              ? "bg-[#2ac1a3]/10 text-[#2ac1a3] font-medium"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" />
          Mon profil
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
        >
          <LogOut className="w-4 h-4" />
          Deconnexion
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
        active
          ? "bg-[#2ac1a3]/10 text-[#2ac1a3] font-medium"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}
