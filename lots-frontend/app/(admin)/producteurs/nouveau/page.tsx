import { supabaseAdmin } from "@/lib/supabase-server"
import ProducteurForm from "./ProducteurForm"

export default async function NouveauProducteur({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  
  // Récupérer pays, zones ET villages
  const { data: pays } = await supabaseAdmin
    .from("pays")
    .select("*")
    .order("nom")

  const { data: zones } = await supabaseAdmin
    .from("zones")
    .select("*")
    .order("nom")

  const { data: villages, error: villagesError } = await supabaseAdmin
    .from("villages")
    .select("*")
    .order("nom")
  
  if (villagesError) {
    console.error("Erreur récupération villages:", villagesError)
  }
  
  console.log("Villages récupérés:", villages?.length || 0, villages)

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-2">Nouveau producteur</h1>
      <p className="text-gray-400 mb-6">Code auto-généré : CG-XXX-XXX</p>
      
      {params.returnTo && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-text">
            📍 Après création, vous serez redirigé vers la création de parcelle
          </p>
        </div>
      )}
      
      <ProducteurForm 
        pays={pays || []} 
        zones={zones || []} 
        villages={villages || []}
        returnTo={params.returnTo}
      />
    </div>
  )
}