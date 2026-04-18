import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { signToken } from "@/lib/auth/jwt"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

export async function POST() {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  // Read current version then increment — invalidates all existing tokens
  const { data: current } = await supabaseAdmin
    .from("user_profiles")
    .select("token_version")
    .eq("id", me.id)
    .single()

  const newVersion = (current?.token_version ?? 0) + 1

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ token_version: newVersion })
    .eq("id", me.id)

  if (updateError) return apiError("UPDATE_FAILED", 500)

  // Issue a fresh token with the new version so the current device stays logged in
  const freshToken = signToken({ userId: me.id, email: me.email, tokenVersion: newVersion })

  const response = NextResponse.json({ success: true })
  response.cookies.set("auth-token", freshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  })

  await insertAuditLog(me.id, "revoke_sessions", "user_profiles", me.id)
  return response
}
