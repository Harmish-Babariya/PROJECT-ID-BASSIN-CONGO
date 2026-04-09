import ParcelleForm from "./ParcelleForm"
import { getProducteursAll, getProducteurById } from "@/lib/services/producteurs"
import { getZones } from "@/lib/services/common"

export default async function NouvelleParcelle({
  searchParams
}: {
  searchParams: Promise<{ producteur_id?: string }>
}) {
  const params = await searchParams

  const [producteurs, zones] = await Promise.all([
    getProducteursAll(),
    getZones(),
  ])

  let producteurSelectionne = null
  if (params.producteur_id) {
    producteurSelectionne = await getProducteurById(params.producteur_id)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouvelle parcelle</h1>

      {producteurSelectionne && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-gray-900">
            Parcelle pour <strong>{producteurSelectionne.code_producteur} - {producteurSelectionne.nom}</strong>
          </p>
        </div>
      )}

      <ParcelleForm
        producteurs={producteurs}
        zones={zones}
        producteurPreselectionne={params.producteur_id}
      />
    </div>
  )
}
