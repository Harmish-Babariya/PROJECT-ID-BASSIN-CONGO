import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: lot } = await supabaseAdmin
    .from("lots")
    .select("*")
    .eq("id", id)
    .single()

  if (!lot) notFound()

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      collecte_id,
      collectes (
        *,
        producteurs (code_producteur, nom, prenom),
        parcelles (code_parcelle)
      )
    `)
    .eq("lot_id", id)

  const collectes = lotCollectes?.map(lc => lc.collectes).filter(Boolean) || []

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/lots" className="text-primary hover:underline">← Retour aux lots</Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{lot.code_lot}</h1>
            <p className="text-text/70">{lot.produit}</p>
          </div>
          <Link 
            href={`/lots/${id}/edit`}
            className="bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            ✏️ Modifier
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 text-text">
          <div>
            <p className="text-text/70 text-sm mb-1">Poids total</p>
            <p className="font-medium text-2xl text-primary">{lot.poids_total_kg} kg</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Statut</p>
            <p className="font-medium">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                lot.statut === 'Exporté' ? 'bg-green-500/20 text-green-400' :
                lot.statut === 'Prêt' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {lot.statut}
              </span>
            </p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Destination</p>
            <p className="font-medium">{lot.destination_pays || '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Acheteur</p>
            <p className="font-medium">{lot.acheteur || '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Date expédition</p>
            <p className="font-medium">
              {lot.date_expedition 
                ? new Date(lot.date_expedition).toLocaleDateString('fr-FR') 
                : '-'
              }
            </p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Date création</p>
            <p className="font-medium">
              {lot.date_creation 
                ? new Date(lot.date_creation).toLocaleDateString('fr-FR') 
                : '-'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-text mb-4">
          Collectes ({collectes.length})
        </h2>
        {collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c: any) => (
              <div key={c.id} className="bg-[#34495e] p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-text font-medium">
                    {c.producteurs?.code_producteur} - {c.producteurs?.nom} {c.producteurs?.prenom}
                  </p>
                  <p className="text-text/70 text-sm">
                    Parcelle: {c.parcelles?.code_parcelle} | {new Date(c.date_collecte).toLocaleDateString('fr-FR')}
                  </p>
                  {c.qualite && (
                    <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      {c.qualite}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold text-xl">{c.poids_net_kg} kg</p>
                  {c.nombre_sacs && (
                    <p className="text-text/70 text-sm">{c.nombre_sacs} sacs</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text/70 mb-4">Aucune collecte associée à ce lot</p>
            <Link
              href={`/lots/${id}/edit`}
              className="inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Ajouter des collectes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}