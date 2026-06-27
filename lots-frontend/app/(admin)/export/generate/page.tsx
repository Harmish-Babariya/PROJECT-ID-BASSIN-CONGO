import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getLots, getLotWithDetails, getAllLotCollectes } from "@/lib/services/lots"
import GenerateDdsContent from "./GenerateDdsContent"
import { normalizeEudrStatus, EUDR_STATUS } from "@/lib/eudr"
import { supabaseAdmin } from "@/lib/supabase-server"

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

  const readyLots = lots.filter((l: any) => l.statut === "Prêt")
  const readyLotIds = readyLots.map((l: any) => l.id)

  // Fetch EUDR summary for all ready lots upfront
  const eudrSummaryByLot: Record<number, { conformes: number; risques: number; total: number }> = {}
  if (readyLotIds.length > 0) {
    const { data: lcRows } = await supabaseAdmin
      .from("lot_collectes")
      .select("lot_id, collectes(parcelles(status_eudr))")
      .in("lot_id", readyLotIds)

    const grouped: Record<number, { conformes: number; risques: number; total: number }> = {}
    ;(lcRows ?? []).forEach((lc: any) => {
      const p = lc.collectes?.parcelles
      if (!p) return
      const lotId = lc.lot_id
      const status = normalizeEudrStatus(p.status_eudr)
      if (!grouped[lotId]) grouped[lotId] = { conformes: 0, risques: 0, total: 0 }
      grouped[lotId].total++
      if (status === EUDR_STATUS.CONFORME) grouped[lotId].conformes++
      if (status === EUDR_STATUS.NON_CONFORME) grouped[lotId].risques++
    })
    Object.assign(eudrSummaryByLot, grouped)
  }

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

  const currentUserName = user?.nom_complet || user?.email || "Admin"

  return (
    <GenerateDdsContent
      readyLots={readyLots}
      collectesParLot={collectesParLot}
      selectedLotDetails={selectedLotDetails}
      selectedLotId={lotId ? parseInt(lotId) : null}
      currentUserName={currentUserName}
      eudrSummaryByLot={eudrSummaryByLot}
    />
  )
}
