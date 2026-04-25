"use server"
import { revalidatePath } from "next/cache"
import { createZone, updateZone, deleteZone, getZonesByIdRef } from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreateZone(formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  const pays_id = parseInt(String(formData.get("pays_id") || "0"))
  if (!code || !nom || !pays_id) throw new Error("Tous les champs sont requis")
  const me = await getCurrentUser()
  const created = await createZone(code, nom, pays_id)
  if (me && created) {
    await insertAuditLog(me.id, "create", "zones", String(created.id), {
      code: created.code,
      nom: created.nom,
      pays_id,
    })
  }
  revalidatePath("/referentiel/zones")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionUpdateZone(id: number, formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  const pays_id = parseInt(String(formData.get("pays_id") || "0"))
  if (!code || !nom || !pays_id) throw new Error("Tous les champs sont requis")
  const me = await getCurrentUser()
  await updateZone(id, code, nom, pays_id)
  if (me) {
    await insertAuditLog(me.id, "update", "zones", String(id), {
      code: code.toUpperCase(),
      nom,
      pays_id,
    })
  }
  revalidatePath("/referentiel/zones")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionDeleteZone(id: number) {
  const me = await getCurrentUser()
  const existing = await getZonesByIdRef(id)
  await deleteZone(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "zones", String(id), {
      code: existing?.code ?? null,
      nom: existing?.nom ?? null,
      pays_id: existing?.pays_id ?? null,
    })
  }
  revalidatePath("/referentiel/zones")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}
