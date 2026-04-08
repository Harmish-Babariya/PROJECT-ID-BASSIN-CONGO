"use server"
import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProducteur(id: number, formData: any) {
  const { error } = await supabaseAdmin
    .from("producteurs")
    .update(formData)
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/producteurs/${id}`)
  redirect(`/producteurs/${id}`)
}