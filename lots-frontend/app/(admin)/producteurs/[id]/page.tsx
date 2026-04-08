import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProducteurDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: producteur } = await supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom, pays(nom)), pays(nom)")
    .eq("id", id)
    .single()

  if (!producteur) notFound()

  const { data: parcelles } = await supabaseAdmin
    .from("parcelles")
    .select("*")
    .eq("producteur_id", id)
    .order("code_parcelle")

  const totalSurface = parcelles?.reduce((sum, p) => sum + (parseFloat(p.surface_ha) || 0), 0) || 0
  const parcellesConformes = parcelles?.filter(p => p.status_eudr === "CONFORME").length || 0

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/producteurs" className="text-primary hover:underline mb-4 inline-block">
          ← Retour aux producteurs
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-text mb-2">
              {producteur.nom} {producteur.prenom}
            </h1>
            <p className="text-2xl text-text/70 font-mono">{producteur.code_producteur}</p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              href={`/producteurs/${id}/edit`}
              className="bg-primary text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              ✏️ Modifier
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1e272e] rounded-lg shadow p-6">
          <p className="text-text/70 text-sm mb-1">Parcelles</p>
          <p className="text-3xl font-bold text-primary">{parcelles?.length || 0}</p>
        </div>
        
        <div className="bg-[#1e272e] rounded-lg shadow p-6">
          <p className="text-text/70 text-sm mb-1">Surface totale</p>
          <p className="text-3xl font-bold text-primary">{totalSurface.toFixed(2)} ha</p>
        </div>
        
        <div className="bg-[#1e272e] rounded-lg shadow p-6">
          <p className="text-text/70 text-sm mb-1">Conformité EUDR</p>
          <p className="text-3xl font-bold text-primary">
            {parcelles && parcelles.length > 0 
              ? `${((parcellesConformes / parcelles.length) * 100).toFixed(0)}%`
              : '0%'
            }
          </p>
        </div>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#1e272e] rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-text mb-4">👤 Informations</h2>
          <div className="space-y-3 text-text">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-text/70">Sexe</span>
              <span>{producteur.sexe}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-text/70">Village</span>
              <span>{producteur.village}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-text/70">Zone</span>
              <span>{producteur.zones?.nom || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PARCELLES */}
      <div className="bg-[#1e272e] rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">
            🌱 Parcelles ({parcelles?.length || 0})
          </h2>
          <Link
            href={`/parcelles/nouveau?producteur_id=${id}`}
            className="bg-primary text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            + Ajouter une parcelle
          </Link>
        </div>

        {parcelles && parcelles.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-[#34495e]">
              <tr>
                <th className="px-6 py-3 text-left text-text text-sm">Code</th>
                <th className="px-6 py-3 text-left text-text text-sm">Surface</th>
                <th className="px-6 py-3 text-left text-text text-sm">Culture</th>
                <th className="px-6 py-3 text-left text-text text-sm">Statut EUDR</th>
                <th className="px-6 py-3 text-left text-text text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcelles.map((p) => (
                <tr key={p.id} className="border-t border-gray-700 hover:bg-[#34495e]">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${p.id}`} className="text-primary hover:underline font-mono text-sm">
                      {p.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text">{p.surface_ha} ha</td>
                  <td className="px-6 py-4 text-text">{p.culture}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.status_eudr === 'CONFORME' ? 'bg-primary/20 text-primary' :
                      p.status_eudr === 'RISQUE NON NÉGLIGEABLE' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {p.status_eudr || 'Non vérifié'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${p.id}/edit`} className="text-primary hover:underline text-sm">
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-text/70 mb-4">Aucune parcelle</p>
            <Link
              href={`/parcelles/nouveau?producteur_id=${id}`}
              className="inline-block bg-primary text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Créer la première parcelle
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}