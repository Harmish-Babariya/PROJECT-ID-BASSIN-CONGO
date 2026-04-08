"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function FiltresBar({ zones, producteurs }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filtres, setFiltres] = useState({
    recherche: searchParams.get('recherche') || '',
    zone_id: searchParams.get('zone_id') || '',
    culture: searchParams.get('culture') || '',
    status_eudr: searchParams.get('status_eudr') || '',
    producteur_id: searchParams.get('producteur_id') || ''
  })

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filtres).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    router.push(`/parcelles?${params.toString()}`)
  }, [filtres, router])

  const resetFiltres = () => {
    setFiltres({recherche: '', zone_id: '', culture: '', status_eudr: '', producteur_id: ''})
  }

  return (
    <div className="bg-[#1e272e] rounded-lg p-4 mb-6">
      <div className="grid grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="🔍 Code parcelle..."
          value={filtres.recherche}
          onChange={(e) => setFiltres({...filtres, recherche: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        />
        
        <select
          value={filtres.zone_id}
          onChange={(e) => setFiltres({...filtres, zone_id: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Toutes les zones</option>
          {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>

        <select
          value={filtres.culture}
          onChange={(e) => setFiltres({...filtres, culture: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Toutes cultures</option>
          <option value="Cacao">Cacao</option>
          <option value="Café">Café</option>
          <option value="Palmier à huile">Palmier à huile</option>
        </select>

        <select
          value={filtres.status_eudr}
          onChange={(e) => setFiltres({...filtres, status_eudr: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Tous statuts EUDR</option>
          <option value="CONFORME">Conforme</option>
          <option value="RISQUE NON NÉGLIGEABLE">Risque</option>
          <option value="NON CONFORME">Non conforme</option>
        </select>

        <select
          value={filtres.producteur_id}
          onChange={(e) => setFiltres({...filtres, producteur_id: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Tous producteurs</option>
          {producteurs?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.code_producteur} - {p.nom}</option>
          ))}
        </select>
      </div>
      
      <button
        onClick={resetFiltres}
        className="mt-3 text-primary hover:underline text-sm"
      >
        ✖️ Réinitialiser
      </button>
    </div>
  )
}