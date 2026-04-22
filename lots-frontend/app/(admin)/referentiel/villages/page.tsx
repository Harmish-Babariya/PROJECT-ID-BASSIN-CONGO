import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getVillagesAll, getZonesAll } from "@/lib/services/referentiel"
import VillagesContent from "./VillagesContent"

export default async function VillagesPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const [villages, zones] = await Promise.all([getVillagesAll(), getZonesAll()])
  return <VillagesContent villages={villages} zones={zones} />
}
