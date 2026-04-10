"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, TriangleAlert, Monitor } from "lucide-react"

interface ProfileUser {
  email: string
  role: string
  country: string | null
  created_at: string
}

interface ProfileStats {
  producteurs: number
  lotsGeneres: number
  ddsEmises: number
  actionsLoguees: number
}

export default function ProfileClient({
  user,
  stats,
}: {
  user: ProfileUser | null
  stats: ProfileStats
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = "Julia Tankeu"
  const displayEmail = user?.email || "julia.tankeu@lonswiss.com"
  const displayRole = user?.role === "admin" ? "Administrateur" : "Point Focal"
  const displayOrg = "LONSWISS SARL"
  const initials = "JT"

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase mb-1">
          ID BASSIN CONGO / <span className="text-[#2AC1A3]">PROFIL</span>
        </p>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">PROFIL</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2AC1A3] rounded-l-xl" />
        <div className="px-8 py-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-[80px] h-[80px] rounded-full bg-[#2AC1A3]/8 border-[2.5px] border-[#2AC1A3] flex items-center justify-center">
              <span className="text-[24px] font-bold text-[#2AC1A3]">{initials}</span>
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-gray-900">{displayName}</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">{displayEmail}</p>
              <div className="flex gap-2.5 mt-3">
                <span className="px-3.5 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.12em] rounded-full uppercase">
                  ADMIN
                </span>
                <span className="px-3.5 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.12em] rounded-full uppercase">
                  {displayOrg}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium">Derniere Connexion</p>
            <p className="text-[13px] font-semibold text-gray-900 mt-0.5">03/04/2026 · 08:42</p>
            <p className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium mt-3">Identifiant</p>
            <p className="text-[13px] font-semibold text-[#2AC1A3] mt-0.5">USR-ADMIN-001</p>
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "PRODUCTEURS", value: stats.producteurs },
          { label: "LOTS GENERES", value: stats.lotsGeneres },
          { label: "DDS EMISES", value: stats.ddsEmises },
          { label: "ACTIONS LOGUEES", value: stats.actionsLoguees.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <p className="text-[9px] text-gray-400 tracking-[0.15em] uppercase font-medium">{s.label}</p>
            <p className="text-[28px] font-bold text-gray-900 mt-1 font-numbers">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
            <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
              Informations du Compte
            </h3>
          </div>
          <div className="space-y-0">
            {[
              { label: "Nom complet", value: displayName },
              { label: "Email", value: displayEmail },
              { label: "Role", value: displayRole },
              { label: "Organisation", value: displayOrg },
              { label: "Pays", value: "Tous (acces global)" },
              { label: "Langue", value: "Francais" },
              { label: "Compte cree", value: "15 janvier 2025" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-3.5 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-[13px] text-gray-400">{row.label}</span>
                <span className="text-[13px] font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
            <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
              Acces & Permissions
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Producteurs", perm: "LECTURE + ECRITURE" },
              { label: "Parcelles", perm: "LECTURE + ECRITURE" },
              { label: "Collectes", perm: "LECTURE + ECRITURE" },
              { label: "Lots", perm: "LECTURE + ECRITURE" },
              { label: "DDS / Export", perm: "ADMIN UNIQUEMENT" },
              { label: "Utilisateurs", perm: "ADMIN UNIQUEMENT" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-[#f5f7fa] rounded-lg px-4 py-3.5"
              >
                <div className="w-5 h-5 rounded-full bg-[#2AC1A3]/15 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#2AC1A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{item.label}</p>
                  <p className="text-[9px] text-gray-400 tracking-[0.1em] uppercase">{item.perm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#C4943A]" />
            <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
              Securite
            </h3>
          </div>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2AC1A3]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#2AC1A3]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">Mot de passe</p>
                  <p className="text-[11px] text-gray-400">Modifie il y a 42 jours</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                  ACTIF
                </span>
                <button className="px-3 py-1 border border-gray-200 text-gray-500 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase hover:bg-gray-50">
                  MODIFIER
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C4943A]/10 flex items-center justify-center">
                  <TriangleAlert className="w-4 h-4 text-[#C4943A]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">Authentification 2 facteurs</p>
                  <p className="text-[11px] text-gray-400">Non configuree — recommandee</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                  INACTIF
                </span>
                <button className="px-3 py-1 border border-gray-200 text-gray-500 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase hover:bg-gray-50">
                  ACTIVER
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2AC1A3]/10 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-[#2AC1A3]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">Sessions actives</p>
                  <p className="text-[11px] text-gray-400">1 session — Chrome · Geneve, CH</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                  1 ACTIVE
                </span>
                <button className="px-3 py-1 border border-gray-200 text-gray-500 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase hover:bg-gray-50">
                  GERER
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
            <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
              Activite Recente
            </h3>
          </div>
          <div className="space-y-0">
            {[
              { color: "#2AC1A3", text: "Generation DDS — LOT-0032", time: "Il y a 1h" },
              { color: "#2AC1A3", text: "Creation producteur — PROD-248", time: "Hier 14:22" },
              { color: "#C4943A", text: "Override EUDR — PAR-00199", time: "Hier 11:03" },
              { color: "#2AC1A3", text: "Modification lot — LOT-0031", time: "01/04/2026" },
              { color: "#2AC1A3", text: "Creation utilisateur — focal@coop.cd", time: "30/03/2026" },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activity.color }}
                  />
                  <span className="text-[13px] text-gray-900">{activity.text}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-6">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-5 py-2 border border-red-300 text-red-500 text-[11px] font-semibold tracking-[0.1em] rounded-lg uppercase hover:bg-red-50 transition disabled:opacity-50"
        >
          {loggingOut ? "..." : "DECONNEXION"}
        </button>
      </div>
    </div>
  )
}
