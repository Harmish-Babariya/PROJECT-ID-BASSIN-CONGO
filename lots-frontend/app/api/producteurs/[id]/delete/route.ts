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

  // 1. Get all collectes of this producteur
  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select("id")
    .eq("producteur_id", numId)
  const collecteIds = (collectes ?? []).map((c) => c.id)

  // 2. Find lots that ONLY contain collectes from this producteur
  //    (i.e. will be left empty after deletion — should be removed too)
  let lotIdsToDelete: number[] = []
  if (collecteIds.length > 0) {
    // All lot_ids linked to this producteur's collectes
    const { data: linkedLotRows } = await supabaseAdmin
      .from("lot_collectes")
      .select("lot_id")
      .in("collecte_id", collecteIds)
    const linkedLotIds = [...new Set((linkedLotRows ?? []).map((r) => r.lot_id))]

    // For each lot, check if ALL its collectes belong to this producteur
    for (const lotId of linkedLotIds) {
      const { data: allRows } = await supabaseAdmin
        .from("lot_collectes")
        .select("collecte_id")
        .eq("lot_id", lotId)
      const allCollecteIds = (allRows ?? []).map((r) => r.collecte_id)
      const allBelongToProducteur = allCollecteIds.every((cid) => collecteIds.includes(cid))
      if (allBelongToProducteur) {
        lotIdsToDelete.push(lotId)
      }
    }
  }

  // 3. Delete DDS for those lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("dds").delete().in("lot_id", lotIdsToDelete)
  }

  // 4. Delete lot_collectes for this producteur's collectes
  if (collecteIds.length > 0) {
    await supabaseAdmin.from("lot_collectes").delete().in("collecte_id", collecteIds)
  }

  // 5. Delete the empty lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("lots").delete().in("id", lotIdsToDelete)
  }

  // 6. Delete collectes
  if (collecteIds.length > 0) {
    await supabaseAdmin.from("collectes").delete().eq("producteur_id", numId)
  }

  // 7. Delete parcelles
  await supabaseAdmin.from("parcelles").delete().eq("producteur_id", numId)

  // 8. Delete producteur
  await insertAuditLog(me.id, "delete", "producteurs", id)
  const { error } = await supabaseAdmin.from("producteurs").delete().eq("id", numId)

  if (error) return apiError("DELETE_FAILED", 500, { detail: error.message })

  return NextResponse.json({ success: true })
}
