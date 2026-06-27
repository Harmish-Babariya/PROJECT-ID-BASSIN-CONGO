import { supabaseAdmin } from "@/lib/supabase-server"
import { DataScope, applyScope } from "@/lib/services/scope"
import { searchTokens } from "@/lib/services/common"

export async function getParcelles(filters?: {
  recherche?: string
  zone_id?: string
  culture?: string
  status_eudr?: string
  producteur_id?: string
  scope?: DataScope
}) {
  let query = supabaseAdmin.from("parcelles").select("*")

  // Parcelles carry both pays_id and created_by, so scope directly (Issue #1).
  query = applyScope(query, filters?.scope ?? null)

  // Token-based search on the parcel code: each whitespace-separated token must
  // match (tokens AND together). Trims the term so a trailing space no longer
  // wipes out results.
  for (const token of searchTokens(filters?.recherche)) {
    query = query.ilike("code_parcelle", `%${token}%`)
  }
  if (filters?.zone_id) {
    query = query.eq("zone_id", parseInt(filters.zone_id))
  }
  if (filters?.culture) {
    query = query.eq("culture", filters.culture)
  }
  if (filters?.status_eudr) {
    // Risk-based filter. Each filter value matches BOTH the new risk strings and
    // every legacy DB value, so it works whether or not a row has been migrated.
    //   "CONFORME"                 → Negligible risk
    //   "NON CONFORME" / RISQUE…   → Non-negligible risk (collapsed)
    //   "__pending_review__"       → Could not assess ∪ null
    const v = filters.status_eudr
    const NEGLIGIBLE = ["Risque négligeable", "CONFORME", "COMPLIANT"]
    const NON_NEGLIGIBLE = [
      "Risque non négligeable",
      "Risque non négligeable (zone protégée)",
      "NON CONFORME", "NON-CONFORME",
      "RISQUE NON NÉGLIGEABLE", "RISQUE NON NEGLIGEABLE", "ALERT",
    ]
    if (v === "__pending_review__" || v === "__not_verified__" || v === "EN ATTENTE" || v === "Analyse impossible") {
      query = query.or(
        "status_eudr.is.null,status_eudr.eq.,status_eudr.eq.Analyse impossible,status_eudr.eq.EN ATTENTE,status_eudr.eq.PENDING,status_eudr.eq.PENDING_REVIEW"
      )
    } else if (v === "__alert__" || v === "NON CONFORME" || v === "RISQUE NON NÉGLIGEABLE" || v === "Risque non négligeable") {
      query = query.in("status_eudr", NON_NEGLIGIBLE)
    } else if (v === "CONFORME" || v === "Risque négligeable") {
      query = query.in("status_eudr", NEGLIGIBLE)
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

export async function getParcellesForSelect(scope?: DataScope) {
  let query = supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, producteur_id")

  query = applyScope(query, scope ?? null)

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

// Lightweight fetch for maps (only location + identity fields), scoped
export async function getParcellesForMap(scope?: DataScope) {
  // Step 1: fetch parcelles
  let query = supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, surface_ha, status_eudr, latitude, longitude, geojson, producteur_id")

  query = applyScope(query, scope ?? null)

  const { data: parcelles } = await query
  if (!parcelles || parcelles.length === 0) return []

  // Step 2: fetch producteur names + country separately (no FK in schema cache)
  const producteurIds = [...new Set(parcelles.map(p => p.producteur_id).filter(Boolean))]
  const producteursMap: Record<number, { nom: string; prenom: string | null; pays: { nom: string } | null; zone_nom: string | null; village: string | null; cooperative: string | null }> = {}

  if (producteurIds.length > 0) {
    const { data: prods } = await supabaseAdmin
      .from("producteurs")
      .select("id, nom, prenom, pays(nom), zones(nom), village, cooperative")
      .in("id", producteurIds)
    if (prods) {
      for (const p of prods) {
        const paysRaw = p.pays as unknown
        const paysObj: { nom: string } | null = Array.isArray(paysRaw)
          ? (paysRaw[0] as { nom: string } ?? null)
          : (paysRaw as { nom: string } | null) ?? null
        const zonesRaw = p.zones as unknown
        const zoneObj: { nom: string } | null = Array.isArray(zonesRaw)
          ? (zonesRaw[0] as { nom: string } ?? null)
          : (zonesRaw as { nom: string } | null) ?? null
        producteursMap[p.id] = {
          nom: p.nom,
          prenom: p.prenom ?? null,
          pays: paysObj,
          zone_nom: zoneObj?.nom ?? null,
          village: (p as Record<string, unknown>).village as string | null ?? null,
          cooperative: (p as Record<string, unknown>).cooperative as string | null ?? null,
        }
      }
    }
  }

  // Step 3: merge
  return parcelles.map(p => ({
    ...p,
    producteurs: p.producteur_id ? (producteursMap[p.producteur_id] ?? null) : null,
  }))
}

// Returns a short-lived signed URL (60 min) for downloading a private GPX file.
// Use this wherever the frontend needs to let an authenticated user access the file.
export async function getSignedGpxUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from("parcelles-gpx")
    .createSignedUrl(storagePath, 3600)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

// Stats for dashboard
export async function getParcellesStats(scope?: DataScope) {
  let query = supabaseAdmin.from("parcelles").select("id, producteur_id, status_eudr, surface_ha")
  query = applyScope(query, scope ?? null)
  const { data } = await query
  return data || []
}
