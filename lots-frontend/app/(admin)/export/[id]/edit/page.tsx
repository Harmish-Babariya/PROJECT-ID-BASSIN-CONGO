import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getLotWithDetails } from "@/lib/services/lots"
import { normalizeEudrStatus, EUDR_STATUS } from "@/lib/eudr"
import EditDdsContent from "./EditDdsContent"

export default async function EditDdsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const { id } = await params
  const ddsId = parseInt(id, 10)
  if (isNaN(ddsId)) notFound()

  // Fetch the DDS record
  const { data: dds } = await supabaseAdmin
    .from("dds")
    .select("id, lot_id, reference_dds, statut, created_at, genere_par_nom")
    .eq("id", ddsId)
    .single()

  if (!dds) notFound()

  // Fetch full lot details
  const details = await getLotWithDetails(String(dds.lot_id))
  if (!details) notFound()

  const lotDetails = {
    ...details,
    parcelles: details.parcelles.map((p: any) => ({
      ...p,
      status_eudr: normalizeEudrStatus(p.status_eudr),
    })),
  }

  // Fetch EUDR summary for the lot
  const { data: lcRows } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id, collectes(parcelles(status_eudr))")
    .eq("lot_id", dds.lot_id)

  let eudrSummary = { conformes: 0, risques: 0, total: 0 }
  ;(lcRows ?? []).forEach((lc: any) => {
    const p = lc.collectes?.parcelles
    if (!p) return
    const status = normalizeEudrStatus(p.status_eudr)
    eudrSummary.total++
    if (status === EUDR_STATUS.CONFORME) eudrSummary.conformes++
    if (status === EUDR_STATUS.RISQUE || status === EUDR_STATUS.NON_CONFORME) eudrSummary.risques++
  })

  const currentUserName = user?.nom_complet || user?.email || "Admin"

  return (
    <EditDdsContent
      dds={{
        id: dds.id,
        reference_dds: dds.reference_dds,
        statut: dds.statut,
        created_at: dds.created_at,
        genere_par_nom: dds.genere_par_nom ?? currentUserName,
      }}
      lotDetails={lotDetails}
      eudrSummary={eudrSummary}
      currentUserName={currentUserName}
    />
  )
}
