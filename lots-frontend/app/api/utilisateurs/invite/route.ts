import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { sendMail, buildVerifyEmail } from "@/lib/services/mail"
import { apiError } from "@/lib/api-errors"

function buildUserCode(count: number) {
  const seq = String(count + 1).padStart(5, "0")
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `USR-${seq}-${rand}`
}

export async function POST(request: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  let body: {
    nom?: string
    email?: string
    organisation?: string | null
    pays_id?: string | null
    role?: "admin" | "focal" | "point_focal"
  }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const email = (body.email || "").toLowerCase().trim()
  const nom = (body.nom || "").trim()
  const organisation = (body.organisation || "").trim() || null
  const rawRole = body.role === "admin" ? "admin" : "point_focal"
  const pays_id = rawRole === "admin" ? null : body.pays_id || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("INVALID_EMAIL", 400)
  }
  if (!nom) return apiError("NAME_REQUIRED", 400)
  if (rawRole === "point_focal" && !pays_id) {
    return apiError("COUNTRY_REQUIRED", 400)
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingProfile) return apiError("USER_EXISTS", 409)

  // Placeholder password is overwritten when the user clicks the verify link.
  const placeholderPassword = randomBytes(24).toString("base64url")
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: placeholderPassword,
      email_confirm: false,
      user_metadata: { name: nom, organisation, pending_verification: true },
    })

  if (createError || !created?.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      return apiError("USER_EXISTS", 409)
    }
    return apiError("CREATE_FAILED", 500, { detail: createError?.message })
  }

  const userId = created.user.id

  const { count } = await supabaseAdmin
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
  const user_code = buildUserCode(count ?? 0)

  const verifyToken = randomBytes(32).toString("hex")
  const verifyExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString()

  const { error: insertError } = await supabaseAdmin
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      nom_complet: nom,
      role: rawRole,
      pays_id,
      statut: "en_attente",
      user_code,
      organisation,
      verify_token: verifyToken,
      verify_token_expires_at: verifyExpiresAt,
    })

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return apiError("PROFILE_INSERT_FAILED", 500, {
      detail: insertError.message,
    })
  }

  const verifyUrl = new URL(
    `/verify-invite?token=${encodeURIComponent(verifyToken)}`,
    request.nextUrl.origin
  ).toString()
  const roleLabel = rawRole === "admin" ? "Administrateur" : "Point focal"

  const { subject, textPart, htmlPart } = buildVerifyEmail({
    fullName: nom,
    verifyUrl,
    roleLabel,
  })

  const mailResult = await sendMail({
    to: email,
    toName: nom,
    subject,
    textPart,
    htmlPart,
  })

  if (!mailResult.ok) {
    await supabaseAdmin.from("user_profiles").delete().eq("id", userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    const code =
      mailResult.error === "MAIL_NOT_CONFIGURED"
        ? "MAIL_NOT_CONFIGURED"
        : "MAIL_SEND_FAILED"
    return apiError(code, 500, { detail: mailResult.error })
  }

  return NextResponse.json({
    success: true,
    message: `Invitation envoyée à ${email}. L'utilisateur recevra un e-mail de vérification.`,
    user: { id: userId, email, nom_complet: nom, role: rawRole, pays_id, user_code },
  })
}
