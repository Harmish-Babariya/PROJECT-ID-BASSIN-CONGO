"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import DetailMap from "@/components/DetailMap"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"

type ParcelPoint = {
  code: string
  lat: number
  lon: number
  status_eudr: string | null
  geojson?: unknown
}

type CollecteRow = {
  id: number
  date_collecte: string
  poids_net_kg: string | number
  qualite: string | null
  nombre_sacs: number | null
  producteur_code: string | null
  producteur_nom: string | null
  parcelle_code: string | null
}

type ParcelleAnalyse = {
  id: number
  code_parcelle: string
  producteur_nom: string | null
  cooperative: string | null
  surface_ha: string | number | null
  type: string | null
  latitude: string | number | null
  longitude: string | number | null
  status_eudr: string | null
  foret_2020_pct: string | number | null
  perte_2021_2024_ha: string | number | null
  alertes_2025_ha: string | number | null
  dans_zone_protegee: boolean | null
}

type LotData = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string | null
  statut: string | null
  destination_pays: string | null
  acheteur: string | null
  date_expedition: string | null
  date_creation: string | null
}

function StatutBadge({ statut }: { statut: string | null }) {
  const { t } = useLanguage()
  let cls = "bg-gray-100 text-gray-500"
  let label: string = statut || "—"
  if (statut === "Exporté") {
    cls = "bg-[#d7efe5] text-[#2f7a5c]"
    label = t.lots.statutExporte
  } else if (statut === "Prêt") {
    cls = "bg-[#e8e4f6] text-[#3b2a7a]"
    label = t.lots.statutPret
  } else if (statut === "En préparation") {
    cls = "bg-[#faecc2] text-[#6b3a12]"
    label = t.lots.statutEnPreparation
  } else if (statut === "En constitution") {
    cls = "bg-[#faecc2] text-[#6b3a12]"
    label = t.lots.statutEnConstitution
  }
  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${cls}`}>
      {label}
    </span>
  )
}

export default function LotDetailClient({
  lot,
  collectes,
  mapPoints,
  parcelles,
}: {
  lot: LotData
  collectes: CollecteRow[]
  mapPoints: ParcelPoint[]
  parcelles: ParcelleAnalyse[]
}) {
  const { t, locale } = useLanguage()
  const l = t.lots
  const tp = t.parcelles
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR"

  // Aggregated deforestation figures for the whole lot.
  const num = (v: string | number | null) => (v == null ? null : Number(v))
  const totalParcelles = parcelles.length
  const negligibleCount = parcelles.filter((p) => p.status_eudr === EUDR_STATUS.CONFORME).length
  const pctNegligible = totalParcelles > 0 ? Math.round((negligibleCount / totalParcelles) * 100) : 0
  const totalPerte = parcelles.reduce((s, p) => s + (num(p.perte_2021_2024_ha) ?? 0), 0)
  const nonNegligibleCount = parcelles.filter(
    (p) => p.status_eudr === EUDR_STATUS.NON_CONFORME
  ).length
  const protectedCount = parcelles.filter((p) => p.dans_zone_protegee === true).length
  const riskLabel = (s: string | null) =>
    s === EUDR_STATUS.CONFORME
      ? tp.eudrConforme
      : s === EUDR_STATUS.NON_CONFORME
        ? tp.eudrNonConforme
        : s === EUDR_STATUS.GEOMETRIE_INVALIDE
          ? tp.eudrGeometrieInvalide
          : tp.eudrEnAttente

  function formatDate(d: string | null) {
    if (!d) return "—"
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(dateLocale)
  }

  const poidsTotal = lot.poids_total_kg ? parseFloat(String(lot.poids_total_kg)).toFixed(2) : "0.00"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/lots" className="text-xs font-semibold text-gray-400 hover:text-gray-600 tracking-widest uppercase">
          {l.detailBack}
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{lot.code_lot}</h1>
          <div className="flex items-center gap-3">
            <StatutBadge statut={lot.statut} />
            <Link
              href={`/lots/${lot.id}/edit`}
              className="bg-[#2ac1a3] text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#24a88e] transition"
            >
              {l.btnEditLot}
            </Link>
            <a
              href={`/api/lots/${lot.id}/geojson`}
              download
              className="inline-flex items-center gap-1.5 bg-[#3b82f6] text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#2563eb] transition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {l.btnDownloadGeojson}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoBlock label={l.detailPoidsTotal} value={`${poidsTotal} kg`} />
          <InfoBlock label={l.detailDestination} value={lot.destination_pays || "—"} />
          <InfoBlock label={l.detailAcheteur} value={lot.acheteur || "—"} />
          <InfoBlock label={l.detailDateExp} value={formatDate(lot.date_expedition)} />
          <InfoBlock label={l.detailDateCreation} value={formatDate(lot.date_creation)} />
          <InfoBlock label={l.detailProduit} value={lot.produit || "—"} />
        </div>
      </div>

      {/* Collectes list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 tracking-[0.15em] uppercase mb-5">
          {l.sectionCollectes(collectes.length)}
        </h2>
        {collectes.length > 0 ? (
          <div className="space-y-2">
            {collectes.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-lg px-5 py-4 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wide mb-1">
                    {formatDate(c.date_collecte)}
                  </p>
                  <p className="text-gray-900 font-semibold text-sm">
                    {c.producteur_code} – {c.producteur_nom}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 font-mono">
                    {l.parcelleLabel} {c.parcelle_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#2ac1a3] tracking-[0.12em] uppercase mb-1">
                    {c.qualite || "STANDARD"}
                  </p>
                  <p className="text-[#2ac1a3] font-bold text-lg">
                    {parseFloat(String(c.poids_net_kg)).toFixed(2)} kg
                  </p>
                  {c.nombre_sacs ? (
                    <p className="text-gray-400 text-xs mt-1">
                      {c.nombre_sacs} {l.sacs}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm mb-4">{l.noCollectes}</p>
            <Link
              href={`/lots/${lot.id}/edit`}
              className="inline-block bg-[#2ac1a3] text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#24a88e] transition"
            >
              {l.addCollectes}
            </Link>
          </div>
        )}
      </div>

      {/* Geolocation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 tracking-[0.15em] uppercase mb-5">
          {l.sectionGeoloc}
        </h2>
        <DetailMap points={mapPoints} />
      </div>

      {/* Deforestation risk analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 tracking-[0.15em] uppercase mb-5">
          {l.sectionAnalyse}
        </h2>

        {/* Aggregated summary — single highlighted green panel with 4 figures */}
        <div className="bg-[#e6f9f5] border border-[#2ac1a3]/30 rounded-2xl px-6 py-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${pctNegligible}%`, label: l.analyseSummaryNegligible },
              { value: `${totalPerte.toFixed(2)} ha`, label: l.analyseSummaryPerte },
              { value: `${nonNegligibleCount}/${totalParcelles}`, label: l.analyseSummaryNonNegligible },
              { value: `${protectedCount}/${totalParcelles}`, label: l.analyseSummaryProtegee },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-[#1da88e]">{value}</p>
                <p className="text-[13px] text-gray-600 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-parcel table */}
        {parcelles.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/60 border-b border-gray-200">
                  <th className="py-3 px-4">{l.colParcelle}</th>
                  <th className="py-3 px-4">{l.colCooperative}</th>
                  <th className="py-3 px-4">{l.colProducteur}</th>
                  <th className="py-3 px-4">{tp.cardSurface}</th>
                  <th className="py-3 px-4">{l.colType}</th>
                  <th className="py-3 px-4">{l.colLat}</th>
                  <th className="py-3 px-4">{l.colLong}</th>
                  <th className="py-3 px-4">{l.colForet2020}</th>
                  <th className="py-3 px-4">{l.colPerteForet}</th>
                  <th className="py-3 px-4">{l.colAlertes}</th>
                  <th className="py-3 px-4">{l.colAireProtegee}</th>
                  <th className="py-3 px-4">{l.colRisque}</th>
                  <th className="py-3 px-4 text-center">{l.colGeojson}</th>
                </tr>
              </thead>
              <tbody>
                {parcelles.map((p) => (
                  <tr key={p.code_parcelle} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-[#2ac1a3] font-semibold">{p.code_parcelle}</td>
                    <td className="py-3 px-4 text-gray-700">{p.cooperative ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-900">{p.producteur_nom ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{p.surface_ha != null ? String(p.surface_ha) : "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{p.type === "Polygon" ? l.typePolygon : p.type === "Point" ? l.typePoint : "—"}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{num(p.latitude) != null ? num(p.latitude)!.toFixed(4) : "—"}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{num(p.longitude) != null ? num(p.longitude)!.toFixed(4) : "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{num(p.foret_2020_pct) != null ? `${num(p.foret_2020_pct)}%` : "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{num(p.perte_2021_2024_ha) != null ? `${num(p.perte_2021_2024_ha)} ha` : "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{num(p.alertes_2025_ha) != null ? `${num(p.alertes_2025_ha)} ha` : "—"}</td>
                    <td className="py-3 px-4 text-gray-700">{p.dans_zone_protegee == null ? "—" : (p.dans_zone_protegee ? tp.yes : tp.no)}</td>
                    <td className="py-3 px-4"><RiskBadge status={p.status_eudr} label={riskLabel(p.status_eudr)} /></td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={`/api/parcelles/${p.id}/geojson`}
                        download
                        title={l.btnDownloadGeojson}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#3b82f6] text-white hover:bg-[#2563eb] transition"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">{l.noParcelles}</p>
        )}
      </div>
    </div>
  )
}

// Small pill for the RISQUE column — green for negligible, red for
// non-negligible, orange for invalid geometry, amber for "could not assess".
function RiskBadge({ status, label }: { status: string | null; label: string }) {
  const norm = normalizeEudrStatus(status)
  let cls = "bg-amber-50 text-amber-700"
  if (norm === EUDR_STATUS.CONFORME) cls = "bg-[#2ac1a3]/10 text-[#1da88e]"
  else if (norm === EUDR_STATUS.NON_CONFORME) cls = "bg-red-100 text-red-700"
  else if (norm === EUDR_STATUS.GEOMETRIE_INVALIDE) cls = "bg-orange-100 text-orange-700"
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-md px-4 py-3">
      <p className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-1">
        {label}
      </p>
      <p className="text-gray-900 font-semibold text-sm">{value}</p>
    </div>
  )
}
