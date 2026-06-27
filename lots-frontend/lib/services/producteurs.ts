import { supabaseAdmin } from "@/lib/supabase-server"
import { DataScope, applyScope } from "@/lib/services/scope"
import { searchTokens, tokenOrExpr } from "@/lib/services/common"

// Query helpers for producteurs

export async function getProducteurs(filters?: {
  recherche?: string
  zone_id?: string
  sexe?: string
  statut?: string
  avec_parcelles?: string
  scope?: DataScope
}) {
  let query = supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom)")

  // Scope to the focal point's countries + their own records (Issue #1).
  // Admins pass scope = null and see everything.
  query = applyScope(query, filters?.scope ?? null)

  // Token-based search: each whitespace-separated token must match at least one
  // of code/nom/prenom (tokens AND together, fields OR together). This makes
  // partial matches, trailing spaces, and full names ("Jean Dupont") all work.
  for (const token of searchTokens(filters?.recherche)) {
    query = query.or(tokenOrExpr(token, ["code_producteur", "nom", "prenom"]))
  }
  if (filters?.zone_id) {
    query = query.eq("zone_id", parseInt(filters.zone_id))
  }
  if (filters?.sexe) {
    query = query.eq("sexe", filters.sexe)
  }
  if (filters?.statut) {
    query = query.eq("statut", filters.statut)
  }

  const { data: producteurs } = await query.order("created_at", { ascending: false })

  // Add parcelle count for each producteur
  let producteursAvecParcelles = await Promise.all(
    (producteurs || []).map(async (p) => {
      const { count } = await supabaseAdmin
        .from("parcelles")
        .select("*", { count: "exact", head: true })
        .eq("producteur_id", p.id)
      return { ...p, nombre_parcelles: count || 0 }
    })
  )

  if (filters?.avec_parcelles === "oui") {
    producteursAvecParcelles = producteursAvecParcelles.filter(p => p.nombre_parcelles > 0)
  } else if (filters?.avec_parcelles === "non") {
    producteursAvecParcelles = producteursAvecParcelles.filter(p => p.nombre_parcelles === 0)
  }

  return producteursAvecParcelles
}

export async function getProducteurById(id: string) {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom, pays(nom)), pays(nom)")
    .eq("id", id)
    .single()
  return data
}

export async function getProducteurSimple(id: string) {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("*")
    .eq("id", id)
    .single()
  return data
}

export async function getProducteursForSelect(scope?: DataScope) {
  let query = supabaseAdmin
    .from("producteurs")
    .select("id, code_producteur, nom, prenom, pays_id, zone_id, village")
  query = applyScope(query, scope ?? null)
  const { data } = await query.order("code_producteur")
  return data || []
}

export async function getProducteursAll() {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("*")
    .order("code_producteur")
  return data || []
}

function buildCodePrefix(paysNom: string | null | undefined, zoneNom: string | null | undefined): string {
  const paysPart = (paysNom ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "XX"
  const zonePart = (zoneNom ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "XXX"
  return `${paysPart}-${zonePart}`
}

function randomNumericSuffix(length = 3): string {
  const max = Math.pow(10, length)
  const n = Math.floor(Math.random() * (max - 1)) + 1
  return String(n).padStart(length, "0")
}

export async function getNextProducteurCode(paysId: number | null, zoneId: number | null): Promise<string> {
  let paysNom: string | null = null
  let zoneNom: string | null = null

  if (paysId) {
    const { data } = await supabaseAdmin
      .from("pays")
      .select("nom")
      .eq("id", paysId)
      .single()
    paysNom = data?.nom ?? null
  }
  if (zoneId) {
    const { data } = await supabaseAdmin
      .from("zones")
      .select("nom")
      .eq("id", zoneId)
      .single()
    zoneNom = data?.nom ?? null
  }

  const prefix = buildCodePrefix(paysNom, zoneNom)

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = `${prefix}-${randomNumericSuffix(3)}`
    const { data: clash } = await supabaseAdmin
      .from("producteurs")
      .select("id")
      .eq("code_producteur", candidate)
      .maybeSingle()
    if (!clash) return candidate
  }

  throw new Error(
    `Impossible de générer un code unique pour ${prefix}- (toutes les combinaisons 000-999 sont prises).`
  )
}

export async function insertProducteur(dataToInsert: Record<string, unknown>) {
  const paysId = typeof dataToInsert.pays_id === "number" ? dataToInsert.pays_id : null
  const zoneId = typeof dataToInsert.zone_id === "number" ? dataToInsert.zone_id : null

  const code = await getNextProducteurCode(paysId, zoneId)
  const payload = { ...dataToInsert, code_producteur: code }

  const { data, error } = await supabaseAdmin
    .from("producteurs")
    .insert(payload)
    .select()
    .single()

  if (error) {
    const isUniqueViolation =
      (error as { code?: string }).code === "23505" ||
      /duplicate|unique|code_producteur/i.test(error.message ?? "")
    if (isUniqueViolation) {
      return {
        data: null,
        error: {
          ...error,
          message: `Le code producteur "${payload.code_producteur}" existe déjà. Veuillez réessayer.`,
        },
      }
    }
  }

  return { data, error }
}

export async function updateProducteurById(id: number, formData: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("producteurs")
    .update(formData)
    .eq("id", id)
  return { error }
}

// Stats for dashboard
export async function getProducteursStats(scope?: DataScope) {
  let query = supabaseAdmin.from("producteurs").select("id, sexe, annee_naissance")
  query = applyScope(query, scope ?? null)
  const { data } = await query
  return data || []
}
