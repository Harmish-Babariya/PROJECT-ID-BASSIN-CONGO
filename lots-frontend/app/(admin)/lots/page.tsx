import LotsContent from "./LotsContent"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"

export default async function LotsPage() {
  const [lots, lotCollectes] = await Promise.all([
    getLots(),
    getAllLotCollectes(),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return <LotsContent lots={lots} collectesParLot={collectesParLot} />
}
