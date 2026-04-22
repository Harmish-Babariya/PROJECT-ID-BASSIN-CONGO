import { notFound, redirect } from "next/navigation"
import ParcelleForm from "./ParcelleForm"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteursAll } from "@/lib/services/producteurs"
import { getZones, getPays } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function EditParcelle({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { id } = await params
  const isAdmin = user.role === "admin"

  const [parcelle, producteurs, zones, allPays] = await Promise.all([
    getParcelleById(id),
    getProducteursAll(),
    getZones(),
    getPays(),
  ])

  if (!parcelle) notFound()

  // point_focal only sees their assigned country
  const pays = isAdmin ? allPays : allPays.filter(p => p.id === user.country_id)
  const filteredZones = isAdmin ? zones : zones.filter(z => z.pays_id === user.country_id)
  const filteredProducteurs = isAdmin
    ? producteurs
    : producteurs.filter(p => p.pays_id === user.country_id)

  return (
    <ParcelleForm
      parcelle={parcelle}
      producteurs={filteredProducteurs}
      zones={filteredZones}
      pays={pays}
    />
  )
}
