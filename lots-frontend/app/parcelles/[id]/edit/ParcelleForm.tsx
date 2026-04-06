"use client"
import { useState } from "react"
import Link from "next/link"
import { updateParcelle } from "./action"

interface ParcelleFormProps {
  parcelle?: any
  producteurs: any[]
  zones: any[]
}

export default function ParcelleForm({ parcelle, producteurs, zones }: ParcelleFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    producteur_id: parcelle?.producteur_id || "",
    zone_id: parcelle?.zone_id || "",
    surface_ha: parcelle?.surface_ha || "",
    culture: parcelle?.culture || "Cacao",
    annee_plantation: parcelle?.annee_plantation || "",
    date_creation: parcelle?.date_creation || new Date().toISOString().split('T')[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await updateParcelle(parcelle.id, formData)
    
    if (result?.error) {
      alert("Erreur: " + result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e272e] rounded-lg shadow p-8 max-w-2xl">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-text text-sm font-medium mb-2">Producteur *</label>
          <select
            value={formData.producteur_id}
            onChange={(e) => setFormData({...formData, producteur_id: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Sélectionner un producteur</option>
            {producteurs.map(p => (
              <option key={p.id} value={p.id}>
                {p.code_producteur} - {p.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Zone *</label>
          <select
            value={formData.zone_id}
            onChange={(e) => setFormData({...formData, zone_id: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Sélectionner une zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Surface (ha) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.surface_ha}
            onChange={(e) => setFormData({...formData, surface_ha: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Culture *</label>
          <select
            value={formData.culture}
            onChange={(e) => setFormData({...formData, culture: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="Cacao">Cacao</option>
            <option value="Café">Café</option>
            <option value="Palmier à huile">Palmier à huile</option>
          </select>
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Année plantation</label>
          <input
            type="number"
            value={formData.annee_plantation}
            onChange={(e) => setFormData({...formData, annee_plantation: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-text text-sm font-medium mb-2">Date de création</label>
          <input
            type="date"
            value={formData.date_creation}
            onChange={(e) => setFormData({...formData, date_creation: e.target.value})}
            className="w-full px-4 py-2 bg-background text-text border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        <Link href={`/parcelles/${parcelle.id}`} className="bg-gray-500 text-text px-6 py-3 rounded-lg font-semibold hover:bg-gray-600">
          Annuler
        </Link>
      </div>
    </form>
  )
}