"use client"
import { useState } from "react"
import Link from "next/link"
import { createLot } from "./actions"
import { Toast, useToast } from "@/components/Toast"

interface LotFormProps {
  collectesDisponibles: any[]
}

export default function LotForm({ collectesDisponibles }: LotFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast, showError, hideToast } = useToast()
  const [collectesSelectionnees, setCollectes] = useState<number[]>([])
  
  const [formData, setFormData] = useState({
    produit: "Cacao",
    destination_pays: "",
    acheteur: "",
    date_expedition: "",
    statut: "En préparation"
  })

  const toggleCollecte = (id: number) => {
    setCollectes(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const poidsTotal = collectesDisponibles
    .filter(c => collectesSelectionnees.includes(c.id))
    .reduce((sum, c) => sum + (parseFloat(c.poids_net_kg) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (collectesSelectionnees.length === 0) {
      showError("Vous devez sélectionner au moins une collecte")
      return
    }

    setLoading(true)
    const result = await createLot(formData, collectesSelectionnees, poidsTotal)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">Informations du lot</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Produit *</label>
            <select
              value={formData.produit}
              onChange={(e) => setFormData({...formData, produit: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            >
              <option value="Cacao">Cacao</option>
              <option value="Café">Café</option>
              <option value="Palmier à huile">Palmier à huile</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Destination</label>
            <input
              type="text"
              value={formData.destination_pays}
              onChange={(e) => setFormData({...formData, destination_pays: e.target.value})}
              placeholder="Ex: Belgique, France..."
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Acheteur</label>
            <input
              type="text"
              value={formData.acheteur}
              onChange={(e) => setFormData({...formData, acheteur: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-medium mb-2">Date d'expédition</label>
            <input
              type="date"
              value={formData.date_expedition}
              onChange={(e) => setFormData({...formData, date_expedition: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-900 text-sm font-medium mb-2">Statut *</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({...formData, statut: e.target.value})}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              required
            >
              <option value="En préparation">En préparation</option>
              <option value="Prêt">Prêt</option>
              <option value="Exporté">Exporté</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-gray-900 font-semibold">
          Poids total : <span className="text-primary text-2xl">{poidsTotal.toFixed(2)} kg</span>
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {collectesSelectionnees.length} collecte(s) sélectionnée(s)
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">
          Sélectionner les collectes ({collectesDisponibles.length} disponibles)
        </h2>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {collectesDisponibles.map((c: any) => {
            const estSelectionnee = collectesSelectionnees.includes(c.id)
            return (
              <div
                key={c.id}
                onClick={() => toggleCollecte(c.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  estSelectionnee 
                    ? 'bg-primary/20 border-2 border-primary' 
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 font-medium">
                      {c.producteurs?.code_producteur} - {c.producteurs?.nom} {c.producteurs?.prenom}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {c.parcelles?.code_parcelle} | {new Date(c.date_collecte).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold">{c.poids_net_kg} kg</p>
                    {c.qualite && (
                      <p className="text-gray-500 text-sm">{c.qualite}</p>
                    )}
                  </div>
                </div>
                {estSelectionnee && (
                  <div className="mt-2 text-primary text-sm font-semibold">✓ Sélectionnée</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || collectesSelectionnees.length === 0}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "⏳ Création..." : "✅ Créer le lot"}
        </button>
        <Link 
          href="/lots" 
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
        >
          Annuler
        </Link>
      </div>
    </form>
    </>
  )
}