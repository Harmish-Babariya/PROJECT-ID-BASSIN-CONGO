import CollecteForm from "./CollecteForm"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"

export default async function NouvelleCollecte() {
  const [producteurs, parcelles] = await Promise.all([
    getProducteursForSelect(),
    getParcellesForSelect(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nouvelle collecte</h1>
      <CollecteForm
        producteurs={producteurs}
        parcelles={parcelles}
      />
    </div>
  )
}
