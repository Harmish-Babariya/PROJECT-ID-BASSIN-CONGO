import { supabaseAdmin } from "@/lib/supabase-server"

export async function getCollectes() {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle),
      zones (nom)
    `)
    .order("date_collecte", { ascending: false })
  return data || []
}

export async function getCollecteById(id: string) {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle, superficie_ha),
      zones (nom),
      pays (nom)
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

// Stats for dashboard
export async function getCollectesStats() {
  const { data } = await supabaseAdmin
    .from("collectes")
    .select("id, poids_net_kg")
  return data || []
}
