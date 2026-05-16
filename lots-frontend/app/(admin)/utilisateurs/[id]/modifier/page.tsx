import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getPays } from "@/lib/services/common"
import { getUserAuditCounts } from "@/lib/services/audit"
import ModifierUtilisateurClient from "./ModifierUtilisateurClient"

type PageParams = Promise<{ id: string }>

export default async function ModifierUtilisateurPage({
  params,
}: {
  params: PageParams
}) {
  const { id } = await params

  const [{ data: profile }, paysList, authUserRes, auditCounts] =
    await Promise.all([
      supabaseAdmin
        .from("user_profiles")
        .select("*, pays(id, nom)")
        .eq("id", id)
        .maybeSingle(),
      getPays(),
      supabaseAdmin.auth.admin.getUserById(id),
      getUserAuditCounts(id),
    ])

  if (!profile) notFound()

  const role: "admin" | "point_focal" =
    profile.role === "admin" ? "admin" : "point_focal"

  const user = {
    id: profile.id,
    email: profile.email ?? "",
    nom_complet: profile.nom_complet ?? "",
    role,
    pays_id: profile.pays_id != null ? String(profile.pays_id) : "",
    // Multi-country set (Issue #1); fall back to the single country.
    pays_ids: (Array.isArray(profile.pays_ids) && profile.pays_ids.length > 0
      ? profile.pays_ids
      : (profile.pays_id != null ? [profile.pays_id] : [])
    ).map((n: number) => String(n)),
    pays_nom: profile.pays?.nom ?? null,
    statut: profile.statut ?? "actif",
    user_code: profile.user_code ?? null,
    organisation: profile.organisation ?? null,
    created_at: profile.created_at ?? null,
    last_sign_in_at: authUserRes?.data?.user?.last_sign_in_at ?? null,
  }

  return (
    <ModifierUtilisateurClient
      user={user}
      pays={paysList}
      auditCounts={auditCounts}
    />
  )
}
