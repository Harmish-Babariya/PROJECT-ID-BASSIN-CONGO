import Link from "next/link"
import { notFound } from "next/navigation"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteurById } from "@/lib/services/producteurs"
import { getCollectesByParcelle } from "@/lib/services/collectes"

export default async function ParcelleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const parcelle = await getParcelleById(id)
  if (!parcelle) notFound()

  const [producteur, collectes] = await Promise.all([
    getProducteurById(String(parcelle.producteur_id)),
    getCollectesByParcelle(id),
  ])

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Link href="/parcelles" className="text-primary hover:underline">&larr; Retour aux parcelles</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{parcelle.code_parcelle}</h1>
            <p className="text-gray-500">
              Producteur : {producteur?.code_producteur} - {producteur?.nom} {producteur?.prenom}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/parcelles/${id}/edit`} className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
              Modifier
            </Link>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              parcelle.status_eudr === 'CONFORME' ? 'bg-primary/20 text-primary' :
              parcelle.status_eudr === 'RISQUE NON NEGLIGEABLE' ? 'bg-yellow-100 text-yellow-700' :
              parcelle.status_eudr === 'NON CONFORME' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {parcelle.status_eudr || 'Non verifie'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-gray-900">
          <div>
            <p className="text-gray-500 text-sm mb-1">Surface</p>
            <p className="font-medium">{parcelle.surface_ha ? `${parcelle.surface_ha} ha` : '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Date de creation</p>
            <p className="font-medium">
              {parcelle.date_creation ? new Date(parcelle.date_creation).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Culture</p>
            <p className="font-medium">{parcelle.culture || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Annee plantation</p>
            <p className="font-medium">{parcelle.annee_plantation || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Zone</p>
            <p className="font-medium">{producteur?.zones?.nom || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Pays</p>
            <p className="font-medium">{producteur?.pays?.nom || '-'}</p>
          </div>
        </div>

        {parcelle.justification_eudr && (
          <div className="mt-6 p-4 bg-white rounded-lg">
            <p className="text-gray-500 text-sm mb-2">Justification EUDR</p>
            <p className="text-gray-900 text-sm">{parcelle.justification_eudr}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Collectes ({collectes.length})</h2>
        {collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c) => (
              <div key={c.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-gray-900 font-medium">
                    {new Date(c.date_collecte).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-gray-500 text-sm">{c.produit}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">{c.poids_net_kg} kg</p>
                  <p className="text-gray-500 text-sm">{c.nombre_sacs} sacs</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucune collecte enregistree</p>
        )}
      </div>
    </div>
  )
}
