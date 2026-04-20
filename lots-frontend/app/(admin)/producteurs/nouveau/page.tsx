import NouveauProducteurClient from "./NouveauProducteurClient"
import { getNextProducteurCode } from "@/lib/services/producteurs"
import { getPays, getZones } from "@/lib/services/common"

export default async function NouveauProducteur({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  const [initialCode, pays, zones] = await Promise.all([
    getNextProducteurCode(null, null),
    getPays(),
    getZones(),
  ])

  return (
    <NouveauProducteurClient
      returnTo={params.returnTo}
      initialCode={initialCode}
      pays={pays}
      zones={zones}
    />
  )
}
