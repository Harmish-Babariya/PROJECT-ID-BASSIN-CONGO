"use server"
import { revalidatePath } from "next/cache"
import { createPays, updatePays, deletePays, getPaysByIdRef } from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreatePays(formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  const me = await getCurrentUser()
  const created = await createPays(code, nom)
  if (me && created) {
    await insertAuditLog(me.id, "create", "pays", String(created.id), {
      code: created.code,
      nom: created.nom,
    })
  }
  revalidatePath("/referentiel/pays")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionUpdatePays(id: number, formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  const me = await getCurrentUser()
  await updatePays(id, code, nom)
  if (me) {
    await insertAuditLog(me.id, "update", "pays", String(id), {
      code: code.toUpperCase(),
      nom,
    })
  }
  revalidatePath("/referentiel/pays")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionDeletePays(id: number) {
  const me = await getCurrentUser()
  const existing = await getPaysByIdRef(id)
  await deletePays(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "pays", String(id), {
      code: existing?.code ?? null,
      nom: existing?.nom ?? null,
    })
  }
  revalidatePath("/referentiel/pays")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}
