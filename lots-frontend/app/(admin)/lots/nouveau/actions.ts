"use server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLot(
  formData: any, 
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  try {
    // 1. Créer le lot
    const { data: lot, error: lotError } = await supabaseAdmin
      .from("lots")
      .insert({
        produit: formData.produit,
        poids_total_kg: poidsTotal,
        destination_pays: formData.destination_pays || null,
        acheteur: formData.acheteur || null,
        date_expedition: formData.date_expedition || null,
        statut: formData.statut
      })
      .select()
      .single()

    if (lotError) {
      console.error("Erreur création lot:", lotError)
      return { error: lotError.message }
    }

    // 2. Créer les associations lot_collectes
    const associations = collectesSelectionnees.map(collecteId => ({
      lot_id: lot.id,
      collecte_id: collecteId
    }))

    const { error: insertError } = await supabaseAdmin
      .from("lot_collectes")
      .insert(associations)

    if (insertError) {
      console.error("Erreur insertion associations:", insertError)
      return { error: insertError.message }
    }

    revalidatePath('/lots')
    revalidatePath('/collectes')
    redirect(`/lots/${lot.id}`)
  } catch (error: any) {
    console.error("Erreur:", error)
    return { error: error.message || "Erreur lors de la création" }
  }
}