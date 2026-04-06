"use server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateCollecte(id: number, formData: any) {
  try {
    const dataToUpdate = {
      producteur_id: parseInt(formData.producteur_id),
      parcelle_id: parseInt(formData.parcelle_id),
      date_collecte: formData.date_collecte,
      produit: formData.produit,
      poids_brut_kg: formData.poids_brut_kg ? parseFloat(formData.poids_brut_kg) : null,
      poids_net_kg: formData.poids_net_kg ? parseFloat(formData.poids_net_kg) : null,
      nombre_sacs: formData.nombre_sacs ? parseInt(formData.nombre_sacs) : null,
      taux_humidite: formData.taux_humidite ? parseFloat(formData.taux_humidite) : null,
      qualite: formData.qualite || null
    }

    const { error } = await supabaseAdmin
      .from("collectes")
      .update(dataToUpdate)
      .eq("id", id)

    if (error) {
      console.error("Erreur update collecte:", error)
      return { error: error.message }
    }

    revalidatePath('/collectes')
    revalidatePath(`/collectes/${id}`)
    redirect(`/collectes/${id}`)
  } catch (error: any) {
    console.error("Erreur:", error)
    return { error: error.message || "Erreur lors de la mise à jour" }
  }
}