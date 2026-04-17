import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await context.params

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, statut")
    .eq("id", id)
    .single()
  if (!profile) return apiError("NOT_FOUND", 404)
  if (profile.statut !== "en_attente") return apiError("NOT_PENDING", 400)

  await supabaseAdmin.from("user_profiles").delete().eq("id", id)
  await supabaseAdmin.auth.admin.deleteUser(id)

  return NextResponse.json({
    success: true,
    message: "Invitation annulée et compte supprimé.",
  })
}
