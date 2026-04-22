"use server"
import { revalidatePath } from "next/cache"
import { createZone, updateZone, deleteZone } from "@/lib/services/referentiel"

export async function actionCreateZone(formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  const pays_id = parseInt(String(formData.get("pays_id") || "0"))
  if (!code || !nom || !pays_id) throw new Error("Tous les champs sont requis")
  await createZone(code, nom, pays_id)
  revalidatePath("/referentiel/zones")
}

export async function actionUpdateZone(id: number, formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  const pays_id = parseInt(String(formData.get("pays_id") || "0"))
  if (!code || !nom || !pays_id) throw new Error("Tous les champs sont requis")
  await updateZone(id, code, nom, pays_id)
  revalidatePath("/referentiel/zones")
}

export async function actionDeleteZone(id: number) {
  await deleteZone(id)
  revalidatePath("/referentiel/zones")
}
