import { supabaseAdmin } from "@/lib/supabase-server"

// Query helpers for producteurs

export async function getProducteurs(filters?: {
  recherche?: string
  zone_id?: string
  sexe?: string
  statut?: string
  avec_parcelles?: string
}) {
  let query = supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom)")

  if (filters?.recherche) {
    query = query.or(`code_producteur.ilike.%${filters.recherche}%,nom.ilike.%${filters.recherche}%`)
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

  const { data: producteurs } = await query.order("code_producteur")

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

export async function getProducteursForSelect() {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("id, code_producteur, nom, prenom")
    .order("code_producteur")
  return data || []
}

export async function getProducteursAll() {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("*")
    .order("code_producteur")
  return data || []
}

export async function insertProducteur(dataToInsert: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("producteurs")
    .insert(dataToInsert)
    .select()
    .single()
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
export async function getProducteursStats() {
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("id, sexe, annee_naissance")
  return data || []
}
