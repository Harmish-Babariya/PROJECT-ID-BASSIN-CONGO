import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import FiltresBar from "./FiltresBar"
import ExportButton from "./ExportButton"

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
  
  // Query avec filtres
  let query = supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom)")
  
  if (params.recherche) {
    query = query.or(`code_producteur.ilike.%${params.recherche}%,nom.ilike.%${params.recherche}%`)
  }
  if (params.zone_id) {
    query = query.eq('zone_id', parseInt(params.zone_id))
  }
  if (params.sexe) {
    query = query.eq('sexe', params.sexe)
  }
  if (params.statut) {
    query = query.eq('statut', params.statut)
  }
  
  const { data: producteurs } = await query.order("code_producteur")

  // Ajouter compteur parcelles + filtrer si demandé
  let producteursAvecParcelles = await Promise.all(
    (producteurs || []).map(async (p) => {
      const { count } = await supabaseAdmin
        .from("parcelles")
        .select("*", { count: 'exact', head: true })
        .eq("producteur_id", p.id)
      return { ...p, nombre_parcelles: count || 0 }
    })
  )

  // Filtre avec/sans parcelles
  if (params.avec_parcelles === 'oui') {
    producteursAvecParcelles = producteursAvecParcelles.filter(p => p.nombre_parcelles > 0)
  } else if (params.avec_parcelles === 'non') {
    producteursAvecParcelles = producteursAvecParcelles.filter(p => p.nombre_parcelles === 0)
  }

  const { data: zones } = await supabaseAdmin.from("zones").select("*").order("nom")

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">Producteurs</h1>
          <Link href="/" className="text-primary hover:underline">← Retour</Link>
        </div>
        
        <div className="mt-4 flex gap-3">
          <Link 
            href="/producteurs/nouveau" 
            className="inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            + Nouveau producteur
          </Link>
          <ExportButton data={producteursAvecParcelles} />
        </div>
      </div>

      <FiltresBar zones={zones} />

      <div className="bg-[#1e272e] rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Code</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Nom</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Zone</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Village</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Parcelles</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {producteursAvecParcelles?.map((p) => (
              <tr key={p.id} className="border-t border-gray-700 hover:bg-[#34495e]">
                <td className="px-6 py-4">
                  <Link href={`/producteurs/${p.id}`} className="font-mono text-sm text-primary hover:underline">
                    {p.code_producteur}
                  </Link>
                </td>
                <td className="px-6 py-4 text-text">{p.nom} {p.prenom}</td>
                <td className="px-6 py-4 text-text">{p.zones?.nom}</td>
                <td className="px-6 py-4 text-text">{p.village}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    p.nombre_parcelles > 0 ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {p.nombre_parcelles} parcelle{p.nombre_parcelles !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 text-sm">
                    <Link href={`/producteurs/${p.id}`} className="text-primary hover:underline">
                      Voir
                    </Link>
                    <Link href={`/producteurs/${p.id}/edit`} className="text-primary hover:underline">
                      Modifier
                    </Link>
                    <Link href={`/parcelles/nouveau?producteur_id=${p.id}`} className="text-green-400 hover:underline">
                      + Parcelle
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-text/70 text-sm mt-4">
        {producteursAvecParcelles.length} producteur(s) trouvé(s)
      </p>
    </div>
  )
}