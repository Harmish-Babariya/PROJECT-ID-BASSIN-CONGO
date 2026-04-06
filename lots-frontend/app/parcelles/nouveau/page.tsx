import { supabaseAdmin } from "@/lib/supabase-server"
import ParcelleForm from "./ParcelleForm"

export default async function NouvelleParcelle({
  searchParams
}: {
  searchParams: Promise<{ producteur_id?: string }>
}) {
  const params = await searchParams
  
  const { data: producteurs } = await supabaseAdmin
    .from("producteurs")
    .select("*")
    .order("code_producteur")
    
  const { data: zones } = await supabaseAdmin
    .from("zones")
    .select("*")
    .order("nom")

  let producteurSelectionne = null
  if (params.producteur_id) {
    const { data } = await supabaseAdmin
      .from("producteurs")
      .select("*, zones(nom)")
      .eq("id", params.producteur_id)
      .single()
    producteurSelectionne = data
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-2">Nouvelle parcelle</h1>
      
      {producteurSelectionne && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-text">
            📍 Parcelle pour <strong>{producteurSelectionne.code_producteur} - {producteurSelectionne.nom}</strong>
          </p>
        </div>
      )}
      
      <ParcelleForm 
        producteurs={producteurs || []} 
        zones={zones || []}
        producteurPreselectionne={params.producteur_id}
      />
    </div>
  )
}