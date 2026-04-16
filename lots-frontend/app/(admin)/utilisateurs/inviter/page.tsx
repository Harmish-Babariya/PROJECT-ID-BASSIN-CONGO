import InviterForm from "./InviterForm"
import { getPays } from "@/lib/services/common"
import { supabaseAdmin } from "@/lib/supabase-server"

function buildUserCode(count: number) {
  const seq = String(count + 1).padStart(5, "0")
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `USR-${seq}-${rand}`
}

export default async function InviterUtilisateurPage() {
  const [pays, countRes] = await Promise.all([
    getPays(),
    supabaseAdmin.from("user_profiles").select("id", { count: "exact", head: true }),
  ])
  const nextCode = buildUserCode(countRes.count ?? 0)
  return <InviterForm pays={pays} nextCode={nextCode} />
}
