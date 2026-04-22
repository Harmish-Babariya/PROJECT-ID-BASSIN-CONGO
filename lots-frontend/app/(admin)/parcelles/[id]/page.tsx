import Link from "next/link"
import { notFound } from "next/navigation"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteurById } from "@/lib/services/producteurs"
import { getCollectesByParcelle } from "@/lib/services/collectes"
import ParcelleDetailClient from "./ParcelleDetailClient"

export default async function ParcelleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const parcelle = await getParcelleById(id)
  if (!parcelle) notFound()

  const [producteur, collectes] = await Promise.all([
    getProducteurById(String(parcelle.producteur_id)),
    getCollectesByParcelle(id),
  ])

  return <ParcelleDetailClient parcelle={parcelle} producteur={producteur} collectes={collectes} />
}
