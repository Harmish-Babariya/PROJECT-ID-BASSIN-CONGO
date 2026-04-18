import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await context.params

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("*, pays(id, nom)")
    .eq("id", id)
    .single()
  if (error || !profile) return apiError("NOT_FOUND", 404)

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)

  return NextResponse.json({
    success: true,
    user: {
      id: profile.id,
      email: profile.email,
      nom_complet: profile.nom_complet,
      role: profile.role,
      pays_id: profile.pays_id,
      pays: profile.pays || null,
      statut: profile.statut ?? "actif",
      user_code: profile.user_code ?? null,
      organisation: profile.organisation ?? null,
      created_at: profile.created_at,
      last_sign_in_at: authUser?.user?.last_sign_in_at ?? null,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await context.params

  let body: {
    nom_complet?: string
    email?: string
    role?: "admin" | "point_focal" | "focal"
    pays_id?: string | number | null
  }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email")
    .eq("id", id)
    .single()
  if (!existing) return apiError("NOT_FOUND", 404)

  const nom = typeof body.nom_complet === "string" ? body.nom_complet.trim() : undefined
  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : undefined
  const role =
    body.role === "admin"
      ? "admin"
      : body.role === "point_focal" || body.role === "focal"
      ? "point_focal"
      : undefined
  const pays_id =
    role === "admin" ? null : body.pays_id != null ? String(body.pays_id) : undefined

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("INVALID_EMAIL", 400)
  }
  if (nom !== undefined && !nom) return apiError("NAME_REQUIRED", 400)
  if (role === "point_focal" && pays_id === undefined) {
    return apiError("COUNTRY_REQUIRED", 400)
  }

  if (email && email !== existing.email) {
    const { data: clash } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .maybeSingle()
    if (clash) return apiError("USER_EXISTS", 409)

    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(id, { email })
    if (authUpdateError) {
      return apiError("UPDATE_FAILED", 500, { detail: authUpdateError.message })
    }
  }

  const update: Record<string, unknown> = {}
  if (nom !== undefined) update.nom_complet = nom
  if (email !== undefined) update.email = email
  if (role !== undefined) update.role = role
  if (pays_id !== undefined) update.pays_id = pays_id

  if (Object.keys(update).length > 0) {
    const { error: profileUpdateError } = await supabaseAdmin
      .from("user_profiles")
      .update(update)
      .eq("id", id)
    if (profileUpdateError) {
      return apiError("UPDATE_FAILED", 500, {
        detail: profileUpdateError.message,
      })
    }
    await insertAuditLog(me.id, "update", "user_profiles", id, {
      fields: Object.keys(update),
    })
  }

  return NextResponse.json({
    success: true,
    message: "Modifications enregistrées.",
  })
}
