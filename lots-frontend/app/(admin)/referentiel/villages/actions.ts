"use server"
import { revalidatePath } from "next/cache"
import { createVillage, updateVillage, deleteVillage } from "@/lib/services/referentiel"

export async function actionCreateVillage(formData: FormData) {
  const nom = String(formData.get("nom") || "").trim()
  const zone_id = parseInt(String(formData.get("zone_id") || "0"))
  if (!nom || !zone_id) throw new Error("Nom et zone requis")
  await createVillage(nom, zone_id)
  revalidatePath("/referentiel/villages")
}

export async function actionUpdateVillage(id: number, formData: FormData) {
  const nom = String(formData.get("nom") || "").trim()
  const zone_id = parseInt(String(formData.get("zone_id") || "0"))
  if (!nom || !zone_id) throw new Error("Nom et zone requis")
  await updateVillage(id, nom, zone_id)
  revalidatePath("/referentiel/villages")
}

export async function actionDeleteVillage(id: number) {
  await deleteVillage(id)
  revalidatePath("/referentiel/villages")
}
