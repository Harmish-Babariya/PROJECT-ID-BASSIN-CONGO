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

  /* ================= PRODUCTEURS ================= */
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

  /* ================= LOTS ================= */
  const totalLots = lots?.length || 0
  const lotsExportes = lots?.filter(l => l.statut === "Exporté").length || 0
  const poidsTotalLots =
    lots?.reduce((s, l) => s + (Number(l.poids_total_kg) || 0), 0) || 0

  /* ================= COLLECTES ================= */
  const totalCollectes = collectes?.length || 0
  const poidsCollectes =
    collectes?.reduce((s, c) => s + (Number(c.poids_net_kg) || 0), 0) || 0

  return {
    producteurs: {
      total: totalProducteurs,
      pourcentageFemmes,
      ageMoyen,
      parcellesTotal: totalParcelles,
      superficieTotale,
      pourcentageConformite,
      conformes,
    },
    lots: {
      total: totalLots,
      exportes: lotsExportes,
      poidsTotal: poidsTotalLots,
    },
    collectes: {
      total: totalCollectes,
      poids: poidsCollectes,
    },
  }
}

export default async function Dashboard() {
  const stats = await getStats()

  const { data: parcelles } = await supabaseAdmin
    .from("parcelles")
    .select("*, producteurs(code_producteur, nom)")
    .order("code_parcelle")

  const parcellesAvecCoords =
    parcelles?.filter(p => p.latitude && p.longitude) || []

  return (
    <div className="min-h-screen p-8 bg-background space-y-16">
      <h1 className="text-4xl font-bold text-text">
        ID Bassin Congo — Tableau de bord
      </h1>

      {/* ================= PRODUCTEURS ================= */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-text">👥 Producteurs</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Link
            href="/producteurs"
            className="bg-[#1e272e] rounded-xl border border-white/5 p-8
                       flex flex-col items-center justify-center
                       hover:shadow-lg transition"
          >
            <p className="text-text/50 text-xs uppercase tracking-wide">
              Total producteurs
            </p>
            <p className="text-5xl font-extrabold text-primary mt-2">
              {stats.producteurs.total}
            </p>
            <p className="text-xs text-text/40 mt-3">Voir détails →</p>
          </Link>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Femmes", value: `${stats.producteurs.pourcentageFemmes}%` },
              { label: "Âge moyen", value: `${stats.producteurs.ageMoyen} ans` },
              { label: "Parcelles totales", value: stats.producteurs.parcellesTotal },
              { label: "Superficie géolocalisée", value: `${stats.producteurs.superficieTotale} ha` },
              {
                label: "Conformité EUDR",
                value: `${stats.producteurs.pourcentageConformite}%`,
                sub: `(${stats.producteurs.conformes}/${stats.producteurs.parcellesTotal})`,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#1e272e] rounded-xl border border-white/5 p-5"
              >
                <p className="text-text/50 text-xs uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {item.value}
                </p>
                {item.sub && (
                  <p className="text-xs text-text/40 mt-1">{item.sub}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CARTE ================= */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">
          🗺️ Parcelles géolocalisées ({parcellesAvecCoords.length})
        </h2>

        <div className="bg-[#1e272e] rounded-xl border border-white/5 p-4">
          <CarteMapbox parcelles={parcellesAvecCoords} />
        </div>
      </section>

      {/* ================= GESTION DES FLUX ================= */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-text">⚙️ Gestion des flux</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ================= COLLECTES ================= */}
          <div className="space-y-4">
            <Link href="/collectes">
              <h3 className="text-2xl font-bold text-text hover:text-primary transition">
                ⚖️ Collectes
              </h3>
            </Link>

            <Link
              href="/collectes"
              className="block rounded-xl p-6 border border-primary/30 bg-primary/5
                         hover:bg-primary/10 hover:shadow-lg transition"
            >
              <p className="text-text/60 text-xs uppercase tracking-wide">
                Total collectes
              </p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-4xl font-bold text-primary">
                  {stats.collectes.total}
                </p>
                <p className="text-xs text-primary/70">Voir détails →</p>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1e272e] rounded-xl border border-white/5 p-5">
                <p className="text-text/50 text-xs uppercase">Poids total</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stats.collectes.poids.toLocaleString()} kg
                </p>
              </div>

              <div className="bg-[#1e272e] rounded-xl border border-white/5 p-5">
                <p className="text-text/50 text-xs uppercase">Poids moyen / collecte</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stats.collectes.total > 0
                    ? Math.round(stats.collectes.poids / stats.collectes.total)
                    : 0} kg
                </p>
              </div>
            </div>
          </div>

          {/* ================= LOTS ================= */}
          <div className="space-y-4">
            <Link href="/lots">
              <h3 className="text-2xl font-bold text-text hover:text-primary transition">
                📦 Lots d&apos;export
              </h3>
            </Link>

            <Link
              href="/lots"
              className="block rounded-xl p-6 border border-primary/30 bg-primary/5
                         hover:bg-primary/10 hover:shadow-lg transition"
            >
              <p className="text-text/60 text-xs uppercase tracking-wide">
                Total lots
              </p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-4xl font-bold text-primary">
                  {stats.lots.total}
                </p>
                <p className="text-xs text-primary/70">Voir détails →</p>
              </div>
            </Link>

            <div className="bg-[#1e272e] rounded-xl border border-white/5 p-5 grid grid-cols-3 gap-6">
              <div>
                <p className="text-text/50 text-xs uppercase">Exportés</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stats.lots.exportes}
                </p>
              </div>

              <div>
                <p className="text-text/50 text-xs uppercase">Poids total</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stats.lots.poidsTotal.toLocaleString()} kg
                </p>
              </div>

              <div>
                <p className="text-text/50 text-xs uppercase">Poids moyen / lot</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stats.lots.total > 0
                    ? Math.round(stats.lots.poidsTotal / stats.lots.total)
                    : 0} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
