import DashboardContent from "./DashboardContent"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats, getParcellesForMap } from "@/lib/services/parcelles"
import { getLotsStats, getRecentLots } from "@/lib/services/lots"
import { getCollectesStats, getRecentCollectes } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { buildScope, type DataScope } from "@/lib/services/scope"
import { eudrBucket, normalizeEudrStatus, EUDR_STATUS } from "@/lib/eudr"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PeriodKey = "month" | "campaign" | "all"

function resolvePeriodRange(period: PeriodKey): { from: string | null; to: string | null } {
  const now = new Date()
  if (period === "all") return { from: null, to: null }
  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }
  // "campaign" = current calendar year
  const from = new Date(now.getFullYear(), 0, 1)
  const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

type Range = { from: string | null; to: string | null }

async function getStats(scope: DataScope, range: Range) {
  // Producteurs/parcelles stats aren't time-scoped — keep them global (by scope only)
  const [producteurs, parcelles, lots, collectes] = await Promise.all([
    getProducteursStats(scope),
    getParcellesStats(scope),
    getLotsStats(scope, range),
    getCollectesStats(scope, range),
  ])

  const totalProducteurs = producteurs.length
  const femmes = producteurs.filter(p => p.sexe === "Femme").length
  const pourcentageFemmes =
    totalProducteurs > 0 ? ((femmes / totalProducteurs) * 100).toFixed(1) : "0"

  const anneeActuelle = new Date().getFullYear()
  const ages = producteurs
    .filter(p => p.annee_naissance)
    .map(p => anneeActuelle - Number(p.annee_naissance))
  const ageMoyen =
    ages.length > 0
      ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(0)
      : "0"
  const ageMin = ages.length > 0 ? Math.min(...ages) : 0
  const ageMax = ages.length > 0 ? Math.max(...ages) : 0

  const totalParcelles = parcelles.length
  // 4 displayed statuses, 3 logical buckets. Dashboard chips show all four
  // so admins can distinguish deforestation alerts from protected-area
  // alerts at a glance.
  const norms = parcelles.map(p => normalizeEudrStatus(p.status_eudr))
  const conformes = norms.filter(s => s === EUDR_STATUS.CONFORME).length
  const nonConformes = norms.filter(s => s === EUDR_STATUS.NON_CONFORME).length
  const risques = norms.filter(s => s === EUDR_STATUS.RISQUE).length
  const enAttente = parcelles.filter(p => eudrBucket(p.status_eudr) === "pending_review").length
  // Legacy field kept at 0 for back-compat — null status now folds into enAttente.
  const nonVerifies = 0
  const pourcentageConformite =
    totalParcelles > 0 ? Math.round((conformes / totalParcelles) * 100) : 0
  const superficieTotale =
    parcelles.reduce((s, p) => s + (Number(p.surface_ha) || 0), 0)
  const haParProducteur =
    totalProducteurs > 0 ? (superficieTotale / totalProducteurs).toFixed(1) : "0"

  const totalLots = lots.length
  const lotsExportes = lots.filter(l => l.statut === "Exporte").length
  const poidsTotalLots = lots.reduce((s, l) => s + (Number(l.poids_total_kg) || 0), 0)
  const poidsMoyenLot = totalLots > 0 ? Math.round(poidsTotalLots / totalLots) : 0

  const totalCollectes = collectes.length
  const poidsCollectes = collectes.reduce((s, c) => s + (Number(c.poids_net_kg) || 0), 0)
  const poidsMoyenCollecte = totalCollectes > 0 ? Math.round(poidsCollectes / totalCollectes) : 0

  return {
    producteurs: { total: totalProducteurs, femmes, pourcentageFemmes, ageMoyen, ageMin, ageMax },
    parcelles: { total: totalParcelles, conformes, nonConformes, risques, enAttente, nonVerifies, pourcentageConformite, superficieTotale, haParProducteur },
    lots: { total: totalLots, exportes: lotsExportes, poidsTotal: poidsTotalLots, poidsMoyen: poidsMoyenLot },
    collectes: { total: totalCollectes, poids: poidsCollectes, poidsMoyen: poidsMoyenCollecte },
  }
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const period: PeriodKey =
    periodParam === "month" || periodParam === "all" ? periodParam : "campaign"
  const range = resolvePeriodRange(period)

  const currentUser = await getCurrentUser()
  // null = admin (everything); else scoped to focal point's countries + own records
  const scope = buildScope(currentUser)

  const [stats, recentCollectes, recentLots, mapParcelles] = await Promise.all([
    getStats(scope, range),
    getRecentCollectes(3, scope, range),
    getRecentLots(3, scope, range),
    getParcellesForMap(scope),
  ])

  return (
    <DashboardContent
      stats={stats}
      recentCollectes={recentCollectes}
      recentLots={recentLots}
      userName={currentUser?.nom_complet ?? currentUser?.email ?? ""}
      mapParcelles={mapParcelles}
    />
  )
}
