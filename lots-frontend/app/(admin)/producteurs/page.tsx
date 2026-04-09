import Link from "next/link"
import FiltresBar from "./FiltresBar"
import ExportButton from "./ExportButton"
import { getProducteurs } from "@/lib/services/producteurs"
import { getZones } from "@/lib/services/common"

export default async function ProducteursPage({
  searchParams
}: {
  searchParams: Promise<{
    recherche?: string
    zone_id?: string
    sexe?: string
    statut?: string
    avec_parcelles?: string
  }>
}) {
  const params = await searchParams
  const producteursAvecParcelles = await getProducteurs(params)
  const zones = await getZones()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / PRODUCTEURS
        </p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Producteurs</h1>
          <div className="flex gap-3">
            <ExportButton data={producteursAvecParcelles} />
            <Link
              href="/producteurs/nouveau"
              className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
            >
              + Nouveau producteur
            </Link>
          </div>
        </div>
      </div>

      <FiltresBar zones={zones} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Code</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Zone</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Village</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Parcelles</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {producteursAvecParcelles?.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link href={`/producteurs/${p.id}`} className="font-mono text-sm text-[#2ac1a3] font-medium hover:underline">
                    {p.code_producteur}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{p.nom} {p.prenom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.zones?.nom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.village}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    p.nombre_parcelles > 0 ? 'bg-[#2ac1a3]/10 text-[#2ac1a3]' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {p.nombre_parcelles}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/producteurs/${p.id}`} className="text-[#2ac1a3] hover:underline">Voir</Link>
                    <Link href={`/producteurs/${p.id}/edit`} className="text-gray-500 hover:underline">Modifier</Link>
                    <Link href={`/parcelles/nouveau?producteur_id=${p.id}`} className="text-gray-500 hover:underline">+ Parcelle</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-sm">
        {producteursAvecParcelles.length} producteur(s)
      </p>
    </div>
  )
}
