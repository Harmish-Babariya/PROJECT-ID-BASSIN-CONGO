"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createCollecte } from "./actions"

interface CollecteFormProps {
  producteurs: any[]
  parcelles: any[]
}

export default function CollecteForm({ producteurs, parcelles }: CollecteFormProps) {
  const [loading, setLoading] = useState(false)
  const [parcellesFiltrees, setParcellesFiltrees] = useState(parcelles)
  
  const [formData, setFormData] = useState({
    producteur_id: "",
    parcelle_id: "",
    date_collecte: new Date().toISOString().split('T')[0],
    produit: "Cacao",
    poids_brut_kg: "",
    poids_net_kg: "",
    nombre_sacs: "",
    taux_humidite: "",
    qualite: ""
  })

  useEffect(() => {
    if (formData.producteur_id) {
      const filtered = parcelles.filter(p => p.producteur_id === parseInt(formData.producteur_id))
      setParcellesFiltrees(filtered)
      setFormData(prev => ({ ...prev, parcelle_id: "" }))
    } else {
      setParcellesFiltrees(parcelles)
    }
  }, [formData.producteur_id, parcelles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await createCollecte(formData)
    if (result?.error) {
      alert("Erreur: " + result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e272e] rounded-lg shadow p-8 max-w-3xl">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-text text-sm font-medium mb-2">Producteur *</label>
          <select
            value={formData.producteur_id}
            onChange={(e) => setFormData({...formData, producteur_id: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
          >
            <option value="">Sélectionner un producteur</option>
            {producteurs.map(p => (
              <option key={p.id} value={p.id}>
                {p.code_producteur} - {p.nom} {p.prenom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Parcelle *</label>
          <select
            value={formData.parcelle_id}
            onChange={(e) => setFormData({...formData, parcelle_id: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
            disabled={!formData.producteur_id}
          >
            <option value="">
              {!formData.producteur_id ? "Sélectionner d'abord un producteur" : "Sélectionner une parcelle"}
            </option>
            {parcellesFiltrees.map(p => (
              <option key={p.id} value={p.id}>{p.code_parcelle}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Date de collecte *</label>
          <input
            type="date"
            value={formData.date_collecte}
            onChange={(e) => setFormData({...formData, date_collecte: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Produit *</label>
          <select
            value={formData.produit}
            onChange={(e) => setFormData({...formData, produit: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
          >
            <option value="Cacao">Cacao</option>
            <option value="Café">Café</option>
            <option value="Palmier à huile">Palmier à huile</option>
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Poids brut (kg) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.poids_brut_kg}
            onChange={(e) => setFormData({...formData, poids_brut_kg: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Poids net (kg) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.poids_net_kg}
            onChange={(e) => setFormData({...formData, poids_net_kg: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Nombre de sacs</label>
          <input
            type="number"
            value={formData.nombre_sacs}
            onChange={(e) => setFormData({...formData, nombre_sacs: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Taux d'humidité (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.taux_humidite}
            onChange={(e) => setFormData({...formData, taux_humidite: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-text text-sm font-medium mb-2">Qualité</label>
          <select
            value={formData.qualite}
            onChange={(e) => setFormData({...formData, qualite: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
          >
            <option value="">Sélectionner</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "⏳ Création..." : "✅ Créer la collecte"}
        </button>
        <Link 
          href="/collectes" 
          className="bg-gray-500 text-text px-6 py-3 rounded-lg font-semibold hover:bg-gray-600"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}