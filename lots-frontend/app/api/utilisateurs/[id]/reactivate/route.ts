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
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await context.params
  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ statut: "actif" })
    .eq("id", id)
  if (error) {
    return apiError("UPDATE_FAILED", 500, { detail: error.message })
  }

  await insertAuditLog(me.id, "reactivate", "user_profiles", id)

  return NextResponse.json({
    success: true,
    message: "Utilisateur réactivé.",
  })
}
