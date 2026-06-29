import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getDataSourcesAll } from "@/lib/services/referentiel"
import SourcesContent from "./SourcesContent"

export default async function SourcesPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const rows = await getDataSourcesAll()
  return <SourcesContent rows={rows} />
}
