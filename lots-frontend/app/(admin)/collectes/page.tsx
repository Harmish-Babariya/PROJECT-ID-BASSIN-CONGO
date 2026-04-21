import { redirect } from "next/navigation"
import CollectesContent from "./CollectesContent"
import { getCollectes, getCollecteLotMap } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"

export default async function CollectesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const isAdmin = user.role === "admin"
  // point_focal with no country assigned sees nothing (-1 matches nothing)
  const scopedPaysId = isAdmin ? null : (user.country_id ?? -1)

  const [collectes, lotCollectes] = await Promise.all([
    getCollectes(scopedPaysId),
    getCollecteLotMap(),
  ])

  const collecteLotsMap = new Map(
    lotCollectes.map(lc => [lc.collecte_id, lc.lots?.[0]])
  )

  return <CollectesContent collectes={collectes} collecteLotsMap={collecteLotsMap} />
}
