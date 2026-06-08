"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import DetailMap from "@/components/DetailMap"
import type { MapParcel } from "@/components/DetailMap"

type Props = {
  collecte: {
    id: number
    date_collecte: string
    produit: string | null
    poids_net_kg: number | null
    qualite: string | null
    nombre_sacs: number | null
    humidite_pct: number | null
    producteurs: { id: number; code_producteur: string; nom: string; prenom: string } | null
    parcelles: {
      id: number
      code_parcelle: string
      latitude?: number | null
      longitude?: number | null
      geojson?: unknown
      status_eudr?: string | null
    } | null
  }
  estAssignee: boolean
  lot: { id: number; code_lot: string; statut: string } | undefined
}

export default function CollecteDetailClient({ collecte, estAssignee, lot }: Props) {
  const { t, locale } = useLanguage()
  const c = t.collectes

  const mapPoints: MapParcel[] = (() => {
    const pc = collecte.parcelles
    if (!pc) return []
    return [{
      code: pc.code_parcelle,
      lat: Number(pc.latitude),
      lon: Number(pc.longitude),
      status_eudr: pc.status_eudr ?? null,
      geojson: pc.geojson,
    }]
  })()

  const dateFormatted = new Date(collecte.date_collecte).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  )

  return (
    <div className="space-y-5">

      {/* Back link */}
      <div>
        <Link
          href="/collectes"
          className="text-[10px] text-gray-400 tracking-[0.15em] uppercase hover:text-[#2AC1A3] transition"
        >
          {c.backToList}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-6 pb-6 flex justify-between items-start">
          <div>
            <h1 className="font-archivo text-[24px] font-bold text-gray-900 tracking-tight">
              COLLECTE #{collecte.id}
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5 capitalize">{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {estAssignee ? (
              <span className="font-courier px-3.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-widest uppercase bg-amber-100 text-amber-700">
                {c.assignedToLot}
              </span>
            ) : (
              <span className="font-courier px-3.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-widest uppercase bg-[#2AC1A3]/10 text-[#2AC1A3]">
                {c.available}
              </span>
            )}
            <Link
              href={`/collectes/${collecte.id}/edit`}
              className="font-courier bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[11px] font-semibold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {c.actionEdit}
            </Link>
          </div>
        </div>

        <hr className="border-gray-200 mx-8" />

        {/* Producteur */}
        <div className="px-8 py-5">
          <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-1.5">
            {c.labelProducteur}
          </p>
          {collecte.producteurs ? (
            <Link
              href={`/producteurs/${collecte.producteurs.id}`}
              className="text-[#2AC1A3] text-[15px] font-semibold hover:underline"
            >
              {collecte.producteurs.code_producteur} – {collecte.producteurs.nom} {collecte.producteurs.prenom}
            </Link>
          ) : (
            <span className="text-gray-400 text-[13px]">—</span>
          )}
        </div>

        <hr className="border-gray-200 mx-8" />

        {/* Parcelle */}
        <div className="px-8 py-5">
          <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-1.5">
            {c.labelParcelle}
          </p>
          {collecte.parcelles ? (
            <Link
              href={`/parcelles/${collecte.parcelles.id}`}
              className="text-[#2AC1A3] text-[15px] font-semibold hover:underline"
            >
              {collecte.parcelles.code_parcelle}
            </Link>
          ) : (
            <span className="text-gray-400 text-[13px]">—</span>
          )}
        </div>

        <hr className="border-gray-200 mx-8" />

        {/* Data fields grid */}
        <div className="px-8 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-5 py-4">
              <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-2">{c.labelProduit}</p>
              <p className="text-[15px] font-semibold text-gray-900">{collecte.produit || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-5 py-4">
              <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-2">{c.labelPoidsNet}</p>
              <p className="text-[22px] font-bold text-[#2AC1A3]">
                {collecte.poids_net_kg ? `${parseFloat(String(collecte.poids_net_kg)).toFixed(2)} kg` : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-5 py-4">
              <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-2">{c.labelQualite}</p>
              <p className="text-[15px] font-semibold text-gray-900">{collecte.qualite || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-5 py-4">
              <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-2">{c.labelNombreSacs}</p>
              <p className="text-[15px] font-semibold text-gray-900">
                {collecte.nombre_sacs != null ? collecte.nombre_sacs : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-100 px-5 py-4">
              <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-2">{c.labelHumidite}</p>
              <p className="text-[15px] font-semibold text-gray-900">
                {collecte.humidite_pct != null ? `${collecte.humidite_pct}%` : "—"}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Parcelle map */}
      {mapPoints.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-8 pt-6 pb-2">
            <p className="font-courier text-[9px] text-gray-400 tracking-[0.15em] uppercase font-semibold mb-4">
              {c.labelParcelle}
            </p>
          </div>
          <div className="px-8 pb-6">
            <DetailMap points={mapPoints} height={280} />
          </div>
        </div>
      )}

      {/* Lot assignment banners */}
      {estAssignee && lot && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4">
          <p className="text-[13px] text-amber-800 font-semibold mb-1">{c.lotPartOf}</p>
          <Link
            href={`/lots/${lot.id}`}
            className="font-courier text-[#2AC1A3] text-[12px] font-semibold hover:underline"
          >
            {lot.code_lot}
          </Link>
        </div>
      )}

      {!estAssignee && (
        <div className="bg-[#2AC1A3]/5 border border-[#2AC1A3]/20 rounded-xl px-6 py-4">
          <p className="text-[13px] text-[#2AC1A3] font-semibold mb-1">{c.collecteAvailable}</p>
          <p className="text-[11px] text-gray-400">{c.collecteAvailableDesc}</p>
        </div>
      )}
    </div>
  )
}
