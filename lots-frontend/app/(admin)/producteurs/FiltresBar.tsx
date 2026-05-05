"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function FiltresBar({ zones }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const p = t.producteurs
  const co = t.common

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-5 gap-4">
        <input
          type="text"
          placeholder={p.searchPlaceholder}
          value={filtres.recherche}
          onChange={(e) => setFiltres({...filtres, recherche: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        />

        <select
          value={filtres.zone_id}
          onChange={(e) => setFiltres({...filtres, zone_id: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{p.filterAllZones}</option>
          {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>

        <select
          value={filtres.sexe}
          onChange={(e) => setFiltres({...filtres, sexe: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{p.filterAllSexes}</option>
          <option value="Homme">{co.male}</option>
          <option value="Femme">{co.female}</option>
        </select>

        <select
          value={filtres.statut}
          onChange={(e) => setFiltres({...filtres, statut: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{p.filterAllStatuts}</option>
          <option value="Actif">{co.active}</option>
          <option value="Inactif">{co.inactive}</option>
        </select>

        <select
          value={filtres.avec_parcelles}
          onChange={(e) => setFiltres({...filtres, avec_parcelles: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{p.filterAnyParcelles}</option>
          <option value="oui">{p.filterWithParcelles}</option>
          <option value="non">{p.filterWithoutParcelles}</option>
        </select>
      </div>

      <button
        onClick={resetFiltres}
        className="mt-3 text-primary hover:underline text-sm"
      >
        {p.resetFilters}
      </button>
    </div>
  )
}
