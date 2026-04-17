import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { sendMail, buildVerifyEmail } from "@/lib/services/mail"
import { apiError } from "@/lib/api-errors"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await context.params
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email, nom_complet, role, statut")
    .eq("id", id)
    .single()
  if (!profile?.email) {
    return apiError("NOT_FOUND", 404)
  }
  if (profile.statut !== "en_attente") {
    return apiError("NOT_PENDING", 400)
  }

  const verifyToken = randomBytes(32).toString("hex")
  const verifyExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString()

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      verify_token: verifyToken,
      verify_token_expires_at: verifyExpiresAt,
    })
    .eq("id", id)

  if (updateError) {
    return apiError("UPDATE_FAILED", 500, { detail: updateError.message })
  }

  const verifyUrl = new URL(
    `/verify-invite?token=${encodeURIComponent(verifyToken)}`,
    request.nextUrl.origin
  ).toString()

  const roleLabel =
    profile.role === "admin" ? "Administrateur" : "Point focal"
  const { subject, textPart, htmlPart } = buildVerifyEmail({
    fullName: profile.nom_complet || profile.email,
    verifyUrl,
    roleLabel,
  })

  const mailResult = await sendMail({
    to: profile.email,
    toName: profile.nom_complet || undefined,
    subject,
    textPart,
    htmlPart,
  })

  if (!mailResult.ok) {
    const code =
      mailResult.error === "MAIL_NOT_CONFIGURED"
        ? "MAIL_NOT_CONFIGURED"
        : "MAIL_SEND_FAILED"
    return apiError(code, 500, { detail: mailResult.error })
  }

  return NextResponse.json({
    success: true,
    message: `Nouvel e-mail de vérification envoyé à ${profile.email}.`,
  })
}
