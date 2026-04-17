import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { sendMail, buildCredentialsEmail } from "@/lib/services/mail"
import { apiError } from "@/lib/api-errors"

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

export async function POST(request: NextRequest) {
  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const token = (body.token || "").trim()
  if (!token || !/^[a-f0-9]{32,128}$/i.test(token)) {
    return apiError("INVALID_TOKEN", 400)
  }

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email, nom_complet, role, statut, verify_token_expires_at")
    .eq("verify_token", token)
    .maybeSingle()

  if (lookupError || !profile) return apiError("INVALID_TOKEN", 400)

  const expiresAt = profile.verify_token_expires_at
    ? new Date(profile.verify_token_expires_at).getTime()
    : 0
  if (!expiresAt || expiresAt < Date.now()) {
    return apiError("TOKEN_EXPIRED", 400)
  }

  // Already verified → don't rotate the password or re-send credentials.
  if (profile.statut === "actif") {
    return NextResponse.json({
      success: true,
      alreadyVerified: true,
      message:
        "Votre compte est déjà activé. Vous pouvez vous connecter avec les identifiants reçus précédemment.",
    })
  }

  const tempPassword = buildTempPassword()

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    profile.id,
    {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: profile.nom_complet,
        pending_verification: false,
      },
    }
  )
  if (updateError) {
    return apiError("VERIFY_FAILED", 500, { detail: updateError.message })
  }

  await supabaseAdmin
    .from("user_profiles")
    .update({
      statut: "actif",
      verify_token: null,
      verify_token_expires_at: null,
    })
    .eq("id", profile.id)

  const loginUrl = new URL("/login", request.nextUrl.origin).toString()
  const roleLabel = profile.role === "admin" ? "Administrateur" : "Point focal"

  const { subject, textPart, htmlPart } = buildCredentialsEmail({
    fullName: profile.nom_complet || profile.email || "",
    email: profile.email || "",
    tempPassword,
    loginUrl,
    roleLabel,
  })

  const mailResult = await sendMail({
    to: profile.email || "",
    toName: profile.nom_complet || undefined,
    subject,
    textPart,
    htmlPart,
  })

  if (!mailResult.ok) {
    return NextResponse.json({
      success: true,
      mailFailed: true,
      detail: mailResult.error,
      message:
        "Votre e-mail est vérifié, mais l'envoi des identifiants a échoué. Contactez l'administrateur.",
    })
  }

  return NextResponse.json({
    success: true,
    email: profile.email,
    message: `Votre e-mail est vérifié. Vos identifiants de connexion ont été envoyés à ${profile.email}.`,
  })
}
