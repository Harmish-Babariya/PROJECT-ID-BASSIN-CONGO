"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Shield, TriangleAlert, Monitor, Trash2 } from "lucide-react"
import type { AuditLogEntry } from "@/lib/services/audit"
import { useLanguage } from "@/contexts/LanguageContext"

interface ProfileUser {
  email: string
  nom_complet: string | null
  organisation: string | null
  user_code: string | null
  role: string
  country: string | null
  created_at: string
  last_sign_in_at: string | null
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
  recentActivity,
}: {
  user: ProfileUser | null
  stats: ProfileStats
  recentActivity: AuditLogEntry[]
}) {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const p = t.profil
  const [loggingOut, setLoggingOut] = useState(false)

  // 2FA modal
  const [show2faModal, setShow2faModal] = useState(false)

  // Sessions modal
  const [showSessionsModal, setShowSessionsModal] = useState(false)

  interface SessionRow {
    id: string
    ip_address: string | null
    user_agent: string | null
    created_at: string
    last_seen_at: string
    is_current: boolean
  }
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch("/api/auth/sessions")
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [])



  async function handleDeleteSession(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Password change form state
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdFeedback, setPwdFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const isAdmin = user?.role === "admin"
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR"

  const displayName = user?.nom_complet || user?.email || "—"
  const displayEmail = user?.email || "—"
  const displayRole = isAdmin ? p.roleAdmin : p.roleFocal
  const displayOrg = user?.organisation || "—"
  const displayCountry = isAdmin
    ? p.countryGlobal
    : user?.country || p.countryNotAssigned
  const identifier = user?.user_code || "—"

  const initials = (() => {
    const name = user?.nom_complet
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return user?.email?.slice(0, 2).toUpperCase() || "??"
  })()

  function formatDate(d: string | null) {
    if (!d) return "—"
    const date = new Date(d)
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const yyyy = date.getFullYear()
    const hh = String(date.getHours()).padStart(2, "0")
    const min = String(date.getMinutes()).padStart(2, "0")
    return `${dd}/${mm}/${yyyy} · ${hh}:${min}`
  }

  function formatDateLong(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  function formatActivityTime(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    const diffD = Math.floor(diffH / 24)
    if (diffH < 1) return p.timeLessThan1h
    if (diffH < 24) return p.timeAgo(diffH)
    if (diffD === 1)
      return p.timeYesterday(
        String(date.getHours()).padStart(2, "0"),
        String(date.getMinutes()).padStart(2, "0")
      )
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
  }


  function formatActivityLabel(entry: AuditLogEntry): string {
    const table = entry.table_name
    const action = entry.action.toLowerCase()
    const meta = entry.metadata as Record<string, unknown> | null

    const tableLabel =
      table === "producteurs" ? p.tableProducteur :
      table === "parcelles" ? p.tableParcelle :
      table === "collectes" ? p.tableCollecte :
      table === "lots" ? p.tableLot :
      table === "dds" ? p.tableDds :
      table === "user_profiles" ? p.tableUser :
      table

    const actionLabel =
      action === "insert" || action === "create" ? p.actionCreate :
      action === "update" ? p.actionUpdate :
      action === "delete" ? p.actionDelete :
      action === "invite" ? p.actionInvite :
      action === "deactivate" ? p.actionDeactivate :
      action === "reactivate" ? p.actionReactivate :
      action === "reset_password" || action === "change_password" ? p.actionResetPwd :
      action

    // Build a rich detail string from metadata depending on the entity type
    let detail = ""
    if (table === "producteurs" && meta) {
      detail = String(meta.nom || meta.code || entry.record_id?.slice(0, 8).toUpperCase() || "—")
    } else if (table === "parcelles" && meta) {
      const culture = meta.culture ? String(meta.culture) : null
      const surface = meta.surface_ha ? `${meta.surface_ha} ha` : null
      detail = [culture, surface].filter(Boolean).join(", ") || entry.record_id?.slice(0, 8).toUpperCase() || "—"
    } else if (table === "collectes" && meta) {
      const produit = meta.produit ? String(meta.produit) : null
      const poids = meta.poids_net_kg ? `${meta.poids_net_kg} kg` : null
      detail = [produit, poids].filter(Boolean).join(" · ") || entry.record_id?.slice(0, 8).toUpperCase() || "—"
    } else if (table === "lots" && meta) {
      const produit = meta.produit ? String(meta.produit) : null
      const poids = meta.poids_total_kg ? `${meta.poids_total_kg} kg` : null
      detail = [produit, poids].filter(Boolean).join(" · ") || entry.record_id?.slice(0, 8).toUpperCase() || "—"
    } else if (table === "user_profiles" && meta) {
      detail = String(meta.email || meta.user_code || entry.record_id?.slice(0, 8).toUpperCase() || "—")
    } else {
      detail = String(
        meta?.code || meta?.nom || meta?.email ||
        entry.record_id?.slice(0, 8).toUpperCase() || "—"
      )
    }

    return `${actionLabel} ${tableLabel} — ${detail}`
  }

  const adminPermissions = [
    { label: p.tableProducteur, perm: p.permRead, scope: p.permCountryScope },
    { label: p.tableParcelle, perm: p.permRead, scope: p.permCountryScope },
    { label: p.tableCollecte, perm: p.permRead, scope: p.permCountryScope },
    { label: p.tableLot, perm: p.permRead, scope: p.permCountryScope },
    { label: t.sidebar.export, perm: p.permFullAccess, scope: p.permCountryScope },
    { label: t.sidebar.users, perm: p.permFullAccess, scope: p.permCountryScope },
  ]

  const focalPermissions = [
    { label: p.tableProducteur, perm: p.permRead, scope: p.permOwnCountryScope },
    { label: p.tableParcelle, perm: p.permRead, scope: p.permOwnCountryScope },
    { label: p.tableCollecte, perm: p.permRead, scope: p.permOwnCountryScope },
    { label: p.tableLot, perm: p.permRead, scope: p.permOwnCountryScope },
  ]

  const permissions = isAdmin ? adminPermissions : focalPermissions

  const statCards = isAdmin
    ? [
        { label: p.statProducteurs, value: stats.producteurs.toLocaleString() },
        { label: p.statLots, value: stats.lotsGeneres.toLocaleString() },
        { label: p.statDds, value: stats.ddsEmises.toLocaleString() },
        { label: p.statActions, value: stats.actionsLoguees.toLocaleString() },
      ]
    : [
        { label: p.statProducteurs, value: stats.producteurs.toLocaleString() },
        { label: p.statParcelles, value: stats.lotsGeneres.toLocaleString() },
        { label: p.statCollectes, value: stats.ddsEmises.toLocaleString() },
        { label: p.statActions, value: stats.actionsLoguees.toLocaleString() },
      ]

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  function openPwdForm() {
    setPwdForm({ current: "", next: "", confirm: "" })
    setPwdFeedback(null)
    setShowPwdForm(true)
  }

  function closePwdForm() {
    setShowPwdForm(false)
    setPwdFeedback(null)
  }

  async function handleChangePassword() {
    setPwdFeedback(null)

    if (pwdForm.next.length < 8) {
      setPwdFeedback({ ok: false, msg: p.secErrorShort })
      return
    }
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdFeedback({ ok: false, msg: p.secErrorMismatch })
      return
    }

    setPwdSaving(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdForm.current,
          newPassword: pwdForm.next,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg =
          data.error === "WRONG_CURRENT_PASSWORD"
            ? p.secErrorWrong
            : data.error === "PASSWORD_TOO_SHORT"
            ? p.secErrorShort
            : p.secErrorServer
        setPwdFeedback({ ok: false, msg })
      } else {
        setPwdFeedback({ ok: true, msg: p.secChangedOk })
        setPwdForm({ current: "", next: "", confirm: "" })
        // Auto-close form after success
        setTimeout(() => setShowPwdForm(false), 2000)
      }
    } catch {
      setPwdFeedback({ ok: false, msg: p.secErrorServer })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase mb-1">
          {p.breadcrumb.split(" / ")[0]} / <span className="text-[#2AC1A3]">{p.breadcrumb.split(" / ")[1]}</span>
        </p>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">{p.title}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-[#2AC1A3] rounded-l-xl" />
        <div className="px-8 py-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#2AC1A3]/8 border-[2.5px] border-[#2AC1A3] flex items-center justify-center">
              <span className="text-[24px] font-bold text-[#2AC1A3]">{initials}</span>
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-gray-900">{displayName}</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">{displayEmail}</p>
              <div className="flex gap-2.5 mt-3">
                <span className="px-3.5 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.12em] rounded-full uppercase">
                  {displayRole}
                </span>
                {user?.organisation && (
                  <span className="px-3.5 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.12em] rounded-full uppercase">
                    {displayOrg}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium">{p.lastLogin}</p>
            <p className="text-[13px] font-semibold text-gray-900 mt-0.5">{formatDate(user?.last_sign_in_at ?? null)}</p>
            <p className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium mt-3">{p.identifier}</p>
            <p className="text-[13px] font-semibold text-[#2AC1A3] mt-0.5">{identifier}</p>
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
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
              {p.accountSection}
            </h3>
          </div>
          <div className="space-y-0">
            {[
              { label: p.rowName, value: displayName },
              { label: p.rowEmail, value: displayEmail },
              { label: p.rowRole, value: displayRole },
              { label: p.rowOrg, value: displayOrg },
              { label: p.rowCountry, value: displayCountry },
              { label: p.rowCreated, value: formatDateLong(user?.created_at ?? null) },
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
              <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
                {p.permissionsSection}
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-widest uppercase ${isAdmin ? "bg-[#2AC1A3]/10 text-[#2AC1A3]" : "bg-amber-50 text-amber-600"}`}>
              {isAdmin ? p.permFullAccess : p.permRestrictedLabel}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-5 ml-4">
            {isAdmin ? p.permAdminRoleDesc : p.permFocalRoleDesc}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {permissions.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-[#f5f7fa] rounded-lg px-4 py-3.5"
              >
                <div className="w-5 h-5 rounded-full bg-[#2AC1A3]/15 flex items-center justify-center shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#2AC1A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">{item.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[9px] tracking-widest uppercase text-gray-400">{item.perm}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-[9px] tracking-widest uppercase font-medium text-[#2AC1A3]">{item.scope}</p>
                  </div>
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
              {p.securitySection}
            </h3>
          </div>
          <div className="space-y-3">

            {/* Password row */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#2AC1A3]/12 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#2AC1A3]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{p.secPassword}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.secPasswordDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                    {p.secActive}
                  </span>
                  {!showPwdForm && (
                    <button
                      onClick={openPwdForm}
                      className="px-3.5 py-1.5 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition"
                    >
                      {p.secEdit}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline password change form */}
              {showPwdForm && (
                <div className="mt-4 space-y-3">
                  {pwdFeedback && (
                    <p className={`text-[11px] font-medium px-3 py-2 rounded-lg ${
                      pwdFeedback.ok
                        ? "bg-[#2AC1A3]/10 text-[#2AC1A3]"
                        : "bg-red-50 text-red-500"
                    }`}>
                      {pwdFeedback.msg}
                    </p>
                  )}
                  <div>
                    <label className="block text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium mb-1">
                      {p.secCurrentPassword}
                    </label>
                    <input
                      type="password"
                      value={pwdForm.current}
                      onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]/30"
                      disabled={pwdSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium mb-1">
                      {p.secNewPassword}
                    </label>
                    <input
                      type="password"
                      value={pwdForm.next}
                      onChange={(e) => setPwdForm((f) => ({ ...f, next: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]/30"
                      disabled={pwdSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 tracking-[0.12em] uppercase font-medium mb-1">
                      {p.secConfirmPassword}
                    </label>
                    <input
                      type="password"
                      value={pwdForm.confirm}
                      onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]/30"
                      disabled={pwdSaving}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwdSaving || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
                      className="px-4 py-1.5 bg-[#2AC1A3] text-white text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-[#24a88c] transition disabled:opacity-40"
                    >
                      {pwdSaving ? p.secSaving : p.secSave}
                    </button>
                    <button
                      onClick={closePwdForm}
                      disabled={pwdSaving}
                      className="px-4 py-1.5 border border-gray-200 bg-white text-gray-500 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition disabled:opacity-40"
                    >
                      {p.secCancel}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2FA row */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#C4943A]/10 flex items-center justify-center shrink-0">
                    <TriangleAlert className="w-4 h-4 text-[#C4943A]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{p.sec2fa}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.sec2faDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#C4943A]/10 text-[#C4943A] text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                    {p.secInactive}
                  </span>
                  <button
                    onClick={() => setShow2faModal(true)}
                    className="px-3.5 py-1.5 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition"
                  >
                    {p.secActivate}
                  </button>
                </div>
              </div>
            </div>

            {/* Sessions row */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#2AC1A3]/12 flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4 text-[#2AC1A3]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{p.secSessions}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {sessionsLoading ? "…" : `${sessions.length} ${p.secActive.toLowerCase()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase">
                    {sessionsLoading ? "…" : `${sessions.length} ${p.secActive}`}
                  </span>
                  <button
                    onClick={() => { setShowSessionsModal(true); fetchSessions() }}
                    className="px-3.5 py-1.5 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition"
                  >
                    {p.secManage}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
            <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.12em] uppercase">
              {p.activitySection}
            </h3>
          </div>
          <div className="space-y-0">
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[13px] text-gray-400">{p.activityEmpty}</p>
              </div>
            ) : (
              recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-[#2AC1A3]" />
                    <span className="text-[13px] text-gray-900">{formatActivityLabel(entry)}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono whitespace-nowrap ml-4">
                    {formatActivityTime(entry.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pb-6">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-5 py-2 border border-red-300 text-red-500 text-[11px] font-semibold tracking-widest rounded-lg uppercase hover:bg-red-50 transition disabled:opacity-50"
        >
          {loggingOut ? "..." : p.logout}
        </button>
      </div>

      {/* 2FA Modal */}
      {show2faModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C4943A]/10 flex items-center justify-center shrink-0">
                  <TriangleAlert className="w-4 h-4 text-[#C4943A]" />
                </div>
                <h2 className="text-[15px] font-bold text-gray-900">{p.sec2faModalTitle}</h2>
              </div>
            </div>
            <div className="px-8 py-6 space-y-4">
              <p className="text-[13px] text-gray-600 leading-relaxed">{p.sec2faModalDesc}</p>
              <div className="flex items-center gap-3 bg-[#C4943A]/8 border border-[#C4943A]/20 rounded-xl px-4 py-3.5">
                <TriangleAlert className="w-4 h-4 text-[#C4943A] shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-[#C4943A]">{p.sec2faModalSoon}</p>
                  <p className="text-[11px] text-[#C4943A]/80 mt-0.5">{p.sec2faModalSoonDesc}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShow2faModal(false)}
                className="px-5 py-2 bg-gray-100 text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase hover:bg-gray-200 transition"
              >
                {p.sec2faModalClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2AC1A3]/10 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-[#2AC1A3]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">{p.secSessionsModalTitle}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{displayEmail}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {sessionsLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-[#2AC1A3] border-t-transparent animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-6">{p.secSessionsModalNeverLogged}</p>
              ) : (
                sessions.map((s) => {
                  const ua = s.user_agent || ""
                  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
                  const browser =
                    /chrome/i.test(ua) && !/edg/i.test(ua) ? "Chrome" :
                    /firefox/i.test(ua) ? "Firefox" :
                    /safari/i.test(ua) && !/chrome/i.test(ua) ? "Safari" :
                    /edg/i.test(ua) ? "Edge" :
                    /opera|opr/i.test(ua) ? "Opera" : "—"
                  const os =
                    /windows/i.test(ua) ? "Windows" :
                    /mac os/i.test(ua) ? "macOS" :
                    /linux/i.test(ua) ? "Linux" :
                    /android/i.test(ua) ? "Android" :
                    /iphone|ipad/i.test(ua) ? "iOS" : "—"

                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl px-5 py-4 border ${
                        s.is_current
                          ? "border-[#2AC1A3]/25 bg-[#2AC1A3]/4"
                          : "border-gray-100 bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            s.is_current ? "bg-[#2AC1A3]/15" : "bg-gray-100"
                          }`}>
                            <Monitor className={`w-4 h-4 ${s.is_current ? "text-[#2AC1A3]" : "text-gray-400"}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium text-gray-900">
                                {isMobile ? "Mobile" : "Desktop"} · {browser}
                              </span>
                              {s.is_current && (
                                <span className="px-2 py-0.5 bg-[#2AC1A3]/10 text-[#2AC1A3] text-[9px] font-semibold tracking-[0.08em] rounded-full uppercase">
                                  {p.secSessionsModalCurrentSession}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {os}{s.ip_address ? ` · ${s.ip_address}` : ""}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {p.secSessionsModalLastLogin}: {formatDate(s.last_seen_at)}
                            </p>
                          </div>
                        </div>
                        {!s.is_current && (
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            disabled={deletingId === s.id}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-40"
                            title={p.secSessionsModalTerminate}
                          >
                            {deletingId === s.id
                              ? <div className="w-3 h-3 rounded-full border border-red-400 border-t-transparent animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowSessionsModal(false)}
                className="px-5 py-2 bg-gray-100 text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-full uppercase hover:bg-gray-200 transition"
              >
                {p.secSessionsModalClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
