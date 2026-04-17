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
  if (id === me.id) {
    return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 })
  }

  await supabaseAdmin.from("user_profiles").delete().eq("id", id)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json(
      { error: "DELETE_FAILED", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
