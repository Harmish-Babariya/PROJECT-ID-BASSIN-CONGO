"use server"
import { revalidatePath } from "next/cache"
import { createVillage, updateVillage, deleteVillage, getVillagesByIdRef } from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreateVillage(formData: FormData) {
  const nom = String(formData.get("nom") || "").trim()
  const zone_id = parseInt(String(formData.get("zone_id") || "0"))
  if (!nom || !zone_id) throw new Error("Nom et zone requis")
  const me = await getCurrentUser()
  const created = await createVillage(nom, zone_id)
  if (me && created) {
    await insertAuditLog(me.id, "create", "villages", String(created.id), {
      nom: created.nom,
      zone_id,
    })
  }
  revalidatePath("/referentiel/villages")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionUpdateVillage(id: number, formData: FormData) {
  const nom = String(formData.get("nom") || "").trim()
  const zone_id = parseInt(String(formData.get("zone_id") || "0"))
  if (!nom || !zone_id) throw new Error("Nom et zone requis")
  const me = await getCurrentUser()
  await updateVillage(id, nom, zone_id)
  if (me) {
    await insertAuditLog(me.id, "update", "villages", String(id), {
      nom,
      zone_id,
    })
  }
  revalidatePath("/referentiel/villages")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionDeleteVillage(id: number) {
  const me = await getCurrentUser()
  const existing = await getVillagesByIdRef(id)
  await deleteVillage(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "villages", String(id), {
      nom: existing?.nom ?? null,
      zone_id: existing?.zone_id ?? null,
    })
  }
  revalidatePath("/referentiel/villages")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}
