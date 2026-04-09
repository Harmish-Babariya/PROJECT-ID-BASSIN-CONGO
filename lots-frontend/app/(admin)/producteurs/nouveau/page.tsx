import ProducteurForm from "./ProducteurForm"
import { getZones, getPays, getVillages } from "@/lib/services/common"

export default async function NouveauProducteur({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams

  const [pays, zones, villages] = await Promise.all([
    getPays(),
    getZones(),
    getVillages(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau producteur</h1>
      <p className="text-gray-400 mb-6">Code auto-genere : CG-XXX-XXX</p>

      {params.returnTo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-gray-900">
            Apres creation, vous serez redirige vers la creation de parcelle
          </p>
        </div>
      )}

      <ProducteurForm
        pays={pays}
        zones={zones}
        villages={villages}
        returnTo={params.returnTo}
      />
    </div>
  )
}
