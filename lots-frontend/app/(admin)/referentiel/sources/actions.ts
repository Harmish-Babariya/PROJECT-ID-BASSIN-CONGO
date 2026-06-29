"use server"
import { revalidatePath } from "next/cache"
import {
  createDataSource,
  updateDataSource,
  deleteDataSource,
} from "@/lib/services/referentiel"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"

export async function actionCreateSource(formData: FormData) {
  const source = String(formData.get("source") || "").trim()
  const version = String(formData.get("version") || "").trim()
  const purpose = String(formData.get("purpose") || "").trim()
  if (!source) throw new Error("Source requise")
  const me = await getCurrentUser()
  const created = await createDataSource(source, version, purpose)
  if (me && created) {
    await insertAuditLog(me.id, "create", "data_sources", String(created.id), { source, version, purpose })
  }
  revalidatePath("/referentiel/sources")
}

export async function actionUpdateSource(id: number, formData: FormData) {
  const source = String(formData.get("source") || "").trim()
  const version = String(formData.get("version") || "").trim()
  const purpose = String(formData.get("purpose") || "").trim()
  if (!source) throw new Error("Source requise")
  const me = await getCurrentUser()
  await updateDataSource(id, source, version, purpose)
  if (me) {
    await insertAuditLog(me.id, "update", "data_sources", String(id), { source, version, purpose })
  }
  revalidatePath("/referentiel/sources")
}

export async function actionDeleteSource(id: number) {
  const me = await getCurrentUser()
  await deleteDataSource(id)
  if (me) {
    await insertAuditLog(me.id, "delete", "data_sources", String(id))
  }
  revalidatePath("/referentiel/sources")
}
