"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function FiltresBar({ zones }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filtres, setFiltres] = useState({
    recherche: searchParams.get('recherche') || '',
    zone_id: searchParams.get('zone_id') || '',
    sexe: searchParams.get('sexe') || '',
    statut: searchParams.get('statut') || '',
    avec_parcelles: searchParams.get('avec_parcelles') || ''
  })

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filtres).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    router.push(`/producteurs?${params.toString()}`)
  }, [filtres, router])

  const resetFiltres = () => {
    setFiltres({recherche: '', zone_id: '', sexe: '', statut: '', avec_parcelles: ''})
  }

  return (
    <div className="bg-[#1e272e] rounded-lg p-4 mb-6">
      <div className="grid grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="🔍 Code ou nom..."
          value={filtres.recherche}
          onChange={(e) => setFiltres({...filtres, recherche: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        />
        
        <select
          value={filtres.zone_id}
          onChange={(e) => setFiltres({...filtres, zone_id: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Toutes zones</option>
          {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>

        <select
          value={filtres.sexe}
          onChange={(e) => setFiltres({...filtres, sexe: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Tous sexes</option>
          <option value="Homme">Homme</option>
          <option value="Femme">Femme</option>
        </select>

        <select
          value={filtres.statut}
          onChange={(e) => setFiltres({...filtres, statut: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Tous statuts</option>
          <option value="Actif">Actif</option>
          <option value="Inactif">Inactif</option>
        </select>

        <select
          value={filtres.avec_parcelles}
          onChange={(e) => setFiltres({...filtres, avec_parcelles: e.target.value})}
          className="px-4 py-2 bg-background text-text border border-gray-600 rounded-lg"
        >
          <option value="">Avec/Sans parcelles</option>
          <option value="oui">Avec parcelles</option>
          <option value="non">Sans parcelle</option>
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