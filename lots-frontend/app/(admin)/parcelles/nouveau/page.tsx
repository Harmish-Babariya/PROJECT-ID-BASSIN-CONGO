import { redirect } from "next/navigation"
import ParcelleForm from "./ParcelleForm"
import { getProducteursAll } from "@/lib/services/producteurs"
import { getZones, getPays } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function NouvelleParcelle({
  searchParams,
}: {
  searchParams: Promise<{ producteur_id?: string; return_to?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const isAdmin = user.role === "admin"

  const [producteurs, zones, allPays] = await Promise.all([
    getProducteursAll(),
    getZones(),
    getPays(),
  ])

  // point_focal only sees their assigned country
  const pays = isAdmin ? allPays : allPays.filter(p => p.id === user.country_id)

  // point_focal: zones and producteurs scoped to their country
  const filteredZones = isAdmin ? zones : zones.filter(z => z.pays_id === user.country_id)
  const filteredProducteurs = isAdmin
    ? producteurs
    : producteurs.filter(p => p.pays_id === user.country_id)

  return (
    <ParcelleForm
      producteurs={filteredProducteurs}
      zones={filteredZones}
      pays={pays}
      defaultPaysId={isAdmin ? undefined : String(user.country_id ?? "")}
      producteurPreselectionne={params.producteur_id}
      returnTo={params.return_to}
    />
  )
}
