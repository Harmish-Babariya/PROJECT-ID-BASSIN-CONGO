import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { sendMail, buildCredentialsEmail } from "@/lib/services/mail"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

function buildTempPassword() {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ"
  const lowers = "abcdefghijkmnpqrstuvwxyz"
  const digits = "23456789"
  const all = letters + lowers + digits
  const pick = (src: string) => src[Math.floor(Math.random() * src.length)]
  const chars = [pick(letters), pick(lowers), pick(digits), pick(digits)]
  for (let i = 0; i < 8; i++) chars.push(pick(all))
  return chars.sort(() => Math.random() - 0.5).join("")
}

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
    .select("id, email, nom_complet, role")
    .eq("id", id)
    .single()
  if (!profile?.email) return apiError("NOT_FOUND", 404)

  const tempPassword = buildTempPassword()
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    id,
    { password: tempPassword }
  )
  if (updateError) {
    return apiError("UPDATE_FAILED", 500, { detail: updateError.message })
  }

  const loginUrl = new URL("/login", request.nextUrl.origin).toString()
  const roleLabel = profile.role === "admin" ? "Administrateur" : "Point focal"

  const { subject, textPart, htmlPart } = buildCredentialsEmail({
    fullName: profile.nom_complet || profile.email,
    email: profile.email,
    tempPassword,
    loginUrl,
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

  await insertAuditLog(me.id, "reset_password", "user_profiles", id, {
    email: profile.email,
  })

  return NextResponse.json({
    success: true,
    message: `E-mail de réinitialisation envoyé à ${profile.email}.`,
  })
}
