import { supabaseAdmin } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"

function buildUserCode(count: number) {
  const seq = String(count + 1).padStart(5, "0")
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `USR-${seq}-${rand}`
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Get user from Supabase auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(payload.userId)

  if (!user) return null

  // Get user_profiles entry (id references auth.users.id, email also stored)
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*, pays(nom)")
    .eq("id", user.id)
    .single()

  // Bootstrap: register route creates auth users without a profile row.
  // Create one on first login so admin access works correctly.
  if (!profile) {
    const { count } = await supabaseAdmin
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
    const bootstrapCode = buildUserCode(count ?? 0)
    await supabaseAdmin.from("user_profiles").insert({
      id: user.id,
      email: user.email,
      nom_complet: user.user_metadata?.name || user.email,
      role: "admin",
      statut: "actif",
      user_code: bootstrapCode,
    })
    return {
      id: user.id,
      email: user.email || "",
      role: "admin" as const,
      nom_complet: user.user_metadata?.name || null,
      organisation: null,
      user_code: bootstrapCode,
      country: null,
      country_id: null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
    }
  }

  let user_code = profile.user_code || null

  // Backfill user_code for legacy accounts that predate the feature
  if (!user_code) {
    const { count } = await supabaseAdmin
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
    user_code = buildUserCode(count ?? 0)
    await supabaseAdmin
      .from("user_profiles")
      .update({ user_code })
      .eq("id", user.id)
  }

  return {
    id: user.id,
    email: user.email || "",
    role: profile.role === "admin" ? "admin" : "point_focal",
    nom_complet: profile.nom_complet || null,
    organisation: profile.organisation || null,
    user_code,
    country: profile.pays?.nom || null,
    country_id: profile.pays_id || null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at || null,
  }
}
