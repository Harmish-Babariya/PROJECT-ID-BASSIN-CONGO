import { supabaseAdmin } from "@/lib/supabase-server"

// --- Search helpers -------------------------------------------------------

// PostgREST treats commas and parentheses as syntax inside or()/and() filters,
// so any user-supplied term must have those characters stripped before it is
// interpolated, otherwise the filter is silently mangled (or rejected).
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[(),*]/g, " ").replace(/\s+/g, " ").trim()
}

// Splits a search box value into individual tokens.
// "  Jean   Dupont " -> ["jean", "dupont"]
export function searchTokens(raw: string | null | undefined): string[] {
  const cleaned = sanitizeSearchTerm((raw ?? "").toLowerCase())
  if (!cleaned) return []
  return cleaned.split(" ").filter(Boolean)
}

// Builds the .or() argument matching a single token against any of `columns`
// using case-insensitive partial match (ilike). e.g.
//   tokenOrExpr("dup", ["nom", "prenom"]) ->
//   "nom.ilike.%dup%,prenom.ilike.%dup%"
export function tokenOrExpr(token: string, columns: string[]): string {
  return columns.map((c) => `${c}.ilike.%${token}%`).join(",")
}

// Shared reference data queries

export async function getZones() {
  const { data } = await supabaseAdmin.from("zones").select("*").order("nom")
  return data || []
}

export async function getPays() {
  const { data } = await supabaseAdmin.from("pays").select("*").order("nom")
  return data || []
}

export async function getVillages() {
  const { data, error } = await supabaseAdmin.from("villages").select("*").order("nom")
  if (error) {
    console.error("Erreur recuperation villages:", error)
  }
  return data || []
}

export async function getNationalites() {
  const { data, error } = await supabaseAdmin.from("nationalites").select("*").order("nom")
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message ?? "")) {
      console.warn(
        "Table `nationalites` introuvable. Exécutez supabase/nationalites_setup.sql pour la créer."
      )
      return []
    }
    console.error("Erreur recuperation nationalites:", error.message, error)
  }
  return data || []
}
