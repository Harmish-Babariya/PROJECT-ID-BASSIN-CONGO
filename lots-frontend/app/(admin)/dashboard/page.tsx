import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import CarteMapbox from "./CarteMapbox"

async function getStats() {
  const [
    { data: producteurs },
    { data: parcelles },
    { data: lots },
    { data: collectes },
  ] = await Promise.all([
    supabaseAdmin.from("producteurs").select("id, sexe, annee_naissance"),
    supabaseAdmin.from("parcelles").select("id, producteur_id, status_eudr, surface_ha"),
    supabaseAdmin.from("lots").select("id, statut, poids_total_kg"),
    supabaseAdmin.from("collectes").select("id, poids_net_kg"),
  ])

  const totalProducteurs = producteurs?.length || 0
  const femmes = producteurs?.filter(p => p.sexe === "Femme").length || 0
  const pourcentageFemmes =
    totalProducteurs > 0 ? ((femmes / totalProducteurs) * 100).toFixed(1) : 0

  const anneeActuelle = new Date().getFullYear()
  const ages =
    producteurs
      ?.filter(p => p.annee_naissance)
      .map(p => anneeActuelle - Number(p.annee_naissance)) || []
  const ageMoyen =
    ages.length > 0
      ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(0)
      : 0

  const totalParcelles = parcelles?.length || 0
  const conformes = parcelles?.filter(p => p.status_eudr === "CONFORME").length || 0
  const pourcentageConformite =
    totalParcelles > 0 ? ((conformes / totalParcelles) * 100).toFixed(0) : 0
  const superficieTotale =
    parcelles?.reduce((s, p) => s + (Number(p.surface_ha) || 0), 0).toFixed(2) || 0

  const totalLots = lots?.length || 0
  const lotsExportes = lots?.filter(l => l.statut === "Exporté").length || 0
  const poidsTotalLots =
    lots?.reduce((s, l) => s + (Number(l.poids_total_kg) || 0), 0) || 0

  const totalCollectes = collectes?.length || 0
  const poidsCollectes =
    collectes?.reduce((s, c) => s + (Number(c.poids_net_kg) || 0), 0) || 0

  return {
    producteurs: { total: totalProducteurs, pourcentageFemmes, ageMoyen, parcellesTotal: totalParcelles, superficieTotale, pourcentageConformite, conformes },
    lots: { total: totalLots, exportes: lotsExportes, poidsTotal: poidsTotalLots },
    collectes: { total: totalCollectes, poids: poidsCollectes },
  }
}

export default async function Dashboard() {
  const stats = await getStats()

  const { data: parcelles } = await supabaseAdmin
    .from("parcelles")
    .select("*, producteurs(code_producteur, nom)")
    .order("code_parcelle")

  const parcellesAvecCoords = parcelles?.filter(p => p.latitude && p.longitude) || []

  const statCards = [
    { label: "PRODUCTEURS", value: stats.producteurs.total, href: "/producteurs" },
    { label: "LOTS GENERES", value: stats.lots.total, href: "/lots" },
    { label: "COLLECTES", value: stats.collectes.total, href: "/collectes" },
    { label: "PARCELLES", value: stats.producteurs.parcellesTotal, href: "/parcelles" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / DASHBOARD
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
          >
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {card.value.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ac1a3]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Producteurs</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Total" value={String(stats.producteurs.total)} />
            <Row label="Femmes" value={`${stats.producteurs.pourcentageFemmes}%`} />
            <Row label="Age moyen" value={`${stats.producteurs.ageMoyen} ans`} />
            <Row label="Parcelles" value={String(stats.producteurs.parcellesTotal)} />
            <Row label="Superficie" value={`${stats.producteurs.superficieTotale} ha`} />
            <Row label="Conformite EUDR" value={`${stats.producteurs.pourcentageConformite}%`} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ac1a3]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Flux</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Collectes" value={String(stats.collectes.total)} />
            <Row label="Poids collectes" value={`${stats.collectes.poids.toLocaleString()} kg`} />
            <Row label="Lots" value={String(stats.lots.total)} />
            <Row label="Lots exportes" value={String(stats.lots.exportes)} />
            <Row label="Poids total lots" value={`${stats.lots.poidsTotal.toLocaleString()} kg`} />
            <Row
              label="Poids moyen / lot"
              value={`${stats.lots.total > 0 ? Math.round(stats.lots.poidsTotal / stats.lots.total) : 0} kg`}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Parcelles geolocalisees ({parcellesAvecCoords.length})
        </h2>
        <CarteMapbox parcelles={parcellesAvecCoords} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}
