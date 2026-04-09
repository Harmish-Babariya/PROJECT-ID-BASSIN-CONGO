import Link from "next/link"
import { getLots, getAllLotCollectes } from "@/lib/services/lots"

export default async function ExportDDSPage() {
  const [lots, lotCollectes] = await Promise.all([
    getLots(),
    getAllLotCollectes(),
  ])

  const collectesParLot = lotCollectes.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / DDS EXPORT
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          Declaration de Diligence Raisonnee (DDS)
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Generez et telechargez les DDS pour chaque lot conformement au reglement EUDR.
        </p>
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
            {lots.map((lot) => {
              const nbCollectes = collectesParLot[lot.id] || 0
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
                      lot.statut === 'Exporte' ? 'bg-green-100 text-green-700' :
                      lot.statut === 'Pret' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {lot.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 items-center">
                      <a
                        href={`/api/generate-dss/${lot.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                        download
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </a>
                      <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline text-sm">
                        Voir
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {lots.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">Aucun lot disponible</p>
          <Link href="/lots/nouveau" className="text-[#2ac1a3] hover:underline text-sm font-semibold">
            Creer un lot
          </Link>
        </div>
      )}
    </div>
  )
}
