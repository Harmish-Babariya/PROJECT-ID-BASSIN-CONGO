import CollectesContent from "./CollectesContent"
import { getCollectes, getCollecteLotMap } from "@/lib/services/collectes"

export default async function CollectesPage() {
  const [collectes, lotCollectes] = await Promise.all([
    getCollectes(),
    getCollecteLotMap(),
  ])

  const collecteLotsMap = new Map(
    lotCollectes.map(lc => [lc.collecte_id, lc.lots?.[0]])
  )

  return <CollectesContent collectes={collectes} collecteLotsMap={collecteLotsMap} />
}
