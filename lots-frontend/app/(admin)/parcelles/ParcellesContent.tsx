"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"

type Parcelle = {
  id: number
  code_parcelle: string
  producteur_id: number
  surface_ha: string | null
  date_creation: string | null
  status_eudr: string | null
}

type Producteur = { id: number; code_producteur: string; nom: string }

function EudrBadge({ status, notVerifiedLabel }: { status: string | null; notVerifiedLabel: string }) {
  if (!status || status === "NON VÉRIFIÉ" || status === "NON VERIFIE") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">{notVerifiedLabel}</span>
  }
  if (status === "CONFORME") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#2ac1a3]/10 text-[#2ac1a3] border border-[#2ac1a3]/20">CONFORME</span>
  }
  if (status === "RISQUE NON NEGLIGEABLE" || status === "RISQUE NON NÉGLIGEABLE") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700 border border-yellow-200">RISQUE NON NÉGLIGEABLE</span>
  }
  if (status === "NON CONFORME") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-600 border border-red-200">NON CONFORME</span>
  }
  return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">{status}</span>
}

export default function ParcellesContent({
  parcelles,
  producteursMap,
  exportButton,
}: {
  parcelles: Parcelle[]
  producteursMap: Map<number, Producteur>
  exportButton: React.ReactNode
}) {
  const { t } = useLanguage()
  const tp = t.parcelles
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("recherche") || "")
  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status_eudr") || "")

  function handleSearchChange(val: string) {
    setSearch(val)
    const params = new URLSearchParams()
    if (val) params.set("recherche", val)
    if (filterStatus) params.set("status_eudr", filterStatus)
    router.push(`/parcelles?${params.toString()}`)
  }

  function handleFilterChange(val: string) {
    setFilterStatus(val)
    const params = new URLSearchParams()
    if (search) params.set("recherche", search)
    if (val) params.set("status_eudr", val)
    router.push(`/parcelles?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tp.breadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tp.title.toUpperCase()}</h1>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/parcelles/nouveau" className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition flex items-center gap-2">
          {tp.newBtn}
        </Link>
        {exportButton}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={tp.searchPlaceholder}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {tp.filterAll}
            </button>
            {showFilter && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px] p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{tp.colEudr}</p>
                {["", "CONFORME", "RISQUE NON NEGLIGEABLE", "NON CONFORME"].map(s => (
                  <label key={s} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 px-1 rounded">
                    <input type="radio" name="status_eudr" value={s} checked={filterStatus === s} onChange={() => { handleFilterChange(s); setShowFilter(false) }} className="accent-[#2ac1a3]" />
                    <span className="text-sm text-gray-700">{s || tp.filterAll}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tp.colCode}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tp.colProducer}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tp.colSurface}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tp.colDate}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tp.colEudr}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parcelles.map(parc => {
              const producteur = producteursMap.get(parc.producteur_id)
              return (
                <tr key={parc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${parc.id}`} className="font-mono text-sm font-bold text-[#2ac1a3] hover:underline">
                      {parc.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {producteur ? `${producteur.code_producteur} – ${producteur.nom}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{parc.surface_ha || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parc.date_creation ? new Date(parc.date_creation).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <EudrBadge status={parc.status_eudr} notVerifiedLabel={tp.notVerified} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/parcelles/${parc.id}`} className="text-xs font-semibold text-gray-500 hover:text-[#2ac1a3] uppercase tracking-wide transition">
                        {tp.actionView}
                      </Link>
                      <Link href={`/parcelles/${parc.id}/edit`} className="text-xs font-semibold text-gray-500 hover:text-[#2ac1a3] uppercase tracking-wide transition">
                        {tp.actionEdit}
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {parcelles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">{tp.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-sm">{tp.count(parcelles.length).toUpperCase()}</p>
    </div>
  )
}
