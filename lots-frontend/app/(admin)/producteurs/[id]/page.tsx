import { notFound, redirect } from "next/navigation"
import { getProducteurById } from "@/lib/services/producteurs"
import { getParcellesByProducteur } from "@/lib/services/parcelles"
import { getCurrentUser } from "@/lib/services/auth"
import ProducteurDetailClient from "./ProducteurDetailClient"

export default async function ProducteurDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { id } = await params
  const producteur = await getProducteurById(id)
  if (!producteur) notFound()

  // point_focal can only view producers from their assigned country
  if (user.role !== "admin" && user.country_id && producteur.pays_id !== user.country_id) {
    redirect("/producteurs")
  }

  const parcelles = await getParcellesByProducteur(id)

  return (
    <ProducteurDetailClient
      producteur={producteur}
      parcelles={parcelles}
    />
  )
}
