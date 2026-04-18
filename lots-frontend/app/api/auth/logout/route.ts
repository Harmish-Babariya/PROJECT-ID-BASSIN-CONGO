import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  // Delete the session row if we have a sessionId
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (token) {
    const payload = verifyToken(token)
    if (payload?.sessionId) {
      await supabaseAdmin
        .from("user_sessions")
        .delete()
        .eq("id", payload.sessionId)
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  return response
}
