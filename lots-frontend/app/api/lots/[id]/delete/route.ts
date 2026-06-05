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

  // 1. Delete DDS linked to this lot
  await supabaseAdmin
    .from("dds")
    .delete()
    .eq("lot_id", numId)

  // 2. Delete lot_collectes junction rows
  await supabaseAdmin
    .from("lot_collectes")
    .delete()
    .eq("lot_id", numId)

  // 3. Delete lot
  await insertAuditLog(me.id, "delete", "lots", id)
  const { error } = await supabaseAdmin
    .from("lots")
    .delete()
    .eq("id", numId)

  if (error) return apiError("DELETE_FAILED", 500, { detail: error.message })

  return NextResponse.json({ success: true })
}
