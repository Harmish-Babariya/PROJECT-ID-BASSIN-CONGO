import Link from "next/link"
import { notFound } from "next/navigation"
import { getCollecteById, getCollecteLotAssignment } from "@/lib/services/collectes"

export default async function CollecteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const collecte = await getCollecteById(id)
  if (!collecte) notFound()

  const lotAssigne = await getCollecteLotAssignment(id)
  const estAssignee = !!lotAssigne
  const lot = lotAssigne?.lots?.[0]

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Link href="/collectes" className="text-primary hover:underline">&larr; Retour aux collectes</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Collecte #{collecte.id}</h1>
            <p className="text-gray-500">
              {new Date(collecte.date_collecte).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {estAssignee ? (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-100 text-yellow-700">
                Assignee au lot
              </span>
            ) : (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-700">
                Disponible
              </span>
            )}
            <Link
              href={`/collectes/${id}/edit`}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
            >
              Modifier
            </Link>
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Producteur</h2>
          <Link
            href={`/producteurs/${collecte.producteurs?.id}`}
            className="text-primary hover:underline text-lg"
          >
            {collecte.producteurs?.code_producteur} - {collecte.producteurs?.nom} {collecte.producteurs?.prenom}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Poids net</p>
            <p className="text-primary font-bold text-2xl">{collecte.poids_net_kg} kg</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Qualite</p>
            <p className="text-gray-900 font-medium text-lg">{collecte.qualite || '-'}</p>
          </div>
        </div>

        {estAssignee && lot && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-gray-900 font-semibold mb-2">Cette collecte fait partie d&apos;un lot</p>
            <Link
              href={`/lots/${lot.id}`}
              className="text-primary hover:underline"
            >
              {lot.code_lot} - {lot.statut}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
