"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createParcelle } from "./actions"
import { supabase } from "@/lib/supabase"
import { Toast, useToast } from "@/components/Toast"

interface ParcelleFormProps {
  producteurs: any[]
  zones: any[]
  returnTo?: string
  producteurPreselectionne?: string
}

export default function ParcelleForm({ 
  producteurs, 
  zones, 
  returnTo,
  producteurPreselectionne 
}: ParcelleFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [filteredProducteurs, setFilteredProducteurs] = useState(producteurs)
  const [producteurBloque, setProducteurBloque] = useState(!!producteurPreselectionne)
  const [gpxUploading, setGpxUploading] = useState(false)
  const [gpxAnalyse, setGpxAnalyse] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    // EXISTANT
    producteur_id: producteurPreselectionne || "",
    zone_id: "",
    pays_id: "",
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
    date_creation: new Date().toISOString().split('T')[0],
    
    // NOUVEAU - Contexte enquête
    localite_enquete: "",
    secteur_agricole: "",
    structure_embauche_enqueteur: "",
    identite_enquete: "",
    
    // NOUVEAU - Propriété
    appartenance_plantation: "",
    nom_proprietaire: "",
    nom_collectivite_proprietaire: "",
    statut_zone: "",
    nombre_plantations_total: "",
    
    // NOUVEAU - Acquisition
    mode_acquisition: "",
    annee_creation: "",
    annee_heritage: "",
    annee_achat: "",
    etat_site_creation: "",
    cultures_precedentes: [] as string[],
    heritage_de: "",
    heritage_autre_precision: "",
    
    // NOUVEAU - Structure plantation
    structure_plantation: "",
    distinction_parcelles: "",
    mode_acces_terre: "",
    mode_acces_autre: "",
    autorisation_occupation: "",
    type_autorisation: "",
    autorite_ayant_accorde: "",
    
    // NOUVEAU - Semences & Système
    provenance_semences: "",
    lieu_semences: "",
    fournisseur_semences: "",
    varietes_semences: "",
    systeme_agricole: "",
    arbres_accompagnons: [] as string[],
    arbres_accompagnons_autre: "",
    nombre_arbres_accompagnons: "",
    
    // NOUVEAU - Santé & Production
    signes_maladies: "",
    identification_maladies: [] as string[],
    plantation_produit: "",
    recolte_annee_derniere: "",
    quantite_recoltee: "",
    
    // NOUVEAU - Formation & Entretien
    formations_recues: "",
    operations_entretien: [] as string[],
    operations_entretien_autre: "",
    utilisation_pesticides: "",
    etat_plantation_enquete: "",
    
    // NOUVEAU - Estimations
    age_estimatif_plantation: "",
    niveau_maitrise_bpa: ""
  })

  useEffect(() => {
    if (formData.zone_id) {
      const filtered = producteurs.filter(p => p.zone_id === parseInt(formData.zone_id))
      setFilteredProducteurs(filtered)
    } else {
      setFilteredProducteurs(producteurs)
    }
  }, [formData.zone_id, producteurs])

  useEffect(() => {
    if (formData.producteur_id) {
      const producteur = producteurs.find(p => p.id === parseInt(formData.producteur_id))
      if (producteur) {
        setFormData(prev => ({
          ...prev,
          zone_id: producteur.zone_id?.toString() || "",
          pays_id: producteur.pays_id?.toString() || ""
        }))
      }
    }
  }, [formData.producteur_id, producteurs])

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      showError("Seuls les fichiers .gpx sont acceptes")
      return
    }

    // Validate max file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      showError("Le fichier ne doit pas depasser 10 Mo")
      return
    }

    setGpxUploading(true)

    try {
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parcelles-gpx')
        .upload(fileName, file)

      if (uploadError) {
        showError("Erreur upload : " + uploadError.message)
        setGpxUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('parcelles-gpx')
        .getPublicUrl(fileName)

      const response = await fetch('/api/analyse-gpx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gpx_url: publicUrl,
          annee_plantation: formData.annee_plantation || null
        })
      })

      const result = await response.json()

      if (result.success) {
        // Map EUDR status from API to display format
        const statusMap: Record<string, string> = {
          'compliant': 'CONFORME',
          'alert': 'RISQUE NON NEGLIGEABLE',
          'pending_review': 'EN ATTENTE'
        }
        setFormData(prev => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
          surface_ha: result.surface_ha,
          gpx_file_url: publicUrl,
          status_eudr: statusMap[result.eudr_status] || result.eudr_status,
          justification_eudr: result.justification || "",
          eudr_verification_timestamp: result.verification_timestamp || "",
          eudr_script_version: result.script_version || "",
          geojson: result.geojson || null
        }))

        setGpxAnalyse(result)
        showSuccess("GPX analyse avec succes !")
      } else {
        showError("Erreur analyse : " + result.error)
      }
    } catch (error: any) {
      showError("Erreur : " + error.message)
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
      showError("Erreur: " + result.error)
      setLoading(false)
    }
  }

  const handleArrayToggle = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value]
      }
    })
  }

  return (
    <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow p-8 max-w-5xl">
      
      {/* SECTION 1: IDENTIFICATION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">1️⃣ Identification de l'enquête</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Zone *</label>
            <select value={formData.zone_id} onChange={(e) => setFormData({...formData, zone_id: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required disabled={producteurBloque}>
              <option value="">Sélectionner une zone</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Producteur *</label>
            <div className="flex gap-2">
              <select value={formData.producteur_id} onChange={(e) => setFormData({...formData, producteur_id: e.target.value})} className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required disabled={producteurBloque || !formData.zone_id}>
                <option value="">{!formData.zone_id ? "Sélectionnez d'abord une zone" : "Sélectionner un producteur"}</option>
                {filteredProducteurs.map(p => <option key={p.id} value={p.id}>{p.code_producteur} - {p.nom} {p.prenom}</option>)}
              </select>
              {producteurBloque && (
                <button type="button" onClick={() => {setProducteurBloque(false); setFormData(prev => ({...prev, producteur_id: "", zone_id: ""}))}} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">🔓 Changer</button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Localité de l'enquête</label>
            <input type="text" value={formData.localite_enquete} onChange={(e) => setFormData({...formData, localite_enquete: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Secteur agricole</label>
            <input type="text" value={formData.secteur_agricole} onChange={(e) => setFormData({...formData, secteur_agricole: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Structure d'embauche de l'enquêteur</label>
            <input type="text" value={formData.structure_embauche_enqueteur} onChange={(e) => setFormData({...formData, structure_embauche_enqueteur: e.target.value})} placeholder="Ex: ASV, Lonswiss..." className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Identité de l'enquêté</label>
            <input type="text" value={formData.identite_enquete} onChange={(e) => setFormData({...formData, identite_enquete: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* SECTION 2: PROPRIÉTÉ */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">2️⃣ Propriété de la plantation</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">À qui appartient cette plantation?</label>
            <select value={formData.appartenance_plantation} onChange={(e) => setFormData({...formData, appartenance_plantation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Propriétaire">Propriétaire</option>
              <option value="Copropriétaire">Copropriétaire</option>
              <option value="Collectivité">Collectivité</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Nom du propriétaire</label>
            <input type="text" value={formData.nom_proprietaire} onChange={(e) => setFormData({...formData, nom_proprietaire: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Nom de la collectivité propriétaire</label>
            <input type="text" value={formData.nom_collectivite_proprietaire} onChange={(e) => setFormData({...formData, nom_collectivite_proprietaire: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Statut de la zone</label>
            <select value={formData.statut_zone} onChange={(e) => setFormData({...formData, statut_zone: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Zone agricole">Zone agricole</option>
              <option value="Zone protégée">Zone protégée</option>
              <option value="Zone mixte">Zone mixte</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Combien de plantations avez-vous?</label>
            <input type="number" value={formData.nombre_plantations_total} onChange={(e) => setFormData({...formData, nombre_plantations_total: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* SECTION 3: ACQUISITION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">3️⃣ Historique d'acquisition</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Comment avez-vous obtenu cette plantation?</label>
            <select value={formData.mode_acquisition} onChange={(e) => setFormData({...formData, mode_acquisition: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Création">Création</option>
              <option value="Héritage">Héritage</option>
              <option value="Achat">Achat</option>
              <option value="Don">Don</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {formData.mode_acquisition === "Création" && (
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-2">Année de création</label>
              <input type="number" value={formData.annee_creation} onChange={(e) => setFormData({...formData, annee_creation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
            </div>
          )}

          {formData.mode_acquisition === "Héritage" && (
            <>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Année d'héritage</label>
                <input type="number" value={formData.annee_heritage} onChange={(e) => setFormData({...formData, annee_heritage: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Auprès de qui l'avez-vous héritée?</label>
                <select value={formData.heritage_de} onChange={(e) => setFormData({...formData, heritage_de: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
                  <option value="">Sélectionner</option>
                  <option value="Père">Père</option>
                  <option value="Mère">Mère</option>
                  <option value="Grand-père">Grand-père</option>
                  <option value="Autre parent">Autre parent</option>
                </select>
              </div>
              {formData.heritage_de === "Autre parent" && (
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">Précisez</label>
                  <input type="text" value={formData.heritage_autre_precision} onChange={(e) => setFormData({...formData, heritage_autre_precision: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
                </div>
              )}
            </>
          )}

          {formData.mode_acquisition === "Achat" && (
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-2">Année d'achat</label>
              <input type="number" value={formData.annee_achat} onChange={(e) => setFormData({...formData, annee_achat: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Quel était l'état du site au moment de sa création?</label>
            <select value={formData.etat_site_creation} onChange={(e) => setFormData({...formData, etat_site_creation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Forêt primaire">Forêt primaire</option>
              <option value="Forêt secondaire">Forêt secondaire</option>
              <option value="Jachère">Jachère</option>
              <option value="Ancien champ agricole">Ancien champ agricole</option>
              <option value="Savane">Savane</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Quelles cultures s'y trouvaient? (max 5)</label>
            <div className="grid grid-cols-4 gap-2">
              {["Cacao", "Café", "Manioc", "Maïs", "Banane", "Palmier", "Aucune", "Autre"].map(c => (
                <label key={c} className="flex items-center space-x-2 text-gray-900 text-sm">
                  <input type="checkbox" checked={formData.cultures_precedentes.includes(c)} onChange={() => handleArrayToggle("cultures_precedentes", c)} className="rounded" disabled={formData.cultures_precedentes.length >= 5 && !formData.cultures_precedentes.includes(c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Comment est structurée cette plantation?</label>
            <select value={formData.structure_plantation} onChange={(e) => setFormData({...formData, structure_plantation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Monoculture">Monoculture</option>
              <option value="Agroforesterie">Agroforesterie</option>
              <option value="Mixte">Mixte</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Pouvez-vous distinguer les parcelles?</label>
            <select value={formData.distinction_parcelles} onChange={(e) => setFormData({...formData, distinction_parcelles: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACCÈS TERRE */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">4️⃣ Accès à la terre</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Comment avez-vous eu accès à la terre?</label>
            <select value={formData.mode_acces_terre} onChange={(e) => setFormData({...formData, mode_acces_terre: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Propriété familiale">Propriété familiale</option>
              <option value="Achat">Achat</option>
              <option value="Location">Location</option>
              <option value="Don">Don</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {formData.mode_acces_terre === "Autre" && (
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-2">Précisez le mode d'acquisition</label>
              <input type="text" value={formData.mode_acces_autre} onChange={(e) => setFormData({...formData, mode_acces_autre: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
            </div>
          )}

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Avez-vous obtenu une autorisation d'occupation?</label>
            <select value={formData.autorisation_occupation} onChange={(e) => setFormData({...formData, autorisation_occupation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          {formData.autorisation_occupation === "Oui" && (
            <>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Type d'autorisation</label>
                <select value={formData.type_autorisation} onChange={(e) => setFormData({...formData, type_autorisation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
                  <option value="">Sélectionner</option>
                  <option value="Titre foncier">Titre foncier</option>
                  <option value="Autorisation verbale">Autorisation verbale</option>
                  <option value="Autorisation écrite">Autorisation écrite</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-900 text-sm font-medium mb-2">Qui vous l'avait accordée?</label>
                <input type="text" value={formData.autorite_ayant_accorde} onChange={(e) => setFormData({...formData, autorite_ayant_accorde: e.target.value})} placeholder="Ex: Chef de village, autorité administrative..." className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 5: SEMENCES & SYSTÈME */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">5️⃣ Semences et système agricole</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Provenance des semences</label>
            <select value={formData.provenance_semences} onChange={(e) => setFormData({...formData, provenance_semences: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Connue">Connue</option>
              <option value="Inconnue">Inconnue</option>
            </select>
          </div>

          {formData.provenance_semences === "Connue" && (
            <>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Où avez-vous trouvé les semences?</label>
                <input type="text" value={formData.lieu_semences} onChange={(e) => setFormData({...formData, lieu_semences: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Qui vous les avait fourni?</label>
                <input type="text" value={formData.fournisseur_semences} onChange={(e) => setFormData({...formData, fournisseur_semences: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">De quelles variétés?</label>
                <input type="text" value={formData.varietes_semences} onChange={(e) => setFormData({...formData, varietes_semences: e.target.value})} placeholder="Forastero, Trinitario..." className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Système agricole</label>
            <select value={formData.systeme_agricole} onChange={(e) => setFormData({...formData, systeme_agricole: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Monoculture">Monoculture</option>
              <option value="Agroforesterie simple">Agroforesterie simple</option>
              <option value="Agroforesterie complexe">Agroforesterie complexe</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Arbres accompagnons présents</label>
            <div className="grid grid-cols-4 gap-2">
              {["Avocatier", "Safoutier", "Manguier", "Palmier", "Bananier", "Papayer", "Autre", "Aucun"].map(a => (
                <label key={a} className="flex items-center space-x-2 text-gray-900 text-sm">
                  <input type="checkbox" checked={formData.arbres_accompagnons.includes(a)} onChange={() => handleArrayToggle("arbres_accompagnons", a)} className="rounded" />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.arbres_accompagnons.includes("Autre") && (
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-2">Précisez les autres arbres</label>
              <input type="text" value={formData.arbres_accompagnons_autre} onChange={(e) => setFormData({...formData, arbres_accompagnons_autre: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
            </div>
          )}

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Nombre d'arbres accompagnons (estimation)</label>
            <input type="number" value={formData.nombre_arbres_accompagnons} onChange={(e) => setFormData({...formData, nombre_arbres_accompagnons: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* SECTION 6: SANTÉ & PRODUCTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">6️⃣ Santé et production</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Signes de maladies ou ravageurs?</label>
            <select value={formData.signes_maladies} onChange={(e) => setFormData({...formData, signes_maladies: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          {formData.signes_maladies === "Oui" && (
            <div className="col-span-2">
              <label className="block text-gray-900 text-sm font-medium mb-2">Identification des maladies</label>
              <div className="grid grid-cols-3 gap-2">
                {["Pourriture brune", "Miride", "Chenille", "Swollen shoot", "Autre"].map(m => (
                  <label key={m} className="flex items-center space-x-2 text-gray-900 text-sm">
                    <input type="checkbox" checked={formData.identification_maladies.includes(m)} onChange={() => handleArrayToggle("identification_maladies", m)} className="rounded" />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">La plantation produit-elle déjà?</label>
            <select value={formData.plantation_produit} onChange={(e) => setFormData({...formData, plantation_produit: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          {formData.plantation_produit === "Oui" && (
            <>
              <div>
                <label className="block text-gray-900 text-sm font-medium mb-2">Récolté l'année dernière?</label>
                <select value={formData.recolte_annee_derniere} onChange={(e) => setFormData({...formData, recolte_annee_derniere: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
                  <option value="">Sélectionner</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
              {formData.recolte_annee_derniere === "Oui" && (
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">Quantité récoltée (kg)</label>
                  <input type="number" value={formData.quantite_recoltee} onChange={(e) => setFormData({...formData, quantite_recoltee: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SECTION 7: FORMATION & ENTRETIEN */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">7️⃣ Formation et entretien</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Avez-vous reçu des formations?</label>
            <select value={formData.formations_recues} onChange={(e) => setFormData({...formData, formations_recues: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Opérations d'entretien appliquées</label>
            <div className="grid grid-cols-4 gap-2">
              {["Désherbage", "Élagage", "Fertilisation", "Traitement phytosanitaire", "Récolte sanitaire", "Autre", "Aucune"].map(o => (
                <label key={o} className="flex items-center space-x-2 text-gray-900 text-sm">
                  <input type="checkbox" checked={formData.operations_entretien.includes(o)} onChange={() => handleArrayToggle("operations_entretien", o)} className="rounded" />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.operations_entretien.includes("Autre") && (
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-2">Précisez les autres opérations</label>
              <input type="text" value={formData.operations_entretien_autre} onChange={(e) => setFormData({...formData, operations_entretien_autre: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
            </div>
          )}

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Utilisez-vous des pesticides?</label>
            <select value={formData.utilisation_pesticides} onChange={(e) => setFormData({...formData, utilisation_pesticides: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">État de la plantation (au moment de l'enquête)</label>
            <select value={formData.etat_plantation_enquete} onChange={(e) => setFormData({...formData, etat_plantation_enquete: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Excellent">Excellent</option>
              <option value="Bon">Bon</option>
              <option value="Moyen">Moyen</option>
              <option value="Dégradé">Dégradé</option>
              <option value="Très dégradé">Très dégradé</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 8: GÉOLOCALISATION GPS */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">8️⃣ Géolocalisation GPS</h2>
        
        {/* Point GPS manuel */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Latitude *</label>
            <input type="number" step="0.000001" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Longitude *</label>
            <input type="number" step="0.000001" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Altitude (m)</label>
            <input type="number" step="0.1" value={formData.altitude} onChange={(e) => setFormData({...formData, altitude: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Précision GPS (m)</label>
            <input type="number" step="0.1" value={formData.precision_gps} onChange={(e) => setFormData({...formData, precision_gps: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
        </div>

        {/* Upload GPX */}
        <div className="space-y-4 p-4 bg-white/50 rounded-lg">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">
              📂 Fichier GPX (trace complète de la parcelle)
            </label>
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleGpxUpload}
              disabled={gpxUploading}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg disabled:opacity-50"
            />
            <p className="text-gray-500 text-xs mt-1">
              Le fichier GPX remplacera les coordonnées manuelles et calculera automatiquement la surface
            </p>
          </div>

          {gpxUploading && (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-700">⏳ Upload et analyse en cours...</p>
            </div>
          )}

          {gpxAnalyse && (
            <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-700 font-semibold mb-2">✅ GPX analysé avec succès</p>
              <div className="space-y-1 text-gray-500 text-sm">
                <p>📍 <strong>Latitude :</strong> {gpxAnalyse.latitude} | <strong>Longitude :</strong> {gpxAnalyse.longitude}</p>
                <p>📏 <strong>Surface calculée :</strong> {gpxAnalyse.surface_ha} ha ({gpxAnalyse.nb_points} points GPS)</p>
                {gpxAnalyse.eudr_status && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className={`font-semibold ${
                      gpxAnalyse.eudr_status === 'CONFORME' ? 'text-green-700' :
                      gpxAnalyse.eudr_status === 'RISQUE NON NÉGLIGEABLE' ? 'text-yellow-700' :
                      'text-red-400'
                    }`}>
                      🌍 EUDR : {gpxAnalyse.eudr_status}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{gpxAnalyse.justification}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Surface et année plantation */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Surface (ha) *</label>
            <input type="number" step="0.01" value={formData.surface_ha} onChange={(e) => setFormData({...formData, surface_ha: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required />
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-gray-900 text-sm">
              <input type="checkbox" checked={formData.surface_estimee} onChange={(e) => setFormData({...formData, surface_estimee: e.target.checked})} className="rounded" />
              <span>Surface estimée</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Âge estimatif de la plantation (années)</label>
            <input type="number" value={formData.age_estimatif_plantation} onChange={(e) => setFormData({...formData, age_estimatif_plantation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Année de plantation</label>
            <input type="number" value={formData.annee_plantation} onChange={(e) => setFormData({...formData, annee_plantation: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* SECTION 9: CULTURE */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">9️⃣ Type de culture</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Culture principale *</label>
            <select value={formData.culture} onChange={(e) => setFormData({...formData, culture: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" required>
              <option value="Cacao">Cacao</option>
              <option value="Café">Café</option>
              <option value="Palmier à huile">Palmier à huile</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Niveau de maîtrise des BPA</label>
            <select value={formData.niveau_maitrise_bpa} onChange={(e) => setFormData({...formData, niveau_maitrise_bpa: e.target.value})} className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg">
              <option value="">Sélectionner</option>
              <option value="Excellent">Excellent</option>
              <option value="Bon">Bon</option>
              <option value="Moyen">Moyen</option>
              <option value="Faible">Faible</option>
              <option value="Aucun">Aucun</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 10: LÉGALITÉ */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">🔟 Conformité EUDR</h2>
        <div className="space-y-4">
          <label className="flex items-start space-x-3 text-gray-900">
            <input type="checkbox" checked={formData.declaration_legalite} onChange={(e) => setFormData({...formData, declaration_legalite: e.target.checked})} className="rounded mt-1" />
            <span className="text-sm">✅ Déclaration de légalité EUDR</span>
          </label>
          <label className="flex items-start space-x-3 text-gray-900">
            <input type="checkbox" checked={formData.consentement_producteur} onChange={(e) => setFormData({...formData, consentement_producteur: e.target.checked})} className="rounded mt-1" />
            <span className="text-sm">✅ Consentement libre et éclairé du producteur</span>
          </label>
        </div>
      </div>

      {/* BOUTONS */}
      <div className="flex gap-4 pt-8 border-t border-gray-200">
        <button type="submit" disabled={loading} className="bg-[#2AC1A3] text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 disabled:opacity-50">
          {loading ? "⏳ Création..." : "✅ Créer la parcelle"}
        </button>
        <Link href={returnTo || (producteurPreselectionne ? `/producteurs/${producteurPreselectionne}` : "/parcelles")} className="bg-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-300">
          Annuler
        </Link>
      </div>
    </form>
    </>
  )
}