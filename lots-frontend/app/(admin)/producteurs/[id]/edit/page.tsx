import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ProducteurForm from "./ProducteurForm"

export default async function EditProducteur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: producteur } = await supabaseAdmin
    .from("producteurs")
    .select("*")
    .eq("id", id)
    .single()

  if (!producteur) notFound()

  const { data: zones } = await supabaseAdmin.from("zones").select("*").order("nom")
  const { data: pays } = await supabaseAdmin.from("pays").select("*").order("nom")

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Modifier le producteur</h1>
      <ProducteurForm producteur={producteur} zones={zones || []} pays={pays || []} />
    </div>
  )
}