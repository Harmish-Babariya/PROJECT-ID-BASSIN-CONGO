import { supabaseAdmin } from "@/lib/supabase-server"

export async function getLots(paysId?: number | null) {
  let query = supabaseAdmin.from("lots").select("*, zones(nom), pays(nom)")
  if (paysId) query = query.eq("pays_id", Number(paysId))
  const { data } = await query.order("date_creation", { ascending: false })
  return data || []
}

export async function getLotById(id: string) {
  const { data } = await supabaseAdmin
    .from("lots")
    .select("*")
    .eq("id", id)
    .single()
  return data
}

export async function getLotCollectes(lotId: string) {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      collecte_id,
      collectes (
        *,
        producteurs (code_producteur, nom, prenom),
        parcelles (code_parcelle, surface_ha, status_eudr, latitude, longitude, geojson)
      )
    `)
    .eq("lot_id", lotId)
  return data || []
}

export async function getLotCollecteIds(lotId: string) {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id")
    .eq("lot_id", lotId)
  return data?.map(lc => lc.collecte_id) || []
}

export async function getAllLotCollectes() {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id, collecte_id")
  return data || []
}

export async function getOtherLotCollecteIds(excludeLotId: string) {
  const { data } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id")
    .neq("lot_id", excludeLotId)
  return data?.map(lc => lc.collecte_id) || []
}

export async function insertLot(dataToInsert: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("lots")
    .insert(dataToInsert)
    .select()
    .single()
  return { data, error }
}

export async function updateLotById(id: number, dataToUpdate: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("lots")
    .update(dataToUpdate)
    .eq("id", id)
  return { error }
}

export async function deleteLotCollectes(lotId: number) {
  const { error } = await supabaseAdmin
    .from("lot_collectes")
    .delete()
    .eq("lot_id", lotId)
  return { error }
}

export async function insertLotCollectes(associations: { lot_id: number; collecte_id: number }[]) {
  const { error } = await supabaseAdmin
    .from("lot_collectes")
    .insert(associations)
  return { error }
}

export async function getRecentLots(limit = 3) {
  const { data } = await supabaseAdmin
    .from("lots")
    .select("id, code_lot, statut, poids_total_kg, date_creation, zones(nom)")
    .order("date_creation", { ascending: false })
    .limit(limit)
  return data || []
}

// Stats for dashboard
export async function getLotsStats(paysId?: number | null) {
  let query = supabaseAdmin.from("lots").select("id, statut, poids_total_kg")
  if (paysId) query = query.eq("pays_id", paysId)
  const { data } = await query
  return data || []
}
