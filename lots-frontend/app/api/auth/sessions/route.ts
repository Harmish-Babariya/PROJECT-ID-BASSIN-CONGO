import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { verifyToken } from "@/lib/auth/jwt"
import { apiError } from "@/lib/api-errors"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  const payload = token ? verifyToken(token) : null
  const currentSessionId = payload?.sessionId ?? null

  // Token has no sessionId — logged in before session tracking was added.
  // Insert a row now so this device appears in the list immediately.
  if (!currentSessionId) {
    const ua = request.headers.get("user-agent") || null
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null

    await supabaseAdmin.from("user_sessions").insert({
      user_id: me.id,
      ip_address: ip,
      user_agent: ua,
      last_seen_at: new Date().toISOString(),
    })
  }

  const { data: sessions, error } = await supabaseAdmin
    .from("user_sessions")
    .select("id, ip_address, user_agent, created_at, last_seen_at")
    .eq("user_id", me.id)
    .order("last_seen_at", { ascending: false })

  if (error) return apiError("SERVER_ERROR", 500)

  return NextResponse.json({
    sessions: (sessions ?? []).map((s) => ({
      ...s,
      is_current: currentSessionId ? s.id === currentSessionId : false,
    })),
  })
}
