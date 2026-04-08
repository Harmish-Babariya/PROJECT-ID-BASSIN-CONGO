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
  
  // Construire query avec filtres
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
  
  // Récupérer zones et producteurs pour filtres
  const { data: zones } = await supabaseAdmin.from("zones").select("*").order("nom")
  const { data: producteurs } = await supabaseAdmin
    .from("producteurs")
    .select("id, code_producteur, nom")
    .order("code_producteur")

  const producteursMap = new Map(producteurs?.map(p => [p.id, p]))

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">Parcelles</h1>
          <Link href="/dashboard" className="text-primary hover:underline">← Retour</Link>
        </div>
        
        <div className="mt-4 flex gap-3">
          <Link 
            href="/parcelles/nouveau" 
            className="inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            + Nouvelle parcelle
          </Link>
          <ExportButton data={parcelles || []} />
        </div>
      </div>

      <FiltresBar zones={zones} producteurs={producteurs} />
      
      <div className="bg-[#1e272e] rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Code</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Producteur</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Surface (ha)</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Date création</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Statut EUDR</th>
            </tr>
          </thead>
          <tbody>
            {parcelles?.map((p) => {
              const producteur = producteursMap.get(p.producteur_id)
              return (
                <tr key={p.id} className="border-t border-gray-700 hover:bg-[#34495e] cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${p.id}`} className="font-mono text-sm text-primary hover:underline">
                      {p.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text">
                    {producteur ? `${producteur.code_producteur} - ${producteur.nom}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-text">{p.surface_ha || '-'}</td>
                  <td className="px-6 py-4 text-text">
                    {p.date_creation ? new Date(p.date_creation).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      p.status_eudr === 'CONFORME' ? 'bg-primary/20 text-primary' :
                      p.status_eudr === 'RISQUE NON NÉGLIGEABLE' ? 'bg-yellow-500/20 text-yellow-400' :
                      p.status_eudr === 'NON CONFORME' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {p.status_eudr || 'Non vérifié'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <p className="text-text/70 text-sm mt-4">
        {parcelles?.length || 0} parcelle(s) trouvée(s)
      </p>
    </div>
  )
}