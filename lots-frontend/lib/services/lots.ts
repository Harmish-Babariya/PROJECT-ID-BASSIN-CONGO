import { supabaseAdmin } from "@/lib/supabase-server"
import { DataScope, applyScope } from "@/lib/services/scope"

export async function getLots(scope?: DataScope) {
  let query = supabaseAdmin.from("lots").select("*, zones(nom), pays(nom)")
  query = applyScope(query, scope ?? null)
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

export async function getRecentLots(
  limit = 3,
  scope?: DataScope,
  range?: { from?: string | null; to?: string | null }
) {
  let query = supabaseAdmin
    .from("lots")
    .select("id, code_lot, statut, poids_total_kg, date_creation, zones(nom)")

  query = applyScope(query, scope ?? null)
  if (range?.from) query = query.gte("date_creation", range.from)
  if (range?.to) query = query.lte("date_creation", range.to)

  const { data } = await query
    .order("date_creation", { ascending: false })
    .limit(limit)
  return data || []
}

// Full lot details for DDS generate page: lot info + producers + parcelles
export async function getLotWithDetails(lotId: string) {
  const [lotData, collectesData] = await Promise.all([
    supabaseAdmin
      .from("lots")
      .select("*, pays(nom), zones(nom)")
      .eq("id", lotId)
      .single(),
    supabaseAdmin
      .from("lot_collectes")
      .select(`
        collecte_id,
        collectes (
          id,
          producteurs (id, code_producteur, nom, prenom),
          parcelles (
            id, code_parcelle, surface_ha, status_eudr,
            latitude, longitude,
            zones(nom), pays(nom)
          )
        )
      `)
      .eq("lot_id", lotId),
  ])

  if (!lotData.data) return null

  const collectes = (collectesData.data ?? [])
    .map((lc: any) => lc.collectes)
    .filter(Boolean) as any[]

  const producteursMap = new Map<string, any>()
  const parcellesMap = new Map<string, any>()
  collectes.forEach((c: any) => {
    if (c.producteurs) producteursMap.set(String(c.producteurs.id), c.producteurs)
    if (c.parcelles) parcellesMap.set(String(c.parcelles.id), c.parcelles)
  })

  return {
    lot: lotData.data,
    producteurs: Array.from(producteursMap.values()),
    parcelles: Array.from(parcellesMap.values()),
    collectesCount: collectes.length,
  }
}

// Stats for dashboard
export async function getLotsStats(
  scope?: DataScope,
  range?: { from?: string | null; to?: string | null }
) {
  let query = supabaseAdmin.from("lots").select("id, statut, poids_total_kg")
  query = applyScope(query, scope ?? null)
  if (range?.from) query = query.gte("date_creation", range.from)
  if (range?.to) query = query.lte("date_creation", range.to)
  const { data } = await query
  return data || []
}
