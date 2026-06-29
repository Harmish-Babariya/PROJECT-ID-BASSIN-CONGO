import { supabaseAdmin } from "@/lib/supabase-server"

// ─── PAYS ────────────────────────────────────────────────────────────────────

export async function getPaysAll() {
  const { data } = await supabaseAdmin.from("pays").select("*").order("nom")
  return data || []
}

export async function getPaysByIdRef(id: number) {
  const { data } = await supabaseAdmin.from("pays").select("*").eq("id", id).single()
  return data
}

export async function createPays(code: string, nom: string) {
  const { data, error } = await supabaseAdmin
    .from("pays")
    .insert({ code: code.toUpperCase().trim(), nom: nom.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updatePays(id: number, code: string, nom: string) {
  const { error } = await supabaseAdmin
    .from("pays")
    .update({ code: code.toUpperCase().trim(), nom: nom.trim() })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deletePays(id: number) {
  const { error } = await supabaseAdmin.from("pays").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ─── ZONES ───────────────────────────────────────────────────────────────────

export async function getZonesAll() {
  const { data } = await supabaseAdmin
    .from("zones")
    .select("*, pays(id, nom, code)")
    .order("nom")
  return data || []
}

export async function getZonesByIdRef(id: number) {
  const { data } = await supabaseAdmin
    .from("zones")
    .select("*, pays(id, nom, code)")
    .eq("id", id)
    .single()
  return data
}

export async function createZone(code: string, nom: string, pays_id: number) {
  const { data, error } = await supabaseAdmin
    .from("zones")
    .insert({ code: code.toUpperCase().trim(), nom: nom.trim(), pays_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateZone(id: number, code: string, nom: string, pays_id: number) {
  const { error } = await supabaseAdmin
    .from("zones")
    .update({ code: code.toUpperCase().trim(), nom: nom.trim(), pays_id })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteZone(id: number) {
  const { error } = await supabaseAdmin.from("zones").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ─── VILLAGES ────────────────────────────────────────────────────────────────

export async function getVillagesAll() {
  const { data } = await supabaseAdmin
    .from("villages")
    .select("*, zones(id, nom, code, pays(id, nom, code))")
    .order("nom")
  return data || []
}

export async function getVillagesByIdRef(id: number) {
  const { data } = await supabaseAdmin
    .from("villages")
    .select("*, zones(id, nom, code, pays(id, nom, code))")
    .eq("id", id)
    .single()
  return data
}

export async function createVillage(nom: string, zone_id: number) {
  const { data, error } = await supabaseAdmin
    .from("villages")
    .insert({ nom: nom.trim(), zone_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateVillage(id: number, nom: string, zone_id: number) {
  const { error } = await supabaseAdmin
    .from("villages")
    .update({ nom: nom.trim(), zone_id })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteVillage(id: number) {
  const { error } = await supabaseAdmin.from("villages").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ─── NATIONALITES ────────────────────────────────────────────────────────────

export async function getNationalitesAll() {
  const { data } = await supabaseAdmin.from("nationalites").select("*").order("nom")
  return data || []
}

export async function getNationaliteByIdRef(id: number) {
  const { data } = await supabaseAdmin.from("nationalites").select("*").eq("id", id).single()
  return data
}

export async function createNationalite(code: string, nom: string) {
  const { data, error } = await supabaseAdmin
    .from("nationalites")
    .insert({ code: code.toUpperCase().trim(), nom: nom.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateNationalite(id: number, code: string, nom: string) {
  const { error } = await supabaseAdmin
    .from("nationalites")
    .update({ code: code.toUpperCase().trim(), nom: nom.trim() })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteNationalite(id: number) {
  const { error } = await supabaseAdmin.from("nationalites").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ─── ANALYSIS METADATA (DDS PDF) ─────────────────────────────────────────────

export async function getAnalysisMetadataAll() {
  const { data } = await supabaseAdmin.from("analysis_metadata").select("*").order("created_at")
  return data || []
}

export async function createAnalysisMetadata(label: string, value: string) {
  const { data, error } = await supabaseAdmin
    .from("analysis_metadata")
    .insert({ label: label.trim(), value: value.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateAnalysisMetadata(id: number, label: string, value: string) {
  const { error } = await supabaseAdmin
    .from("analysis_metadata")
    .update({ label: label.trim(), value: value.trim() })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteAnalysisMetadata(id: number) {
  const { error } = await supabaseAdmin.from("analysis_metadata").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ─── DATA SOURCES (DDS PDF) ───────────────────────────────────────────────────

export async function getDataSourcesAll() {
  const { data } = await supabaseAdmin.from("data_sources").select("*").order("created_at")
  return data || []
}

export async function createDataSource(source: string, version: string, purpose: string) {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .insert({ source: source.trim(), version: version.trim() || null, purpose: purpose.trim() || null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateDataSource(id: number, source: string, version: string, purpose: string) {
  const { error } = await supabaseAdmin
    .from("data_sources")
    .update({ source: source.trim(), version: version.trim() || null, purpose: purpose.trim() || null })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteDataSource(id: number) {
  const { error } = await supabaseAdmin.from("data_sources").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
