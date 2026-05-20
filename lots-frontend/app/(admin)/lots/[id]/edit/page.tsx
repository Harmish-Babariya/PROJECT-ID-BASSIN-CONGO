import { notFound } from "next/navigation"
import LotForm from "./LotForm"
import EditLotHeader from "./EditLotHeader"
import {
  getLotById,
  getLotCollecteIds,
  getOtherLotCollecteIds,
} from "@/lib/services/lots"
import { getCollectesForLot } from "@/lib/services/collectes"
import { isConforme } from "@/lib/eudr"

export default async function EditLot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [lot, collectesAssignees, collectesAutresLots, collectes] = await Promise.all([
    getLotById(id),
    getLotCollecteIds(id),
    getOtherLotCollecteIds(id),
    getCollectesForLot(),
  ])

  if (!lot) notFound()

  // Only CONFORME collectes are addable. An already-attached collecte stays
  // visible even if non-CONFORME so legacy data isn't silently dropped.
  const collectesDisponibles = collectes.filter((c) => {
    if (collectesAutresLots.includes(c.id) && !collectesAssignees.includes(c.id)) return false
    if (collectesAssignees.includes(c.id)) return true
    const parcelle = Array.isArray(c.parcelles) ? c.parcelles[0] : c.parcelles
    return isConforme(parcelle?.status_eudr ?? null)
  })

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
