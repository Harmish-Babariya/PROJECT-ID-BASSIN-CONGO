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
        producteurs (code_producteur, nom, prenom, cooperative),
        parcelles (
          id, code_parcelle, surface_ha, status_eudr, latitude, longitude, geojson,
          eudr_foret_2020_pct, eudr_perte_2021_2024_ha, eudr_alertes_2025_ha, dans_zone_protegee
        )
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

// Parcelle + producer pairs for a lot, with the geometry/identity fields the
// GeoJSON export needs. Each parcelle is paired with the producer it was
// collected from (via lot_collectes -> collectes).
export async function getLotParcellesForExport(lotId: string) {
  const { data: lot } = await supabaseAdmin
    .from("lots")
    .select("id, code_lot")
    .eq("id", lotId)
    .single()
  if (!lot) return null

  const { data: rows } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      collectes (
        producteurs (nom, prenom, cooperative, village, pays(nom), zones(nom)),
        parcelles (id, code_parcelle, surface_ha, latitude, longitude, geojson)
      )
    `)
    .eq("lot_id", lotId)

  // De-duplicate parcelles (a parcelle can appear in multiple collectes).
  type ExportRow = {
    collectes?: {
      producteurs?: Record<string, unknown> | null
      parcelles?: ({ id: number | string } & Record<string, unknown>) | null
    } | null
  }
  const seen = new Set<string>()
  const pairs: Array<{ parcelle: Record<string, unknown>; producteur: Record<string, unknown> | null }> = []
  for (const lc of (rows ?? []) as ExportRow[]) {
    const col = lc.collectes
    if (!col?.parcelles) continue
    const pid = String(col.parcelles.id)
    if (seen.has(pid)) continue
    seen.add(pid)
    pairs.push({ parcelle: col.parcelles, producteur: col.producteurs ?? null })
  }

  return { lot, pairs }
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
