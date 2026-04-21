"use server"
import { insertCollecte } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCollecte(formData: any) {
  const me = await getCurrentUser()

  const dataToInsert = {
    producteur_id: parseInt(formData.producteur_id),
    parcelle_id: parseInt(formData.parcelle_id),
    date_collecte: formData.date_collecte,
    produit: formData.produit,
    poids_brut_kg: formData.poids_brut_kg ? parseFloat(formData.poids_brut_kg) : null,
    poids_net_kg: formData.poids_net_kg ? parseFloat(formData.poids_net_kg) : null,
    nombre_sacs: formData.nombre_sacs ? parseInt(formData.nombre_sacs) : null,
    humidite_pct: formData.taux_humidite ? parseFloat(formData.taux_humidite) : null,
    qualite: formData.qualite || null
  }

  const { data, error } = await insertCollecte(dataToInsert)

  if (error) {
    return { error: error.message }
  }

  if (me) {
    await insertAuditLog(me.id, "create", "collectes", String(data.id), {
      producteur_id: dataToInsert.producteur_id,
      produit: dataToInsert.produit,
      poids_net_kg: dataToInsert.poids_net_kg,
      date_collecte: dataToInsert.date_collecte,
    })
  }

  revalidatePath('/collectes')
  redirect(`/collectes/${data.id}`)
}
