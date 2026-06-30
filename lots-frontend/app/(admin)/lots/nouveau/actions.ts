"use server"
import { insertLot, insertLotCollectes } from "@/lib/services/lots"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Derive a lot's country from its collectes' producteurs. The creator's own
// country is unreliable (admins have none), which previously left admin-created
// lots with pays_id = null and therefore invisible to focal points (Issue #7).
async function resolveLotPaysId(collecteIds: number[]): Promise<number | null> {
  if (collecteIds.length === 0) return null
  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select("producteur_id")
    .in("id", collecteIds)
  const producteurIds = [...new Set((collectes ?? []).map((c) => c.producteur_id).filter(Boolean))]
  if (producteurIds.length === 0) return null
  const { data: prods } = await supabaseAdmin
    .from("producteurs")
    .select("pays_id")
    .in("id", producteurIds)
  return prods?.find((p) => p.pays_id != null)?.pays_id ?? null
}

export async function createLot(
  formData: any,
  collectesSelectionnees: number[],
  poidsTotal: number
) {
  const me = await getCurrentUser()

  let newLotId: number | null = null

  try {
    const lotPaysId = (await resolveLotPaysId(collectesSelectionnees)) ?? me?.country_id ?? null

    const { data: lot, error: lotError } = await insertLot({
      produit: formData.produit,
      poids_total_kg: poidsTotal,
      destination_pays: formData.destination_pays || null,
      acheteur: formData.acheteur || null,
      date_expedition: formData.date_expedition || null,
      statut: formData.statut,
      // Country comes from the lot's producers so focal points scoped by country
      // can see it regardless of who created it (Issue #7).
      pays_id: lotPaysId,
      created_by: me?.id ?? null,
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
