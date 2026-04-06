import { supabaseAdmin } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import LotForm from "./LotForm"

export default async function EditLot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: lot } = await supabaseAdmin
    .from("lots")
    .select("*")
    .eq("id", id)
    .single()

  if (!lot) notFound()

  // Récupérer collectes déjà assignées à ce lot
  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id")
    .eq("lot_id", id)

  const collectesAssignees = lotCollectes?.map(lc => lc.collecte_id) || []

  // Récupérer TOUTES les collectes disponibles (non assignées à d'autres lots)
  const { data: autresLotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id")
    .neq("lot_id", id)

  const collectesAutresLots = autresLotCollectes?.map(lc => lc.collecte_id) || []

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

  // Filtrer: disponibles OU déjà dans ce lot
  const collectesDisponibles = collectes?.filter(c => 
    !collectesAutresLots.includes(c.id) || collectesAssignees.includes(c.id)
  ) || []

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Modifier le lot</h1>
      <LotForm 
        lot={lot} 
        collectesDisponibles={collectesDisponibles}
        collectesInitiales={collectesAssignees}
      />
    </div>
  )
}