import Link from "next/link"
import { getCollectes, getCollecteLotMap } from "@/lib/services/collectes"

export default async function CollectesPage() {
  const [collectes, lotCollectes] = await Promise.all([
    getCollectes(),
    getCollecteLotMap(),
  ])

  const collecteLotsMap = new Map(
    lotCollectes.map(lc => [lc.collecte_id, lc.lots?.[0]])
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / COLLECTES
        </p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Collectes</h1>
          <Link
            href="/collectes/nouveau"
            className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
          >
            + Nouvelle collecte
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Date</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Producteur</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Parcelle</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Poids net</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Qualite</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Statut</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collectes.map((c) => {
              const dateCollecte = new Date(c.date_collecte)
              if (isNaN(dateCollecte.getTime())) return null
              const lotAssigne = collecteLotsMap.get(c.id)

              return (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {dateCollecte.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {c.producteurs ? (
                      <Link href={`/producteurs/${c.producteurs.id}`} className="text-[#2ac1a3] hover:underline">
                        {c.producteurs.nom} {c.producteurs.prenom}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {c.parcelles ? (
                      <Link href={`/parcelles/${c.parcelles.id}`} className="text-[#2ac1a3] hover:underline font-mono text-xs">
                        {c.parcelles.code_parcelle}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                    {c.poids_net_kg ? parseFloat(c.poids_net_kg).toFixed(2) + ' kg' : '-'}
                  </td>
                  <td className="px-5 py-4">
                    {c.qualite ? (
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        c.qualite === 'Grade 1' ? 'bg-green-100 text-green-700' :
                        c.qualite === 'Grade 2' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {c.qualite}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4">
                    {lotAssigne ? (
                      <Link
                        href={`/lots/${lotAssigne.id}`}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      >
                        {lotAssigne.code_lot}
                      </Link>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3 text-sm">
                      <Link href={`/collectes/${c.id}`} className="text-[#2ac1a3] hover:underline">Voir</Link>
                      <Link href={`/collectes/${c.id}/edit`} className="text-gray-500 hover:underline">Modifier</Link>
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
