import { notFound } from "next/navigation"
import LotForm from "./LotForm"
import EditLotHeader from "./EditLotHeader"
import {
  getLotById,
  getLotCollecteIds,
  getOtherLotCollecteIds,
} from "@/lib/services/lots"
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

  const collectesDisponibles = collectes.filter(
    (c) => !collectesAutresLots.includes(c.id) || collectesAssignees.includes(c.id)
  )

  return (
    <div className="space-y-6">
      <EditLotHeader lotId={lot.id} codeLot={lot.code_lot} />
      <LotForm
        lot={lot}
        collectesDisponibles={collectesDisponibles}
        collectesInitiales={collectesAssignees}
      />
    </div>
  )
}
