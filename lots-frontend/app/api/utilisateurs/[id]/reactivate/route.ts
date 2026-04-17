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
  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ statut: "actif" })
    .eq("id", id)
  if (error) {
    return NextResponse.json(
      { error: "UPDATE_FAILED", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
