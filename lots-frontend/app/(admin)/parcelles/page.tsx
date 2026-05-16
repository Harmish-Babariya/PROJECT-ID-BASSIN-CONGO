import { redirect } from "next/navigation"
import ParcellesContent from "./ParcellesContent"
import { getParcelles } from "@/lib/services/parcelles"
import { getProducteursForSelect } from "@/lib/services/producteurs"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope } from "@/lib/services/scope"

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
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const scope = buildScope(user)

  const [parcelles, producteurs] = await Promise.all([
    getParcelles({
      ...params,
      scope,
    }),
    getProducteursForSelect(scope),
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
