import Link from "next/link"
import { notFound } from "next/navigation"
import { getLotById, getLotCollectes } from "@/lib/services/lots"

function getEudrBadge(status: string | null) {
  switch (status) {
    case 'CONFORME':
      return 'bg-green-100 text-green-700'
    case 'RISQUE NON NEGLIGEABLE':
    case 'alert':
      return 'bg-yellow-100 text-yellow-700'
    case 'NON CONFORME':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lot = await getLotById(id)
  if (!lot) notFound()

  const lotCollectes = await getLotCollectes(id)
  const collectes = lotCollectes.map(lc => lc.collectes).filter(Boolean) as any[]

  // Extract unique producers and parcelles for traceability
  const producteursMap = new Map<string, any>()
  const parcellesMap = new Map<string, any>()

  collectes.forEach((c: any) => {
    if (c.producteurs) {
      producteursMap.set(c.producteurs.code_producteur, c.producteurs)
    }
    if (c.parcelles) {
      parcellesMap.set(c.parcelles.code_parcelle, c.parcelles)
    }
  })

  const uniqueProducteurs = Array.from(producteursMap.values())
  const uniqueParcelles = Array.from(parcellesMap.values())
  const totalSurface = uniqueParcelles.reduce((sum, p) => sum + (parseFloat(p.surface_ha) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Link href="/lots" className="text-primary hover:underline">&larr; Retour aux lots</Link>
      </div>

      {/* Lot Info */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lot.code_lot}</h1>
            <p className="text-gray-500">{lot.produit}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/generate-dss/${id}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              download
            >
              Telecharger DDS
            </a>
            <Link
              href={`/lots/${id}/edit`}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Modifier
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-gray-900">
          <div>
            <p className="text-gray-500 text-sm mb-1">Poids total</p>
            <p className="font-medium text-2xl text-primary">{lot.poids_total_kg} kg</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Statut</p>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              lot.statut === 'Exporte' ? 'bg-green-100 text-green-700' :
              lot.statut === 'Pret' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {lot.statut}
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Destination</p>
            <p className="font-medium">{lot.destination_pays || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Acheteur</p>
            <p className="font-medium">{lot.acheteur || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Date expedition</p>
            <p className="font-medium">
              {lot.date_expedition ? new Date(lot.date_expedition).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Date creation</p>
            <p className="font-medium">
              {lot.date_creation ? new Date(lot.date_creation).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Traceability Chain */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Tracabilite</h2>

        {/* Visual chain: Parcelles -> Collectes -> Lot */}
        <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium">
            {uniqueParcelles.length} Parcelle(s)
          </span>
          <span>&rarr;</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded font-medium">
            {collectes.length} Collecte(s)
          </span>
          <span>&rarr;</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">
            1 Lot
          </span>
        </div>

        {/* Linked Producers */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Producteurs lies ({uniqueProducteurs.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uniqueProducteurs.map((p) => (
              <Link
                key={p.code_producteur}
                href={`/producteurs/${p.code_producteur}`}
                className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <p className="text-primary font-mono text-sm">{p.code_producteur}</p>
                <p className="text-gray-900 text-sm">{p.nom} {p.prenom}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Linked Parcelles */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Parcelles liees ({uniqueParcelles.length}) - Surface totale: {totalSurface.toFixed(2)} ha
          </h3>
          <div className="space-y-2">
            {uniqueParcelles.map((p) => (
              <div
                key={p.code_parcelle}
                className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
              >
                <div>
                  <Link href={`/parcelles/${p.code_parcelle}`} className="text-primary hover:underline font-mono text-sm">
                    {p.code_parcelle}
                  </Link>
                  <p className="text-gray-500 text-xs mt-1">
                    Surface: {p.surface_ha || '-'} ha
                    {p.latitude && p.longitude && (
                      <> | Coords: {parseFloat(p.latitude).toFixed(4)}, {parseFloat(p.longitude).toFixed(4)}</>
                    )}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getEudrBadge(p.status_eudr)}`}>
                  {p.status_eudr || 'Non verifie'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collectes Detail */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Collectes ({collectes.length})
        </h2>
        {collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c: any) => (
              <div key={c.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-gray-900 font-medium">
                    {c.producteurs?.code_producteur} - {c.producteurs?.nom} {c.producteurs?.prenom}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Parcelle: {c.parcelles?.code_parcelle} | {new Date(c.date_collecte).toLocaleDateString('fr-FR')}
                  </p>
                  {c.qualite && (
                    <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      {c.qualite}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold text-xl">{c.poids_net_kg} kg</p>
                  {c.nombre_sacs && (
                    <p className="text-gray-500 text-sm">{c.nombre_sacs} sacs</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Aucune collecte associee a ce lot</p>
            <Link
              href={`/lots/${id}/edit`}
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Ajouter des collectes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
