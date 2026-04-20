"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type Pays = { id: number | string; nom: string }

export default function InviterForm({ pays, nextCode }: { pays: Pays[]; nextCode: string }) {
  const { t } = useLanguage()
  const u = t.utilisateurs
  const i = u.invite
  const router = useRouter()

  const [role, setRole] = useState<"admin" | "focal">("admin")
  const [form, setForm] = useState({
    nom: "",
    email: "",
    organisation: "",
    pays_id: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isAdmin = role === "admin"

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (submitting) return
    setError(null)
    setSuccess(null)

    if (!form.nom.trim()) {
      setError(t.errors.NAME_REQUIRED)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t.errors.INVALID_EMAIL)
      return
    }
    if (!isAdmin && !form.pays_id) {
      setError(t.errors.COUNTRY_REQUIRED)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/utilisateurs/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          email: form.email.trim(),
          organisation: form.organisation.trim() || null,
          pays_id: isAdmin ? null : form.pays_id,
          role: isAdmin ? "admin" : "point_focal",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          (t.errors[data?.error as keyof typeof t.errors] as string) ||
            t.errors.SERVER_ERROR
        )
        return
      }
      setSuccess(
        t.actions.inviteSent(form.email.trim())
      )
      setTimeout(() => {
        router.push("/utilisateurs")
        router.refresh()
      }, 1100)
    } catch {
      setError(t.errors.NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Back link */}
      <Link
        href="/utilisateurs"
        className="inline-block text-[10px] sm:text-[11px] text-gray-400 hover:text-gray-600 tracking-[0.25em] font-mono uppercase"
      >
        {i.back}
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-numbers text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.05] font-extrabold text-gray-900 tracking-wide">
          {i.title}
        </h1>
        <p className="text-gray-400 text-[12px] sm:text-[13px] mt-3 font-mono">{i.subtitleLine1}</p>
        <p className="text-gray-400 text-[12px] sm:text-[13px] font-mono">
          {i.subtitleLine2} <span className="text-gray-600">{nextCode}</span>
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-stretch overflow-hidden"
        style={{ backgroundColor: "#E8FAF6", borderRadius: 6 }}
      >
        <div className="w-1 shrink-0" style={{ backgroundColor: "#2AC1A3" }} />
        <div className="px-5 sm:px-6 py-4 sm:py-5 flex-1">
          <p className="text-[12px] sm:text-[13px] text-[#2AC1A3] leading-relaxed">{i.banner}</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 p-5 sm:p-8" style={{ borderRadius: 16 }}>
        {/* Section: Informations du compte */}
        <div>
          <div className="inline-block">
            <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-[0.2em] uppercase font-mono">
              {i.sectionAccount}
            </h2>
            <div className="h-0.5 bg-[#2AC1A3] mt-2 w-[60%]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-6 sm:mt-8">
            <div>
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                {i.fullName} <span className="text-gray-400">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => update("nom", e.target.value)}
                placeholder={i.fullNamePlaceholder}
                className="w-full px-4 py-3 bg-[#F4F6F8] border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                {i.email} <span className="text-gray-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder={i.emailPlaceholder}
                className="w-full px-4 py-3 bg-[#F4F6F8] border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                {i.organisation}
              </label>
              <input
                type="text"
                value={form.organisation}
                onChange={(e) => update("organisation", e.target.value)}
                placeholder={i.organisationPlaceholder}
                className="w-full px-4 py-3 bg-[#F4F6F8] border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 my-8" />

        {/* Section: Rôle & accès */}
        <div>
          <div className="inline-block">
            <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-[0.2em] uppercase font-mono">
              {i.sectionRole}
            </h2>
            <div className="h-0.5 bg-[#2AC1A3] mt-2 w-[60%]" />
          </div>

          <div className="mt-6 sm:mt-8">
            <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-3">
              {i.role} <span className="text-gray-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin option */}
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`text-left w-full transition px-4 py-4 ${
                  isAdmin ? "border border-[#2AC1A3]" : "border border-transparent hover:brightness-[0.98]"
                }`}
                style={{
                  borderRadius: 10,
                  backgroundColor: isAdmin ? "#E8FAF6" : "#F4F6F8",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                      isAdmin ? "bg-[#2AC1A3] text-white" : "bg-[#4A5568] text-white"
                    }`}
                    style={{ borderRadius: 8 }}
                  >
                    <User className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <h3 className={`text-[14px] font-semibold ${isAdmin ? "text-[#2AC1A3]" : "text-gray-900"}`}>
                        {i.roleAdminTitle}
                      </h3>
                      {isAdmin && (
                        <span className="text-[11px] text-[#2AC1A3] font-semibold">
                          {i.roleSelected}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] mt-1 leading-snug ${isAdmin ? "text-[#2AC1A3]" : "text-gray-500"}`}>
                      {i.roleAdminDesc}
                    </p>
                  </div>
                </div>
              </button>

              {/* Focal option */}
              <button
                type="button"
                onClick={() => setRole("focal")}
                className={`text-left w-full transition px-4 py-4 ${
                  !isAdmin ? "border border-[#2AC1A3]" : "border border-transparent hover:brightness-[0.98]"
                }`}
                style={{
                  borderRadius: 10,
                  backgroundColor: !isAdmin ? "#E8FAF6" : "#F4F6F8",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                      !isAdmin ? "bg-[#2AC1A3] text-white" : "bg-[#4A5568] text-white"
                    }`}
                    style={{ borderRadius: 8 }}
                  >
                    <User className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <h3 className={`text-[14px] font-semibold ${!isAdmin ? "text-[#2AC1A3]" : "text-gray-900"}`}>
                        {i.roleFocalTitle}
                      </h3>
                      {!isAdmin && (
                        <span className="text-[11px] text-[#2AC1A3] font-semibold">
                          {i.roleSelected}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] mt-1 leading-snug ${!isAdmin ? "text-[#2AC1A3]" : "text-gray-500"}`}>
                      {i.roleFocalDesc}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Pays assigné */}
          {isAdmin ? (
            <div className="mt-6">
              <label className="block text-[10px] sm:text-[11px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2">
                {i.country}
              </label>
              <div
                className="border border-gray-200 px-5 py-4"
                style={{ backgroundColor: "#F2F3F5", borderRadius: 10 }}
              >
                <p className="text-[10px] text-gray-400 tracking-[0.2em] font-mono uppercase mb-2.5">
                  {i.countryNotApplicable}
                </p>
                <div
                  className="w-full px-4 py-3 bg-[#F7F8FA] border border-gray-200 text-[14px] text-gray-400"
                  style={{ borderRadius: 8 }}
                >
                  {i.countryAdminPlaceholder}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div
                className="border border-[#2AC1A3] p-5"
                style={{ borderRadius: 10, backgroundColor: "#F0FBF7" }}
              >
                <label className="block text-[10px] sm:text-[11px] text-[#2AC1A3] tracking-[0.2em] font-mono uppercase mb-2.5 font-semibold">
                  {i.country}
                </label>
                <select
                  value={form.pays_id}
                  onChange={(e) => update("pays_id", e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:border-[#2AC1A3]"
                  style={{ borderRadius: 8 }}
                >
                  <option value="">{i.countrySelectPlaceholder}</option>
                  {pays.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 mt-8" />

        {(error || success) && (
          <div
            className={`mt-6 px-4 py-3 rounded-lg text-[12px] sm:text-[13px] ${
              error
                ? "bg-[#FDECEC] text-[#C2413A] border border-[#F2B4B0]"
                : "bg-[#E8FAF6] text-[#1F8F77] border border-[#B6E8DC]"
            }`}
            role={error ? "alert" : "status"}
          >
            {error || success}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <p className="text-[12px] sm:text-[13px] text-gray-400 flex-1">{i.footerNote}</p>
          <div className="flex items-center gap-5 sm:gap-6 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 sm:px-7 py-3 sm:py-3.5 bg-[#2AC1A3] hover:bg-[#25ad92] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] sm:text-[12px] font-bold tracking-[0.2em] rounded-lg transition font-mono shadow-sm"
            >
              {submitting ? "..." : i.submit}
            </button>
            <Link
              href="/utilisateurs"
              className="text-[11px] sm:text-[12px] text-gray-400 hover:text-gray-600 tracking-[0.2em] font-mono uppercase"
            >
              {i.cancel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
