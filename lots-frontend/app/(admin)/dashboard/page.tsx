import DashboardContent from "./DashboardContent"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getParcellesStats } from "@/lib/services/parcelles"
import { getLotsStats, getRecentLots } from "@/lib/services/lots"
import { getCollectesStats, getRecentCollectes } from "@/lib/services/collectes"
import { getCurrentUser } from "@/lib/services/auth"

async function getStats() {
  const [producteurs, parcelles, lots, collectes] = await Promise.all([
    getProducteursStats(),
    getParcellesStats(),
    getLotsStats(),
    getCollectesStats(),
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
  const conformes = parcelles.filter(p => p.status_eudr === "CONFORME").length
  const nonConformes = parcelles.filter(p => p.status_eudr === "NON CONFORME").length
  const aTraiter = totalParcelles - conformes - nonConformes
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
    parcelles: { total: totalParcelles, conformes, nonConformes, aTraiter, pourcentageConformite, superficieTotale, haParProducteur },
    lots: { total: totalLots, exportes: lotsExportes, poidsTotal: poidsTotalLots, poidsMoyen: poidsMoyenLot },
    collectes: { total: totalCollectes, poids: poidsCollectes, poidsMoyen: poidsMoyenCollecte },
  }
}

export default async function Dashboard() {
  const [stats, recentCollectes, recentLots, currentUser] = await Promise.all([
    getStats(),
    getRecentCollectes(3),
    getRecentLots(3),
    getCurrentUser(),
  ])

  return (
    <DashboardContent
      stats={stats}
      recentCollectes={recentCollectes}
      recentLots={recentLots}
      userName={currentUser?.nom_complet ?? currentUser?.email ?? ""}
    />
  )
}
