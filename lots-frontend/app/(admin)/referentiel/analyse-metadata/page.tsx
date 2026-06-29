import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { getAnalysisMetadataAll } from "@/lib/services/referentiel"
import MetadataContent from "./MetadataContent"

export default async function AnalyseMetadataPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const rows = await getAnalysisMetadataAll()
  return <MetadataContent rows={rows} />
}
