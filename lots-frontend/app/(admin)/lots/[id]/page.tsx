import { notFound } from "next/navigation"
import { getLotById, getLotCollectes } from "@/lib/services/lots"
import LotDetailClient from "./LotDetailClient"

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lot = await getLotById(id)
  if (!lot) notFound()

  const lotCollectes = await getLotCollectes(id)
  const collectesRaw = lotCollectes.map((lc: any) => lc.collectes).filter(Boolean) as any[]

  const collectes = collectesRaw.map((c) => ({
    id: c.id,
    date_collecte: c.date_collecte,
    poids_net_kg: c.poids_net_kg,
    qualite: c.qualite,
    nombre_sacs: c.nombre_sacs ?? null,
    producteur_code: c.producteurs?.code_producteur ?? null,
    producteur_nom: [c.producteurs?.nom, c.producteurs?.prenom].filter(Boolean).join(" ") || null,
    parcelle_code: c.parcelles?.code_parcelle ?? null,
  }))

  // Build unique parcelles for the map
  const parcellesMap = new Map<string, any>()
  collectesRaw.forEach((c) => {
    if (c.parcelles?.code_parcelle) {
      parcellesMap.set(c.parcelles.code_parcelle, c.parcelles)
    }
  })
  const mapPoints = Array.from(parcellesMap.values()).map((p: any) => {
    const conforme = (p.status_eudr || "").toString().toUpperCase() === "CONFORME"
    return {
      code: p.code_parcelle,
      lat: p.latitude !== null && p.latitude !== "" ? Number(p.latitude) : NaN,
      lon: p.longitude !== null && p.longitude !== "" ? Number(p.longitude) : NaN,
      conforme,
      geojson: p.geojson ?? null,
    }
  })

  return (
    <LotDetailClient
      lot={{
        id: lot.id,
        code_lot: lot.code_lot,
        produit: lot.produit,
        poids_total_kg: lot.poids_total_kg,
        statut: lot.statut,
        destination_pays: lot.destination_pays,
        acheteur: lot.acheteur,
        date_expedition: lot.date_expedition,
        date_creation: lot.date_creation,
      }}
      collectes={collectes}
      mapPoints={mapPoints}
    />
  )
}
