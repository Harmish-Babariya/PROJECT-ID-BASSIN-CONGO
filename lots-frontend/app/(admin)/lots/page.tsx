import { redirect } from "next/navigation"
import LotsContent from "./LotsContent"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"

export default async function LotsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const isAdmin = user.role === "admin"
  // point_focal with no country assigned sees nothing (-1 matches nothing)
  const paysId = isAdmin ? null : (user.country_id ?? -1)

  const [lots, lotCollectes] = await Promise.all([
    getLots(paysId),
    getAllLotCollectes(),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return <LotsContent lots={lots} collectesParLot={collectesParLot} />
}
