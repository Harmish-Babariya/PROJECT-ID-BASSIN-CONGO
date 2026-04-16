"use client"
import { User } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type Profile = {
  id: string
  nom_complet: string | null
  email: string | null
  role: string | null
  created_at: string | null
  last_sign_in_at?: string | null
  statut?: string | null
  pays: { nom: string } | null
}

function getInitials(name: string | null, email: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "??"
}

function formatDate(d: string | null | undefined) {
  if (!d) return null
  const date = new Date(d)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

export default function UtilisateursContent({ profiles }: { profiles: Profile[] }) {
  const { t } = useLanguage()
  const u = t.utilisateurs

  const totalUsers = profiles.filter((p) => p.statut !== "inactif" && p.statut !== "en_attente").length
  const admins = profiles.filter((p) => p.role === "admin" && p.statut !== "inactif").length
  const focals = profiles.filter((p) => p.role !== "admin" && p.statut !== "inactif" && p.statut !== "en_attente").length
  const pending = profiles.filter((p) => p.statut === "en_attente").length

  const roleTags = {
    admin: [u.tagAllCountries, u.tagData, u.tagDdsExport, u.tagUsers, u.tagAuditLogs],
    focal: [u.tagOwnCountry, u.tagData, u.tagNoDds, u.tagNoUsers],
  }

  const statCards = [
    { label: u.statTotalLabel, value: totalUsers, sub: u.statTotalSub, color: "text-gray-900" },
    { label: u.statAdminsLabel, value: admins, sub: "", color: "text-[#b8844a]" },
    { label: u.statFocalLabel, value: focals, sub: "", color: "text-[#2AC1A3]" },
    { label: u.statPendingLabel, value: pending, sub: u.statPendingSub, color: "text-gray-900" },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-2 sm:mb-3 font-mono">
            <span className="text-gray-400">ID BASSIN CONGO / </span>
            <span className="text-[#2AC1A3] font-semibold">{u.title}</span>
          </p>
          <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] leading-none font-extrabold text-gray-900 tracking-wide font-mono wrap-break-word">
            {u.title}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">{u.subtitle}</p>
        </div>
        <button className="self-start sm:self-auto shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2AC1A3] hover:bg-[#25ad92] text-white text-[10px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.18em] rounded-lg transition font-mono shadow-sm">
          {u.inviteBtn}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 px-4 sm:px-6 py-3 sm:py-4"
            style={{ borderRadius: 10 }}
          >
            <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-[0.15em] sm:tracking-[0.2em] uppercase font-mono mb-1.5 sm:mb-2 truncate">
              {s.label}
            </p>
            <p className={`text-[26px] sm:text-[32px] leading-none font-bold font-mono mb-1.5 sm:mb-2 ${s.color}`}>
              {s.value}
            </p>
            <p className={`text-[11px] sm:text-[12px] ${s.sub ? "text-gray-500" : "text-transparent select-none"}`}>
              {s.sub || "."}
            </p>
          </div>
        ))}
      </div>

      {/* Role info cards */}
      <div
        className="bg-white border border-gray-200 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
        style={{ borderRadius: 16 }}
      >
        {/* Admin card */}
        <div
          className="border border-[#A67C5226] px-4 sm:px-5 py-4"
          style={{ backgroundColor: "#A67C5226", borderRadius: 10, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 border border-[#A67C5240] bg-transparent"
              style={{ borderRadius: 8 }}
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#A67C52]" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-gray-900 mb-1">{u.roleAdminTitle}</h3>
              <p className="text-[11px] sm:text-[12px] text-gray-600 leading-snug mb-2.5 max-w-130">
                {u.roleAdminDesc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roleTags.admin.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] tracking-widest font-mono uppercase rounded-full border border-[#A67C5266] text-[#A67C52] whitespace-nowrap"
                    style={{ backgroundColor: "#F5EDDF" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Focal card */}
        <div
          className="border border-[#2AC1A326] px-4 sm:px-5 py-4"
          style={{ backgroundColor: "#E8FAF6", borderRadius: 10, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 border border-[#2AC1A340] bg-transparent"
              style={{ borderRadius: 8 }}
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2AC1A3]" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-gray-900 mb-1">{u.roleFocalTitle}</h3>
              <p className="text-[11px] sm:text-[12px] text-gray-600 leading-snug mb-2.5 max-w-130">
                {u.roleFocalDesc}
              </p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {roleTags.focal.map((tag, i) =>
                  i < 2 ? (
                    <span
                      key={tag}
                      className="px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] tracking-widest font-mono uppercase rounded-full border border-[#2AC1A366] text-[#2AC1A3] whitespace-nowrap"
                      style={{ backgroundColor: "#DFF5EF" }}
                    >
                      {tag}
                    </span>
                  ) : (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-[8px] sm:text-[9px] tracking-widest font-mono uppercase text-gray-400 whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users table - desktop/tablet */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-gray-200">
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap">
                  {u.colUser}
                </th>
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap">
                  {u.colRole}
                </th>
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap">
                  {u.colCountry}
                </th>
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap">
                  {u.colStatus}
                </th>
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap hidden lg:table-cell">
                  {u.colLastConnection}
                </th>
                <th className="px-4 lg:px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 tracking-[0.2em] uppercase font-mono whitespace-nowrap">
                  {u.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((user) => {
                const status = user.statut || "actif"
                const isPending = status === "en_attente"
                const isInactive = status === "inactif"
                const isAdmin = user.role === "admin"
                const initials = getInitials(user.nom_complet, user.email)
                const lastConnection = formatDate(user.last_sign_in_at)

                const avatarCls = isPending
                  ? "bg-white border border-dashed border-gray-300 text-gray-400"
                  : isInactive
                  ? "bg-gray-100 text-gray-400"
                  : isAdmin
                  ? "bg-[#E8DCC7] text-[#7A5A38]"
                  : "bg-[#D5F0E8] text-[#2AC1A3]"

                return (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-[11px] lg:text-[12px] font-semibold shrink-0 ${avatarCls}`}
                        >
                          {isPending ? "?" : initials}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs lg:text-[14px] font-semibold truncate ${
                              isInactive ? "text-gray-400 line-through" : isPending ? "text-gray-700" : "text-gray-900"
                            }`}
                          >
                            {isPending ? u.pendingName : user.nom_complet || "-"}
                          </p>
                          <p className="text-[11px] lg:text-[12px] text-gray-400 font-mono truncate">
                            {user.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`inline-block px-2.5 lg:px-3 py-1 rounded-full text-[8px] lg:text-[9px] font-semibold tracking-[0.12em] lg:tracking-[0.15em] uppercase font-mono whitespace-nowrap ${
                          isAdmin
                            ? "bg-[#F5EDDF] text-[#A67C52] border border-[#A67C5233]"
                            : "bg-[#DFF5EF] text-[#2AC1A3] border border-[#2AC1A333]"
                        }`}
                      >
                        {isAdmin ? u.roleAdmin : u.roleFocal}
                      </span>
                    </td>
                    <td className={`px-4 lg:px-6 py-4 text-xs lg:text-[14px] whitespace-nowrap ${isInactive ? "text-gray-400" : "text-gray-800"}`}>
                      {isAdmin ? u.allCountries : user.pays?.nom || "-"}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`inline-block px-2.5 lg:px-3 py-1 rounded-full text-[8px] lg:text-[9px] font-semibold tracking-[0.12em] lg:tracking-[0.15em] uppercase font-mono whitespace-nowrap ${
                          isPending
                            ? "bg-[#FBEFCF] text-[#A67C2E] border border-[#A67C2E33]"
                            : isInactive
                            ? "bg-gray-100 text-gray-400 border border-gray-200"
                            : "bg-[#DFF5EF] text-[#2AC1A3] border border-[#2AC1A333]"
                        }`}
                      >
                        {isPending ? u.statusPending : isInactive ? u.statusInactive : u.statusActive}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-xs lg:text-[13px] text-gray-600 font-mono whitespace-nowrap hidden lg:table-cell">
                      {isPending ? (
                        <span className="italic text-gray-400">{u.neverConnected}</span>
                      ) : isInactive ? (
                        <span className="text-gray-400">{lastConnection || "-"}</span>
                      ) : (
                        lastConnection || "-"
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3 lg:gap-5 text-[9px] lg:text-[10px] tracking-[0.12em] lg:tracking-[0.15em] font-semibold uppercase font-mono whitespace-nowrap">
                        {isPending ? (
                          <>
                            <button className="text-gray-500 hover:text-gray-900">{u.actionResend}</button>
                            <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionCancel}</button>
                          </>
                        ) : isInactive ? (
                          <>
                            <button className="text-gray-500 hover:text-gray-900">{u.actionReactivate}</button>
                            <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionDelete}</button>
                          </>
                        ) : (
                          <>
                            <button className="text-gray-500 hover:text-gray-900">{u.actionEdit}</button>
                            <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionDisable}</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {profiles.length === 0 && (
          <div className="p-8 lg:p-12 text-center">
            <p className="text-gray-500 text-sm">{u.empty}</p>
          </div>
        )}
      </div>

      {/* Users list - mobile cards */}
      <div className="md:hidden space-y-3">
        {profiles.map((user) => {
          const status = user.statut || "actif"
          const isPending = status === "en_attente"
          const isInactive = status === "inactif"
          const isAdmin = user.role === "admin"
          const initials = getInitials(user.nom_complet, user.email)
          const lastConnection = formatDate(user.last_sign_in_at)

          return (
            <div
              key={user.id}
              className="bg-white border border-gray-200 p-4"
              style={{ borderRadius: 12 }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                    isPending || isInactive ? "bg-gray-100 text-gray-400" : "bg-[#e8f8f3] text-[#2AC1A3]"
                  }`}
                >
                  {isPending ? "?" : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isInactive ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {isPending ? u.pendingName : user.nom_complet || "-"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">{user.email || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[9px] text-gray-400 tracking-widest uppercase font-mono mb-1">{u.colRole}</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-[9px] font-semibold tracking-widest uppercase font-mono ${
                      isAdmin
                        ? "bg-[#fdf6e8] text-[#b8844a] border border-[#e8d8b9]"
                        : "bg-[#eafbf6] text-[#2AC1A3] border border-[#bfe8df]"
                    }`}
                  >
                    {isAdmin ? u.roleAdmin : u.roleFocal}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 tracking-widest uppercase font-mono mb-1">{u.colStatus}</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-[9px] font-semibold tracking-widest uppercase font-mono ${
                      isPending
                        ? "bg-[#fdf6e8] text-[#b8844a] border border-[#e8d8b9]"
                        : isInactive
                        ? "bg-gray-100 text-gray-400 border border-gray-200"
                        : "bg-[#eafbf6] text-[#2AC1A3] border border-[#bfe8df]"
                    }`}
                  >
                    {isPending ? u.statusPending : isInactive ? u.statusInactive : u.statusActive}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 tracking-widest uppercase font-mono mb-1">{u.colCountry}</p>
                  <p className={`text-xs ${isInactive ? "text-gray-400" : "text-gray-700"}`}>
                    {isAdmin ? u.allCountries : user.pays?.nom || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 tracking-widest uppercase font-mono mb-1">{u.colLastConnection}</p>
                  <p className="text-[11px] text-gray-600 font-mono">
                    {isPending ? <span className="italic text-gray-400">{u.neverConnected}</span> : lastConnection || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-[10px] tracking-widest font-semibold uppercase font-mono">
                {isPending ? (
                  <>
                    <button className="text-gray-600 hover:text-gray-900">{u.actionResend}</button>
                    <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionCancel}</button>
                  </>
                ) : isInactive ? (
                  <>
                    <button className="text-gray-600 hover:text-gray-900">{u.actionReactivate}</button>
                    <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionDelete}</button>
                  </>
                ) : (
                  <>
                    <button className="text-gray-600 hover:text-gray-900">{u.actionEdit}</button>
                    <button className="text-[#d97757] hover:text-[#c04d2e]">{u.actionDisable}</button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {profiles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">{u.empty}</p>
          </div>
        )}
      </div>
    </div>
  )
}
