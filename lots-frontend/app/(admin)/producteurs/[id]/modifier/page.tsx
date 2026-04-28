import { notFound, redirect } from "next/navigation"
import ModifierProducteurClient from "./ModifierProducteurClient"
import { getProducteurSimple } from "@/lib/services/producteurs"
import { getPays, getZones, getVillages, getNationalites } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function ModifierProducteur({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { id } = await params
  const isAdmin = user.role === "admin"

  const [producteur, pays, zones, villages, nationalites] = await Promise.all([
    getProducteurSimple(id),
    getPays(),
    getZones(),
    getVillages(),
    getNationalites(),
  ])
  if (!producteur) notFound()

  // point_focal can only edit producers from their assigned country
  if (!isAdmin && user.country_id && producteur.pays_id !== user.country_id) {
    redirect("/producteurs")
  }

  // For point_focal: only show their assigned country in the pays list
  const filteredPays = isAdmin
    ? pays
    : pays.filter((p) => p.id === user.country_id)

  return <ModifierProducteurClient producteur={producteur} pays={filteredPays} zones={zones} villages={villages} nationalites={nationalites} />
}
