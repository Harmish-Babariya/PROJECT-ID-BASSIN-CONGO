import { notFound } from "next/navigation"
import LotForm from "./LotForm"
import { getLotById, getLotCollecteIds, getOtherLotCollecteIds } from "@/lib/services/lots"
import { getCollectesForLot } from "@/lib/services/collectes"

export default async function EditLot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [lot, collectesAssignees, collectesAutresLots, collectes] = await Promise.all([
    getLotById(id),
    getLotCollecteIds(id),
    getOtherLotCollecteIds(id),
    getCollectesForLot(),
  ])

  if (!lot) notFound()

  // Filter: available OR already in this lot
  const collectesDisponibles = collectes.filter(c =>
    !collectesAutresLots.includes(c.id) || collectesAssignees.includes(c.id)
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier le lot</h1>
      <LotForm
        lot={lot}
        collectesDisponibles={collectesDisponibles}
        collectesInitiales={collectesAssignees}
      />
    </div>
  )
}
