"use server"
import { updateProducteurById } from "@/lib/services/producteurs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProducteur(id: number, formData: any) {
  const { error } = await updateProducteurById(id, formData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/producteurs/${id}`)
  redirect(`/producteurs/${id}`)
}
