"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createProducteur } from "./actions"

interface ProducteurFormProps {
  zones: any[]
  pays: any[]
  villages: any[]
  returnTo?: string
}

export default function ProducteurForm({ zones, pays, villages, returnTo }: ProducteurFormProps) {
  const [loading, setLoading] = useState(false)
  const [filteredZones, setFilteredZones] = useState(zones)
  const [filteredVillages, setFilteredVillages] = useState(villages || [])
  const [showAutreActivites, setShowAutreActivites] = useState(false)
  
  // Debug
  console.log("Villages reçus:", villages?.length || 0, villages)
  console.log("Zones reçues:", zones?.length || 0)
  console.log("Pays reçus:", pays?.length || 0)
  
  const [formData, setFormData] = useState({
    // Identification
    nom: "",
    prenom: "",
    sexe: "Homme",
    annee_naissance: "",
    nationalite: "",
    telephone: "",
    
    // Localisation (ordre: pays → zone → village)
    pays_id: "",
    zone_id: "",
    village: "",
    
    // Structure et rôle
    structure_embauche: "",
    role_activite_cacao: "",
    type_proprietaire: "",
    communaute: "",
    
    // Activités
    autres_activites: [] as string[],
    autres_activites_details: [] as string[],
    source_principale_revenus: "",
    cultures_phares: [] as string[],
    autres_cultures: [] as string[],
    place_cacao: "",
    
    // Exploitation cacaoyère
    main_oeuvre_supplementaire: "",
    recolte_annee_derniere: "",
    usage_cacao_recolte: [] as string[],
    mode_vente: [] as string[],
    kilos_vendus: "",
    prix_kilo: "",
    lieu_vente: "",
    acheteur: [] as string[],
    
    // Système
    statut: "Actif",
    date_enregistrement: new Date().toISOString().split('T')[0]
  })

  // Filtrer zones quand pays change
  useEffect(() => {
    if (formData.pays_id) {
      const filtered = zones.filter(z => z.pays_id === parseInt(formData.pays_id))
      setFilteredZones(filtered)
      setFormData(prev => ({ ...prev, zone_id: "", village: "" }))
    } else {
      setFilteredZones(zones)
    }
  }, [formData.pays_id, zones])

  // Filtrer villages quand zone change
  useEffect(() => {
    console.log("=== DEBUG VILLAGES ===")
    console.log("formData.zone_id:", formData.zone_id, typeof formData.zone_id)
    console.log("Tous les villages:", villages)
    
    if (formData.zone_id && villages && villages.length > 0) {
      console.log("Filtrage en cours...")
      const filtered = villages.filter(v => {
        console.log(`Village ${v.nom}: v.zone_id=${v.zone_id} (${typeof v.zone_id}) vs formData.zone_id=${parseInt(formData.zone_id)} (${typeof parseInt(formData.zone_id)})`)
        return v.zone_id === parseInt(formData.zone_id)
      })
      console.log("Villages filtrés:", filtered)
      setFilteredVillages(filtered)
      setFormData(prev => ({ ...prev, village: "" }))
    } else {
      console.log("Pas de filtrage: zone_id vide ou pas de villages")
      setFilteredVillages([])
    }
  }, [formData.zone_id, villages])

  // Afficher champ "Autre" si sélectionné
  useEffect(() => {
    setShowAutreActivites(formData.autres_activites.includes("Autre"))
  }, [formData.autres_activites])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createProducteur(formData, returnTo)
    
    if (result?.error) {
      alert("Erreur: " + result.error)
      setLoading(false)
    }
  }

  const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      const updated = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return { ...prev, [field]: updated }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e272e] rounded-lg shadow p-8 max-w-4xl">
      {/* SECTION 1: IDENTIFICATION */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">1. Identification</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-text text-sm font-medium mb-2">Nom *</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Prénom</label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Sexe *</label>
            <select
              value={formData.sexe}
              onChange={(e) => setFormData({...formData, sexe: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              required
            >
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Année de naissance</label>
            <input
              type="number"
              value={formData.annee_naissance}
              onChange={(e) => setFormData({...formData, annee_naissance: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Nationalité</label>
            <select
              value={formData.nationalite}
              onChange={(e) => setFormData({...formData, nationalite: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Algérie">Algérie</option>
              <option value="Angola">Angola</option>
              <option value="Bénin">Bénin</option>
              <option value="Botswana">Botswana</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="Cameroun">Cameroun</option>
              <option value="Cap-Vert">Cap-Vert</option>
              <option value="République Centrafricaine">République Centrafricaine</option>
              <option value="Tchad">Tchad</option>
              <option value="Comores">Comores</option>
              <option value="Congo">Congo</option>
              <option value="RDC">RDC</option>
              <option value="Côte d'Ivoire">Côte d'Ivoire</option>
              <option value="Djibouti">Djibouti</option>
              <option value="Égypte">Égypte</option>
              <option value="Guinée Équatoriale">Guinée Équatoriale</option>
              <option value="Érythrée">Érythrée</option>
              <option value="Eswatini">Eswatini</option>
              <option value="Éthiopie">Éthiopie</option>
              <option value="Gabon">Gabon</option>
              <option value="Gambie">Gambie</option>
              <option value="Ghana">Ghana</option>
              <option value="Guinée">Guinée</option>
              <option value="Guinée-Bissau">Guinée-Bissau</option>
              <option value="Kenya">Kenya</option>
              <option value="Lesotho">Lesotho</option>
              <option value="Liberia">Liberia</option>
              <option value="Libye">Libye</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Malawi">Malawi</option>
              <option value="Mali">Mali</option>
              <option value="Mauritanie">Mauritanie</option>
              <option value="Maurice">Maurice</option>
              <option value="Maroc">Maroc</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Namibie">Namibie</option>
              <option value="Niger">Niger</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Sao Tomé-et-Principe">Sao Tomé-et-Principe</option>
              <option value="Sénégal">Sénégal</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Somalie">Somalie</option>
              <option value="Afrique du Sud">Afrique du Sud</option>
              <option value="Soudan du Sud">Soudan du Sud</option>
              <option value="Soudan">Soudan</option>
              <option value="Tanzanie">Tanzanie</option>
              <option value="Togo">Togo</option>
              <option value="Tunisie">Tunisie</option>
              <option value="Ouganda">Ouganda</option>
              <option value="Zambie">Zambie</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Téléphone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({...formData, telephone: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: LOCALISATION */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">2. Localisation</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-text text-sm font-medium mb-2">Pays *</label>
            <select
              value={formData.pays_id}
              onChange={(e) => setFormData({...formData, pays_id: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Sélectionner un pays</option>
              {pays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Zone *</label>
            <select
              value={formData.zone_id}
              onChange={(e) => setFormData({...formData, zone_id: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              required
              disabled={!formData.pays_id}
            >
              <option value="">Sélectionner une zone</option>
              {filteredZones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-text text-sm font-medium mb-2">Village *</label>
            <select
              value={formData.village}
              onChange={(e) => setFormData({...formData, village: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              required
              disabled={!formData.zone_id}
            >
              <option value="">
                {!formData.zone_id 
                  ? "Sélectionner d'abord un pays et une zone" 
                  : filteredVillages.length === 0 
                    ? "Aucun village disponible pour cette zone"
                    : "Sélectionner un village"
                }
              </option>
              {filteredVillages.map(v => <option key={v.id} value={v.nom}>{v.nom}</option>)}
            </select>
            {formData.zone_id && filteredVillages.length === 0 && (
              <p className="text-yellow-500 text-xs mt-1">
                ℹ️ Aucun village enregistré pour cette zone. Contactez l'administrateur.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: STRUCTURE ET RÔLE */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">3. Structure et rôle</h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-text text-sm font-medium mb-2">Structure d'embauche de l'enquêteur</label>
            <input
              type="text"
              value={formData.structure_embauche}
              onChange={(e) => setFormData({...formData, structure_embauche: e.target.value})}
              placeholder="Ex: ASV, Lonswiss, CNSCPCA-CA..."
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Que représentez-vous dans votre activité cacaoyère?</label>
            <select
              value={formData.role_activite_cacao}
              onChange={(e) => setFormData({...formData, role_activite_cacao: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Copropriétaire">Copropriétaire</option>
              <option value="Copropriétaire Représentant">Copropriétaire Représentant</option>
              <option value="Gestionnaire">Gestionnaire</option>
              <option value="Gestionnaire Copropriétaire">Gestionnaire Copropriétaire</option>
              <option value="Gestionnaire Représentant">Gestionnaire Représentant</option>
              <option value="Propriétaire">Propriétaire</option>
              <option value="Propriétaire Gestionnaire">Propriétaire Gestionnaire</option>
              <option value="Propriétaire Représentant">Propriétaire Représentant</option>
              <option value="Représentant">Représentant</option>
              <option value="Représentant Propriétaire">Représentant Propriétaire</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Quel type de propriétaire êtes-vous?</label>
            <select
              value={formData.type_proprietaire}
              onChange={(e) => setFormData({...formData, type_proprietaire: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Héritier">Héritier</option>
              <option value="Héritier Initiative personnelle">Héritier Initiative personnelle</option>
              <option value="Initiative personnelle">Initiative personnelle</option>
              <option value="Initiative personnelle Héritier">Initiative personnelle Héritier</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">À quelle communauté appartenez-vous?</label>
            <select
              value={formData.communaute}
              onChange={(e) => setFormData({...formData, communaute: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Bantou">Bantou</option>
              <option value="Autochtone">Autochtone</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACTIVITÉS */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">4. Activités économiques</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-text text-sm font-medium mb-2">Autres activités (en dehors de l'agriculture)</label>
            <div className="grid grid-cols-3 gap-2">
              {["Artisanat", "Pêche", "Élevage", "Autre", "Aucune"].map(act => (
                <label key={act} className="flex items-center space-x-2 text-text text-sm">
                  <input
                    type="checkbox"
                    checked={formData.autres_activites.includes(act)}
                    onChange={() => handleCheckboxChange("autres_activites", act)}
                    className="rounded"
                  />
                  <span>{act}</span>
                </label>
              ))}
            </div>
          </div>

          {showAutreActivites && (
            <div>
              <label className="block text-text text-sm font-medium mb-2">Si Autre, lesquelles?</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded">
                {["Abateur-scilleur", "Agent de sécurité", "Agriculture", "Agriculture vivrière", "Apiculture", "Petit commerce", "Architecte", "Aucun", "Auxiliaire de la douane", "Boulanger", "Commerce de vin de palme", "Cueillette", "Champêtre", "Champs vivrières", "Charbon", "Charbonnier", "Charpentier", "Commerce", "Chasse", "Chasse de subsistance", "Orpaillage", "Maçonnerie", "Chauffeur", "Coiffure", "Menuiserie", "Piège", "Prospecteur", "Récolte des termites", "Récolte de vin local", "Soudure", "Mécanique", "Commerce des divers", "Rentier", "Taximan", "Comptable", "Conducteur", "Construction", "Couture", "Commerce de manioc", "Maïs", "Cultivateur", "Ministère", "Douane", "Electricien", "Enseignement", "Études", "Fabrication vin local", "Fonctionnaire", "Frigoriste", "Gardien", "Journaliste", "Guérisseur traditionnel", "Infirmier", "Armée", "Ménagere", "Pasteur", "Photographe", "Pisciculture", "Hôtellerie", "Plomberie", "Politique", "Salarié", "Sciage", "Scieur", "Secourisme médicale", "Sécurité", "Tailleur", "Taxi Moto", "Technicien de moto", "Technicien en Froid", "Transport", "Travaux champêtre", "Trésorière", "Vie associative"].map(det => (
                  <label key={det} className="flex items-center space-x-2 text-text text-xs">
                    <input
                      type="checkbox"
                      checked={formData.autres_activites_details.includes(det)}
                      onChange={() => handleCheckboxChange("autres_activites_details", det)}
                      className="rounded"
                    />
                    <span>{det}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-text text-sm font-medium mb-2">Source principale de revenus</label>
            <select
              value={formData.source_principale_revenus}
              onChange={(e) => setFormData({...formData, source_principale_revenus: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Élevage">Élevage</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Cultures phares de votre activité agricole</label>
            <div className="grid grid-cols-3 gap-2">
              {["Autres", "Avocatier", "Cacaoyer", "Manioc", "Safoutier"].map(cult => (
                <label key={cult} className="flex items-center space-x-2 text-text text-sm">
                  <input
                    type="checkbox"
                    checked={formData.cultures_phares.includes(cult)}
                    onChange={() => handleCheckboxChange("cultures_phares", cult)}
                    className="rounded"
                  />
                  <span>{cult}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Autres cultures phares</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-background rounded">
              {["Ananas", "Citron", "Mangue", "Orange", "Mandarine", "Banane", "Goyave", "mandariniers", "Papaye", "Tarot", "Palmier à huile", "Igname", "Canne sucre", "Arachide", "Maïs", "Tomate", "Choux", "Carotte", "Noix de coco", "Patate douce", "Piment", "Concombre", "Banane plantain", "Cola", "Courge", "Palmier", "Figue", "Pamplemousse", "Poivron", "Corrossol", "Pomme sauvage", "Autre"].map(autr => (
                <label key={autr} className="flex items-center space-x-2 text-text text-xs">
                  <input
                    type="checkbox"
                    checked={formData.autres_cultures.includes(autr)}
                    onChange={() => handleCheckboxChange("autres_cultures", autr)}
                    className="rounded"
                  />
                  <span>{autr}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Place de l'activité cacaoyère dans votre activité agricole</label>
            <select
              value={formData.place_cacao}
              onChange={(e) => setFormData({...formData, place_cacao: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="1er rang">1er rang</option>
              <option value="2eme rang">2ème rang</option>
              <option value="3eme rang">3ème rang</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 5: EXPLOITATION CACAOYÈRE */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">5. Exploitation cacaoyère</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-text text-sm font-medium mb-2">Utilisez-vous une main d'œuvre supplémentaire?</label>
            <select
              value={formData.main_oeuvre_supplementaire}
              onChange={(e) => setFormData({...formData, main_oeuvre_supplementaire: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Avez-vous récolté le cacao l'année dernière?</label>
            <select
              value={formData.recolte_annee_derniere}
              onChange={(e) => setFormData({...formData, recolte_annee_derniere: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Qu'avez-vous fait du cacao récolté?</label>
            <div className="grid grid-cols-3 gap-2">
              {["Autre", "Don", "Vente", "Partage", "Semis", "Transformation"].map(usage => (
                <label key={usage} className="flex items-center space-x-2 text-text text-sm">
                  <input
                    type="checkbox"
                    checked={formData.usage_cacao_recolte.includes(usage)}
                    onChange={() => handleCheckboxChange("usage_cacao_recolte", usage)}
                    className="rounded"
                  />
                  <span>{usage}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Comment avez-vous vendu votre cacao?</label>
            <div className="grid grid-cols-3 gap-2">
              {["Cabosse", "Par pesage", "Par sac"].map(mode => (
                <label key={mode} className="flex items-center space-x-2 text-text text-sm">
                  <input
                    type="checkbox"
                    checked={formData.mode_vente.includes(mode)}
                    onChange={() => handleCheckboxChange("mode_vente", mode)}
                    className="rounded"
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-text text-sm font-medium mb-2">Combien de kilos avez-vous vendu?</label>
              <input
                type="number"
                value={formData.kilos_vendus}
                onChange={(e) => setFormData({...formData, kilos_vendus: e.target.value})}
                className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-text text-sm font-medium mb-2">Prix du kilo (Franc CFA)</label>
              <input
                type="number"
                value={formData.prix_kilo}
                onChange={(e) => setFormData({...formData, prix_kilo: e.target.value})}
                className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Où avez-vous vendu votre cacao?</label>
            <input
              type="text"
              value={formData.lieu_vente}
              onChange={(e) => setFormData({...formData, lieu_vente: e.target.value})}
              className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-text text-sm font-medium mb-2">Chez qui avez-vous vendu votre cacao?</label>
            <div className="grid grid-cols-3 gap-2">
              {["Camerounais", "CIB Olam", "Congolais", "Ouest Africain", "Diamant", "Non identifié", "Autre"].map(ach => (
                <label key={ach} className="flex items-center space-x-2 text-text text-sm">
                  <input
                    type="checkbox"
                    checked={formData.acheteur.includes(ach)}
                    onChange={() => handleCheckboxChange("acheteur", ach)}
                    className="rounded"
                  />
                  <span>{ach}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOUTONS */}
      <div className="flex gap-4 mt-8 pt-8 border-t border-gray-600">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2AC1A3] text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? "⏳ Création en cours..." : "✅ Créer le producteur"}
        </button>
        <Link 
          href={returnTo || "/producteurs"} 
          className="bg-gray-600 text-text px-8 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-all"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}