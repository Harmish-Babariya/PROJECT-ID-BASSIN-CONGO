"use client"
import { useState } from "react"
import Link from "next/link"
import { updateProducteur } from "./actions"

interface ProducteurFormProps {
  producteur?: any
  zones: any[]
  pays: any[]
}

export default function ProducteurForm({ producteur, zones, pays }: ProducteurFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: producteur?.nom || "",
    prenom: producteur?.prenom || "",
    sexe: producteur?.sexe || "Homme",
    annee_naissance: producteur?.annee_naissance || "",
    village: producteur?.village || "",
    zone_id: producteur?.zone_id || "",
    pays_id: producteur?.pays_id || "",
    telephone: producteur?.telephone || "",
    statut: producteur?.statut || "Actif"
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await updateProducteur(producteur.id, formData)
    
    if (result?.error) {
      alert("Erreur: " + result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e272e] rounded-lg shadow p-8 max-w-2xl">
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
            onChange={(e) => setFormData({...formData, annee_naissance: parseInt(e.target.value)})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Village *</label>
          <input
            type="text"
            value={formData.village}
            onChange={(e) => setFormData({...formData, village: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Zone *</label>
          <select
            value={formData.zone_id}
            onChange={(e) => setFormData({...formData, zone_id: parseInt(e.target.value)})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Sélectionner une zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Pays *</label>
          <select
            value={formData.pays_id}
            onChange={(e) => setFormData({...formData, pays_id: parseInt(e.target.value)})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Sélectionner un pays</option>
            {pays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
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

        <div>
          <label className="block text-text text-sm font-medium mb-2">Statut</label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({...formData, statut: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        <Link href={`/producteurs/${producteur.id}`} className="bg-gray-500 text-text px-6 py-3 rounded-lg font-semibold hover:bg-gray-600">
          Annuler
        </Link>
      </div>
    </form>
  )
}