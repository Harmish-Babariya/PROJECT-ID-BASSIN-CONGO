import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  if (me.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id } = await context.params

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, statut")
    .eq("id", id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }
  if (profile.statut !== "en_attente") {
    return NextResponse.json({ error: "NOT_PENDING" }, { status: 400 })
  }

  await supabaseAdmin.from("user_profiles").delete().eq("id", id)
  await supabaseAdmin.auth.admin.deleteUser(id)

  return NextResponse.json({ success: true })
}
