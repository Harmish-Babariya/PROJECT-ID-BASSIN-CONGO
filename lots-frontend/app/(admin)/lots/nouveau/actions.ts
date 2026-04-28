"use server"
import { insertLot, insertLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLot(
  formData: any,
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  const me = await getCurrentUser()

  let newLotId: number | null = null

  try {
    const { data: lot, error: lotError } = await insertLot({
      produit: formData.produit,
      poids_total_kg: poidsTotal,
      destination_pays: formData.destination_pays || null,
      acheteur: formData.acheteur || null,
      date_expedition: formData.date_expedition || null,
      statut: formData.statut,
      pays_id: me?.country_id ?? null,
    })

    if (lotError) {
      return { error: lotError.message }
    }

    const associations = collectesSelectionnees.map((collecteId) => ({
      lot_id: lot.id,
      collecte_id: collecteId,
    }))

    const { error: insertError } = await insertLotCollectes(associations)
    if (insertError) {
      return { error: insertError.message }
    }

    if (me) {
      await insertAuditLog(me.id, "create", "lots", String(lot.id), {
        produit: formData.produit,
        poids_total_kg: poidsTotal,
        nb_collectes: collectesSelectionnees.length,
        statut: formData.statut,
      })
    }

    revalidatePath("/lots")
    revalidatePath("/collectes")
    revalidatePath("/profil")
    revalidatePath("/dashboard")
    newLotId = lot.id
  } catch (error: any) {
    return { error: error.message || "CREATE_FAILED" }
  }

  redirect(`/lots/${newLotId}`)
}
