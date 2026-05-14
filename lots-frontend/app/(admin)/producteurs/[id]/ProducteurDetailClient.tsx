"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"
import { translateGeoName } from "@/lib/i18n/geo"

const CarteMapbox = dynamic(() => import("@/app/(admin)/dashboard/CarteMapbox"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1A1A1A] rounded-xl flex items-center justify-center min-h-[240px]">
      <p className="text-white/40 text-[12px] tracking-widest uppercase">Chargement…</p>
    </div>
  ),
})

type Zone = { nom: string } | null
type Pays = { nom: string } | null

type Producteur = {
  id: number
  code_producteur: string
  nom: string | null
  prenom: string | null
  sexe: string | null
  annee_naissance: number | null
  nationalite: string | null
  communaute: string | null
  village: string | null
  telephone: string | null
  statut: string | null
  role_activite_cacao: string | null
  type_proprietaire: string | null
  structure_embauche: string | null
  source_principale_revenus: string | null
  place_cacao: string | null
  cultures_phares: string[] | null
  autres_activites: string[] | null
  main_oeuvre_supplementaire: string | null
  recolte_annee_derniere: string | null
  usage_cacao_recolte: string[] | null
  mode_vente: string[] | null
  lieu_vente: string | null
  acheteur: string[] | null
  kilos_vendus: string | number | null
  prix_kilo: string | number | null
  zones: Zone
  pays: Pays
}

type Parcelle = {
  id: number
  code_parcelle: string
  surface_ha: string | number | null
  culture: string | null
  status_eudr: string | null
  latitude?: number | null
  longitude?: number | null
  geojson?: unknown
}

function tx(value: string | null | undefined, labels?: Record<string, string>): string {
  if (!value) return value ?? ""
  return labels?.[value] ?? value
}

function formatList(values: string[] | null, labels?: Record<string, string>): string {
  if (!values || values.length === 0) return "—"
  return values.map(v => tx(v, labels)).join("; ")
}

function formatValue(value: string | number | null | undefined, labels?: Record<string, string>): string {
  if (value === null || value === undefined || value === "") return "—"
  return tx(String(value), labels)
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 gap-3">
      <span className="font-numbers text-[13px] sm:text-[14px] text-[#7A8290] shrink-0 max-w-[50%]">{label}</span>
      <span className="font-numbers text-[13px] sm:text-[14px] font-bold text-[#1A1A1A] text-right break-words">{value}</span>
    </div>
  )
}

