import { supabaseAdmin } from "@/lib/supabase-server"
import LotForm from "./LotForm"

export default async function NouveauLot() {
  // Récupérer collectes NON assignées à un lot
  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id")

  const collectesAssignees = lotCollectes?.map(lc => lc.collecte_id) || []

  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select(`
      id,
      date_collecte,
      poids_net_kg,
      qualite,
      producteurs (code_producteur, nom, prenom),
      parcelles (code_parcelle)
    `)
    .order("date_collecte", { ascending: false })

  const collectesDisponibles = collectes?.filter(c => !collectesAssignees.includes(c.id)) || []

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-2">Nouveau lot d'export</h1>
      <p className="text-gray-400 mb-8">Code auto-généré : LOT-XXX</p>
      
      {collectesDisponibles.length === 0 ? (
        <div className="bg-[#1e272e] rounded-lg shadow p-8 text-center">
          <p className="text-text/70 mb-4">Aucune collecte disponible pour créer un lot</p>
          <p className="text-text/70 text-sm">Toutes les collectes sont déjà assignées à des lots.</p>
        </div>
      ) : (
        <LotForm collectesDisponibles={collectesDisponibles} />
      )}
    </div>
  )
}