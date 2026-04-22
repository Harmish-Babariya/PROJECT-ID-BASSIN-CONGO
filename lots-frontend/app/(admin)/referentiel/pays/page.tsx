import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getPaysAll } from "@/lib/services/referentiel"
import PaysContent from "./PaysContent"

export default async function PaysPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const pays = await getPaysAll()
  return <PaysContent pays={pays} />
}
