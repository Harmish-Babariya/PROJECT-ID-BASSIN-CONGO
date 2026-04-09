"use server"
import { insertLot, insertLotCollectes } from "@/lib/services/lots"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLot(
  formData: any,
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  try {
    const { data: lot, error: lotError } = await insertLot({
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

    const associations = collectesSelectionnees.map(collecteId => ({
      lot_id: lot.id,
      collecte_id: collecteId
    }))

    const { error: insertError } = await insertLotCollectes(associations)
    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath('/lots')
    revalidatePath('/collectes')
    redirect(`/lots/${lot.id}`)
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la creation" }
  }
}
