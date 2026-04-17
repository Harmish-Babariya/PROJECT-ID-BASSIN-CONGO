import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"

export async function POST(
  request: NextRequest,
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
    .select("email, statut")
    .eq("id", id)
    .single()
  if (!profile?.email) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  const redirectTo = new URL("/login", request.nextUrl.origin).toString()
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    profile.email,
    { redirectTo }
  )
  if (error) {
    return NextResponse.json(
      { error: "INVITE_FAILED", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
