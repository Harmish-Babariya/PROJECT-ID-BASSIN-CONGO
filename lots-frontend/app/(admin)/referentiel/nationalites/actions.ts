"use server"
import { revalidatePath } from "next/cache"
import {
  createNationalite,
  updateNationalite,
  deleteNationalite,
  getNationaliteByIdRef,
} from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreateNationalite(formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  const me = await getCurrentUser()
  const created = await createNationalite(code, nom)
  if (me && created) {
    await insertAuditLog(me.id, "create", "nationalites", String(created.id), {
      code: created.code,
      nom: created.nom,
    })
  }
  revalidatePath("/referentiel/nationalites")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionUpdateNationalite(id: number, formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  const me = await getCurrentUser()
  await updateNationalite(id, code, nom)
  if (me) {
    await insertAuditLog(me.id, "update", "nationalites", String(id), {
      code: code.toUpperCase(),
      nom,
    })
  }
  revalidatePath("/referentiel/nationalites")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}

export async function actionDeleteNationalite(id: number) {
  const me = await getCurrentUser()
  const existing = await getNationaliteByIdRef(id)
  await deleteNationalite(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "nationalites", String(id), {
      code: existing?.code ?? null,
      nom: existing?.nom ?? null,
    })
  }
  revalidatePath("/referentiel/nationalites")
  revalidatePath("/profil")
  revalidatePath("/dashboard")
}
