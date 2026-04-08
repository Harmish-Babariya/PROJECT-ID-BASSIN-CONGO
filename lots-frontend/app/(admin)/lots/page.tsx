import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"

export default async function LotsPage() {
  const { data: lots } = await supabaseAdmin
    .from("lots")
    .select(`*, zones (nom), pays (nom)`)
    .order("date_creation", { ascending: false })

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id")

  const collectesParLot = lotCollectes?.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / LOTS
        </p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lots d&apos;export</h1>
          <Link
            href="/lots/nouveau"
            className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
          >
            + Nouveau lot
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Code lot</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Collectes</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Poids total</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots?.map((lot) => {
              const nbCollectes = collectesParLot?.[lot.id] || 0
              return (
                <tr key={lot.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline font-mono font-medium text-sm">
                      {lot.code_lot}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lot.produit}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#2ac1a3]/10 text-[#2ac1a3] rounded-full text-xs font-semibold">
                      {nbCollectes}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {parseFloat(lot.poids_total_kg).toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      lot.statut === 'Exporté' ? 'bg-green-100 text-green-700' :
                      lot.statut === 'Prêt' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {lot.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-sm">
                      <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline">Voir</Link>
                      <Link href={`/lots/${lot.id}/edit`} className="text-gray-500 hover:underline">Modifier</Link>
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
