"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import DetailMap from "@/components/DetailMap"
import type { MapParcel } from "@/components/DetailMap"
import { EUDR_STATUS, normalizeEudrStatus, eudrBucket } from "@/lib/eudr"
import { translateGeoName } from "@/lib/i18n/geo"
import { translateJustification, extractProtectedAreaName } from "@/lib/i18n/justification"
import { translateCleanupCorrection } from "@/lib/i18n/cleanup"

function readField(obj: any, ...keys: string[]): any {
  for (const key of keys) {
    const parts = key.split(".")
    let val: any = obj
    for (const p of parts) val = val?.[p]
    if (val !== undefined && val !== null && val !== "") return val
  }
  return null
}

function readArray(obj: any, ...keys: string[]): string[] {
  for (const key of keys) {
    const parts = key.split(".")
    let val: any = obj
    for (const p of parts) val = val?.[p]
    if (Array.isArray(val) && val.length > 0) return val
  }
  return []
}

function EudrBadge({
  status,
  notVerifiedLabel,
  conformeLabel,
  nonConformeLabel,
  geometrieInvalideLabel,
  enAttenteLabel,
}: {
  status: string | null
  notVerifiedLabel: string
  conformeLabel: string
  nonConformeLabel: string
  geometrieInvalideLabel: string
  enAttenteLabel: string
}) {
  // The 4 client risk categories, each with its own badge.
  const norm = normalizeEudrStatus(status)
  if (norm === EUDR_STATUS.CONFORME) {
    return <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-[#2ac1a3]/15 text-[#2ac1a3]">{conformeLabel}</span>
  }
  if (norm === EUDR_STATUS.NON_CONFORME) {
    return <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700">{nonConformeLabel}</span>
  }
  if (norm === EUDR_STATUS.GEOMETRIE_INVALIDE) {
    return <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-orange-100 text-orange-700">{geometrieInvalideLabel}</span>
  }
  // EN ATTENTE + null both fall through to pending_review badge.
  if (eudrBucket(status) === "pending_review") {
    return <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-amber-50 text-amber-700">{enAttenteLabel}</span>
  }
  return <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500">{notVerifiedLabel}</span>
}

export default function ParcelleDetailClient({
  parcelle,
  producteur,
  collectes,
}: {
  parcelle: any
  producteur: any
  collectes: any[]
}) {
  const { t, locale } = useLanguage()
  const tp = t.parcelles
  const tl = t.lots
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB"
  const tx = (val: string | null | undefined) =>
    val ? (tp.optionLabels[val] ?? val) : "—"
  const txArr = (arr: string[]) =>
    arr.length > 0 ? arr.map(tx).join(", ") : "—"

  const latitude = parcelle.latitude ?? null
  const longitude = parcelle.longitude ?? null
  const annees = parcelle.annee_plantation
    ? tp.cardYears(new Date().getFullYear() - Number(parcelle.annee_plantation))
    : "—"

  // Read all fields with JSONB fallbacks
  const modeAcces = readField(parcelle, "mode_acces_terre", "acces_terre_data.mode_acces_terre")
  const autorisationOccupation = readField(parcelle, "autorisation_occupation", "acces_terre_data.autorisation_occupation")
  const typeAutorisation = readField(parcelle, "type_autorisation", "acces_terre_data.type_autorisation")
  const autoritePar = readField(parcelle, "autorite_ayant_accorde", "acces_terre_data.autorite_ayant_accorde")
  const etatSite = readField(parcelle, "etat_site_creation", "acces_terre_data.etat_site_creation", "acquisition_data.etat_site_creation")
  const provenance = readField(parcelle, "provenance_semences", "semences_data.provenance_semences")
  const lieuSemences = readField(parcelle, "lieu_semences", "semences_data.lieu_semences")
  const fournisseur = readField(parcelle, "fournisseur_semences", "semences_data.fournisseur_semences")
  const systemeAgricole = readField(parcelle, "systeme_agricole", "semences_data.systeme_agricole")
  const arbres = readArray(parcelle, "arbres_accompagnons", "semences_data.arbres_accompagnons")
  const nombreArbres = readField(parcelle, "nombre_arbres_accompagnons", "semences_data.nombre_arbres_accompagnons")
  const signesMaladies = readField(parcelle, "signes_maladies", "sante_production_data.signes_maladies", "sante_data.signes_maladies")
  const maladies = readArray(parcelle, "identification_maladies", "sante_production_data.identification_maladies", "sante_data.identification_maladies")
  const plantationProduit = readField(parcelle, "plantation_produit", "sante_production_data.plantation_produit", "sante_data.plantation_produit")
  const recolte = readField(parcelle, "recolte_annee_derniere", "sante_production_data.recolte_annee_derniere", "sante_data.recolte_annee_derniere")
  const quantite = readField(parcelle, "quantite_recoltee", "sante_production_data.quantite_recoltee", "sante_data.quantite_recoltee")
  const formations = readField(parcelle, "formations_recues", "formation_entretien_data.formations_recues", "formation_data.formations_recues")
  const operations = readArray(parcelle, "operations_entretien", "formation_entretien_data.operations_entretien", "formation_data.operations_entretien")
  const pesticides = readField(parcelle, "utilisation_pesticides", "formation_entretien_data.utilisation_pesticides", "formation_data.utilisation_pesticides")
  const etatPlantation = readField(parcelle, "etat", "etat_plantation_enquete", "formation_entretien_data.etat_plantation_enquete", "formation_data.etat_plantation_enquete")

  // GPX cleanup corrections for the polygon-analysis box.
  const cleanupRaw = readField(parcelle, "nettoyage_corrections", "eudr_cleanup", "cleanup_corrections")
  const cleanupItems = typeof cleanupRaw === "string"
    ? cleanupRaw.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
    : Array.isArray(cleanupRaw)
      ? cleanupRaw.map((s) => String(s).trim()).filter(Boolean)
      : []

  // WDPA protected-area name: prefer the dedicated column, fall back to the
  // name embedded in the justification text (Issue #4).
  const protectedAreaName =
    parcelle.zone_protegee_nom || extractProtectedAreaName(parcelle.justification_eudr)

  const fields = [
    { label: tp.fieldCooperative, value: (producteur as any)?.cooperatives?.nom || "—" },
    { label: tp.fieldProducteur, value: producteur ? `${producteur.nom}${(producteur as any).prenom ? " " + (producteur as any).prenom : ""}` : "—" },
    { label: tp.fieldModeAcces, value: tx(modeAcces) },
    { label: tp.fieldAutorisationOccupation, value: tx(autorisationOccupation) },
    { label: tp.fieldTypeAutorisation, value: tx(typeAutorisation) },
    { label: tp.fieldAutorisationPar, value: autoritePar || "—" },
    { label: tp.fieldEtatSiteCreation, value: tx(etatSite) },
    { label: tp.fieldProvenanceSemences, value: tx(provenance) },
    { label: tp.fieldLieuSemences, value: tx(lieuSemences) },
    { label: tp.fieldFournisseurSemences, value: fournisseur || "—" },
    { label: tp.fieldSystemeAgricole, value: tx(systemeAgricole) },
    { label: tp.fieldArbresCompagnons, value: txArr(arbres) },
    { label: tp.fieldNombreArbres, value: nombreArbres !== null ? String(nombreArbres) : "—" },
    { label: tp.fieldSignesMaladies, value: tx(signesMaladies) },
    { label: tp.fieldMaladies, value: txArr(maladies) },
    { label: tp.fieldPlantationProduit, value: tx(plantationProduit) },
    { label: tp.fieldRecolteAnnee, value: tx(recolte) },
    { label: tp.fieldQuantiteRecoltee, value: quantite !== null ? String(quantite) : "—" },
    { label: tp.fieldFormationsRecues, value: tx(formations) },
    { label: tp.fieldOperationsEntretien, value: txArr(operations) },
    { label: tp.fieldPesticides, value: tx(pesticides) },
    { label: tp.fieldEtatPlantation, value: tx(etatPlantation) },
  ]

  return (
    <div className="space-y-6">
      <Link href="/parcelles" className="text-xs text-gray-400 tracking-widest uppercase hover:text-[#2ac1a3] transition">
        {tp.backToList}
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{parcelle.code_parcelle}</h1>
              <EudrBadge
                status={parcelle.status_eudr}
                notVerifiedLabel={tp.notVerified}
                conformeLabel={tp.eudrConforme}
                nonConformeLabel={tp.eudrNonConforme}
                geometrieInvalideLabel={tp.eudrGeometrieInvalide}
                enAttenteLabel={tp.eudrEnAttente}
              />
            </div>
            <p className="text-sm text-gray-500">
              {tp.fieldProducteur} : {producteur?.code_producteur} – {producteur?.nom}{(producteur as any)?.prenom ? ` ${(producteur as any).prenom}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`/api/parcelles/${parcelle.id}/geojson`}
              download
              className="flex items-center gap-2 bg-[#3b82f6] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#2563eb] transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {tp.btnDownloadGeojson}
            </a>
            <Link href={`/parcelles/${parcelle.id}/edit`} className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition">
              {tp.btnEdit}
            </Link>
          </div>
        </div>

        {parcelle.justification_eudr && (
          <div className="mb-6 p-4 bg-[#e6f9f5] border border-[#2ac1a3]/20 rounded-lg">
            <p className="text-xs font-bold text-[#2ac1a3] uppercase tracking-widest mb-1">{tp.eudrJustificationLabel}</p>
            <p className="text-sm text-gray-700">{translateJustification(parcelle.justification_eudr, locale)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: detail table */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{tp.sectionOtherInfo}</h2>
            <div className="space-y-0">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm text-gray-900 font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stat cards + map */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: tp.cardCulture, value: parcelle.culture ? (tp.optionLabels[parcelle.culture] ?? parcelle.culture) : "—" },
                { label: tp.cardLocalite, value: (producteur as any)?.villages?.nom || (producteur as any)?.village || "—" },
                { label: tp.cardZone, value: translateGeoName((producteur as any)?.zones?.nom, locale) || "—" },
                { label: tp.cardPays, value: translateGeoName((producteur as any)?.pays?.nom, locale) || "—" },
                { label: tp.cardLatitude, value: latitude ?? "—" },
                { label: tp.cardLongitude, value: longitude ?? "—" },
                { label: tp.cardSurface, value: parcelle.surface_ha || "—" },
                { label: tp.cardAnnee, value: annees },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-base font-semibold text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>

            <DetailMap
              points={[{
                code: parcelle.code_parcelle,
                lat: Number(latitude),
                lon: Number(longitude),
                status_eudr: parcelle.status_eudr ?? null,
                geojson: parcelle.geojson,
              } satisfies MapParcel]}
              height={240}
            />

            {/* Détails de l'analyse — directly below the map */}
            <div className="pt-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{tp.analyseDetailsTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1: polygon analysis & correction */}
                <div className="bg-[#e6f9f5] border border-[#2ac1a3]/30 rounded-xl p-5">
                  <h3 className="text-center font-semibold text-gray-800 mb-4">{tp.analysePolygonTitle}</h3>
                  {cleanupItems.length > 0 ? (
                    <ul className="text-sm text-gray-700 space-y-1.5">
                      <li className="flex gap-2">
                        <span className="text-[#2ac1a3]">•</span>
                        <div>
                          <span>{tp.analysePolygonCorrections}</span>
                          <ul className="mt-1.5 space-y-1.5 pl-4">
                            {cleanupItems.map((item, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#2ac1a3]">•</span>
                                <span>{translateCleanupCorrection(item, locale)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">{tp.analysePolygonNone}</p>
                  )}
                </div>

                {/* Box 2: deforestation risk analysis */}
                <div className="bg-[#e6f9f5] border border-[#2ac1a3]/30 rounded-xl p-5">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <h3 className="text-center font-semibold text-gray-800">{tp.analyseRiskTitle}</h3>
                    <EudrBadge
                      status={parcelle.status_eudr}
                      notVerifiedLabel={tp.notVerified}
                      conformeLabel={tp.eudrConforme}
                      nonConformeLabel={tp.eudrNonConforme}
                      geometrieInvalideLabel={tp.eudrGeometrieInvalide}
                      enAttenteLabel={tp.eudrEnAttente}
                    />
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    {[
                      { label: tp.analyseCouvertureForet, value: parcelle.eudr_foret_2020_pct != null ? `${Number(parcelle.eudr_foret_2020_pct)}%` : "—" },
                      { label: tp.analysePerteDepuis2020, value: parcelle.eudr_perte_2021_2024_ha != null ? `${Number(parcelle.eudr_perte_2021_2024_ha)} ha` : "—" },
                      { label: tp.analyseAlertesRecentes, value: parcelle.eudr_alertes_2025_ha != null ? `${Number(parcelle.eudr_alertes_2025_ha)} ha` : "—" },
                      { label: tp.analyseChevauchement, value: parcelle.dans_zone_protegee == null
                          ? "—"
                          : (parcelle.dans_zone_protegee
                              // Append the WDPA protected-area name after "Yes" (Issue #4).
                              // Prefer the dedicated column; fall back to the name
                              // embedded in the justification text when the column
                              // was never populated.
                              ? (protectedAreaName ? `${tp.yes} — ${protectedAreaName}` : tp.yes)
                              : tp.no) },
                    ].map(({ label, value }) => (
                      <li key={label} className="flex gap-2">
                        <span className="text-[#2ac1a3]">•</span>
                        <span>{label}: {value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collectes */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-base font-bold text-gray-900 mb-5">{tp.sectionCollectes} ({collectes.length})</h2>
        {collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{new Date(c.date_collecte).toLocaleDateString(dateLocale)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{c.produit}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#2ac1a3]">{c.poids_net_kg} kg</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.nombre_sacs} {tl.sacs}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{tp.noCollectes}</p>
        )}
      </div>
    </div>
  )
}
