import AdminLayout from "@/components/AdminLayout"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats } from "@/lib/services/parcelles"
import { getLotsStats } from "@/lib/services/lots"
import { getCollectesStats } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const [producteurs, parcelles, lots, collectes, user] = await Promise.all([
    getProducteursStats(),
    getParcellesStats(),
    getLotsStats(),
    getCollectesStats(),
    getCurrentUser(),
  ])

  const counts = {
    producteurs: producteurs.length,
    parcelles: parcelles.length,
    lots: lots.length,
    collectes: collectes.length,
  }

  const role = user?.role ?? "point_focal"
  const userName = user?.nom_complet ?? user?.email ?? ""

  return <AdminLayout counts={counts} role={role} userName={userName}>{children}</AdminLayout>
}
