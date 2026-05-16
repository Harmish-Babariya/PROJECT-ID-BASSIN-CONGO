import { redirect } from "next/navigation"
import CollectesContent from "./CollectesContent"
import { getCollectes, getCollecteLotMap } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope } from "@/lib/services/scope"

export default async function CollectesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const scope = buildScope(user)

  const [collectes, lotCollectes] = await Promise.all([
    getCollectes(scope),
    getCollecteLotMap(),
  ])

  const collecteLotsMap = new Map(
    lotCollectes.map(lc => [lc.collecte_id, lc.lots?.[0]])
  )

  return <CollectesContent collectes={collectes} collecteLotsMap={collecteLotsMap} />
}
