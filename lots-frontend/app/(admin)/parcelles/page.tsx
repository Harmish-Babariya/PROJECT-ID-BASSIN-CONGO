import ParcellesContent from "./ParcellesContent"
import { getParcelles } from "@/lib/services/parcelles"
import { getProducteursForSelect } from "@/lib/services/producteurs"

export default async function ParcellesPage({
  searchParams,
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
  const [parcelles, producteurs] = await Promise.all([
    getParcelles(params),
    getProducteursForSelect(),
  ])

  const producteursMap = new Map(producteurs.map(p => [p.id, p]))

  return (
    <ParcellesContent
      parcelles={parcelles}
      producteursMap={producteursMap}
      exportButton={null}
    />
  )
}
