import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { signToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "EMAIL_PASSWORD_REQUIRED" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "PASSWORD_TOO_SHORT" },
        { status: 400 }
      )
    }

    // Create user via Supabase Auth (handles bcrypt internally)
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name || null },
    })

    if (authError || !data.user) {
      if (authError?.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "USER_EXISTS" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: "SERVER_ERROR" },
        { status: 500 }
      )
    }

    // Sign JWT token
    const token = signToken({ userId: data.user.id, email: data.user.email! })

    const response = NextResponse.json({
      user: { id: data.user.id, email: data.user.email, name },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}
