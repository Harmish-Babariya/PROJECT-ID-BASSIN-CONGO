"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import LotMap from "./LotMap"

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
}: {
  lot: LotData
  collectes: CollecteRow[]
  mapPoints: ParcelPoint[]
}) {
  const { t, locale } = useLanguage()
  const l = t.lots
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR"

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
        <LotMap
          points={mapPoints}
          emptyLabel={l.mapEmpty}
          legendConformeLabel={l.legendConforme}
          legendNonConformeLabel={l.legendNonConforme}
          legendRisqueLabel={l.legendRisque}
          legendEnAttenteLabel={l.legendEnAttente}
          legendNotVerifiedLabel={l.legendNotVerified}
        />
      </div>
    </div>
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
