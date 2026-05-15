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
    // Per spec, 4 separate filter values:
    //   "CONFORME"                 → compliant
    //   "NON CONFORME"             → deforestation alert (own filter)
    //   "RISQUE NON NÉGLIGEABLE"   → protected-area alert (own filter)
    //   "__pending_review__"       → EN ATTENTE ∪ null
    // Legacy aliases ("__alert__", "__not_verified__") kept for back-compat.
    const v = filters.status_eudr
    if (v === "__pending_review__" || v === "__not_verified__" || v === "EN ATTENTE") {
      query = query.or(
        "status_eudr.is.null,status_eudr.eq.,status_eudr.eq.EN ATTENTE,status_eudr.eq.PENDING,status_eudr.eq.PENDING_REVIEW"
      )
    } else if (v === "__alert__") {
      query = query.in("status_eudr", [
        "NON CONFORME", "NON-CONFORME",
        "RISQUE NON NÉGLIGEABLE", "RISQUE NON NEGLIGEABLE",
      ])
    } else if (v === "NON CONFORME") {
      query = query.in("status_eudr", ["NON CONFORME", "NON-CONFORME"])
    } else if (v === "RISQUE NON NÉGLIGEABLE") {
      query = query.in("status_eudr", ["RISQUE NON NÉGLIGEABLE", "RISQUE NON NEGLIGEABLE", "ALERT"])
    } else if (v === "CONFORME") {
      query = query.in("status_eudr", ["CONFORME", "COMPLIANT"])
    } else {
      query = query.eq("status_eudr", v)
    }
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

export async function getParcellesForSelect(paysId?: number | null) {
  let query = supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, producteur_id")

  if (paysId) {
    const { data: scopedProducteurs } = await supabaseAdmin
      .from("producteurs")
      .select("id")
      .eq("pays_id", Number(paysId))
    const ids = (scopedProducteurs ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0 ? query.in("producteur_id", ids) : query.in("producteur_id", [-1])
  }

  const { data } = await query.order("code_parcelle")
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

// Lightweight fetch for maps (only location + identity fields), country-scoped
export async function getParcellesForMap(paysId?: number | null) {
  let query = supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, surface_ha, status_eudr, latitude, longitude, geojson, producteur_id")

  if (paysId) {
    const { data: prods } = await supabaseAdmin
      .from("producteurs")
      .select("id")
      .eq("pays_id", paysId)
    const ids = (prods ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0 ? query.in("producteur_id", ids) : query.in("producteur_id", [-1])
  }

  const { data } = await query
  return data || []
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
