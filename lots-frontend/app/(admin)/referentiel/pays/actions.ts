"use server"
import { revalidatePath } from "next/cache"
import { createPays, updatePays, deletePays } from "@/lib/services/referentiel"

export async function actionCreatePays(formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  await createPays(code, nom)
  revalidatePath("/referentiel/pays")
}

export async function actionUpdatePays(id: number, formData: FormData) {
  const code = String(formData.get("code") || "").trim()
  const nom = String(formData.get("nom") || "").trim()
  if (!code || !nom) throw new Error("Code et nom requis")
  await updatePays(id, code, nom)
  revalidatePath("/referentiel/pays")
}

export async function actionDeletePays(id: number) {
  await deletePays(id)
  revalidatePath("/referentiel/pays")
}
