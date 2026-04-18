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
  if (id === me.id) return apiError("CANNOT_DELETE_SELF", 400)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) {
    return apiError("DELETE_FAILED", 500, { detail: error.message })
  }

  // Mark the profile as deleted so data remains linked but the account is gone
  await supabaseAdmin
    .from("user_profiles")
    .update({ statut: "supprime", email: null, nom_complet: "[Supprimé]" })
    .eq("id", id)

  return NextResponse.json({
    success: true,
    message: "Utilisateur supprimé définitivement.",
  })
}
