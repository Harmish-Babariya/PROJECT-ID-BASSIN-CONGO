import AdminLayout from "@/components/AdminLayout"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats } from "@/lib/services/parcelles"
import { getLotsStats } from "@/lib/services/lots"
import { getCollectesStats } from "@/lib/services/collectes"

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const [producteurs, parcelles, lots, collectes] = await Promise.all([
    getProducteursStats(),
    getParcellesStats(),
    getLotsStats(),
    getCollectesStats(),
  ])

  const counts = {
    producteurs: producteurs.length,
    parcelles: parcelles.length,
    lots: lots.length,
    collectes: collectes.length,
  }

  return <AdminLayout counts={counts}>{children}</AdminLayout>
}
