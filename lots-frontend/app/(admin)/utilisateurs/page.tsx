import UtilisateursContent from "./UtilisateursContent"
import { supabaseAdmin } from "@/lib/supabase-server"

export default async function UtilisateursPage() {
  const { data: profiles } = await supabaseAdmin
    .from("user_profiles")
    .select("*, pays(nom)")
    .order("created_at", { ascending: false })

  const { data: authList } = await supabaseAdmin.auth.admin.listUsers()
  const lastSignInById = new Map<string, string | null>()
  for (const u of authList?.users || []) {
    lastSignInById.set(u.id, u.last_sign_in_at ?? null)
  }

  const enriched = (profiles || []).map((p) => ({
    ...p,
    last_sign_in_at: lastSignInById.get(p.id) ?? null,
  }))

  return <UtilisateursContent profiles={enriched} />
}
