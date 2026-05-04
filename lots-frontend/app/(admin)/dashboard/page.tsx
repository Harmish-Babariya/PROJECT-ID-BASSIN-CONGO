import DashboardContent from "./DashboardContent"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats, getParcellesForMap } from "@/lib/services/parcelles"
import { getLotsStats, getRecentLots } from "@/lib/services/lots"
import { getCollectesStats, getRecentCollectes } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"

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

async function getStats(paysId: number | null, range: Range) {
  // Producteurs/parcelles stats aren't time-scoped — keep them global (by country only)
  const [producteurs, parcelles, lots, collectes] = await Promise.all([
    getProducteursStats(paysId),
    getParcellesStats(paysId),
    getLotsStats(paysId, range),
    getCollectesStats(paysId, range),
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
  const normalisedStatuses = parcelles.map(p => normalizeEudrStatus(p.status_eudr))
  const conformes = normalisedStatuses.filter(s => s === EUDR_STATUS.CONFORME).length
  const risques = normalisedStatuses.filter(s => s === EUDR_STATUS.RISQUE).length
  const enAttente = normalisedStatuses.filter(s => s === EUDR_STATUS.EN_ATTENTE).length
  // Rows with no status set (null after normalisation) — never verified.
  const nonVerifies = normalisedStatuses.filter(s => s === null).length
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
    parcelles: { total: totalParcelles, conformes, risques, enAttente, nonVerifies, pourcentageConformite, superficieTotale, haParProducteur },
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
  const isAdmin = currentUser?.role === "admin"
  // point_focal without a country sees nothing (-1 matches nothing); admins see everything
  const paysId = isAdmin ? null : (currentUser?.country_id ?? -1)

  const [stats, recentCollectes, recentLots, mapParcelles] = await Promise.all([
    getStats(paysId, range),
    getRecentCollectes(3, paysId, range),
    getRecentLots(3, paysId, range),
    getParcellesForMap(paysId),
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
