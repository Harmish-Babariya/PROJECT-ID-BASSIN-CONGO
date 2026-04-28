import { redirect } from "next/navigation"
import NouveauProducteurClient from "./NouveauProducteurClient"
import { getNextProducteurCode } from "@/lib/services/producteurs"
import { getPays, getZones, getVillages, getNationalites } from "@/lib/services/common"
import { getCurrentUser } from "@/lib/services/auth"

export default async function NouveauProducteur({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const isAdmin = user.role === "admin"

  const [initialCode, pays, zones, villages, nationalites] = await Promise.all([
    getNextProducteurCode(null, null),
    getPays(),
    getZones(),
    getVillages(),
    getNationalites(),
  ])

  // For point_focal: only show their assigned country in the pays list
  const filteredPays = isAdmin
    ? pays
    : pays.filter((p) => p.id === user.country_id)

  return (
    <NouveauProducteurClient
      returnTo={params.returnTo}
      initialCode={initialCode}
      pays={filteredPays}
      zones={zones}
      villages={villages}
      nationalites={nationalites}
      defaultPaysId={isAdmin ? undefined : String(user.country_id ?? "")}
    />
  )
}
