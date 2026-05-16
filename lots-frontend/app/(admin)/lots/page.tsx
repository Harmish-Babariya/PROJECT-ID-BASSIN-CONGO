import { redirect } from "next/navigation"
import LotsContent from "./LotsContent"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope } from "@/lib/services/scope"

export default async function LotsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const scope = buildScope(user)

  const [lots, lotCollectes] = await Promise.all([
    getLots(scope),
    getAllLotCollectes(),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return <LotsContent lots={lots} collectesParLot={collectesParLot} />
}
