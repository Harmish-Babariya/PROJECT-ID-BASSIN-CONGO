"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ConfirmModal from "@/components/ConfirmModal"

type Pays = { id: number | string; nom: string }

type AuditCounts = {
  producteurs: number | null
  parcelles: number | null
  collectes: number | null
}

type InitialUser = {
  id: string
  email: string
  nom_complet: string
  role: "admin" | "point_focal"
  pays_id: string
  pays_nom: string | null
  statut: string
  user_code: string | null
  organisation: string | null
  created_at: string | null
  last_sign_in_at: string | null
}


function getInitials(name: string, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "??"
}

function formatDate(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatLongDate(d: string | null, locale = "fr-FR") {
  if (!d) return "—"
  return new Date(d).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function ModifierUtilisateurClient({
  user,
  pays,
  auditCounts,
}: {
  user: InitialUser
  pays: Pays[]
  auditCounts: AuditCounts
}) {
  const formatCount = (n: number | null) =>
    n == null ? "—" : n.toLocaleString()
  const { t } = useLanguage()
  const u = t.utilisateurs
  const m = u.modify
  const router = useRouter()

  const [form, setForm] = useState({
    nom_complet: user.nom_complet,
    email: user.email,
    role: user.role,
    pays_id: user.pays_id,
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<"reset" | "deactivate" | "delete" | null>(null)
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "err"
    message: string
    extra?: string
  } | null>(null)

  const isAdmin = form.role === "admin"
  const isActive = user.statut === "actif"

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function showFeedback(kind: "ok" | "err", message: string, extra?: string) {
    setFeedback({ kind, message, extra })
    setTimeout(() => setFeedback(null), 6000)
  }

  async function handleSave() {
    if (submitting) return
    setFeedback(null)

    if (!form.nom_complet.trim()) {
      showFeedback("err", t.errors.NAME_REQUIRED)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showFeedback("err", t.errors.INVALID_EMAIL)
      return
    }
    if (!isAdmin && !form.pays_id) {
      showFeedback("err", t.errors.COUNTRY_REQUIRED)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/utilisateurs/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_complet: form.nom_complet.trim(),
          email: form.email.trim(),
          role: form.role,
          pays_id: isAdmin ? null : form.pays_id,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showFeedback(
          "err",
          (t.errors[data?.error as keyof typeof t.errors] as string) || t.errors.SERVER_ERROR
        )
        return
      }
      const countryChanged = !isAdmin && form.pays_id !== user.pays_id
      showFeedback(
        "ok",
        m.saveSuccess,
        countryChanged ? m.saveSuccessCountry : undefined
      )
      router.refresh()
    } catch {
      showFeedback("err", t.errors.NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  async function runExtraAction(kind: "reset" | "deactivate" | "reactivate" | "delete") {
    const path =
      kind === "reset"
        ? "reset-password"
        : kind === "deactivate"
        ? "deactivate"
        : kind === "reactivate"
        ? "reactivate"
        : "delete"

    setActionPending(kind)
    setFeedback(null)
    try {
      const res = await fetch(`/api/utilisateurs/${user.id}/${path}`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showFeedback(
          "err",
          (t.errors[data?.error as keyof typeof t.errors] as string) || t.errors.SERVER_ERROR
        )
        return
      }
      const successMessages = {
        reset: m.resetSuccess,
        deactivate: t.actions.deactivateSuccess,
        reactivate: t.actions.reactivateSuccess,
        delete: t.actions.deleteSuccess,
      }
      showFeedback("ok", successMessages[kind])
      if (kind === "delete") {
        setTimeout(() => router.push("/utilisateurs"), 800)
      } else {
        router.refresh()
      }
    } catch {
      showFeedback("err", t.errors.NETWORK_ERROR)
    } finally {
      setActionPending(null)
    }
  }

  const initials = getInitials(user.nom_complet, user.email)
  const roleLabel = isAdmin ? m.roleAdminTitle : m.roleFocalTitle
  const currentRoleLabel =
    user.role === "admin" ? m.roleAdminTitle : m.roleFocalTitle
  const identifier = user.user_code || `USR-${user.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Back link */}
      <Link
        href="/utilisateurs"
        className="inline-block text-[10px] sm:text-[11px] text-gray-400 hover:text-gray-600 tracking-[0.25em] font-mono uppercase"
      >
        {m.back}
      </Link>

      {/* Title */}
      <h1 className="font-numbers text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.05] font-extrabold text-gray-900 tracking-wide">
        {m.title}
      </h1>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg text-[12px] sm:text-[13px] ${
            feedback.kind === "ok"
              ? "bg-[#E8FAF6] text-[#1F8F77] border border-[#B6E8DC]"
              : "bg-[#FDECEC] text-[#C2413A] border border-[#F2B4B0]"
          }`}
          role={feedback.kind === "err" ? "alert" : "status"}
        >
          <p>{feedback.message}</p>
          {feedback.extra && (
            <p className="mt-1 opacity-80">{feedback.extra}</p>
          )}
        </div>
      )}

      {/* Summary card */}
      <div
        className="bg-white border border-gray-200 px-6 sm:px-8 py-5 sm:py-6"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-[#D5F0E8] text-[#2AC1A3] flex items-center justify-center text-[13px] font-semibold shrink-0 tracking-wider">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-gray-900 truncate">
                {user.nom_complet || user.email}
              </h2>
              <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">
                {user.email}
                {user.created_at ? (
                  <>
                    <span className="mx-2">·</span>
                    {m.accountCreatedOn} {formatDate(user.created_at)}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-400 tracking-[0.18em] font-mono uppercase">
              {m.identifier}
            </p>
            <p className="text-[13px] text-[#2AC1A3] font-mono font-semibold mt-1">
              {identifier}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          <SummaryRow
            label={m.summaryEmail}
            value={user.email}
            valueClass="font-mono text-[13px] text-gray-400"
          />
          <SummaryRow
            label={m.summaryProducers}
            value={formatCount(auditCounts.producteurs)}
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
          <SummaryRow
            label={m.summaryRole}
            valueNode={
              <span className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-[0.15em] uppercase font-mono bg-[#E8FAF6] text-[#2AC1A3]">
                {(currentRoleLabel || "").toUpperCase()}
              </span>
            }
          />
          <SummaryRow
            label={m.summaryParcels}
            value={formatCount(auditCounts.parcelles)}
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
          <SummaryRow
            label={m.summaryCountry}
            value={
              user.role === "admin" ? u.allCountries : user.pays_nom || "—"
            }
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
          <SummaryRow
            label={m.summaryCollectes}
            value={formatCount(auditCounts.collectes)}
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
          <SummaryRow
            label={m.summaryCreated}
            value={formatLongDate(user.created_at)}
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
          <SummaryRow
            label={m.summaryLastLogin}
            value={formatDate(user.last_sign_in_at)}
            valueClass="text-[14px] text-gray-900 font-semibold"
          />
        </div>
      </div>

      {/* Edit card */}
      <div
        className="bg-white border border-gray-200 p-5 sm:p-8"
        style={{ borderRadius: 16 }}
      >
        {/* Account section */}
        <div>
          <div className="inline-block">
            <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-[0.2em] uppercase font-mono">
              {m.sectionAccount}
            </h2>
            <div className="h-0.5 bg-[#2AC1A3] mt-2 w-[60%]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-6 sm:mt-8">
            <div>
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                {m.fullName} <span className="text-gray-400">*</span>
              </label>
              <input
                type="text"
                value={form.nom_complet}
                onChange={(e) => update("nom_complet", e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F6F8] border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                {m.email} <span className="text-gray-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F6F8] border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 my-8" />

        {/* Role & access */}
        <div>
          <div className="inline-block">
            <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-[0.2em] uppercase font-mono">
              {m.sectionRole}
            </h2>
            <div className="h-0.5 bg-[#2AC1A3] mt-2 w-[60%]" />
          </div>

          <div className="mt-6 sm:mt-8">
            <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-3">
              {m.role} <span className="text-gray-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RoleButton
                active={isAdmin}
                onClick={() => update("role", "admin")}
                title={m.roleAdminTitle}
                desc={m.roleAdminDesc}
                selectedLabel={m.roleSelected}
              />
              <RoleButton
                active={!isAdmin}
                onClick={() => update("role", "point_focal")}
                title={m.roleFocalTitle}
                desc={m.roleFocalDesc}
                selectedLabel={m.roleSelected}
              />
            </div>
          </div>

          {isAdmin ? (
            <div className="mt-6">
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2">
                {m.country} <span className="text-gray-400">*</span>
              </label>
              <div
                className="border border-gray-200 px-5 py-4"
                style={{ backgroundColor: "#F2F3F5", borderRadius: 10 }}
              >
                <p className="text-[10px] text-gray-400 tracking-[0.2em] font-mono uppercase">
                  {m.countryNotApplicable}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div
                className="border border-[#2AC1A3] p-5"
                style={{ borderRadius: 10, backgroundColor: "#F0FBF7" }}
              >
                <label className="block text-[10px] sm:text-[11px] text-[#2AC1A3] tracking-[0.2em] font-mono uppercase mb-2.5 font-semibold">
                  {m.country} <span className="text-[#2AC1A3]">*</span>
                </label>
                <select
                  value={form.pays_id}
                  onChange={(e) => update("pays_id", e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:border-[#2AC1A3]"
                  style={{ borderRadius: 8 }}
                >
                  <option value="">{m.countrySelectPlaceholder}</option>
                  {pays.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                <p className="mt-2.5 text-[11px] text-[#2AC1A3] font-mono">
                  {m.countryRlsNote}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 mt-8" />

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mt-6">
          <div className="flex items-center gap-5 sm:gap-6 self-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="px-6 sm:px-7 py-3 sm:py-3.5 bg-[#2AC1A3] hover:bg-[#25ad92] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] sm:text-[12px] font-bold tracking-[0.2em] rounded-lg transition font-mono shadow-sm"
            >
              {submitting ? "..." : m.save}
            </button>
            <Link
              href="/utilisateurs"
              className="text-[11px] sm:text-[12px] text-gray-400 hover:text-gray-600 tracking-[0.2em] font-mono uppercase"
            >
              {m.cancel}
            </Link>
          </div>
        </div>
        <p className="sr-only">{roleLabel}</p>
      </div>

      {/* Extra actions */}
      <div
        className="bg-white border border-gray-200 p-5 sm:p-7"
        style={{ borderRadius: 16 }}
      >
        <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-[0.2em] uppercase font-mono mb-4">
          {m.sectionExtra}
        </h2>

        <div className="space-y-3">
          <ExtraAction
            title={m.resetTitle}
            desc={m.resetDesc}
            btn={m.resetBtn}
            pending={actionPending === "reset"}
            onClick={() => setConfirmKind("reset")}
          />

          {isActive ? (
            <ExtraAction
              title={m.deactivateTitle}
              desc={m.deactivateDesc}
              btn={m.deactivateBtn}
              pending={actionPending === "deactivate"}
              onClick={() => setConfirmKind("deactivate")}
            />
          ) : (
            <ExtraAction
              title={m.reactivateTitle}
              desc={m.reactivateDesc}
              btn={m.reactivateBtn}
              pending={actionPending === "reactivate"}
              onClick={() => runExtraAction("reactivate")}
            />
          )}

          <ExtraAction
            title={m.deleteTitle}
            desc={m.deleteDesc}
            btn={m.deleteBtn}
            danger
            pending={actionPending === "delete"}
            onClick={() => setConfirmKind("delete")}
          />
        </div>
      </div>

      {confirmKind && (() => {
        const c = u.confirm
        const cfg = {
          reset:      { title: c.resetTitle,      message: c.resetMsg,      danger: false },
          deactivate: { title: c.deactivateTitle, message: c.deactivateMsg, danger: false },
          delete:     { title: c.deleteTitle,     message: c.deleteMsg,     danger: true  },
        }[confirmKind]
        return (
          <ConfirmModal
            open
            title={cfg.title}
            message={cfg.message}
            confirmLabel={c.confirmBtn}
            cancelLabel={c.cancelBtn}
            danger={cfg.danger}
            onConfirm={() => { setConfirmKind(null); runExtraAction(confirmKind) }}
            onCancel={() => setConfirmKind(null)}
          />
        )
      })()}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueNode,
  valueClass,
}: {
  label: string
  value?: string
  valueNode?: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 min-w-0 py-3 border-b border-gray-200 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
      <span className="text-[13px] text-gray-500 truncate">{label}</span>
      {valueNode ? (
        <span className="shrink-0">{valueNode}</span>
      ) : (
        <span className={`shrink-0 text-right ${valueClass || "text-[13px] text-gray-900"}`}>
          {value}
        </span>
      )}
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  title,
  desc,
  selectedLabel,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
  selectedLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full transition px-4 py-4 ${
        active
          ? "border border-[#2AC1A3]"
          : "border border-transparent hover:brightness-[0.98]"
      }`}
      style={{
        borderRadius: 10,
        backgroundColor: active ? "#E8FAF6" : "#F4F6F8",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 flex items-center justify-center shrink-0 ${
            active ? "bg-[#2AC1A3] text-white" : "bg-[#4A5568] text-white"
          }`}
          style={{ borderRadius: 8 }}
        >
          <User className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
            <h3
              className={`text-[14px] font-semibold ${
                active ? "text-[#2AC1A3]" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
            {active && (
              <span className="text-[11px] text-[#2AC1A3] font-semibold">
                {selectedLabel}
              </span>
            )}
          </div>
          <p
            className={`text-[12px] mt-1 leading-snug ${
              active ? "text-[#2AC1A3]" : "text-gray-500"
            }`}
          >
            {desc}
          </p>
        </div>
      </div>
    </button>
  )
}

function ExtraAction({
  title,
  desc,
  btn,
  danger,
  pending,
  onClick,
}: {
  title: string
  desc: string
  btn: string
  danger?: boolean
  pending?: boolean
  onClick: () => void
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F7F8FA] border border-gray-200 rounded-lg px-4 sm:px-5 py-3.5 sm:py-4"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`self-start sm:self-auto shrink-0 px-4 py-2 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] rounded-md border font-mono transition disabled:opacity-50 disabled:cursor-not-allowed ${
          danger
            ? "border-[#F2B4B0] text-[#C2413A] hover:bg-[#FDECEC]"
            : "border-gray-300 text-gray-700 hover:bg-white"
        }`}
      >
        {pending ? "..." : btn}
      </button>
    </div>
  )
}
