import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { sendMail, buildVerifyEmail } from "@/lib/services/mail"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

function buildUserCode(count: number) {
  const n = count + 1
  const seq = String(n).padStart(5, "0")
  const seed = (n * 2654435761) >>> 0
  const rand = seed.toString(36).slice(-3).toUpperCase().padStart(3, "A")
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

  // Check user_profiles first
  const { data: existingProfile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingProfile) return apiError("USER_EXISTS", 409)

  // Placeholder password is overwritten when the user clicks the verify link.
  const placeholderPassword = randomBytes(24).toString("base64url")
  let { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: placeholderPassword,
      email_confirm: false,
      user_metadata: { name: nom, organisation, pending_verification: true },
    })

  if (createError || !created?.user) {
    const msg = createError?.message?.toLowerCase() ?? ""
    if (msg.includes("already")) {
      // Auth user exists but has no profile (orphaned) — find it and reuse its ID
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const orphan = allUsers.find(u => u.email?.toLowerCase() === email)
      if (orphan) {
        created = { user: orphan } as typeof created
      } else {
        return apiError("USER_EXISTS", 409)
      }
    } else {
      return apiError("CREATE_FAILED", 500, { detail: createError?.message })
    }
  }

  if (!created?.user) {
    return apiError("CREATE_FAILED", 500)
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

  // Use upsert so a previously failed insert (orphaned profile) gets overwritten cleanly
  const { error: insertError } = await supabaseAdmin
    .from("user_profiles")
    .upsert({
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
    }, { onConflict: "id" })

  if (insertError) {
    console.error("[invite] profile upsert failed:", insertError)
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
    // Clean up both profile and auth user on mail failure
    await supabaseAdmin.from("user_profiles").delete().eq("id", userId)
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {})
    const code =
      mailResult.error === "MAIL_NOT_CONFIGURED"
        ? "MAIL_NOT_CONFIGURED"
        : "MAIL_SEND_FAILED"
    return apiError(code, 500, { detail: mailResult.error })
  }

  await insertAuditLog(me.id, "invite", "user_profiles", userId, {
    email,
    role: rawRole,
    user_code,
  })

  return NextResponse.json({
    success: true,
    message: `Invitation envoyée à ${email}. L'utilisateur recevra un e-mail de vérification.`,
    user: { id: userId, email, nom_complet: nom, role: rawRole, pays_id, user_code },
  })
}
