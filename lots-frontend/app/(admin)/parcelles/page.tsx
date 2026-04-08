import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import FiltresBar from "./FiltresBar"
import ExportButton from "./ExportButton"

export default async function ParcellesPage({
  searchParams
}: {
  searchParams: Promise<{
    recherche?: string
    zone_id?: string
    culture?: string
    status_eudr?: string
    producteur_id?: string
  }>
}) {
  const params = await searchParams

  let query = supabaseAdmin
    .from("parcelles")
    .select("*")

  if (params.recherche) {
    query = query.ilike('code_parcelle', `%${params.recherche}%`)
  }
  if (params.zone_id) {
    query = query.eq('zone_id', parseInt(params.zone_id))
  }
  if (params.culture) {
    query = query.eq('culture', params.culture)
  }
  if (params.status_eudr) {
    query = query.eq('status_eudr', params.status_eudr)
  }
  if (params.producteur_id) {
    query = query.eq('producteur_id', parseInt(params.producteur_id))
  }

  const { data: parcelles } = await query.order("code_parcelle")

  const { data: zones } = await supabaseAdmin.from("zones").select("*").order("nom")
  const { data: producteurs } = await supabaseAdmin
    .from("producteurs")
    .select("id, code_producteur, nom")
    .order("code_producteur")

  const producteursMap = new Map(producteurs?.map(p => [p.id, p]))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / PARCELLES
        </p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Parcelles</h1>
          <div className="flex gap-3">
            <ExportButton data={parcelles || []} />
            <Link
              href="/parcelles/nouveau"
              className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
            >
              + Nouvelle parcelle
            </Link>
          </div>
        </div>
      </div>

      <FiltresBar zones={zones} producteurs={producteurs} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Code</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Producteur</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Surface (ha)</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Date creation</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Statut EUDR</th>
            </tr>
          </thead>
          <tbody>
            {parcelles?.map((p) => {
              const producteur = producteursMap.get(p.producteur_id)
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${p.id}`} className="font-mono text-sm text-[#2ac1a3] font-medium hover:underline">
                      {p.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {producteur ? `${producteur.code_producteur} - ${producteur.nom}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{p.surface_ha || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.date_creation ? new Date(p.date_creation).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status_eudr === 'CONFORME' ? 'bg-[#2ac1a3]/10 text-[#2ac1a3]' :
                      p.status_eudr === 'RISQUE NON NÉGLIGEABLE' ? 'bg-yellow-100 text-yellow-700' :
                      p.status_eudr === 'NON CONFORME' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {p.status_eudr || 'Non verifie'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-sm">
        {parcelles?.length || 0} parcelle(s)
      </p>
    </div>
  )
}
