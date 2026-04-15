import UtilisateursContent from "./UtilisateursContent"
import { supabaseAdmin } from "@/lib/supabase-server"

export default async function UtilisateursPage() {
  const { data: profiles } = await supabaseAdmin
    .from("user_profiles")
    .select("*, pays(nom)")
    .order("created_at", { ascending: false })

  return <UtilisateursContent profiles={profiles || []} />
}
