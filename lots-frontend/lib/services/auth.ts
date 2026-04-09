import { supabaseAdmin } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"

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

  return {
    id: user.id,
    email: user.email || "",
    role: profile?.role || "point_focal",
    country: profile?.pays?.nom || null,
    country_id: profile?.pays_id || null,
    created_at: user.created_at,
  }
}
