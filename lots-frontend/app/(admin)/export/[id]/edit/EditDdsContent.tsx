"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS } from "@/lib/eudr"

type DdsStatut = "en_preparation" | "pret" | "exporte"

type Dds = {
  id: number
  reference_dds: string
  statut: string
  created_at: string
  genere_par_nom: string
}

type Parcelle = {
  id: number
  code_parcelle: string
  surface_ha: number | null
  status_eudr: string | null
  latitude: number | null
  longitude: number | null
  zones?: { nom: string } | null
  pays?: { nom: string } | null
}

type Producteur = {
  id: number
  code_producteur: string
  nom: string
  prenom: string | null
}

type LotDetails = {
  lot: any
  producteurs: Producteur[]
  parcelles: Parcelle[]
  collectesCount: number
}

function eudrPct(parcelles: Parcelle[]): number {
  if (!parcelles.length) return 0
  const conformes = parcelles.filter((p) => p.status_eudr === EUDR_STATUS.CONFORME).length
  return Math.round((conformes / parcelles.length) * 100)
}

function hasRisk(parcelles: Parcelle[]): number {
  return parcelles.filter(
    (p) => p.status_eudr === EUDR_STATUS.NON_CONFORME
  ).length
}

function lotEudrSummary(parcelles: Parcelle[]): "conforme" | "risque" | "attente" {
  if (!parcelles.length) return "attente"
  if (hasRisk(parcelles) > 0) return "risque"
  if (eudrPct(parcelles) === 100) return "conforme"
  return "attente"
}

function statToInternal(statut: string): DdsStatut {
  const s = statut.toLowerCase()
  if (s.includes("export")) return "exporte"
  if (s.includes("prêt") || s.includes("pret") || s.includes("ready")) return "pret"
  return "en_preparation"
}

