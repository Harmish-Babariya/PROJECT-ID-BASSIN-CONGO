import { redirect } from "next/navigation"
import ExportContent from "./ExportContent"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"

export default async function ExportDDSPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const [lots, lotCollectes] = await Promise.all([
    getLots(),
    getAllLotCollectes(),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return <ExportContent lots={lots} collectesParLot={collectesParLot} />
}
