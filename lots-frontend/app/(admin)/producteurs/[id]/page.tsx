import Link from "next/link"
import { notFound } from "next/navigation"
import { getProducteurById } from "@/lib/services/producteurs"
import { getParcellesByProducteur } from "@/lib/services/parcelles"

export default async function ProducteurDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const producteur = await getProducteurById(id)
  if (!producteur) notFound()

  const parcelles = await getParcellesByProducteur(id)

  const totalSurface = parcelles.reduce((sum, p) => sum + (parseFloat(p.surface_ha) || 0), 0)
  const parcellesConformes = parcelles.filter(p => p.status_eudr === "CONFORME").length

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Link href="/producteurs" className="text-primary hover:underline mb-4 inline-block">
          &larr; Retour aux producteurs
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {producteur.nom} {producteur.prenom}
            </h1>
            <p className="text-2xl text-gray-500 font-mono">{producteur.code_producteur}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/producteurs/${id}/edit`}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Modifier
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm mb-1">Parcelles</p>
          <p className="text-3xl font-bold text-primary">{parcelles.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm mb-1">Surface totale</p>
          <p className="text-3xl font-bold text-primary">{totalSurface.toFixed(2)} ha</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm mb-1">Conformite EUDR</p>
          <p className="text-3xl font-bold text-primary">
            {parcelles.length > 0
              ? `${((parcellesConformes / parcelles.length) * 100).toFixed(0)}%`
              : '0%'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Informations</h2>
          <div className="space-y-3 text-gray-900">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Sexe</span>
              <span>{producteur.sexe}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Village</span>
              <span>{producteur.village}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Zone</span>
              <span>{producteur.zones?.nom || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Parcelles ({parcelles.length})
          </h2>
          <Link
            href={`/parcelles/nouveau?producteur_id=${id}`}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            + Ajouter une parcelle
          </Link>
        </div>

        {parcelles.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-900 text-sm">Code</th>
                <th className="px-6 py-3 text-left text-gray-900 text-sm">Surface</th>
                <th className="px-6 py-3 text-left text-gray-900 text-sm">Culture</th>
                <th className="px-6 py-3 text-left text-gray-900 text-sm">Statut EUDR</th>
                <th className="px-6 py-3 text-left text-gray-900 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcelles.map((p) => (
                <tr key={p.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${p.id}`} className="text-primary hover:underline font-mono text-sm">
                      {p.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{p.surface_ha} ha</td>
                  <td className="px-6 py-4 text-gray-900">{p.culture}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.status_eudr === 'CONFORME' ? 'bg-primary/20 text-primary' :
                      p.status_eudr === 'RISQUE NON NEGLIGEABLE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.status_eudr || 'Non verifie'}
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
            <p className="text-gray-500 mb-4">Aucune parcelle</p>
            <Link
              href={`/parcelles/nouveau?producteur_id=${id}`}
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Creer la premiere parcelle
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
