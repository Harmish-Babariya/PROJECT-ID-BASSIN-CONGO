import { redirect } from "next/navigation"
import ExportContent from "./ExportContent"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export default async function ExportDDSPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const [lots, lotCollectes, ddsRows] = await Promise.all([
    getLots(),
    getAllLotCollectes(),
    supabaseAdmin.from("dds").select("id, lot_id, reference_dds, statut, created_at, genere_par_nom").order("created_at", { ascending: false }),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Map lot_id → ALL DDS records for that lot (a lot can have several DDS).
  // Keeping every DDS — not just the latest — is what lets each generated DDS
  // get its own table row with a real id, so View/Delete target the DDS rather
  // than falling back to the lot (Issue #5).
  const ddsByLot: Record<number, { id: number; reference_dds: string; statut: string; created_at: string; genere_par_nom: string | null }[]> = {}
  for (const d of ddsRows.data ?? []) {
    ;(ddsByLot[d.lot_id] ??= []).push(d as any)
  }

  const currentUserName = user?.nom_complet || user?.email || "Admin"

  return (
    <ExportContent
      lots={lots}
      collectesParLot={collectesParLot}
      currentUserName={currentUserName}
      ddsByLot={ddsByLot}
    />
  )
}
