"use server"
import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateParcelle(id: number, formData: any) {
  const { error } = await supabaseAdmin
    .from("parcelles")
    .update({
      producteur_id: parseInt(formData.producteur_id),
      zone_id: parseInt(formData.zone_id),
      surface_ha: parseFloat(formData.surface_ha),
      culture: formData.culture,
      annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
      date_creation: formData.date_creation
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parcelles/${id}`)
  redirect(`/parcelles/${id}`)
}