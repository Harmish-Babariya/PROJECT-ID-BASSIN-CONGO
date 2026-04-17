import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { sendMail, buildInviteEmail } from "@/lib/services/mail"

function buildUserCode(count: number) {
  const seq = String(count + 1).padStart(5, "0")
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `USR-${seq}-${rand}`
}

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
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }
  if (me.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

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
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const email = (body.email || "").toLowerCase().trim()
  const nom = (body.nom || "").trim()
  const organisation = (body.organisation || "").trim() || null
  const rawRole = body.role === "admin" ? "admin" : "point_focal"
  const pays_id = rawRole === "admin" ? null : body.pays_id || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 })
  }
  if (!nom) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 })
  }
  if (rawRole === "point_focal" && !pays_id) {
    return NextResponse.json({ error: "COUNTRY_REQUIRED" }, { status: 400 })
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingProfile) {
    return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 })
  }

  const tempPassword = buildTempPassword()

  // Create the auth user directly with a temporary password
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: nom, organisation },
    })

  if (createError || !created?.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 })
    }
    return NextResponse.json(
      { error: "CREATE_FAILED", detail: createError?.message },
      { status: 500 }
    )
  }

  const userId = created.user.id

  const { count } = await supabaseAdmin
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
  const user_code = buildUserCode(count ?? 0)

  const insertPayload: Record<string, unknown> = {
    id: userId,
    email,
    nom_complet: nom,
    role: rawRole,
    pays_id,
    statut: "actif",
    user_code,
    organisation,
  }

  const optionalColumns = ["statut", "user_code", "organisation"]
  let insertError: { message?: string } | null = null
  while (true) {
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .insert(insertPayload)
    if (!error) {
      insertError = null
      break
    }
    const msg = error.message || ""
    const missingCol = optionalColumns.find(
      (col) => msg.includes(`'${col}'`) || msg.includes(`"${col}"`)
    )
    if (!missingCol || !(missingCol in insertPayload)) {
      insertError = error
      break
    }
    delete insertPayload[missingCol]
  }

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: "PROFILE_INSERT_FAILED", detail: insertError.message },
      { status: 500 }
    )
  }

  // Send credentials by email via Mailjet
  const loginUrl = new URL("/login", request.nextUrl.origin).toString()
  const roleLabel = rawRole === "admin" ? "Administrateur" : "Point focal"
  const { subject, textPart, htmlPart } = buildInviteEmail({
    fullName: nom,
    email,
    tempPassword,
    loginUrl,
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
    // Email delivery failed — roll back the created user so the admin can retry cleanly
    await supabaseAdmin.from("user_profiles").delete().eq("id", userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    const code =
      mailResult.error === "MAIL_NOT_CONFIGURED"
        ? "MAIL_NOT_CONFIGURED"
        : "MAIL_SEND_FAILED"
    return NextResponse.json(
      { error: code, detail: mailResult.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    user: { id: userId, email, nom_complet: nom, role: rawRole, pays_id, user_code },
  })
}
