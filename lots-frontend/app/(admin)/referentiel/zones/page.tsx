import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getZonesAll } from "@/lib/services/referentiel"
import { getPaysAll } from "@/lib/services/referentiel"
import ZonesContent from "./ZonesContent"

export default async function ZonesPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const [zones, pays] = await Promise.all([getZonesAll(), getPaysAll()])
  return <ZonesContent zones={zones} pays={pays} />
}
