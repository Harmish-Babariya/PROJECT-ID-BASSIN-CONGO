import CollecteForm from "./CollecteForm"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"
import { getCurrentUser } from "@/lib/services/auth"

export default async function NouvelleCollecte() {
  const user = await getCurrentUser()
  const paysId = user?.role !== "admin" ? user?.country_id ?? null : null

  const [producteurs, parcelles] = await Promise.all([
    getProducteursForSelect(paysId),
    getParcellesForSelect(paysId),
  ])

  return <CollecteForm producteurs={producteurs} parcelles={parcelles} />
}
