import { notFound } from "next/navigation"
import { getProducteurById } from "@/lib/services/producteurs"
import { getParcellesByProducteur } from "@/lib/services/parcelles"
import ProducteurDetailClient from "./ProducteurDetailClient"

export default async function ProducteurDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const producteur = await getProducteurById(id)
  if (!producteur) notFound()

  const parcelles = await getParcellesByProducteur(id)

  return (
    <ProducteurDetailClient
      producteur={producteur}
      parcelles={parcelles}
    />
  )
}
