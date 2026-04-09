"use server"
import { updateLotById, deleteLotCollectes, insertLotCollectes } from "@/lib/services/lots"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateLot(
  lotId: number,
  formData: any,
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  try {
    const { error: lotError } = await updateLotById(lotId, {
      produit: formData.produit,
      poids_total_kg: poidsTotal,
      destination_pays: formData.destination_pays || null,
      acheteur: formData.acheteur || null,
      date_expedition: formData.date_expedition || null,
      statut: formData.statut
    })

    if (lotError) {
      return { error: lotError.message }
    }

    const { error: deleteError } = await deleteLotCollectes(lotId)
    if (deleteError) {
      return { error: deleteError.message }
    }

    if (collectesSelectionnees.length > 0) {
      const associations = collectesSelectionnees.map(collecteId => ({
        lot_id: lotId,
        collecte_id: collecteId
      }))
      const { error: insertError } = await insertLotCollectes(associations)
      if (insertError) {
        return { error: insertError.message }
      }
    }

    revalidatePath('/lots')
    revalidatePath(`/lots/${lotId}`)
    revalidatePath('/collectes')
    redirect(`/lots/${lotId}`)
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la mise a jour" }
  }
}
