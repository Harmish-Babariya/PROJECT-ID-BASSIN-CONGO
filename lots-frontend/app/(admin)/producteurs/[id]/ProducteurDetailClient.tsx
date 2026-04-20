"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useLanguage } from "@/contexts/LanguageContext"

const CarteMapbox = dynamic(() => import("@/app/(admin)/dashboard/CarteMapbox"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1A1A1A] rounded-xl flex items-center justify-center min-h-[240px]">
      <p className="text-white/40 text-[12px] tracking-widest uppercase">Chargement…</p>
    </div>
  ),
})

type Zone = { nom: string } | null
type Pays = { nom: string } | null

type Producteur = {
  id: number
  code_producteur: string
  nom: string | null
  prenom: string | null
  sexe: string | null
  annee_naissance: number | null
  nationalite: string | null
  communaute: string | null
  village: string | null
  telephone: string | null
  statut: string | null
  role_activite_cacao: string | null
  type_proprietaire: string | null
  structure_embauche: string | null
  source_principale_revenus: string | null
  place_cacao: string | null
  cultures_phares: string[] | null
  autres_activites: string[] | null
  main_oeuvre_supplementaire: string | null
  recolte_annee_derniere: string | null
  usage_cacao_recolte: string[] | null
  mode_vente: string[] | null
  lieu_vente: string | null
  acheteur: string[] | null
  kilos_vendus: string | number | null
  prix_kilo: string | number | null
  zones: Zone
  pays: Pays
}

type Parcelle = {
  id: number
  code_parcelle: string
  surface_ha: string | number | null
  culture: string | null
  status_eudr: string | null
  latitude?: number | null
  longitude?: number | null
  geojson?: unknown
}

function formatList(values: string[] | null): string {
  if (!values || values.length === 0) return "—"
  return values.join("; ")
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 gap-3">
      <span className="font-numbers text-[13px] sm:text-[14px] text-[#7A8290] shrink-0 max-w-[50%]">{label}</span>
      <span className="font-numbers text-[13px] sm:text-[14px] font-bold text-[#1A1A1A] text-right break-words">{value}</span>
    </div>
  )
}

