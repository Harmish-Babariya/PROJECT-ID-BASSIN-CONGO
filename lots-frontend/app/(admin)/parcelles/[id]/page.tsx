import { notFound } from "next/navigation"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteurById } from "@/lib/services/producteurs"
import { getCollectesByParcelle } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import ParcelleDetailClient from "./ParcelleDetailClient"

export default async function ParcelleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [parcelle, me] = await Promise.all([getParcelleById(id), getCurrentUser()])
  if (!parcelle) notFound()

  const [producteur, collectes] = await Promise.all([
    getProducteurById(String(parcelle.producteur_id)),
    getCollectesByParcelle(id),
  ])

  // Resolve the override author's display name (if any) so the badge can show
  // "Locked by <name>" instead of just "Locked by <uuid>".
  let overrideByName: string | null = null
  if (parcelle.eudr_admin_override_by) {
    const { data: user } = await supabaseAdmin
      .from("user_profiles")
      .select("nom_complet, email")
      .eq("id", parcelle.eudr_admin_override_by)
      .single()
    overrideByName = user?.nom_complet || user?.email || null
  }

  return (
    <ParcelleDetailClient
      parcelle={parcelle}
      producteur={producteur}
      collectes={collectes}
      isAdmin={me?.role === "admin"}
      overrideByName={overrideByName}
    />
  )
}
