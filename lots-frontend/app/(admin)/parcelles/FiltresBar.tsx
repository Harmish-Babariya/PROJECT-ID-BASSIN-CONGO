"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function FiltresBar({ zones, producteurs }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const tp = t.parcelles
  const tc = t.common

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-5 gap-4">
        <input
          type="text"
          placeholder={tp.filterSearchPlaceholder}
          value={filtres.recherche}
          onChange={(e) => setFiltres({...filtres, recherche: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        />

        <select
          value={filtres.zone_id}
          onChange={(e) => setFiltres({...filtres, zone_id: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{tp.filterAllZones}</option>
          {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>

        <select
          value={filtres.culture}
          onChange={(e) => setFiltres({...filtres, culture: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{tp.filterAllCultures}</option>
          <option value="Cacao">{tc.cultureCacao}</option>
          <option value="Café">{tc.cultureCafe}</option>
          <option value="Palmier à huile">{tc.culturePalmier}</option>
        </select>

        <select
          value={filtres.status_eudr}
          onChange={(e) => setFiltres({...filtres, status_eudr: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{tp.filterAllStatusesEudr}</option>
          <option value="CONFORME">{tp.eudrConforme}</option>
          <option value="RISQUE NON NÉGLIGEABLE">{tp.eudrRisque}</option>
          <option value="EN ATTENTE">{tp.eudrEnAttente}</option>
        </select>

        <select
          value={filtres.producteur_id}
          onChange={(e) => setFiltres({...filtres, producteur_id: e.target.value})}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
        >
          <option value="">{tp.filterAllProducers}</option>
          {producteurs?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.code_producteur} - {p.nom}</option>
          ))}
        </select>
      </div>

      <button
        onClick={resetFiltres}
        className="mt-3 text-primary hover:underline text-sm"
      >
        {tp.resetFiltersBtn}
      </button>
    </div>
  )
}