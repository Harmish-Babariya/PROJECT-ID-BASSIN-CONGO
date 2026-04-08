"use server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateLot(
  lotId: number, 
  formData: any, 
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  try {
    // 1. Mettre à jour les infos du lot
    const { error: lotError } = await supabaseAdmin
      .from("lots")
      .update({
        produit: formData.produit,
        poids_total_kg: poidsTotal,
        destination_pays: formData.destination_pays || null,
        acheteur: formData.acheteur || null,
        date_expedition: formData.date_expedition || null,
        statut: formData.statut
      })
      .eq("id", lotId)

    if (lotError) {
      console.error("Erreur update lot:", lotError)
      return { error: lotError.message }
    }

    // 2. Supprimer TOUTES les anciennes associations
    const { error: deleteError } = await supabaseAdmin
      .from("lot_collectes")
      .delete()
      .eq("lot_id", lotId)

    if (deleteError) {
      console.error("Erreur suppression associations:", deleteError)
      return { error: deleteError.message }
    }

    // 3. Créer les NOUVELLES associations
    if (collectesSelectionnees.length > 0) {
      const associations = collectesSelectionnees.map(collecteId => ({
        lot_id: lotId,
        collecte_id: collecteId
      }))

      const { error: insertError } = await supabaseAdmin
        .from("lot_collectes")
        .insert(associations)

      if (insertError) {
        console.error("Erreur insertion associations:", insertError)
        return { error: insertError.message }
      }
    }

    revalidatePath('/lots')
    revalidatePath(`/lots/${lotId}`)
    revalidatePath('/collectes')
    redirect(`/lots/${lotId}`)
  } catch (error: any) {
    console.error("Erreur:", error)
    return { error: error.message || "Erreur lors de la mise à jour" }
  }
}