export default function ProducteurDetailClient({
  producteur,
  parcelles,
}: {
  producteur: Producteur
  parcelles: Parcelle[]
}) {
  const { t } = useLanguage()
  const p = t.producteurs

  const totalSurface = parcelles.reduce(
    (sum, pc) => sum + (parseFloat(String(pc.surface_ha)) || 0),
    0
  )
  const conformesCount = parcelles.filter((pc) => pc.status_eudr === "CONFORME").length
  const nonConformesCount = parcelles.filter(
    (pc) => pc.status_eudr === "NON CONFORME" || pc.status_eudr === "RISQUE NON NEGLIGEABLE"
  ).length
  const conformitePct =
    parcelles.length > 0 ? Math.round((conformesCount / parcelles.length) * 100) : 0

  const displayName = [producteur.nom, producteur.prenom].filter(Boolean).join(" ").trim()

  const infoRows: Array<{ label: string; value: string }> = [
    { label: p.fieldSexe, value: formatValue(producteur.sexe) },
    { label: p.fieldAnneeNaissance, value: formatValue(producteur.annee_naissance) },
    { label: p.fieldNationalite, value: formatValue(producteur.nationalite) },
    { label: p.fieldCommunaute, value: formatValue(producteur.communaute) },
    { label: p.fieldTelephone, value: formatValue(producteur.telephone) },
    { label: p.fieldPays, value: formatValue(producteur.pays?.nom) },
    { label: p.fieldZone, value: formatValue(producteur.zones?.nom) },
    { label: p.fieldVillage, value: formatValue(producteur.village) },
  ]

  const otherRows: Array<{ label: string; value: string }> = [
    { label: p.fieldRole, value: formatValue(producteur.role_activite_cacao) },
    { label: p.fieldTypeProprietaire, value: formatValue(producteur.type_proprietaire) },
    { label: p.fieldSourceRevenus, value: formatValue(producteur.source_principale_revenus) },
    { label: p.fieldPlaceCacao, value: formatValue(producteur.place_cacao) },
    { label: p.fieldCulturesPhares, value: formatList(producteur.cultures_phares) },
    { label: p.fieldAutresActivites, value: formatList(producteur.autres_activites) },
    { label: p.fieldMainOeuvre, value: formatValue(producteur.main_oeuvre_supplementaire) },
    { label: p.fieldRecolte, value: formatValue(producteur.recolte_annee_derniere) },
    { label: p.fieldUsageCacao, value: formatList(producteur.usage_cacao_recolte) },
    { label: p.fieldModeVente, value: formatList(producteur.mode_vente) },
    { label: p.fieldKilos, value: formatValue(producteur.kilos_vendus) },
    { label: p.fieldPrixKiloFcfa, value: formatValue(producteur.prix_kilo) },
    { label: p.fieldLieuVente, value: formatValue(producteur.lieu_vente) },
    { label: p.fieldAcheteur, value: formatList(producteur.acheteur) },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Back + header */}
      <div>
        <Link
          href="/producteurs"
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mb-3 inline-block"
        >
          {p.backToList}
        </Link>
        <h1 className="text-[22px] sm:text-[28px] font-bold text-[#1A1A1A] break-words">
          {displayName || producteur.code_producteur}
        </h1>
        <p className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium mt-1 flex flex-wrap gap-1 items-center">
          <span className="font-mono">{producteur.code_producteur}</span>
          <span>·</span>
          <span>{producteur.statut || "—"}</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiParcelles}
          </p>
          <p className="text-[22px] sm:text-[28px] font-bold text-[#1A1A1A] mt-1 font-numbers">
            {parcelles.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiSurface}
          </p>
          <p className="text-[18px] sm:text-[28px] font-bold text-[#1A1A1A] mt-1 font-numbers">
            {totalSurface.toFixed(2)} <span className="text-[13px]">ha</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
            {p.kpiEudr}
          </p>
          <p className="text-[22px] sm:text-[28px] font-bold text-[#1A1A1A] mt-1 font-numbers">
            {conformitePct}%
          </p>
        </div>
      </div>

      {/* Info + map row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 pt-4 pb-2">
          <h3 className="font-numbers text-[12px] sm:text-[13px] font-bold text-[#1A1A1A] tracking-[0.16em] uppercase pb-2.5 border-b border-gray-100">
            {p.sectionInformations}
          </h3>
          <div>
            {infoRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="relative rounded-xl overflow-hidden min-h-[240px] sm:min-h-[280px]">
          <div className="[&>div]:!h-full [&>div]:!rounded-xl h-full min-h-[240px] sm:min-h-[280px]">
            <CarteMapbox
              parcelles={parcelles
                .filter((pc) => pc.latitude != null && pc.longitude != null)
                .map((pc) => ({
                  id: pc.id,
                  code_parcelle: pc.code_parcelle,
                  latitude: Number(pc.latitude),
                  longitude: Number(pc.longitude),
                  status_eudr: pc.status_eudr ?? "",
                  surface_ha: Number(pc.surface_ha) || 0,
                  geojson: pc.geojson,
                  producteurs: {
                    code_producteur: producteur.code_producteur,
                    nom: producteur.nom ?? "",
                  },
                }))}
            />
          </div>
          {parcelles.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 text-[10px] tracking-[0.15em] uppercase pointer-events-none z-10">
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#2AC1A3] shrink-0" />
                {p.legendConforme} ({conformesCount})
              </span>
              <span className="flex items-center gap-1.5 text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[#C4943A] shrink-0" />
                {p.legendNonConforme} ({nonConformesCount})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Other info + Parcelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 pt-4 pb-2">
          <h3 className="font-numbers text-[12px] sm:text-[13px] font-bold text-[#1A1A1A] tracking-[0.16em] uppercase pb-2.5 border-b border-gray-100">
            {p.sectionAutresInfos}
          </h3>
          <div>
            {otherRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Parcelles header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-numbers text-[15px] sm:text-[16px] font-bold text-[#1A1A1A] tracking-[0.14em] uppercase">
              <span className="text-[#2AC1A3] text-[17px]">🌱</span>
              {p.sectionParcelles}{" "}
              <span className="text-[#1A1A1A]">({parcelles.length})</span>
            </h3>
            <Link
              href={`/parcelles/nouveau?producteur_id=${producteur.id}`}
              className="bg-[#6FCFB5] hover:bg-[#5fc0a5] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-numbers text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase transition inline-flex items-center gap-2"
            >
              {p.addParcelBtn}
            </Link>
          </div>

          {/* Parcelles table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-gray-200">
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colCode}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colSurface}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap hidden sm:table-cell">
                      {p.colCulture}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colEudr}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-left font-numbers text-[11px] sm:text-[12px] font-bold text-[#6B7280] tracking-[0.18em] uppercase whitespace-nowrap">
                      {p.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parcelles.map((pc) => (
                    <tr key={pc.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 sm:px-6 py-4">
                        <Link
                          href={`/parcelles/${pc.id}`}
                          className="font-mono text-[12px] sm:text-[13px] text-[#2AC1A3] font-bold tracking-[0.08em] hover:underline whitespace-nowrap"
                        >
                          {pc.code_parcelle}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-numbers text-[13px] sm:text-[15px] text-[#1A1A1A] whitespace-nowrap">
                        {pc.surface_ha ?? "—"} ha
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-numbers text-[13px] sm:text-[15px] text-[#1A1A1A] hidden sm:table-cell">
                        {pc.culture ?? "—"}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full font-numbers text-[10px] sm:text-[11px] font-bold tracking-[0.1em] uppercase whitespace-nowrap ${
                          pc.status_eudr === "CONFORME"
                            ? "bg-[#D4F1E7] text-[#2AC1A3]"
                            : pc.status_eudr === "RISQUE NON NEGLIGEABLE"
                            ? "bg-[#FBE9C8] text-[#8B6914]"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {pc.status_eudr || "—"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Link
                          href={`/parcelles/${pc.id}/edit`}
                          className="font-mono text-[11px] sm:text-[12px] text-[#6B7280] tracking-[0.14em] uppercase hover:text-[#2AC1A3]"
                        >
                          {p.actionEdit}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {parcelles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center font-numbers text-[14px] text-gray-400">
                        —
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4">
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
                {p.fieldPrixVenteFcfa}
              </p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mt-1 font-numbers break-all">
                {formatValue(producteur.kilos_vendus)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4">
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium leading-tight">
                {p.fieldPrixKiloFcfa}
              </p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mt-1 font-numbers break-all">
                {formatValue(producteur.prix_kilo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/producteurs/${producteur.id}/modifier`}
          className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-[#24a88e] transition"
        >
          {p.actionEdit}
        </Link>
      </div>
    </div>
  )
}
