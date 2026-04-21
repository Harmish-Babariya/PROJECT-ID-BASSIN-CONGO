import { redirect } from "next/navigation"
import ProducteursContent from "./ProducteursContent"
import { getProducteurs } from "@/lib/services/producteurs"
import { getZones } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function ProducteursPage({
  searchParams,
}: {
  searchParams: Promise<{
    recherche?: string
    zone_id?: string
    sexe?: string
    statut?: string
    avec_parcelles?: string
  }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const isAdmin = user.role === "admin"

  // point_focal with no country assigned sees nothing
  const scopedPaysId = isAdmin ? null : (user.country_id ?? -1)

  const [producteurs, zones] = await Promise.all([
    getProducteurs({
      ...params,
      pays_id: isAdmin ? null : scopedPaysId,
    }),
    getZones(),
  ])

  return (
    <ProducteursContent
      producteurs={producteurs}
      zones={zones}
      isAdmin={isAdmin}
    />
  )
}
