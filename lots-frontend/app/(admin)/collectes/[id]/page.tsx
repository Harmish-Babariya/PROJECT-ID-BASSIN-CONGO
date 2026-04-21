import { notFound } from "next/navigation"
import { getCollecteById, getCollecteLotAssignment } from "@/lib/services/collectes"
import CollecteDetailClient from "./CollecteDetailClient"

export default async function CollecteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const collecte = await getCollecteById(id)
  if (!collecte) notFound()

  const lotAssigne = await getCollecteLotAssignment(id)
  const estAssignee = !!lotAssigne
  const lot = lotAssigne?.lots?.[0] as { id: number; code_lot: string; statut: string } | undefined

  return (
    <CollecteDetailClient
      collecte={collecte}
      estAssignee={estAssignee}
      lot={lot}
    />
  )
}
