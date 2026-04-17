import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { signToken } from "@/lib/auth/jwt"
import { apiError } from "@/lib/api-errors"

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return apiError("EMAIL_PASSWORD_REQUIRED", 400)
    }

    const { data, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (authError || !data.user) {
      return apiError("INVALID_CREDENTIALS", 401)
    }

    const token = signToken(
      { userId: data.user.id, email: data.user.email! },
      rememberMe
    )

    const response = NextResponse.json({
      success: true,
      message: "Connexion réussie.",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || null,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch {
    return apiError("SERVER_ERROR", 500)
  }
}
