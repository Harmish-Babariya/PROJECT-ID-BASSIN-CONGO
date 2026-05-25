import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getLots, getLotWithDetails } from "@/lib/services/lots"
import { getAllLotCollectes } from "@/lib/services/lots"
import GenerateDdsContent from "./GenerateDdsContent"
import { normalizeEudrStatus } from "@/lib/eudr"

export default async function GenerateDdsPage({
  searchParams,
}: {
  searchParams: Promise<{ lotId?: string }>
}) {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const { lotId } = await searchParams

  const [lots, allLotCollectes] = await Promise.all([
    getLots(),
    getAllLotCollectes(),
  ])

  const collectesParLot = allLotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Only show lots with "Prêt" status on the list
  const readyLots = lots.filter((l: any) => l.statut === "Prêt")

  // If a lot is selected, fetch its full details
  let selectedLotDetails: {
    lot: any
    producteurs: any[]
    parcelles: any[]
    collectesCount: number
  } | null = null

  if (lotId) {
    const details = await getLotWithDetails(lotId)
    if (details) {
      selectedLotDetails = {
        ...details,
        parcelles: details.parcelles.map((p: any) => ({
          ...p,
          status_eudr: normalizeEudrStatus(p.status_eudr),
        })),
      }
    }
  }

  const currentUserName =
    user?.nom_complet || user?.email || "Admin"

  return (
    <GenerateDdsContent
      readyLots={readyLots}
      collectesParLot={collectesParLot}
      selectedLotDetails={selectedLotDetails}
      selectedLotId={lotId ? parseInt(lotId) : null}
      currentUserName={currentUserName}
    />
  )
}
