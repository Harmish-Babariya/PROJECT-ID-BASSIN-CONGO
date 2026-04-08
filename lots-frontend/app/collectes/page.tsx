import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"

export default async function CollectesPage() {
  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle),
      zones (nom)
    `)
    .order("date_collecte", { ascending: false })

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id, lot_id, lots (id, code_lot)")

  const collecteLotsMap = new Map(
    lotCollectes?.map(lc => [lc.collecte_id, lc.lots?.[0]]) || []
  )

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">📦 Collectes</h1>
          <Link href="/dashboard" className="text-primary hover:underline">← Retour</Link>
        </div>
        <Link 
          href="/collectes/nouveau" 
          className="mt-4 inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          + Nouvelle collecte
        </Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Producteur</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Parcelle</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Poids net (kg)</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Qualité</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Statut</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collectes?.map((c) => {
              const dateCollecte = new Date(c.date_collecte)
              if (isNaN(dateCollecte.getTime())) return null

              const lotAssigne = collecteLotsMap.get(c.id)
              
              return (
                <tr key={c.id} className="border-t border-gray-700 hover:bg-[#34495e] transition-colors">
                  <td className="px-4 py-3 text-text text-sm whitespace-nowrap">
                    {dateCollecte.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.producteurs ? (
                      <Link 
                        href={`/producteurs/${c.producteurs.id}`}
                        className="text-primary hover:underline"
                      >
                        {c.producteurs.nom} {c.producteurs.prenom}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.parcelles ? (
                      <Link 
                        href={`/parcelles/${c.parcelles.id}`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {c.parcelles.code_parcelle}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-primary font-bold text-sm">
                    {c.poids_net_kg ? parseFloat(c.poids_net_kg).toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.qualite ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.qualite === 'Grade 1' ? 'bg-green-500/20 text-green-400' :
                        c.qualite === 'Grade 2' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {c.qualite}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lotAssigne ? (
                      <Link 
                        href={`/lots/${lotAssigne.id}`}
                        className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      >
                        → {lotAssigne.code_lot}
                      </Link>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link 
                        href={`/collectes/${c.id}`}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                      >
                        Voir
                      </Link>
                      <Link 
                        href={`/collectes/${c.id}/edit`}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}