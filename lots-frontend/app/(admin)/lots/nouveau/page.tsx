import LotForm from "./LotForm"
import { getAllLotCollectes } from "@/lib/services/lots"
import { getCollectesForLot } from "@/lib/services/collectes"
import NouveauLotHeader from "./NouveauLotHeader"
import EmptyCollectesNotice from "./EmptyCollectesNotice"

export default async function NouveauLot() {
  const [lotCollectes, collectes] = await Promise.all([
    getAllLotCollectes(),
    getCollectesForLot(),
  ])

  const collectesAssignees = lotCollectes.map((lc) => lc.collecte_id)
  const collectesDisponibles = collectes.filter((c) => !collectesAssignees.includes(c.id))

  return (
    <div className="space-y-6">
      <NouveauLotHeader />
      {collectesDisponibles.length === 0 ? (
        <EmptyCollectesNotice />
      ) : (
        <LotForm collectesDisponibles={collectesDisponibles} />
      )}
    </div>
  )
}
