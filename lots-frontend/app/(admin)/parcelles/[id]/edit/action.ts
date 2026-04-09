"use server"
import { updateParcelleById } from "@/lib/services/parcelles"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateParcelle(id: number, formData: any) {
  const { error } = await updateParcelleById(id, {
    producteur_id: parseInt(formData.producteur_id),
    zone_id: parseInt(formData.zone_id),
    surface_ha: parseFloat(formData.surface_ha),
    culture: formData.culture,
    annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
    date_creation: formData.date_creation
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parcelles/${id}`)
  redirect(`/parcelles/${id}`)
}
