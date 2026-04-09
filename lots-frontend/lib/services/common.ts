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
