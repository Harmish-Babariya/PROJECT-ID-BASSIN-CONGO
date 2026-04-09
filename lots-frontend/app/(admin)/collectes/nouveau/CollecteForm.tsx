"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createCollecte } from "./actions"
import { Toast, useToast } from "@/components/Toast"

interface CollecteFormProps {
  producteurs: any[]
  parcelles: any[]
}

export default function CollecteForm({ producteurs, parcelles }: CollecteFormProps) {
  const [loading, setLoading] = useState(false)
  const [parcellesFiltrees, setParcellesFiltrees] = useState(parcelles)
  const { toast, showError, hideToast } = useToast()

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
    if (loading) return
    setLoading(true)
    const result = await createCollecte(formData)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow p-8 max-w-3xl">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Producteur *</label>
            <select
              value={formData.producteur_id}
              onChange={(e) => setFormData({...formData, producteur_id: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Selectionner un producteur</option>
              {producteurs.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code_producteur} - {p.nom} {p.prenom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Parcelle *</label>
            <select
              value={formData.parcelle_id}
              onChange={(e) => setFormData({...formData, parcelle_id: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
              disabled={!formData.producteur_id}
            >
              <option value="">
                {!formData.producteur_id ? "Selectionner d'abord un producteur" : "Selectionner une parcelle"}
              </option>
              {parcellesFiltrees.map(p => (
                <option key={p.id} value={p.id}>{p.code_parcelle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Date de collecte *</label>
            <input
              type="date"
              value={formData.date_collecte}
              onChange={(e) => setFormData({...formData, date_collecte: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Produit *</label>
            <select
              value={formData.produit}
              onChange={(e) => setFormData({...formData, produit: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            >
              <option value="Cacao">Cacao</option>
              <option value="Cafe">Cafe</option>
              <option value="Palmier a huile">Palmier a huile</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Poids brut (kg) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.poids_brut_kg}
              onChange={(e) => setFormData({...formData, poids_brut_kg: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Poids net (kg) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.poids_net_kg}
              onChange={(e) => setFormData({...formData, poids_net_kg: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Nombre de sacs</label>
            <input
              type="number"
              value={formData.nombre_sacs}
              onChange={(e) => setFormData({...formData, nombre_sacs: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Taux d&apos;humidite (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.taux_humidite}
              onChange={(e) => setFormData({...formData, taux_humidite: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Qualite</label>
            <select
              value={formData.qualite}
              onChange={(e) => setFormData({...formData, qualite: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            >
              <option value="">Selectionner</option>
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
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creation en cours..." : "Creer la collecte"}
          </button>
          <Link
            href="/collectes"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Annuler
          </Link>
        </div>
      </form>
    </>
  )
}
