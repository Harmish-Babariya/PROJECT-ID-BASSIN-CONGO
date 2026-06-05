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

  await insertAuditLog(me.id, "delete", "dds", id)

  const { error } = await supabaseAdmin
    .from("dds")
    .delete()
    .eq("id", parseInt(id))

  if (error) return apiError("DELETE_FAILED", 500, { detail: error.message })

  return NextResponse.json({ success: true })
}
