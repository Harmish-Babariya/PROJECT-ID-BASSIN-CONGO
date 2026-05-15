"use client"
import { useState } from "react"
import Link from "next/link"
import { updateParcelle } from "./action"
import { Toast, useToast } from "@/components/Toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { translateGeoName } from "@/lib/i18n/geo"
import { translateJustification } from "@/lib/i18n/justification"
import { mapApiCodeToStatus, EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"
import EudrOverrideControl from "../EudrOverrideControl"

interface ParcelleFormProps {
  parcelle: any
  producteurs: any[]
  zones: any[]
  pays: any[]
  isAdmin?: boolean
  overrideByName?: string | null
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

function CheckboxGroup({ items, selected, onToggle, labels }: { items: string[]; selected: string[]; onToggle: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
      {items.map(item => (
        <label key={item} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            className="accent-[#2ac1a3] rounded"
          />
          {labels?.[item] ?? item}
        </label>
      ))}
    </div>
  )
}

function readField(parcelle: any, ...keys: string[]): any {
  for (const key of keys) {
    const parts = key.split(".")
    let val: any = parcelle
    for (const p of parts) {
      val = val?.[p]
    }
    if (val !== undefined && val !== null && val !== "") return val
  }
  return ""
}

function readArray(parcelle: any, ...keys: string[]): string[] {
  for (const key of keys) {
    const parts = key.split(".")
    let val: any = parcelle
    for (const p of parts) val = val?.[p]
    if (Array.isArray(val)) return val
  }
  return []
}

export default function ParcelleForm({ parcelle, producteurs, zones, pays, isAdmin = false, overrideByName = null }: ParcelleFormProps) {
  const { t, locale } = useLanguage()
  const tp = t.parcelles
  const [loading, setLoading] = useState(false)
  const [gpxUploading, setGpxUploading] = useState(false)
  const [gpxAnalyse, setGpxAnalyse] = useState<any>(null)
  const { toast, showSuccess, showError, hideToast } = useToast()
  const paysLocked = pays.length === 1

  const initialPaysId = parcelle.pays_id
    ? String(parcelle.pays_id)
    : zones.find((z: any) => z.id === parcelle.zone_id)?.pays_id?.toString() || ""

  const [formData, setFormData] = useState({
    producteur_id: String(parcelle.producteur_id || ""),
    zone_id: String(parcelle.zone_id || ""),
    pays_id: initialPaysId,
    surface_ha: parcelle.surface_ha || "",
    culture: parcelle.culture || "Cacao",
    annee_plantation: parcelle.annee_plantation || "",
    date_creation: parcelle.date_creation || new Date().toISOString().split("T")[0],
    gpx_file_url: parcelle.gpx_file_url || "",
    status_eudr: parcelle.status_eudr || "",
    justification_eudr: parcelle.justification_eudr || "",
    eudr_verification_timestamp: parcelle.eudr_verification_timestamp || "",
    eudr_script_version: parcelle.eudr_script_version || "",
    geojson: parcelle.geojson || null,
    latitude: parcelle.latitude || "",
    longitude: parcelle.longitude || "",
    // Section 2 — read from flat or acces_terre_data JSONB
    mode_acces_terre: readField(parcelle, "mode_acces_terre", "acces_terre_data.mode_acces_terre"),
    mode_acces_autre: readField(parcelle, "mode_acces_autre", "acces_terre_data.mode_acces_autre"),
    autorisation_occupation: readField(parcelle, "autorisation_occupation", "acces_terre_data.autorisation_occupation"),
    type_autorisation: readField(parcelle, "type_autorisation", "acces_terre_data.type_autorisation"),
    autorite_ayant_accorde: readField(parcelle, "autorite_ayant_accorde", "acces_terre_data.autorite_ayant_accorde"),
    etat_site_creation: readField(parcelle, "etat_site_creation", "acces_terre_data.etat_site_creation", "acquisition_data.etat_site_creation"),
    // Section 3 — read from flat or semences_data JSONB
    provenance_semences: readField(parcelle, "provenance_semences", "semences_data.provenance_semences"),
    lieu_semences: readField(parcelle, "lieu_semences", "semences_data.lieu_semences"),
    fournisseur_semences: readField(parcelle, "fournisseur_semences", "semences_data.fournisseur_semences"),
    varietes_semences: readField(parcelle, "varietes_semences", "semences_data.varietes_semences"),
    systeme_agricole: readField(parcelle, "systeme_agricole", "semences_data.systeme_agricole"),
    arbres_accompagnons: readArray(parcelle, "arbres_accompagnons", "semences_data.arbres_accompagnons"),
    arbres_accompagnons_autre: readField(parcelle, "arbres_accompagnons_autre", "semences_data.arbres_accompagnons_autre"),
    nombre_arbres_accompagnons: readField(parcelle, "nombre_arbres_accompagnons", "semences_data.nombre_arbres_accompagnons"),
    // Section 4 — read from flat or sante_production_data JSONB
    signes_maladies: readField(parcelle, "signes_maladies", "sante_production_data.signes_maladies", "sante_data.signes_maladies"),
    identification_maladies: readArray(parcelle, "identification_maladies", "sante_production_data.identification_maladies", "sante_data.identification_maladies"),
    plantation_produit: readField(parcelle, "plantation_produit", "sante_production_data.plantation_produit", "sante_data.plantation_produit"),
    recolte_annee_derniere: readField(parcelle, "recolte_annee_derniere", "sante_production_data.recolte_annee_derniere", "sante_data.recolte_annee_derniere"),
    quantite_recoltee: readField(parcelle, "quantite_recoltee", "sante_production_data.quantite_recoltee", "sante_data.quantite_recoltee"),
    // Section 5 — read from flat or formation_entretien_data JSONB
    formations_recues: readField(parcelle, "formations_recues", "formation_entretien_data.formations_recues", "formation_data.formations_recues"),
    operations_entretien: readArray(parcelle, "operations_entretien", "formation_entretien_data.operations_entretien", "formation_data.operations_entretien"),
    operations_entretien_autre: readField(parcelle, "operations_entretien_autre", "formation_entretien_data.operations_entretien_autre"),
    utilisation_pesticides: readField(parcelle, "utilisation_pesticides", "formation_entretien_data.utilisation_pesticides", "formation_data.utilisation_pesticides"),
    etat_plantation_enquete: readField(parcelle, "etat_plantation_enquete", "formation_entretien_data.etat_plantation_enquete", "formation_data.etat_plantation_enquete"),
  })

  const filteredZones = formData.pays_id
    ? zones.filter((z: any) => z.pays_id === parseInt(formData.pays_id))
    : zones

  const filteredProducteurs = formData.zone_id
    ? producteurs.filter((p: any) => p.zone_id === parseInt(formData.zone_id))
    : formData.pays_id
    ? producteurs.filter((p: any) => p.pays_id === parseInt(formData.pays_id))
    : producteurs

  function handlePaysChange(val: string) {
    const currentZoneStillValid = val
      ? zones.some((z: any) => z.id === parseInt(formData.zone_id) && z.pays_id === parseInt(val))
      : true
    const newZoneId = currentZoneStillValid ? formData.zone_id : ""
    const currentProdStillValid = newZoneId
      ? producteurs.some((p: any) => p.id === parseInt(formData.producteur_id) && p.zone_id === parseInt(newZoneId))
      : false
    setFormData(prev => ({ ...prev, pays_id: val, zone_id: newZoneId, producteur_id: currentProdStillValid ? prev.producteur_id : "" }))
  }

  function handleZoneChange(val: string) {
    const prodStillValid = val
      ? producteurs.some((p: any) => p.id === parseInt(formData.producteur_id) && p.zone_id === parseInt(val))
      : false
    const zoneObj = zones.find((z: any) => z.id === parseInt(val))
    setFormData(prev => ({ ...prev, zone_id: val, pays_id: zoneObj?.pays_id?.toString() || prev.pays_id, producteur_id: prodStillValid ? prev.producteur_id : "" }))
  }

  function handleProducteurChange(val: string) {
    if (!val) { setFormData(prev => ({ ...prev, producteur_id: "" })); return }
    const p = producteurs.find((p: any) => p.id === parseInt(val))
    setFormData(prev => ({ ...prev, producteur_id: val, zone_id: p?.zone_id?.toString() || prev.zone_id, pays_id: p?.pays_id?.toString() || prev.pays_id }))
  }

  const toggle = (field: string, value: string) => {
    setFormData(prev => {
      const arr = (prev as any)[field] as string[]
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] }
    })
  }

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".gpx")) { showError(t.errors.gpxOnly); return }
    if (file.size > 10 * 1024 * 1024) { showError(t.errors.gpxTooLarge); return }
    setGpxUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (formData.annee_plantation) fd.append("annee_plantation", String(formData.annee_plantation))
      const response = await fetch(`/api/upload-gpx?locale=${locale}`, { method: "POST", body: fd })
      const result = await response.json()
      if (result.success) {
        const status =
          normalizeEudrStatus(result.eudr_status) ??
          mapApiCodeToStatus(result.eudr_status) ??
          EUDR_STATUS.EN_ATTENTE
        setFormData(prev => ({
          ...prev,
          gpx_file_url: result.gpx_file_url,
          latitude: result.latitude,
          longitude: result.longitude,
          surface_ha: result.surface_ha,
          status_eudr: status,
          justification_eudr: result.justification || "",
          eudr_verification_timestamp: result.verification_timestamp || "",
          eudr_script_version: result.script_version || "",
          geojson: result.geojson || null,
        }))
        setGpxAnalyse(result)
        showSuccess(t.actions.gpxSuccess)
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
    const result = await updateParcelle(parcelle.id, formData)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="space-y-1 mb-8">
        <Link href={`/parcelles/${parcelle.id}`} className="text-xs text-gray-400 tracking-widest uppercase hover:text-[#2ac1a3] transition">
          ← {tp.backToList.replace("← ", "")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{tp.formEdit}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-10">

          {/* SECTION 1: IDENTIFICATION */}
          <div className="pb-10 border-b border-gray-200">
            <SectionTitle num="1" title={tp.section1} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className={labelClass}>{tp.labelPays}</label>
                <select value={formData.pays_id} onChange={e => handlePaysChange(e.target.value)} className={selectClass} disabled={paysLocked} required>
                  <option value="">{tp.selectPays}</option>
                  {pays.map((p: any) => <option key={p.id} value={p.id}>{translateGeoName(p.nom, locale)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{tp.labelZone}</label>
                <select value={formData.zone_id} onChange={e => handleZoneChange(e.target.value)} className={selectClass} required>
                  <option value="">{tp.selectZone}</option>
                  {filteredZones.map((z: any) => <option key={z.id} value={z.id}>{translateGeoName(z.nom, locale)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>{tp.labelProducteur}</label>
                <select value={formData.producteur_id} onChange={e => handleProducteurChange(e.target.value)} className={selectClass} required>
                  <option value="">{tp.selectProducteur}</option>
                  {filteredProducteurs.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.code_producteur} – {p.nom} {p.prenom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACQUISITION ET ACCÈS À LA TERRE */}
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

          {/* SECTION 3: SEMENCES ET SYSTÈME AGRICOLE */}
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
                <CheckboxGroup
                  items={["Avocatier", "Safoutier", "Manguier", "Palmier", "Bananier", "Papayer", "Autre", "Aucun"]}
                  selected={formData.arbres_accompagnons}
                  onToggle={v => toggle("arbres_accompagnons", v)}
                  labels={tp.optionLabels}
                />
              </div>
              <div>
                <label className={labelClass}>{tp.labelNombreArbres}</label>
                <input type="number" value={formData.nombre_arbres_accompagnons} onChange={e => setFormData({ ...formData, nombre_arbres_accompagnons: e.target.value })} placeholder="Ex. 45" className={inputClass} />
              </div>
            </div>
          </div>

          {/* SECTION 4: SANTÉ ET PRODUCTION */}
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
                <CheckboxGroup
                  items={["Pourriture brune", "Miride", "Chenille", "Swollen Shoot", "Autre", "Aucun"]}
                  selected={formData.identification_maladies}
                  onToggle={v => toggle("identification_maladies", v)}
                  labels={tp.optionLabels}
                />
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

          {/* SECTION 5: FORMATION ET ENTRETIEN */}
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
                <CheckboxGroup
                  items={["Désherbage", "Élagage", "Fertilisation", "Traitement", "Récolte sanitaire", "Autre", "Aucun"]}
                  selected={formData.operations_entretien}
                  onToggle={v => toggle("operations_entretien", v)}
                  labels={tp.optionLabels}
                />
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

          {/* SECTION 6: GÉOLOCALISATION GPS */}
          <div>
            <SectionTitle num="6" title={tp.section6} />
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 mb-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-500 font-medium">📂 {tp.labelGpxFile}</span>
                <input
                  type="file"
                  accept=".gpx,application/gpx+xml"
                  onChange={handleGpxUpload}
                  disabled={gpxUploading}
                  className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 disabled:opacity-50"
                />
              </div>
            </div>

            {gpxUploading && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-yellow-700 font-medium">{tp.gpxUploading}</p>
              </div>
            )}

            {(gpxAnalyse || formData.gpx_file_url) && (
              <div className="mb-4 p-4 bg-[#e6f9f5] border border-[#2ac1a3]/30 rounded-lg">
                <p className="text-sm font-bold text-[#2ac1a3] mb-2">{tp.gpxSuccess}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  {formData.latitude && formData.longitude && (
                    <p>{tp.gpxLatLon(String(formData.latitude), String(formData.longitude))}</p>
                  )}
                  {gpxAnalyse && (
                    <p>{tp.gpxSurface(gpxAnalyse.surface_ha, gpxAnalyse.nb_points)}</p>
                  )}
                  {formData.status_eudr && (() => {
                    const norm = normalizeEudrStatus(formData.status_eudr)
                    const statusLabel =
                      norm === EUDR_STATUS.CONFORME ? tp.eudrConforme :
                      norm === EUDR_STATUS.RISQUE ? tp.eudrRisque :
                      norm === EUDR_STATUS.EN_ATTENTE ? tp.eudrEnAttente :
                      formData.status_eudr
                    const colorClass =
                      norm === EUDR_STATUS.CONFORME ? "text-[#2ac1a3]" :
                      norm === EUDR_STATUS.RISQUE ? "text-yellow-600" :
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

            {(isAdmin || parcelle.eudr_admin_override) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className={labelClass}>{tp.overrideModalTitle}</label>
                <EudrOverrideControl
                  parcelleId={parcelle.id}
                  currentStatus={formData.status_eudr || parcelle.status_eudr}
                  overrideActive={!!parcelle.eudr_admin_override}
                  overrideReason={parcelle.eudr_admin_override_reason ?? null}
                  overrideAt={parcelle.eudr_admin_override_at ?? null}
                  overrideByName={overrideByName}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </div>

        </div>

        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={loading} className="bg-[#2ac1a3] text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] disabled:opacity-50 transition">
            {loading ? tp.btnSaving : tp.btnSave}
          </button>
        </div>
      </form>
    </>
  )
}
