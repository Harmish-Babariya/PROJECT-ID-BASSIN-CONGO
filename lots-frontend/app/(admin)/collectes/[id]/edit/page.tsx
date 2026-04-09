import { notFound } from "next/navigation"
import CollecteForm from "./CollecteForm"
import { getCollecteSimple } from "@/lib/services/collectes"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"

export default async function EditCollecte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [collecte, producteurs, parcelles] = await Promise.all([
    getCollecteSimple(id),
    getProducteursForSelect(),
    getParcellesForSelect(),
  ])

  if (!collecte) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier la collecte</h1>
      <CollecteForm
        collecte={collecte}
        producteurs={producteurs}
        parcelles={parcelles}
      />
    </div>
  )
}
