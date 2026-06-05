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

  // 1. Find lots that will be left empty after this collecte is removed
  const { data: linkedLotRows } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id")
    .eq("collecte_id", numId)
  const linkedLotIds = (linkedLotRows ?? []).map((r) => r.lot_id)

  const lotIdsToDelete: number[] = []
  for (const lotId of linkedLotIds) {
    const { data: allRows } = await supabaseAdmin
      .from("lot_collectes")
      .select("collecte_id")
      .eq("lot_id", lotId)
    // Lot has only this one collecte — will be empty after deletion
    if ((allRows ?? []).length === 1) {
      lotIdsToDelete.push(lotId)
    }
  }

  // 2. Delete DDS for those lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("dds").delete().in("lot_id", lotIdsToDelete)
  }

  // 3. Remove lot_collectes junction rows for this collecte
  await supabaseAdmin.from("lot_collectes").delete().eq("collecte_id", numId)

  // 4. Delete empty lots
  if (lotIdsToDelete.length > 0) {
    await supabaseAdmin.from("lots").delete().in("id", lotIdsToDelete)
  }

  // 5. Delete collecte
  await insertAuditLog(me.id, "delete", "collectes", id)
  const { error } = await supabaseAdmin.from("collectes").delete().eq("id", numId)

  if (error) return apiError("DELETE_FAILED", 500, { detail: error.message })

  return NextResponse.json({ success: true })
}
