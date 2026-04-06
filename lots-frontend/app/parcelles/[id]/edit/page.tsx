import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ParcelleForm from "./ParcelleForm"

export default async function EditParcelle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: parcelle } = await supabaseAdmin
    .from("parcelles")
    .select("*")
    .eq("id", id)
    .single()

  if (!parcelle) notFound()

  const { data: producteurs } = await supabaseAdmin.from("producteurs").select("*").order("code_producteur")
  const { data: zones } = await supabaseAdmin.from("zones").select("*").order("nom")

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Modifier la parcelle</h1>
      <ParcelleForm parcelle={parcelle} producteurs={producteurs || []} zones={zones || []} />
    </div>
  )
}