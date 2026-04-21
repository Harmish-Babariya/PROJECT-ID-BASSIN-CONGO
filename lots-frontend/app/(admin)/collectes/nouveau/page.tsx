import CollecteForm from "./CollecteForm"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"

export default async function NouvelleCollecte() {
  const [producteurs, parcelles] = await Promise.all([
    getProducteursForSelect(),
    getParcellesForSelect(),
  ])

  return <CollecteForm producteurs={producteurs} parcelles={parcelles} />
}
