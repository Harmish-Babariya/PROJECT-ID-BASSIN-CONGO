import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CollecteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: collecte } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle, superficie_ha),
      zones (nom),
      pays (nom)
    `)
    .eq("id", id)
    .single()

  if (!collecte) notFound()

  const { data: lotAssigne } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      lot_id,
      lots (id, code_lot, statut)
    `)
    .eq("collecte_id", id)
    .single()

  const estAssignee = !!lotAssigne
  const lot = lotAssigne?.lots

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/collectes" className="text-primary hover:underline">← Retour aux collectes</Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Collecte #{collecte.id}</h1>
            <p className="text-text/70">
              {new Date(collecte.date_collecte).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {estAssignee ? (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500/20 text-yellow-400">
                ✓ Assignée au lot
              </span>
            ) : (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 text-primary">
                Disponible
              </span>
            )}
            <Link 
              href={`/collectes/${id}/edit`} 
              className="bg-primary text-[#2d3436] px-4 py-2 rounded-lg hover:opacity-90"
            >
              Modifier
            </Link>
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-text mb-4">Producteur</h2>
          <Link 
            href={`/producteurs/${collecte.producteurs?.id}`}
            className="text-primary hover:underline text-lg"
          >
            {collecte.producteurs?.code_producteur} - {collecte.producteurs?.nom} {collecte.producteurs?.prenom}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-text/70 text-sm mb-1">Poids net</p>
            <p className="text-primary font-bold text-2xl">{collecte.poids_net_kg} kg</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Qualité</p>
            <p className="text-text font-medium text-lg">{collecte.qualite || '-'}</p>
          </div>
        </div>

        {estAssignee && lot && (
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <p className="text-text font-semibold mb-2">Cette collecte fait partie d'un lot</p>
            <Link 
              href={`/lots/${lot.id}`}
              className="text-primary hover:underline"
            >
              {lot.code_lot} - {lot.statut}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
