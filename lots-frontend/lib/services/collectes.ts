import { supabaseAdmin } from "@/lib/supabase-server"

export async function getCollectes(paysId?: number | null) {
  let query = supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle),
      zones (nom)
    `)

  if (paysId) {
    const { data: scopedProducteurs } = await supabaseAdmin
      .from("producteurs")
      .select("id")
      .eq("pays_id", Number(paysId))
    const ids = (scopedProducteurs ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0
      ? query.in("producteur_id", ids)
      : query.in("producteur_id", [-1])
  }

  const { data } = await query.order("date_collecte", { ascending: false })
  return data || []
}

export async function getCollecteById(id: string) {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle, surface_ha),
      zones (nom)
    `)
    .eq("id", id)
    .single()
  return data
}

export async function getCollecteSimple(id: string) {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select("*")
    .eq("id", id)
    .single()
  return data
}

export async function getCollectesByParcelle(parcelleId: string) {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select("*")
    .eq("parcelle_id", parcelleId)
    .order("date_collecte", { ascending: false })
  return data || []
}

export async function getCollectesForLot() {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select(`
      id,
      date_collecte,
      poids_net_kg,
      qualite,
      nombre_sacs,
      producteurs (code_producteur, nom, prenom),
      parcelles (code_parcelle)
    `)
    .order("date_collecte", { ascending: false })
  return data || []
}

export async function getCollecteLotAssignment(collecteId: string) {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      lot_id,
      lots (id, code_lot, statut)
    `)
    .eq("collecte_id", collecteId)
    .single()
  return data
}

export async function getCollecteLotMap() {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id, lot_id, lots (id, code_lot)")
  return data || []
}

export async function insertCollecte(dataToInsert: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("collectes")
    .insert(dataToInsert)
    .select()
    .single()
  return { data, error }
}

export async function updateCollecteById(id: number, dataToUpdate: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("collectes")
    .update(dataToUpdate)
    .eq("id", id)
  return { error }
}

export async function getRecentCollectes(limit = 3) {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select(`
      id, date_collecte, poids_net_kg, produit,
      producteurs (code_producteur, nom, prenom),
      zones (nom)
    `)
    .order("date_collecte", { ascending: false })
    .limit(limit)
  return data || []
}

// Stats for dashboard
export async function getCollectesStats(paysId?: number | null) {
  let query = supabaseAdmin.from("collectes").select("id, poids_net_kg")
  if (paysId) {
    const { data: prods } = await supabaseAdmin.from("producteurs").select("id").eq("pays_id", paysId)
    const ids = (prods ?? []).map((p: { id: number }) => p.id)
    query = ids.length > 0 ? query.in("producteur_id", ids) : query.in("producteur_id", [-1])
  }
  const { data } = await query
  return data || []
}
