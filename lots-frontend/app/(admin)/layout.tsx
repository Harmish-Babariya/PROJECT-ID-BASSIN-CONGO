import AdminLayout from "@/components/AdminLayout"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats } from "@/lib/services/parcelles"
import { getLotsStats } from "@/lib/services/lots"
import { getCollectesStats } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope } from "@/lib/services/scope"

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // null = admin (sees all); otherwise scoped to the focal point's
  // countries + the records they personally registered (Issue #1).
  const scope = buildScope(user)

  const [producteurs, parcelles, lots, collectes] = await Promise.all([
    getProducteursStats(scope),
    getParcellesStats(scope),
    getLotsStats(scope),
    getCollectesStats(scope),
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
