import { supabaseAdmin } from "@/lib/supabase"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ParcelleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: parcelle } = await supabaseAdmin
    .from("parcelles")
    .select("*")
    .eq("id", id)
    .single()

  if (!parcelle) notFound()

  const { data: producteur } = await supabaseAdmin
    .from("producteurs")
    .select("*, zones(nom), pays(nom)")
    .eq("id", parcelle.producteur_id)
    .single()

  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select("*")
    .eq("parcelle_id", id)
    .order("date_collecte", { ascending: false })

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/parcelles" className="text-primary hover:underline">← Retour aux parcelles</Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{parcelle.code_parcelle}</h1>
            <p className="text-text/70">
              Producteur : {producteur?.code_producteur} - {producteur?.nom} {producteur?.prenom}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/parcelles/${id}/edit`} className="bg-primary text-[#2d3436] px-4 py-2 rounded-lg hover:opacity-90">
              Modifier
            </Link>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              parcelle.status_eudr === 'CONFORME' ? 'bg-primary/20 text-primary' :
              parcelle.status_eudr === 'RISQUE NON NÉGLIGEABLE' ? 'bg-yellow-500/20 text-yellow-400' :
              parcelle.status_eudr === 'NON CONFORME' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {parcelle.status_eudr || 'Non vérifié'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-text">
          <div>
            <p className="text-text/70 text-sm mb-1">Surface</p>
            <p className="font-medium">{parcelle.surface_ha ? `${parcelle.surface_ha} ha` : '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Date de création</p>
            <p className="font-medium">
              {parcelle.date_creation ? new Date(parcelle.date_creation).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Culture</p>
            <p className="font-medium">{parcelle.culture || '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Année plantation</p>
            <p className="font-medium">{parcelle.annee_plantation || '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Zone</p>
            <p className="font-medium">{producteur?.zones?.nom || '-'}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Pays</p>
            <p className="font-medium">{producteur?.pays?.nom || '-'}</p>
          </div>
        </div>

        {parcelle.justification_eudr && (
          <div className="mt-6 p-4 bg-background rounded-lg">
            <p className="text-text/70 text-sm mb-2">Justification EUDR</p>
            <p className="text-text text-sm">{parcelle.justification_eudr}</p>
          </div>
        )}
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-text mb-4">Collectes ({collectes?.length || 0})</h2>
        {collectes && collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c) => (
              <div key={c.id} className="bg-[#34495e] p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-text font-medium">
                    {new Date(c.date_collecte).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-text/70 text-sm">{c.produit}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">{c.poids_net_kg} kg</p>
                  <p className="text-text/70 text-sm">{c.nombre_sacs} sacs</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text/70">Aucune collecte enregistrée</p>
        )}
      </div>
    </div>
  )
}