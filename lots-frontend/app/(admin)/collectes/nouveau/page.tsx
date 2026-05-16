import CollecteForm from "./CollecteForm"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"
import { getPays, getZones, getVillages } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope } from "@/lib/services/scope"

export default async function NouvelleCollecte() {
  const user = await getCurrentUser()
  const scope = buildScope(user)

  const [producteurs, parcelles, pays, zones, villages] = await Promise.all([
    getProducteursForSelect(scope),
    getParcellesForSelect(scope),
    getPays(),
    getZones(),
    getVillages(),
  ])

  // Focal points pick a country from their assigned set; admins see all.
  const filteredPays = scope
    ? pays.filter((p) => scope.paysIds.includes(p.id))
    : pays

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
