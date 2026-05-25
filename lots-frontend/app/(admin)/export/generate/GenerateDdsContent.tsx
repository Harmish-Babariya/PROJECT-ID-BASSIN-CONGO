"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS } from "@/lib/eudr"

type DdsStatut = "en_preparation" | "pret" | "exporte"

type ReadyLot = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string
  statut: string | null
  destination_pays?: string | null
  acheteur?: string | null
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

type SelectedDetails = {
  lot: any
  producteurs: Producteur[]
  parcelles: Parcelle[]
  collectesCount: number
}

function eudrPct(parcelles: Parcelle[]): number {
  if (!parcelles.length) return 0
  const conformes = parcelles.filter(
    (p) => p.status_eudr === EUDR_STATUS.CONFORME
  ).length
  return Math.round((conformes / parcelles.length) * 100)
}

function hasRisk(parcelles: Parcelle[]): number {
  return parcelles.filter(
    (p) =>
      p.status_eudr === EUDR_STATUS.RISQUE ||
      p.status_eudr === EUDR_STATUS.NON_CONFORME
  ).length
}

export default function GenerateDdsContent({
  readyLots,
  collectesParLot,
  selectedLotDetails,
  selectedLotId,
  eudrSummaryByLot = {},
}: {
  readyLots: ReadyLot[]
  collectesParLot: Record<number, number>
  selectedLotDetails: SelectedDetails | null
  selectedLotId: number | null
  currentUserName: string
  eudrSummaryByLot?: Record<number, { conformes: number; risques: number; total: number }>
}) {
  const { t, locale } = useLanguage()
  const e = t.export
  const router = useRouter()
  const [ddsStatut, setDdsStatut] = useState<DdsStatut>("pret")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ ok: true; ref: string } | { ok: false; msg: string } | null>(null)

  function selectLot(lotId: number) {
    router.push(`/export/generate?lotId=${lotId}`)
  }

  function eudrLabel(status: string | null): string {
    if (status === EUDR_STATUS.CONFORME) return e.genConforme
    if (status === EUDR_STATUS.RISQUE || status === EUDR_STATUS.NON_CONFORME)
      return e.genRisque
    if (status === EUDR_STATUS.EN_ATTENTE) return e.genEnAttente
    return e.genNonVerifie
  }

  function eudrColor(status: string | null): string {
    if (status === EUDR_STATUS.CONFORME) return "text-[#2ac1a3] font-semibold"
    if (status === EUDR_STATUS.RISQUE || status === EUDR_STATUS.NON_CONFORME)
      return "text-red-500 font-semibold"
    if (status === EUDR_STATUS.EN_ATTENTE) return "text-yellow-600 font-semibold"
    return "text-gray-400"
  }

  function lotEudrSummary(parcelles: Parcelle[]): string {
    const pct = eudrPct(parcelles)
    const risk = hasRisk(parcelles)
    if (risk > 0) return "risque"
    if (pct === 100) return "conforme"
    return "attente"
  }

  async function handleGenerate() {
    if (!selectedLotId) return
    setGenerating(true)
    setResult(null)

    const statutMap: Record<DdsStatut, string> = {
      en_preparation: "En préparation",
      pret: "Prêt",
      exporte: "Exporté",
    }

    try {
      const res = await fetch("/api/dds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: selectedLotId,
          statut: statutMap[ddsStatut],
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: json.message || "Erreur lors de la création." })
      } else {
        setResult({ ok: true, ref: json.dds.reference_dds })
      }
    } catch {
      setResult({ ok: false, msg: "Erreur réseau. Veuillez réessayer." })
    } finally {
      setGenerating(false)
    }
  }

  const lot = selectedLotDetails?.lot ?? null
  const producteurs = selectedLotDetails?.producteurs ?? []
  const parcelles = selectedLotDetails?.parcelles ?? []

  const lotEudrState = useMemo(
    () => (parcelles.length ? lotEudrSummary(parcelles) : null),
    [parcelles]
  )

  const ddsStatutOptions: { value: DdsStatut; label: string }[] = [
    { value: "en_preparation", label: e.genStatutEnPreparation },
    { value: "pret", label: e.genStatutPret },
    { value: "exporte", label: e.genStatutExporte },
  ]

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div>
        <Link
          href="/export"
          className="text-xs text-gray-400 tracking-widest uppercase hover:text-[#2ac1a3] transition mb-3 inline-block"
          style={{ fontFamily: "var(--font-courier-prime)" }}
        >
          {e.genBack}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-archivo-narrow)" }}>{e.genTitle}</h1>
        <p className="text-gray-400 text-sm mt-1">{e.genSubtitle}</p>
      </div>

      {/* Admin info banner */}
      <div className="bg-[#f0faf7] border-l-4 border-[#2ac1a3] rounded-lg px-5 py-4">
        <p className="text-xs font-bold text-[#2ac1a3] tracking-widest uppercase mb-1">
          {e.genAdminBadge}
        </p>
        <p className="text-sm text-[#1a7a63]">{e.genAdminDesc}</p>
      </div>

      {/* Lots list */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-archivo-narrow)" }}>
          {e.genLotsTitle}
        </h2>
        <div className="w-10 h-0.5 bg-[#2ac1a3] mb-4" />

        {readyLots.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm mb-3">{e.genNoLotsReady}</p>
            <Link
              href="/lots"
              className="text-[#2ac1a3] text-sm font-semibold hover:underline"
            >
              {e.genGoToLots}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "var(--font-archivo-narrow)" }}>
              {e.genLotsDesc(readyLots.length)}
            </p>
            <div className="space-y-3 max-h-[calc(3*112px)] overflow-y-auto pr-1">
              {readyLots.map((rl) => {
                const isSelected = rl.id === selectedLotId
                const nCollectes = collectesParLot[rl.id] ?? 0
                const poids = parseFloat(rl.poids_total_kg) || 0

                return (
                  <button
                    key={rl.id}
                    onClick={() => selectLot(rl.id)}
                    className={`w-full text-left rounded-xl px-5 py-4 transition ${
                      isSelected
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    style={{ backgroundColor: isSelected ? undefined : "#F5F7FA" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-bold text-blue-600">
                            {rl.code_lot}
                          </span>
                          <span className="px-2 py-0.5 bg-[#e8e4f6] text-[#3b2a7a] text-[10px] font-bold rounded tracking-wide">
                            {e.genTagPret}
                          </span>
                          {/* EUDR tag — always shown using pre-fetched summary */}
                          {(() => {
                            const summary = eudrSummaryByLot[rl.id]
                            if (!summary || summary.total === 0) return null
                            if (summary.risques > 0) {
                              return (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded tracking-wide">
                                  {e.genTagRisque(summary.risques)}
                                </span>
                              )
                            }
                            const pct = Math.round((summary.conformes / summary.total) * 100)
                            return (
                              <span className="px-2 py-0.5 bg-[#e8f7f3] text-[#2ac1a3] text-[10px] font-bold rounded tracking-wide">
                                {e.genTagConforme(pct)}
                              </span>
                            )
                          })()}
                        </div>
                        {/* Main info */}
                        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-archivo-narrow)" }}>
                          {[rl.produit, rl.destination_pays, rl.acheteur]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {e.genCollectes(nCollectes)}&nbsp;·&nbsp;
                          {isSelected && producteurs.length > 0
                            ? `${e.genProducteurs(producteurs.length)} · ${e.genParcelles(parcelles.length)} · `
                            : ""}
                          <span style={{ fontFamily: "var(--font-archivo-narrow)" }}>
                            {poids.toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            kg
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-base font-bold ${
                            isSelected ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {poids.toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          kg
                        </p>
                        {isSelected ? (
                          <p className="text-[10px] font-bold text-blue-600 tracking-wide mt-0.5">
                            ✓ {e.genSelected}
                          </p>
                        ) : isSelected && lotEudrState === "risque" ? (
                          <p className="text-[10px] text-yellow-600 flex items-center gap-1 justify-end mt-0.5">
                            <span>⚠</span> {e.genVerifyEudr}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Preview panel */}
      {selectedLotId && (
        <div className="bg-white border-2 border-blue-400 rounded-xl p-6 space-y-5">
          {/* Preview header */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-widest uppercase">
              {lot ? e.genPreviewTitle(lot.code_lot) : "…"}
            </h2>
            {lotEudrState === "conforme" && (
              <span className="px-3 py-1 border border-blue-400 text-blue-600 text-[10px] font-bold rounded tracking-widest uppercase">
                {e.genReadyBadge}
              </span>
            )}
          </div>

          {lot ? (
            <>
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label={e.genFieldLot}>
                  <span className="text-[#2ac1a3] font-semibold">
                    {lot.code_lot}
                  </span>
                </InfoCard>
                <InfoCard label={e.genFieldProduit}>
                  <span className="font-semibold text-gray-900">
                    {lot.produit ?? "—"}
                  </span>
                </InfoCard>
                <InfoCard label={e.genFieldPoids}>
                  <span className="font-semibold text-gray-900">
                    {parseFloat(lot.poids_total_kg || "0").toLocaleString(
                      locale === "en" ? "en-GB" : "fr-FR",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}{" "}
                    kg
                  </span>
                </InfoCard>
                <InfoCard label={e.genFieldDestination}>
                  <span className="font-semibold text-gray-900">
                    {lot.destination_pays ?? lot.pays?.nom ?? "—"}
                  </span>
                </InfoCard>
                <InfoCard label={e.genFieldAcheteur}>
                  <span className="font-semibold text-gray-900">
                    {lot.acheteur ?? "—"}
                  </span>
                </InfoCard>
                <InfoCard label={e.genFieldEudr}>
                  {lotEudrState === "conforme" ? (
                    <span className="text-[#2ac1a3] font-bold text-sm tracking-wide">
                      {e.genEudrConforme}
                    </span>
                  ) : lotEudrState === "risque" ? (
                    <span className="text-red-500 font-bold text-sm tracking-wide">
                      {e.genEudrRisque}
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-bold text-sm tracking-wide">
                      {e.genEudrEnAttente}
                    </span>
                  )}
                </InfoCard>
              </div>

              {/* DDS Status selector */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
                  {e.genFieldStatutDds}
                </label>
                <select
                  value={ddsStatut}
                  onChange={(ev) => setDdsStatut(ev.target.value as DdsStatut)}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3] transition"
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
                  <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-courier-prime)" }}>
                    {e.genProducersTitle(producteurs.length)}
                  </p>
                  <div className="rounded-xl overflow-hidden">
                    {producteurs.map((prod, idx) => {
                      const myParcelle = parcelles[idx] ?? null

                      return (
                        <div
                          key={prod.id}
                          className="px-5 py-4 flex items-center justify-between gap-4 mb-2 last:mb-0 rounded-lg"
                          style={{ backgroundColor: "#F5F7FA" }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2ac1a3] tracking-wide" style={{ fontFamily: "var(--font-courier-prime)" }}>
                              {prod.code_producteur} — {prod.nom}{" "}
                              {prod.prenom ?? ""}
                            </p>
                            {myParcelle && (
                              <>
                                <p className="text-[14px] text-gray-400 mt-0" style={{ fontFamily: "var(--font-archivo-narrow)" }}>
                                  {myParcelle.code_parcelle}
                                  {myParcelle.surface_ha != null ? ` · ${myParcelle.surface_ha} ha` : ""}
                                  {myParcelle.zones?.nom ? ` · ${myParcelle.zones.nom}` : ""}
                                  {myParcelle.pays?.nom ? `, ${myParcelle.pays.nom}` : ""}
                                </p>
                                {myParcelle.latitude != null && myParcelle.longitude != null && (
                                  <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-courier-prime)" }}>
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
                                <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-archivo-narrow)" }}>
                                  {myParcelle.surface_ha != null ? `${myParcelle.surface_ha} ha` : "—"}
                                </p>
                                <p className={`text-[10px] mt-1 tracking-widest uppercase font-bold ${eudrColor(myParcelle.status_eudr)}`} style={{ fontFamily: "var(--font-courier-prime)" }}>
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
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              {e.genSelectLotFirst}
            </p>
          )}
        </div>
      )}

      {!selectedLotId && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">{e.genSelectLotFirst}</p>
        </div>
      )}

      {/* Result feedback */}
      {result && (
        result.ok ? (
          <div className="flex items-start gap-3 bg-[#f0faf7] border border-[#2ac1a3] rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-[#2ac1a3] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-bold text-[#1a7a63]">
                {locale === "en" ? "DDS created successfully" : "DDS créée avec succès"}
              </p>
              <p className="text-xs text-[#1a7a63] mt-0.5 font-mono">{result.ref}</p>
              <Link
                href="/export"
                className="text-xs text-[#2ac1a3] font-semibold hover:underline mt-1 inline-block"
              >
                {locale === "en" ? "← Back to DDS list" : "← Retour à la liste DDS"}
              </Link>
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

      {/* Footer: note + action buttons */}
      <div className="flex items-end justify-between gap-4">
        <p className="text-xs text-gray-400 max-w-md">{e.genFooterNote}</p>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!selectedLotId || generating || result?.ok === true}
            className="px-6 py-2.5 text-white text-sm font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: "#0EA5E9" }}
          >
            {generating ? "…" : e.genBtnGenerate}
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

function InfoCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "#F5F7FA" }}>
      <p className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase mb-1">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  )
}
