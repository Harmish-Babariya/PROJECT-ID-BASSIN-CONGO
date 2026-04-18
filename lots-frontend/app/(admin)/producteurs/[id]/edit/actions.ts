"use server"
import { updateProducteurById } from "@/lib/services/producteurs"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProducteur(id: number, formData: any) {
  const me = await getCurrentUser()

  const { error } = await updateProducteurById(id, formData)

  if (error) {
    return { error: error.message }
  }

  if (me) {
    await insertAuditLog(me.id, "update", "producteurs", String(id), {
      nom: `${formData.nom || ""}${formData.prenom ? " " + formData.prenom : ""}`.trim() || undefined,
    })
  }

  revalidatePath(`/producteurs/${id}`)
  redirect(`/producteurs/${id}`)
}
