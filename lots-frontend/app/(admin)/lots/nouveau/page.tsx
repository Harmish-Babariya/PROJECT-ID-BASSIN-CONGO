import LotForm from "./LotForm"
import { getAllLotCollectes } from "@/lib/services/lots"
import { getCollectesForLot } from "@/lib/services/collectes"

export default async function NouveauLot() {
  const [lotCollectes, collectes] = await Promise.all([
    getAllLotCollectes(),
    getCollectesForLot(),
  ])

  const collectesAssignees = lotCollectes.map(lc => lc.collecte_id)
  const collectesDisponibles = collectes.filter(c => !collectesAssignees.includes(c.id))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau lot d&apos;export</h1>
      <p className="text-gray-400 mb-8">Code auto-genere : LOT-XXX</p>

      {collectesDisponibles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Aucune collecte disponible pour creer un lot</p>
          <p className="text-gray-500 text-sm">Toutes les collectes sont deja assignees a des lots.</p>
        </div>
      ) : (
        <LotForm collectesDisponibles={collectesDisponibles} />
      )}
    </div>
  )
}
