import { notFound } from "next/navigation"
import CollecteForm from "./CollecteForm"
import { getCollecteSimple } from "@/lib/services/collectes"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getParcellesForSelect } from "@/lib/services/parcelles"
import { getCurrentUser } from "@/lib/services/auth"

export default async function EditCollecte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const paysId = user?.role !== "admin" ? user?.country_id ?? null : null

  const [collecte, producteurs, parcelles] = await Promise.all([
    getCollecteSimple(id),
    getProducteursForSelect(paysId),
    getParcellesForSelect(paysId),
  ])

  if (!collecte) notFound()

  return <CollecteForm collecte={collecte} producteurs={producteurs} parcelles={parcelles} />
}
