import { supabaseAdmin } from "@/lib/supabase-server"

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