export default function EditDdsContent({
  dds,
  lotDetails,
  eudrSummary,
  currentUserName,
}: {
  dds: Dds
  lotDetails: LotDetails
  eudrSummary: { conformes: number; risques: number; total: number }
  currentUserName: string
}) {
  const { t, locale } = useLanguage()
  const e = t.export
  const router = useRouter()

  const lot = lotDetails.lot
  const producteurs = lotDetails.producteurs
  const parcelles = lotDetails.parcelles

  const [ddsStatut, setDdsStatut] = useState<DdsStatut>(statToInternal(dds.statut))
  const [referenceDds, setReferenceDds] = useState(dds.reference_dds)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: true } | { ok: false; msg: string } | null>(null)

  const eudrState = useMemo(() => lotEudrSummary(parcelles), [parcelles])

  const statutMap: Record<DdsStatut, string> = {
    en_preparation: "En préparation",
    pret: "Prêt",
    exporte: "Exporté",
  }

  const ddsStatutOptions: { value: DdsStatut; label: string }[] = [
    { value: "en_preparation", label: e.genStatutEnPreparation },
    { value: "pret", label: e.genStatutPret },
    { value: "exporte", label: e.genStatutExporte },
  ]

  function eudrLabel(status: string | null): string {
    if (status === EUDR_STATUS.CONFORME) return e.genConforme
    if (status === EUDR_STATUS.NON_CONFORME) return e.genRisque
    if (status === EUDR_STATUS.EN_ATTENTE) return e.genEnAttente
    return e.genNonVerifie
  }

  function eudrColor(status: string | null): string {
    if (status === EUDR_STATUS.CONFORME) return "text-[#2ac1a3] font-semibold"
    if (status === EUDR_STATUS.NON_CONFORME) return "text-red-500 font-semibold"
    if (status === EUDR_STATUS.EN_ATTENTE) return "text-yellow-600 font-semibold"
    return "text-gray-400"
  }

  async function handleSave() {
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch(`/api/dds/${dds.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: statutMap[ddsStatut],
          reference_dds: referenceDds,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: json.message || (locale === "en" ? "Update failed." : "Erreur lors de la mise à jour.") })
      } else {
        setResult({ ok: true })
        setTimeout(() => router.push("/export"), 1500)
      }
    } catch {
      setResult({ ok: false, msg: locale === "en" ? "Network error. Please try again." : "Erreur réseau. Veuillez réessayer." })
    } finally {
      setSaving(false)
    }
  }

  const dateLocale = locale === "en" ? "en-GB" : "fr-FR"
  const createdAt = new Date(dds.created_at).toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div>
        <Link
          href="/export"
          className="text-xs text-gray-400 tracking-widest uppercase hover:text-[#2ac1a3] transition mb-3 inline-block"
          style={{ fontFamily: "var(--font-courier-prime)" }}
        >
          {e.editBack}
        </Link>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-archivo-narrow)" }}
        >
          {e.editTitle}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{e.editSubtitle}</p>
      </div>

      {/* DDS identity banner */}
      <div className="bg-[#f0faf7] border-l-4 border-[#2ac1a3] rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div>
          <p className="text-[10px] font-bold text-[#2ac1a3] tracking-widest uppercase mb-0.5">
            {e.editDdsRefLabel}
          </p>
          <p className="text-sm font-mono font-semibold text-[#1a7a63]">{dds.reference_dds}</p>
        </div>
        <div className="hidden sm:block w-px h-8 bg-[#2ac1a3]/30" />
        <div>
          <p className="text-[10px] font-bold text-[#2ac1a3] tracking-widest uppercase mb-0.5">
            {e.editCreatedLabel}
          </p>
          <p className="text-sm text-[#1a7a63]">{createdAt}</p>
        </div>
        <div className="hidden sm:block w-px h-8 bg-[#2ac1a3]/30" />
        <div>
          <p className="text-[10px] font-bold text-[#2ac1a3] tracking-widest uppercase mb-0.5">
            {e.editGeneratedByLabel}
          </p>
          <p className="text-sm text-[#1a7a63]">{dds.genere_par_nom}</p>
        </div>
      </div>

      {/* Editable fields + lot preview */}
      <div className="bg-white border-2 border-[#2ac1a3] rounded-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2
            className="text-sm font-bold text-gray-900 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-archivo-narrow)" }}
          >
            {e.editPreviewTitle(lot?.code_lot ?? "…")}
          </h2>
          {eudrState === "conforme" && (
            <span className="px-3 py-1 border border-[#2ac1a3] text-[#2ac1a3] text-[10px] font-bold rounded tracking-widest uppercase">
              {e.genReadyBadge}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoCard label={e.genFieldLot}>
            <span className="text-[#2ac1a3] font-semibold">{lot?.code_lot ?? "—"}</span>
          </InfoCard>
          <InfoCard label={e.genFieldProduit}>
            <span className="font-semibold text-gray-900">{lot?.produit ?? "—"}</span>
          </InfoCard>
          <InfoCard label={e.genFieldPoids}>
            <span className="font-semibold text-gray-900">
              {parseFloat(lot?.poids_total_kg || "0").toLocaleString(dateLocale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              kg
            </span>
          </InfoCard>
          <InfoCard label={e.genFieldDestination}>
            <span className="font-semibold text-gray-900">
              {lot?.destination_pays ?? lot?.pays?.nom ?? "—"}
            </span>
          </InfoCard>
          <InfoCard label={e.genFieldAcheteur}>
            <span className="font-semibold text-gray-900">{lot?.acheteur ?? "—"}</span>
          </InfoCard>
          <InfoCard label={e.genFieldEudr}>
            {eudrState === "conforme" ? (
              <span className="text-[#2ac1a3] font-bold text-sm tracking-wide">{e.genEudrConforme}</span>
            ) : eudrState === "risque" ? (
              <span className="text-red-500 font-bold text-sm tracking-wide">{e.genEudrRisque}</span>
            ) : (
              <span className="text-yellow-600 font-bold text-sm tracking-wide">{e.genEudrEnAttente}</span>
            )}
          </InfoCard>
        </div>

        <div className="border-t border-gray-100" />

        {/* Editable: DDS Reference */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.editFieldRef}
          </label>
          <input
            type="text"
            value={referenceDds}
            onChange={(ev) => setReferenceDds(ev.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 bg-white focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3] transition"
          />
        </div>

        {/* Editable: DDS Status */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.genFieldStatutDds}
          </label>
          <select
            value={ddsStatut}
            onChange={(ev) => setDdsStatut(ev.target.value as DdsStatut)}
            className="w-full sm:max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3] transition"
          >
            {ddsStatutOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-gray-100" />

        {/* Producers + parcelles */}
        {producteurs.length > 0 && (
          <div>
            <p
              className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3"
              style={{ fontFamily: "var(--font-courier-prime)" }}
            >
              {e.genProducersTitle(producteurs.length)}
            </p>
            <div className="rounded-xl overflow-hidden">
              {producteurs.map((prod, idx) => {
                const myParcelle = parcelles[idx] ?? null
                return (
                  <div
                    key={prod.id}
                    className="px-4 sm:px-5 py-4 flex items-start justify-between gap-3 mb-2 last:mb-0 rounded-lg"
                    style={{ backgroundColor: "#F5F7FA" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-[#2ac1a3] tracking-wide"
                        style={{ fontFamily: "var(--font-courier-prime)" }}
                      >
                        {prod.code_producteur} — {prod.nom} {prod.prenom ?? ""}
                      </p>
                      {myParcelle && (
                        <>
                          <p
                            className="text-[14px] text-gray-400 mt-0"
                            style={{ fontFamily: "var(--font-archivo-narrow)" }}
                          >
                            {myParcelle.code_parcelle}
                            {myParcelle.surface_ha != null ? ` · ${myParcelle.surface_ha} ha` : ""}
                            {myParcelle.zones?.nom ? ` · ${myParcelle.zones.nom}` : ""}
                            {myParcelle.pays?.nom ? `, ${myParcelle.pays.nom}` : ""}
                          </p>
                          {myParcelle.latitude != null && myParcelle.longitude != null && (
                            <p
                              className="text-[11px] text-gray-400 mt-0.5"
                              style={{ fontFamily: "var(--font-courier-prime)" }}
                            >
                              {Number(myParcelle.latitude).toFixed(6)}°N,{" "}
                              {Number(myParcelle.longitude).toFixed(6)}°W
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {myParcelle && (
                        <>
                          <p
                            className="text-sm font-bold text-gray-900"
                            style={{ fontFamily: "var(--font-archivo-narrow)" }}
                          >
                            {myParcelle.surface_ha != null ? `${myParcelle.surface_ha} ha` : "—"}
                          </p>
                          <p
                            className={`text-[10px] mt-1 tracking-widest uppercase font-bold ${eudrColor(myParcelle.status_eudr)}`}
                            style={{ fontFamily: "var(--font-courier-prime)" }}
                          >
                            {eudrLabel(myParcelle.status_eudr)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        result.ok ? (
          <div className="flex items-start gap-3 bg-[#f0faf7] border border-[#2ac1a3] rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-[#2ac1a3] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-bold text-[#1a7a63]">
                {locale === "en" ? "DDS updated successfully" : "DDS mise à jour avec succès"}
              </p>
              <p className="text-xs text-[#1a7a63] mt-0.5">
                {locale === "en" ? "Redirecting…" : "Redirection en cours…"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-600">{result.msg}</p>
          </div>
        )
      )}

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <p className="text-xs text-gray-400 max-w-md">{e.editFooterNote}</p>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || result?.ok === true}
            className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 text-white text-sm font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#2AC1A3" }}
          >
            {saving ? "…" : e.editBtnSave}
          </button>
          <Link
            href="/export"
            className="text-sm text-gray-500 hover:text-gray-700 transition font-medium"
          >
            {e.genBtnCancel}
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "#F5F7FA" }}>
      <p className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}
