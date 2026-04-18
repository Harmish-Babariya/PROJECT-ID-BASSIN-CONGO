import InviterForm from "./InviterForm"
import { getPays } from "@/lib/services/common"
import { supabaseAdmin } from "@/lib/supabase-server"

function buildUserCode(count: number) {
  const n = count + 1
  const seq = String(n).padStart(5, "0")
  // Deterministic suffix derived from sequence — same input always yields same code
  const seed = (n * 2654435761) >>> 0
  const rand = seed.toString(36).slice(-3).toUpperCase().padStart(3, "A")
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
