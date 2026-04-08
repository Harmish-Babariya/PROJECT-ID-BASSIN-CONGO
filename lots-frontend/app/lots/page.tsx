import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"

export default async function LotsPage() {
  const { data: lots } = await supabaseAdmin
    .from("lots")
    .select(`
      *,
      zones (nom),
      pays (nom)
    `)
    .order("date_creation", { ascending: false })

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id")

  const collectesParLot = lotCollectes?.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">🚢 Lots d'export</h1>
          <Link href="/dashboard" className="text-primary hover:underline">← Retour</Link>
        </div>
        <Link 
          href="/lots/nouveau" 
          className="mt-4 inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          + Nouveau lot d'export
        </Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Code lot</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Produit</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Collectes</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Poids total</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Statut</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots?.map((lot) => {
              const nbCollectes = collectesParLot?.[lot.id] || 0
              
              return (
                <tr key={lot.id} className="border-t border-gray-700 hover:bg-[#34495e] transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/lots/${lot.id}`} 
                      className="text-primary hover:underline font-mono font-bold text-sm"
                    >
                      {lot.code_lot}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text text-sm">{lot.produit}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                      {nbCollectes}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-primary font-bold text-sm">
                    {parseFloat(lot.poids_total_kg).toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      lot.statut === 'Exporté' ? 'bg-green-500/20 text-green-400' :
                      lot.statut === 'Prêt' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {lot.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link 
                        href={`/lots/${lot.id}`}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
                      >
                        Voir
                      </Link>
                      <Link 
                        href={`/lots/${lot.id}/edit`}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30"
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