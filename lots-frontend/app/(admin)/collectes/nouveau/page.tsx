import CollecteForm from "./CollecteForm"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"
import { getPays, getZones, getVillages } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function NouvelleCollecte() {
  const user = await getCurrentUser()
  const paysId = user?.role !== "admin" ? user?.country_id ?? null : null

  const [producteurs, parcelles, pays, zones, villages] = await Promise.all([
    getProducteursForSelect(paysId),
    getParcellesForSelect(paysId),
    getPays(),
    getZones(),
    getVillages(),
  ])

  const filteredPays = paysId ? pays.filter((p) => p.id === paysId) : pays

  return (
    <CollecteForm
      producteurs={producteurs}
      parcelles={parcelles}
      pays={filteredPays}
      zones={zones}
      villages={villages}
    />
  )
}
