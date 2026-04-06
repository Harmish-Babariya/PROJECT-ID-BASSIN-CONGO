import { supabaseAdmin } from "@/lib/supabase-server"
import CollecteForm from "./CollecteForm"

export default async function NouvelleCollecte() {
  const { data: producteurs } = await supabaseAdmin
    .from("producteurs")
    .select("id, code_producteur, nom, prenom")
    .order("code_producteur")

  const { data: parcelles } = await supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, producteur_id")
    .order("code_parcelle")

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Nouvelle collecte</h1>
      <CollecteForm 
        producteurs={producteurs || []} 
        parcelles={parcelles || []} 
      />
    </div>
  )
}