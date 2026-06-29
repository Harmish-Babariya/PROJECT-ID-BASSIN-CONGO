"use server"
import { revalidatePath } from "next/cache"
import {
  createAnalysisMetadata,
  updateAnalysisMetadata,
  deleteAnalysisMetadata,
} from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreateMetadata(formData: FormData) {
  const label = String(formData.get("label") || "").trim()
  const value = String(formData.get("value") || "").trim()
  if (!label || !value) throw new Error("Label et valeur requis")
  const me = await getCurrentUser()
  const created = await createAnalysisMetadata(label, value)
  if (me && created) {
    await insertAuditLog(me.id, "create", "analysis_metadata", String(created.id), { label, value })
  }
  revalidatePath("/referentiel/analyse-metadata")
}

export async function actionUpdateMetadata(id: number, formData: FormData) {
  const label = String(formData.get("label") || "").trim()
  const value = String(formData.get("value") || "").trim()
  if (!label || !value) throw new Error("Label et valeur requis")
  const me = await getCurrentUser()
  await updateAnalysisMetadata(id, label, value)
  if (me) {
    await insertAuditLog(me.id, "update", "analysis_metadata", String(id), { label, value })
  }
  revalidatePath("/referentiel/analyse-metadata")
}

export async function actionDeleteMetadata(id: number) {
  const me = await getCurrentUser()
  await deleteAnalysisMetadata(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "analysis_metadata", String(id))
  }
  revalidatePath("/referentiel/analyse-metadata")
}
