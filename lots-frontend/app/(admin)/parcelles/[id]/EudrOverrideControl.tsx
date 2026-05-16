"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Lock, ShieldCheck, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"
import { setEudrOverride, clearEudrOverride } from "./eudr-override-actions"

type Props = {
  parcelleId: number | string
  currentStatus: string | null
  overrideActive: boolean
  overrideReason: string | null
  overrideAt: string | null
  overrideByName: string | null
  /** Locale-formatted "Locked by X on Y" line is built in the parent. */
  isAdmin: boolean
}

export default function EudrOverrideControl({
  parcelleId,
  currentStatus,
  overrideActive,
  overrideReason,
  overrideAt,
  overrideByName,
  isAdmin,
}: Props) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const tp = t.parcelles
  const [setOpen, setSetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [pickedStatus, setPickedStatus] = useState<string>(
    normalizeEudrStatus(currentStatus) ?? EUDR_STATUS.CONFORME
  )
  const [reason, setReason] = useState("")

  if (!isAdmin) {
    return overrideActive ? <LockedBadge tp={tp} byName={overrideByName} at={overrideAt} reason={overrideReason} locale={locale} /> : null
  }

  function submitSet() {
    setError(null)
    if (!reason.trim()) {
      setError("REASON_REQUIRED")
      return
    }
    startTransition(async () => {
      const res = await setEudrOverride(parcelleId, pickedStatus, reason)
      if ("error" in res && res.error) {
        setError(res.error)
        return
      }
      setSetOpen(false)
      setReason("")
      router.refresh()
    })
  }

  function submitClear() {
    setError(null)
    startTransition(async () => {
      const res = await clearEudrOverride(parcelleId)
      if ("error" in res && res.error) {
        setError(res.error)
        return
      }
      setClearOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {overrideActive && (
          <LockedBadge tp={tp} byName={overrideByName} at={overrideAt} reason={overrideReason} locale={locale} />
        )}
        {overrideActive ? (
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-gray-50 transition"
          >
            {tp.overrideBtnClear}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSetOpen(true)}
            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3" />
            {tp.overrideBtnSet}
          </button>
        )}
      </div>

      {/* Set-override modal */}
      {setOpen && (
        <Modal title={tp.overrideModalTitle} onClose={() => setSetOpen(false)}>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-5">
            {tp.overrideModalDesc}
          </p>

          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            {tp.overrideFieldStatus}
          </label>
          {/* Override picks one of the 3 display buckets. Both "alert"
              choices (NON CONFORME for deforestation override, RISQUE for
              protected-area override) collapse to the same Alert badge. */}
          <select
            value={pickedStatus}
            onChange={(e) => setPickedStatus(e.target.value)}
            className="w-full px-4 py-2.5 mb-4 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
          >
            <option value={EUDR_STATUS.CONFORME}>{tp.eudrConforme}</option>
            <option value={EUDR_STATUS.NON_CONFORME}>{tp.eudrNonConforme}</option>
            <option value={EUDR_STATUS.RISQUE}>{tp.eudrRisque}</option>
            <option value={EUDR_STATUS.EN_ATTENTE}>{tp.eudrEnAttente}</option>
          </select>

          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            {tp.overrideFieldReason}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tp.overrideFieldReasonPh}
            rows={3}
            className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3] resize-none"
          />

          {error && (
            <p className="mt-3 text-[12px] text-red-600">
              {error === "REASON_REQUIRED" ? tp.overrideFieldReason : tp.overrideSaveError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSetOpen(false)}
              disabled={pending}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition disabled:opacity-50"
            >
              {tp.overrideModalCancel}
            </button>
            <button
              type="button"
              onClick={submitSet}
              disabled={pending}
              className="px-4 py-2 bg-[#2ac1a3] text-white text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-[#24a88e] transition disabled:opacity-50"
            >
              {tp.overrideModalConfirm}
            </button>
          </div>
        </Modal>
      )}

      {/* Clear-override modal */}
      {clearOpen && (
        <Modal title={tp.overrideClearTitle} onClose={() => setClearOpen(false)}>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {tp.overrideClearDesc}
          </p>

          {error && (
            <p className="mt-3 text-[12px] text-red-600">{tp.overrideSaveError}</p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClearOpen(false)}
              disabled={pending}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition disabled:opacity-50"
            >
              {tp.overrideModalCancel}
            </button>
            <button
              type="button"
              onClick={submitClear}
              disabled={pending}
              className="px-4 py-2 bg-red-500 text-white text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-red-600 transition disabled:opacity-50"
            >
              {tp.overrideClearConfirm}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  )
}

function LockedBadge({
  tp,
  byName,
  at,
  reason,
  locale,
}: {
  tp: {
    overrideBadge: string
    overrideSavedBy: (n: string, w: string) => string
    overrideReasonLabel: string
  }
  byName: string | null
  at: string | null
  reason: string | null
  locale: string
}) {
  const formattedDate = at ? new Date(at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB") : ""
  const line = byName ? tp.overrideSavedBy(byName, formattedDate) : tp.overrideBadge
  return (
    <span
      title={reason ? `${tp.overrideReasonLabel}: ${reason}` : line}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      {tp.overrideBadge}
    </span>
  )
}