export default function ProducteurDetailClient({
  producteur,
  parcelles,
}: {
  producteur: Producteur
  parcelles: Parcelle[]
}) {
  const { t, locale } = useLanguage()
  const p = t.producteurs
  const geo = (n: string | null | undefined) => translateGeoName(n, locale)
  const [mapExpanded, setMapExpanded] = useState(false)

  useEffect(() => {
    if (!mapExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [mapExpanded])

  const mapParcelles = parcelles
    .filter((pc) => pc.latitude != null && pc.longitude != null)
    .map((pc) => ({
      id: pc.id,
      code_parcelle: pc.code_parcelle,
      latitude: Number(pc.latitude),
      longitude: Number(pc.longitude),
      status_eudr: pc.status_eudr ?? "",
      surface_ha: Number(pc.surface_ha) || 0,
      geojson: pc.geojson,
      producteurs: {
        code_producteur: producteur.code_producteur,
        nom: producteur.nom ?? "",
      },
    }))

  const totalSurface = parcelles.reduce(
    (sum, pc) => sum + (parseFloat(String(pc.surface_ha)) || 0),
    0
  )
  const conformesCount = parcelles.filter(
    (pc) => normalizeEudrStatus(pc.status_eudr) === EUDR_STATUS.CONFORME
  ).length
  const risquesCount = parcelles.filter(
    (pc) => normalizeEudrStatus(pc.status_eudr) === EUDR_STATUS.RISQUE
  ).length
  const enAttenteCount = parcelles.filter(
    (pc) => normalizeEudrStatus(pc.status_eudr) === EUDR_STATUS.EN_ATTENTE
  ).length
  const notVerifiedCount = parcelles.filter(
    (pc) => normalizeEudrStatus(pc.status_eudr) === null
  ).length

  const displayName = [producteur.nom, producteur.prenom].filter(Boolean).join(" ").trim()

  const labels = p.optionLabels
  const infoRows: Array<{ label: string; value: string }> = [
    { label: p.fieldSexe, value: formatValue(producteur.sexe, labels) },
    { label: p.fieldAnneeNaissance, value: formatValue(producteur.annee_naissance) },
    { label: p.fieldNationalite, value: formatValue(producteur.nationalite, labels) },
    { label: p.fieldCommunaute, value: formatValue(producteur.communaute) },
    { label: p.fieldTelephone, value: formatValue(producteur.telephone) },
    { label: p.fieldPays, value: formatValue(geo(producteur.pays?.nom)) },
    { label: p.fieldZone, value: formatValue(geo(producteur.zones?.nom)) },
    { label: p.fieldVillage, value: formatValue(producteur.village) },
  ]

  const otherRows: Array<{ label: string; value: string }> = [
    { label: p.fieldRole, value: formatValue(producteur.role_activite_cacao, labels) },
    { label: p.fieldTypeProprietaire, value: formatValue(producteur.type_proprietaire, labels) },
    { label: p.fieldSourceRevenus, value: formatValue(producteur.source_principale_revenus, labels) },
    { label: p.fieldPlaceCacao, value: formatValue(producteur.place_cacao) },
    { label: p.fieldCulturesPhares, value: formatList(producteur.cultures_phares, labels) },
    { label: p.fieldAutresActivites, value: formatList(producteur.autres_activites, labels) },
    { label: p.fieldMainOeuvre, value: formatValue(producteur.main_oeuvre_supplementaire, labels) },
    { label: p.fieldRecolte, value: formatValue(producteur.recolte_annee_derniere, labels) },
    { label: p.fieldUsageCacao, value: formatList(producteur.usage_cacao_recolte, labels) },
    { label: p.fieldModeVente, value: formatList(producteur.mode_vente, labels) },
    { label: p.fieldKilos, value: formatValue(producteur.kilos_vendus) },
    { label: p.fieldPrixKiloFcfa, value: formatValue(producteur.prix_kilo) },
    { label: p.fieldLieuVente, value: formatValue(producteur.lieu_vente) },
    { label: p.fieldAcheteur, value: formatList(producteur.acheteur, labels) },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Back + header */}
      <div>
        <Link
          href="/producteurs"
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mb-3 inline-block"
        >
          {p.backToList}
        </Link>
        <h1 className="text-[22px] sm:text-[28px] font-bold text-[#1A1A1A] break-words">
          {displayName || producteur.code_producteur}
        </h1>
        <p className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium mt-1 flex flex-wrap gap-1 items-center">
          <span className="font-mono">{producteur.code_producteur}</span>
          <span>·</span>
          <span>{producteur.statut ? (labels[producteur.statut] ?? producteur.statut) : "—"}</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiParcelles}
          </p>
          <p className="text-[22px] sm:text-[28px] font-bold text-[#1A1A1A] mt-1 font-numbers">
            {parcelles.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiSurface}
          </p>
          <p className="text-[18px] sm:text-[28px] font-bold text-[#1A1A1A] mt-1 font-numbers">
            {totalSurface.toFixed(2)} <span className="text-[13px]">ha</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiEudr}
          </p>
          <div className="mt-2">
            {(() => {
              // Dominant status: alert wins over pending, pending over compliant,
              // compliant over not-verified. Mirrors the priority used in the
              // parcel list filters.
              const tParc = t.parcelles
              const cls = "inline-block px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold uppercase tracking-wide"
              if (risquesCount > 0) {
                return <span className={`${cls} bg-yellow-100 text-yellow-700`}>{tParc.eudrRisque}</span>
              }
              if (enAttenteCount > 0) {
                return <span className={`${cls} bg-amber-50 text-amber-700`}>{tParc.eudrEnAttente}</span>
              }
              if (conformesCount > 0) {
                return <span className={`${cls} bg-[#2ac1a3]/15 text-[#2ac1a3]`}>{tParc.eudrConforme}</span>
              }
              return <span className={`${cls} bg-gray-100 text-gray-500`}>{tParc.notVerified}</span>
            })()}
          </div>
        </div>
      </div>

      {/* Info + map row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 pt-4 pb-2">
          <h3 className="font-numbers text-[12px] sm:text-[13px] font-bold text-[#1A1A1A] tracking-[0.16em] uppercase pb-2.5 border-b border-gray-100">
            {p.sectionInformations}
          </h3>
          <div>
            {infoRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div
          role="button"
          tabIndex={0}
          aria-label={t.common.expand}
          onClick={() => setMapExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setMapExpanded(true)
            }
          }}
          className="relative rounded-xl overflow-hidden min-h-[240px] sm:min-h-[280px] cursor-zoom-in group"
        >
          <div className="[&>div]:!h-full [&>div]:!rounded-xl h-full min-h-[240px] sm:min-h-[280px] pointer-events-none">
            <CarteMapbox parcelles={mapParcelles} />
          </div>
          <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-md flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            {t.common.expand}
          </div>
          {parcelles.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 text-[10px] tracking-[0.15em] uppercase pointer-events-none z-10">
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#2AC1A3] shrink-0" />
                {p.legendConforme} ({conformesCount})
              </span>
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
                {p.legendRisque} ({risquesCount})
              </span>
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                {p.legendEnAttente} ({enAttenteCount})
              </span>
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#94A3B8] shrink-0" />
                {p.legendNotVerified} ({notVerifiedCount})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Other info + Parcelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 pt-4 pb-2">
          <h3 className="font-numbers text-[12px] sm:text-[13px] font-bold text-[#1A1A1A] tracking-[0.16em] uppercase pb-2.5 border-b border-gray-100">
            {p.sectionAutresInfos}
          </h3>
          <div>
            {otherRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Parcelles header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-numbers text-[15px] sm:text-[16px] font-bold text-[#1A1A1A] tracking-[0.14em] uppercase">
              <span className="text-[#2AC1A3] text-[17px]">🌱</span>
              {p.sectionParcelles}{" "}
              <span className="text-[#1A1A1A]">({parcelles.length})</span>
            </h3>
            <Link
              href={`/parcelles/nouveau?producteur_id=${producteur.id}`}
              className="bg-[#6FCFB5] hover:bg-[#5fc0a5] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-numbers text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase transition inline-flex items-center gap-2"
            >
              {p.addParcelBtn}
            </Link>
          </div>

          {/* Parcelles table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-gray-200">
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colCode}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colSurface}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap hidden sm:table-cell">
                      {p.colCulture}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colEudr}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parcelles.map((pc) => (
                    <tr key={pc.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 sm:px-6 py-4">
                        <Link
                          href={`/parcelles/${pc.id}`}
                          className="font-mono text-[12px] sm:text-[13px] text-[#2AC1A3] font-bold tracking-[0.08em] hover:underline whitespace-nowrap"
                        >
                          {pc.code_parcelle}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-numbers text-[13px] sm:text-[15px] text-[#1A1A1A] whitespace-nowrap">
                        {pc.surface_ha ?? "—"} ha
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-numbers text-[13px] sm:text-[15px] text-[#1A1A1A] hidden sm:table-cell">
                        {pc.culture ?? "—"}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {(() => {
                          const norm = normalizeEudrStatus(pc.status_eudr)
                          let cls = "bg-gray-100 text-gray-500"
                          let label: string = t.parcelles.notVerified
                          if (norm === EUDR_STATUS.CONFORME) {
                            cls = "bg-[#D4F1E7] text-[#2AC1A3]"
                            label = t.parcelles.eudrConforme
                          } else if (norm === EUDR_STATUS.RISQUE) {
                            cls = "bg-[#FBE9C8] text-[#8B6914]"
                            label = t.parcelles.eudrRisque
                          } else if (norm === EUDR_STATUS.EN_ATTENTE) {
                            cls = "bg-amber-50 text-amber-700"
                            label = t.parcelles.eudrEnAttente
                          }
                          return (
                            <span className={`inline-block px-2 sm:px-3 py-1 rounded-full font-numbers text-[10px] sm:text-[11px] font-bold tracking-[0.1em] uppercase whitespace-nowrap ${cls}`}>
                              {label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Link
                          href={`/parcelles/${pc.id}/edit`}
                          className="font-mono text-[11px] sm:text-[12px] text-[#6B7280] tracking-[0.14em] uppercase hover:text-[#2AC1A3]"
                        >
                          {p.actionEdit}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {parcelles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center font-numbers text-[14px] text-gray-400">
                        —
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4">
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
                {p.fieldPrixVenteFcfa}
              </p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mt-1 font-numbers break-all">
                {formatValue(producteur.kilos_vendus)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4">
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
                {p.fieldPrixKiloFcfa}
              </p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mt-1 font-numbers break-all">
                {formatValue(producteur.prix_kilo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/producteurs/${producteur.id}/modifier`}
          className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-[#24a88e] transition"
        >
          {p.actionEdit}
        </Link>
      </div>

      {/* Expanded map modal */}
      {mapExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setMapExpanded(false)}
        >
          <div
            className="relative w-full h-full max-w-[1400px] max-h-[95vh] bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 left-3 z-20 bg-black/70 text-white text-[11px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-md font-semibold">
              {displayName || producteur.code_producteur}
            </div>
            <button
              type="button"
              onClick={() => setMapExpanded(false)}
              aria-label={t.common.close}
              className="absolute top-3 right-3 z-20 bg-black/70 hover:bg-black text-white text-[11px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {t.common.close}
            </button>
            <div className="[&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none w-full h-full">
              <CarteMapbox parcelles={mapParcelles} />
            </div>
            {parcelles.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 text-[10px] tracking-[0.15em] uppercase pointer-events-none z-10">
                <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-[#2AC1A3] shrink-0" />
                  {p.legendConforme} ({conformesCount})
                </span>
                <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
                  {p.legendRisque} ({risquesCount})
                </span>
                <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                  {p.legendEnAttente} ({enAttenteCount})
                </span>
                <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-[#94A3B8] shrink-0" />
                  {p.legendNotVerified} ({notVerifiedCount})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
