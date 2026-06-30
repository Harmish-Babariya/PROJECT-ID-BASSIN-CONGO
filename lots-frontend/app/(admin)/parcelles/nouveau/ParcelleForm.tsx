"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createParcelle } from "./actions"
import { Toast, useToast } from "@/components/Toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { mapApiCodeToStatus, EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"
import { translateGeoName } from "@/lib/i18n/geo"
import { translateJustification } from "@/lib/i18n/justification"

interface ParcelleFormProps {
  producteurs: any[]
  zones: any[]
  pays: any[]
  returnTo?: string
  producteurPreselectionne?: string
  defaultPaysId?: string
  mode?: "create" | "edit"
}

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const selectClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="inline-block">
        <span className="text-base font-bold text-gray-900">{num}. {title.toUpperCase()}</span>
        <div className="h-0.5 bg-[#2ac1a3] mt-1" />
      </div>
    </div>
  )
}

export default function ParcelleForm({
  producteurs,
  zones,
  pays,
  returnTo,
  producteurPreselectionne,
  defaultPaysId,
  mode = "create",
}: ParcelleFormProps) {
  const { t, locale } = useLanguage()
  const tp = t.parcelles
  const [loading, setLoading] = useState(false)
  const { toast, showSuccess, showError, hideToast } = useToast()
  // Producer is enforced (locked, non-changeable) when launched via "+ parcel"
  // for a specific producer — Issue #3.
  const producteurBloque = !!producteurPreselectionne
  const [gpxUploading, setGpxUploading] = useState(false)
  const [gpxAnalyse, setGpxAnalyse] = useState<any>(null)

  const paysLocked = pays.length === 1

  const [formData, setFormData] = useState({
    producteur_id: producteurPreselectionne || "",
    zone_id: "",
    pays_id: defaultPaysId || (pays.length === 1 ? String(pays[0].id) : ""),
    surface_ha: "",
    surface_estimee: false,
    latitude: "",
    longitude: "",
    altitude: "",
    precision_gps: "",
    gpx_file_url: "",
    status_eudr: "",
    justification_eudr: "",
    eudr_verification_timestamp: "",
    eudr_script_version: "",
    geojson: null as any,
    nettoyage_corrections: [] as string[],
    culture: "Cacao",
    varietes: [] as string[],
    annee_plantation: "",
    etat: "",
    a_rehabiliter: false,
    notes_etat: "",
    production_annuelle_estimee_kg: "",
    derniere_recolte_kg: "",
    date_derniere_recolte: "",
    declaration_legalite: false,
    consentement_producteur: false,
    date_creation: new Date().toISOString().split("T")[0],
    localite_enquete: "",
    secteur_agricole: "",
    structure_embauche_enqueteur: "",
    identite_enquete: "",
    appartenance_plantation: "",
    nom_proprietaire: "",
    nom_collectivite_proprietaire: "",
    statut_zone: "",
    nombre_plantations_total: "",
    mode_acquisition: "",
    annee_creation: "",
    annee_heritage: "",
    annee_achat: "",
    etat_site_creation: "",
    cultures_precedentes: [] as string[],
    heritage_de: "",
    heritage_autre_precision: "",
    structure_plantation: "",
    distinction_parcelles: "",
    mode_acces_terre: "",
    mode_acces_autre: "",
    autorisation_occupation: "",
    type_autorisation: "",
    autorite_ayant_accorde: "",
    provenance_semences: "",
    lieu_semences: "",
    fournisseur_semences: "",
    varietes_semences: "",
    systeme_agricole: "",
    arbres_accompagnons: [] as string[],
    arbres_accompagnons_autre: "",
    nombre_arbres_accompagnons: "",
    signes_maladies: "",
    identification_maladies: [] as string[],
    plantation_produit: "",
    recolte_annee_derniere: "",
    quantite_recoltee: "",
    formations_recues: "",
    operations_entretien: [] as string[],
    operations_entretien_autre: "",
    utilisation_pesticides: "",
    etat_plantation_enquete: "",
    age_estimatif_plantation: "",
    niveau_maitrise_bpa: "",
  })

  // Derived filtered lists based on selections
  const filteredZones = formData.pays_id
    ? zones.filter(z => z.pays_id === parseInt(formData.pays_id))
    : zones

  const filteredProducteurs = formData.zone_id
    ? producteurs.filter(p => p.zone_id === parseInt(formData.zone_id))
    : formData.pays_id
    ? producteurs.filter(p => p.pays_id === parseInt(formData.pays_id))
    : producteurs

  // When producteur is pre-selected, auto-fill pays_id and zone_id
  useEffect(() => {
    if (producteurPreselectionne) {
      const p = producteurs.find(p => p.id === parseInt(producteurPreselectionne))
      if (p) {
        setFormData(prev => ({
          ...prev,
          producteur_id: producteurPreselectionne,
          zone_id: p.zone_id?.toString() || "",
          pays_id: p.pays_id?.toString() || "",
        }))
      }
    }
  }, [producteurPreselectionne, producteurs])

  // When producteur changes, auto-fill zone and pays
  function handleProducteurChange(val: string) {
    if (!val) {
      setFormData(prev => ({ ...prev, producteur_id: "" }))
      return
    }
    const p = producteurs.find(p => p.id === parseInt(val))
    setFormData(prev => ({
      ...prev,
      producteur_id: val,
      zone_id: p?.zone_id?.toString() || prev.zone_id,
      pays_id: p?.pays_id?.toString() || prev.pays_id,
    }))
  }

  // When pays changes, reset zone and producteur if they no longer match.
  // When the producteur is enforced (producteurBloque), it is never cleared —
  // the parcel may legitimately sit in a different country/zone (Issue #3).
  function handlePaysChange(val: string) {
    const currentZoneStillValid = val
      ? zones.some(z => z.id === parseInt(formData.zone_id) && z.pays_id === parseInt(val))
      : true
    const newZoneId = currentZoneStillValid ? formData.zone_id : ""
    const currentProdStillValid = newZoneId
      ? producteurs.some(p => p.id === parseInt(formData.producteur_id) && p.zone_id === parseInt(newZoneId))
      : false
    setFormData(prev => ({
      ...prev,
      pays_id: val,
      zone_id: newZoneId,
      producteur_id: producteurBloque ? prev.producteur_id : (currentProdStillValid ? prev.producteur_id : ""),
    }))
  }

  // When zone changes, reset producteur if it no longer belongs to that zone
  // (unless the producteur is enforced — see handlePaysChange).
  function handleZoneChange(val: string) {
    const prodStillValid = val
      ? producteurs.some(p => p.id === parseInt(formData.producteur_id) && p.zone_id === parseInt(val))
      : false
    const zoneObj = zones.find(z => z.id === parseInt(val))
    setFormData(prev => ({
      ...prev,
      zone_id: val,
      pays_id: zoneObj?.pays_id?.toString() || prev.pays_id,
      producteur_id: producteurBloque ? prev.producteur_id : (prodStillValid ? prev.producteur_id : ""),
    }))
  }

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      showError(t.errors.gpxOnly)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showError(t.errors.gpxTooLarge)
      return
    }
    setGpxUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (formData.annee_plantation) fd.append("annee_plantation", formData.annee_plantation)

      const response = await fetch(`/api/upload-gpx?locale=${locale}`, { method: "POST", body: fd })
      const result = await response.json()

      if (result.success) {
        // The API now returns canonical FR statuses, but mapApiCodeToStatus
        // also accepts legacy codes (compliant/alert/pending_review) so this
        // form keeps working if the API hasn't been redeployed.
        const status =
          normalizeEudrStatus(result.eudr_status) ??
          mapApiCodeToStatus(result.eudr_status) ??
          EUDR_STATUS.EN_ATTENTE
        setFormData(prev => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
          surface_ha: result.surface_ha,
          gpx_file_url: result.gpx_file_url,
          status_eudr: status,
          justification_eudr: result.justification || "",
          eudr_verification_timestamp: result.verification_timestamp || "",
          eudr_script_version: result.script_version || "",
          geojson: result.geojson || null,
          nettoyage_corrections: result.nettoyage_corrections || [],
        }))
        setGpxAnalyse(result)
        showSuccess(t.actions.gpxSuccess)
        if (result.duplicateWarning) {
          showError(t.errors.gpxDuplicate(result.duplicateWarning.code_parcelle ?? `#${result.duplicateWarning.id}`))
        }
      } else {
        showError(t.errors.gpxAnalyseError(result.error))
      }
    } catch (err: any) {
      showError(t.errors.gpxError(err.message))
    } finally {
      setGpxUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const result = await createParcelle(formData, returnTo)
    if (result?.error) {
      showError((t.errors as any)[result.error] as string || result.error)
      setLoading(false)
    }
  }

  const handleArrayToggle = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const arr = prev[field] as string[]
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  const isEdit = mode === "edit"

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="space-y-1 mb-8">
        <Link href="/parcelles" className="text-xs text-gray-400 tracking-widest uppercase hover:text-[#2ac1a3] transition">
          {tp.backToList}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
          {isEdit ? tp.formEdit : tp.formNew}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl">

        {/* All sections in one card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-10">

        {/* SECTION 1 */}
        <div className="pb-10 border-b border-gray-200">
          <SectionTitle num="1" title={tp.section1} />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>{tp.labelPays}</label>
              {/* When a producer is enforced via "+ parcel", country/zone stay
                  editable: this new parcel may sit in a different zone than the
                  producer's other parcels (client request, Issue #3). */}
              <select value={formData.pays_id} onChange={e => handlePaysChange(e.target.value)} className={selectClass} disabled={paysLocked} required>
                <option value="">{tp.selectPays}</option>
                {pays.map(p => <option key={p.id} value={p.id}>{translateGeoName(p.nom, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelZone}</label>
              <select value={formData.zone_id} onChange={e => handleZoneChange(e.target.value)} className={selectClass} required>
                <option value="">{tp.selectZone}</option>
                {filteredZones.map(z => <option key={z.id} value={z.id}>{translateGeoName(z.nom, locale)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>{tp.labelProducteur}</label>
              <div className="flex gap-2">
                {/* When launched from "+ parcel", the producteur is enforced and
                    cannot be changed (Issue #3): only this producer's parcels are
                    created here, even if the parcel lies in another zone. The
                    enforced producer is rendered explicitly so it shows regardless
                    of the zone filter. */}
                <select value={formData.producteur_id} onChange={e => handleProducteurChange(e.target.value)} className={selectClass} disabled={producteurBloque} required>
                  <option value="">{tp.selectProducteur}</option>
                  {producteurBloque
                    ? (() => {
                        const p = producteurs.find(p => p.id === parseInt(formData.producteur_id))
                        return p ? <option key={p.id} value={p.id}>{p.code_producteur} – {p.nom} {p.prenom}</option> : null
                      })()
                    : filteredProducteurs.map(p => (
                        <option key={p.id} value={p.id}>{p.code_producteur} – {p.nom} {p.prenom}</option>
                      ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="pb-10 border-b border-gray-200">
          <SectionTitle num="2" title={tp.section2} />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>{tp.labelModeAcces}</label>
              <select value={formData.mode_acces_terre} onChange={e => setFormData({ ...formData, mode_acces_terre: e.target.value })} className={selectClass}>
                <option value="">{tp.selectModeAcces}</option>
                <option value="Propriété familiale">{tp.optionLabels["Propriété familiale"]}</option>
                <option value="Achat">{tp.optionLabels["Achat"]}</option>
                <option value="Location">{tp.optionLabels["Location"]}</option>
                <option value="Don">{tp.optionLabels["Don"]}</option>
                <option value="Autre">{tp.optionLabels["Autre"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelAutorisationOccupation}</label>
              <select value={formData.autorisation_occupation} onChange={e => setFormData({ ...formData, autorisation_occupation: e.target.value })} className={selectClass}>
                <option value="">{tp.selectAutorisation}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelTypeAutorisation}</label>
              <select value={formData.type_autorisation} onChange={e => setFormData({ ...formData, type_autorisation: e.target.value })} className={selectClass}>
                <option value="">{tp.selectTypeAutorisation}</option>
                <option value="Titre foncier">{tp.optionLabels["Titre foncier"]}</option>
                <option value="Autorisation verbale">{tp.optionLabels["Autorisation verbale"]}</option>
                <option value="Autorisation écrite">{tp.optionLabels["Autorisation écrite"]}</option>
                <option value="Autre">{tp.optionLabels["Autre"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelAccordeePar}</label>
              <input type="text" value={formData.autorite_ayant_accorde} onChange={e => setFormData({ ...formData, autorite_ayant_accorde: e.target.value })} placeholder="Ex Chef de village..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tp.labelEtatSite}</label>
              <select value={formData.etat_site_creation} onChange={e => setFormData({ ...formData, etat_site_creation: e.target.value })} className={selectClass}>
                <option value="">{tp.selectEtat}</option>
                <option value="Excellent">{tp.optionLabels["Excellent"]}</option>
                <option value="Bon">{tp.optionLabels["Bon"]}</option>
                <option value="Moyen">{tp.optionLabels["Moyen"]}</option>
                <option value="Dégradé">{tp.optionLabels["Dégradé"]}</option>
                <option value="Très dégradé">{tp.optionLabels["Très dégradé"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelAnneeplantation}</label>
              <input type="number" value={formData.annee_plantation} onChange={e => setFormData({ ...formData, annee_plantation: e.target.value })} placeholder="Ex: 2023" className={inputClass} />
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="pb-10 border-b border-gray-200">
          <SectionTitle num="3" title={tp.section3} />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>{tp.labelProvenance}</label>
              <select value={formData.provenance_semences} onChange={e => setFormData({ ...formData, provenance_semences: e.target.value })} className={selectClass}>
                <option value="">{tp.selectProvenance}</option>
                <option value="Connue">{tp.optionLabels["Connue"]}</option>
                <option value="Inconnue">{tp.optionLabels["Inconnue"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelLieu}</label>
              <select value={formData.lieu_semences} onChange={e => setFormData({ ...formData, lieu_semences: e.target.value })} className={selectClass}>
                <option value="">{tp.selectLieu}</option>
                <option value="Local">{tp.optionLabels["Local"]}</option>
                <option value="Importé">{tp.optionLabels["Importé"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelFournisseur}</label>
              <input type="text" value={formData.fournisseur_semences} onChange={e => setFormData({ ...formData, fournisseur_semences: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tp.labelVarietes}</label>
              <input type="text" value={formData.varietes_semences} onChange={e => setFormData({ ...formData, varietes_semences: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tp.labelSysteme}</label>
              <select value={formData.systeme_agricole} onChange={e => setFormData({ ...formData, systeme_agricole: e.target.value })} className={selectClass}>
                <option value="">{tp.selectSysteme}</option>
                <option value="Monoculture">{tp.optionLabels["Monoculture"]}</option>
                <option value="Agroforesterie simple">{tp.optionLabels["Agroforesterie simple"]}</option>
                <option value="Agroforesterie complexe">{tp.optionLabels["Agroforesterie complexe"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelArbres}</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                {["Avocatier", "Safoutier", "Manguier", "Palmier", "Bananier", "Papayer", "Autre", "Aucun"].map(a => (
                  <label key={a} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formData.arbres_accompagnons.includes(a)} onChange={() => handleArrayToggle("arbres_accompagnons", a)} className="accent-[#2ac1a3] rounded" />
                    {tp.optionLabels[a] ?? a}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{tp.labelNombreArbres}</label>
              <input type="number" value={formData.nombre_arbres_accompagnons} onChange={e => setFormData({ ...formData, nombre_arbres_accompagnons: e.target.value })} placeholder="Ex. 45" className={inputClass} />
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="pb-10 border-b border-gray-200">
          <SectionTitle num="4" title={tp.section4} />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>{tp.labelSignesMaladies}</label>
              <select value={formData.signes_maladies} onChange={e => setFormData({ ...formData, signes_maladies: e.target.value })} className={selectClass}>
                <option value="">{tp.selectOuiNon}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelMaladies}</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                {["Pourriture brune", "Miride", "Chenille", "Swollen Shoot", "Autre", "Aucun"].map(m => (
                  <label key={m} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formData.identification_maladies.includes(m)} onChange={() => handleArrayToggle("identification_maladies", m)} className="accent-[#2ac1a3] rounded" />
                    {tp.optionLabels[m] ?? m}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{tp.labelPlantationProduit}</label>
              <select value={formData.plantation_produit} onChange={e => setFormData({ ...formData, plantation_produit: e.target.value })} className={selectClass}>
                <option value="">{tp.selectOuiNon}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelRecolte}</label>
              <select value={formData.recolte_annee_derniere} onChange={e => setFormData({ ...formData, recolte_annee_derniere: e.target.value })} className={selectClass}>
                <option value="">{tp.selectOuiNon}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelQuantite}</label>
              <input type="number" value={formData.quantite_recoltee} onChange={e => setFormData({ ...formData, quantite_recoltee: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="pb-10 border-b border-gray-200">
          <SectionTitle num="5" title={tp.section5} />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>{tp.labelFormations}</label>
              <select value={formData.formations_recues} onChange={e => setFormData({ ...formData, formations_recues: e.target.value })} className={selectClass}>
                <option value="">{tp.selectOuiNon}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelOperations}</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                {["Désherbage", "Élagage", "Fertilisation", "Traitement", "Récolte sanitaire", "Autre", "Aucun"].map(o => (
                  <label key={o} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formData.operations_entretien.includes(o)} onChange={() => handleArrayToggle("operations_entretien", o)} className="accent-[#2ac1a3] rounded" />
                    {tp.optionLabels[o] ?? o}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{tp.labelPesticides}</label>
              <select value={formData.utilisation_pesticides} onChange={e => setFormData({ ...formData, utilisation_pesticides: e.target.value })} className={selectClass}>
                <option value="">{tp.selectOuiNon}</option>
                <option value="Oui">{tp.optionLabels["Oui"]}</option>
                <option value="Non">{tp.optionLabels["Non"]}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{tp.labelEtatPlantation}</label>
              <select value={formData.etat_plantation_enquete} onChange={e => setFormData({ ...formData, etat_plantation_enquete: e.target.value })} className={selectClass}>
                <option value="">{tp.selectEtat}</option>
                <option value="Excellent">{tp.optionLabels["Excellent"]}</option>
                <option value="Bon">{tp.optionLabels["Bon"]}</option>
                <option value="Moyen">{tp.optionLabels["Moyen"]}</option>
                <option value="Dégradé">{tp.optionLabels["Dégradé"]}</option>
                <option value="Très dégradé">{tp.optionLabels["Très dégradé"]}</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 6 */}
        <div>
          <SectionTitle num="6" title={tp.section6} />
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-gray-500 font-medium">📂 {tp.labelGpxFile}</span>
              <input type="file" accept=".gpx,application/gpx+xml" onChange={handleGpxUpload} disabled={gpxUploading}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 disabled:opacity-50" />
            </div>
          </div>
          {gpxUploading && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-yellow-700 font-medium">{tp.gpxUploading}</p>
            </div>
          )}
          {gpxAnalyse && (
            <div className="mb-4 p-4 bg-[#e6f9f5] border border-[#2ac1a3]/30 rounded-lg">
              <p className="text-sm font-bold text-[#2ac1a3] mb-2">{tp.gpxSuccess}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{tp.gpxLatLon(gpxAnalyse.latitude, gpxAnalyse.longitude)}</p>
                <p>{tp.gpxSurface(gpxAnalyse.surface_ha, gpxAnalyse.nb_points)}</p>
                {formData.status_eudr && (() => {
                  const norm = normalizeEudrStatus(formData.status_eudr)
                  const statusLabel =
                    norm === EUDR_STATUS.CONFORME ? tp.eudrConforme :
                    norm === EUDR_STATUS.NON_CONFORME ? tp.eudrNonConforme :
                    norm === EUDR_STATUS.GEOMETRIE_INVALIDE ? tp.eudrGeometrieInvalide :
                    norm === EUDR_STATUS.EN_ATTENTE ? tp.eudrEnAttente :
                    formData.status_eudr
                  const colorClass =
                    norm === EUDR_STATUS.CONFORME ? "text-[#2ac1a3]" :
                    norm === EUDR_STATUS.NON_CONFORME ? "text-red-600" :
                    norm === EUDR_STATUS.GEOMETRIE_INVALIDE ? "text-orange-600" :
                    norm === EUDR_STATUS.EN_ATTENTE ? "text-amber-600" :
                    "text-gray-500"
                  return (
                    <p className={`font-semibold mt-1 ${colorClass}`}>
                      {tp.gpxEudrLabel} {statusLabel}{formData.justification_eudr ? ` — ${translateJustification(formData.justification_eudr, locale)}` : ""}
                    </p>
                  )
                })()}
              </div>
            </div>
          )}
        </div>

        </div>

        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={loading} className="bg-[#2ac1a3] text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] disabled:opacity-50 transition">
            {loading ? tp.btnSaving : isEdit ? tp.btnSave : tp.btnCreate}
          </button>
        </div>
      </form>
    </>
  )
}
