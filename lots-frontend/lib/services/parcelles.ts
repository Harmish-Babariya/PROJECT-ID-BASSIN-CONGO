import { supabaseAdmin } from "@/lib/supabase-server"

export async function getParcelles(filters?: {
  recherche?: string
  zone_id?: string
  culture?: string
  status_eudr?: string
  producteur_id?: string
  pays_id?: number | null
}) {
  let query = supabaseAdmin.from("parcelles").select("*")

  // Scope to country for point_focal via producteur relationship
  if (filters?.pays_id) {
    const { data: scopedProducteurs } = await supabaseAdmin
      .from("producteurs")
      .select("id")
      .eq("pays_id", Number(filters.pays_id))
    const ids = (scopedProducteurs ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0 ? query.in("producteur_id", ids) : query.in("producteur_id", [-1])
  }

  if (filters?.recherche) {
    query = query.ilike("code_parcelle", `%${filters.recherche}%`)
  }
  if (filters?.zone_id) {
    query = query.eq("zone_id", parseInt(filters.zone_id))
  }
  if (filters?.culture) {
    query = query.eq("culture", filters.culture)
  }
  if (filters?.status_eudr) {
    query = query.eq("status_eudr", filters.status_eudr)
  }
  if (filters?.producteur_id) {
    query = query.eq("producteur_id", parseInt(filters.producteur_id))
  }

  const { data } = await query.order("code_parcelle")
  return data || []
}

export async function getParcelleById(id: string) {
  const { data } = await supabaseAdmin
    .from("parcelles")
    .select("*")
    .eq("id", id)
    .single()
  return data
}

export async function getParcellesByProducteur(producteurId: string) {
  const { data } = await supabaseAdmin
    .from("parcelles")
    .select("*")
    .eq("producteur_id", producteurId)
    .order("code_parcelle")
  return data || []
}

export async function getParcellesForSelect() {
  const { data } = await supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, producteur_id")
    .order("code_parcelle")
  return data || []
}

export async function getParcellesWithProducteurs() {
  const { data } = await supabaseAdmin
    .from("parcelles")
    .select("*, producteurs(code_producteur, nom)")
    .order("code_parcelle")
  return data || []
}

export async function insertParcelle(dataToInsert: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("parcelles")
    .insert(dataToInsert)
    .select()
    .single()
  return { data, error }
}

export async function updateParcelleById(id: number | string, dataToUpdate: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("parcelles")
    .update(dataToUpdate)
    .eq("id", typeof id === "string" ? parseInt(id) : id)
    .select()
    .single()
  return { data, error }
}

// Stats for dashboard
export async function getParcellesStats(paysId?: number | null) {
  let query = supabaseAdmin.from("parcelles").select("id, producteur_id, status_eudr, surface_ha")
  if (paysId) {
    const { data: prods } = await supabaseAdmin.from("producteurs").select("id").eq("pays_id", paysId)
    const ids = (prods ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0 ? query.in("producteur_id", ids) : query.in("producteur_id", [-1])
  }
  const { data } = await query
  return data || []
}
