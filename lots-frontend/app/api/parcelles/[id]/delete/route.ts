import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  const { id } = await context.params
  const numId = parseInt(id)

  // 1. Get all collectes linked to this parcelle
  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select("id")
    .eq("parcelle_id", numId)
  const collecteIds = (collectes ?? []).map((c) => c.id)

  // 2. Find lots that will be left empty after these collectes are removed
  let lotIdsToDelete: number[] = []
  if (collecteIds.length > 0) {
    const { data: linkedLotRows } = await supabaseAdmin
      .from("lot_collectes")
      .select("lot_id")
      .in("collecte_id", collecteIds)
    const linkedLotIds = [...new Set((linkedLotRows ?? []).map((r) => r.lot_id))]

    for (const lotId of linkedLotIds) {
      const { data: allRows } = await supabaseAdmin
        .from("lot_collectes")
        .select("collecte_id")
        .eq("lot_id", lotId)
      const allCollecteIds = (allRows ?? []).map((r) => r.collecte_id)
      const allBelongToParcelle = allCollecteIds.every((cid) => collecteIds.includes(cid))
      if (allBelongToParcelle) {
        lotIdsToDelete.push(lotId)
      }
    }
  }

  // 3. Delete DDS for those lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("dds").delete().in("lot_id", lotIdsToDelete)
  }

  // 4. Delete lot_collectes for this parcelle's collectes
  if (collecteIds.length > 0) {
    await supabaseAdmin.from("lot_collectes").delete().in("collecte_id", collecteIds)
  }

  // 5. Delete empty lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("lots").delete().in("id", lotIdsToDelete)
  }

  // 6. Delete collectes
  if (collecteIds.length > 0) {
    await supabaseAdmin.from("collectes").delete().eq("parcelle_id", numId)
  }

  // 7. Delete parcelle
  await insertAuditLog(me.id, "delete", "parcelles", id)
  const { error } = await supabaseAdmin.from("parcelles").delete().eq("id", numId)

  if (error) return apiError("DELETE_FAILED", 500, { detail: error.message })

  return NextResponse.json({ success: true })
}
