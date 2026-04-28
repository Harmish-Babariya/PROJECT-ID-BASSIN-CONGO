import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getNationalitesAll } from "@/lib/services/referentiel"
import NationalitesContent from "./NationalitesContent"

export default async function NationalitesPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const nationalites = await getNationalitesAll()
  return <NationalitesContent nationalites={nationalites} />
}
