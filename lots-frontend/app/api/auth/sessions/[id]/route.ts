import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { verifyToken } from "@/lib/auth/jwt"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"
import { cookies } from "next/headers"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  const { id } = await params

  // Prevent deleting own current session via this endpoint (use logout for that)
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  const payload = token ? verifyToken(token) : null
  if (payload?.sessionId === id) {
    return apiError("FORBIDDEN", 403)
  }

  // Only allow deleting own sessions
  const { error } = await supabaseAdmin
    .from("user_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", me.id)

  if (error) return apiError("DELETE_FAILED", 500)

  await insertAuditLog(me.id, "revoke_session", "user_sessions", id)

  return NextResponse.json({ success: true })
}
