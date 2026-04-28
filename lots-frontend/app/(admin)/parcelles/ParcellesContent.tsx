"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"

type Parcelle = {
  id: number
  code_parcelle: string
  producteur_id: number
  surface_ha: string | null
  date_creation: string | null
  status_eudr: string | null
}

type Producteur = { id: number; code_producteur: string; nom: string; prenom?: string | null }

function EudrBadge({
  status,
  notVerifiedLabel,
  conformeLabel,
  risqueLabel,
  nonConformeLabel,
}: {
  status: string | null
  notVerifiedLabel: string
  conformeLabel: string
  risqueLabel: string
  nonConformeLabel: string
}) {
  if (!status || status === "NON VÉRIFIÉ" || status === "NON VERIFIE") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">{notVerifiedLabel}</span>
  }
  if (status === "CONFORME") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#2ac1a3]/10 text-[#2ac1a3] border border-[#2ac1a3]/20">{conformeLabel}</span>
  }
  if (status === "RISQUE NON NEGLIGEABLE" || status === "RISQUE NON NÉGLIGEABLE") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700 border border-yellow-200">{risqueLabel}</span>
  }
  if (status === "NON CONFORME") {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-600 border border-red-200">{nonConformeLabel}</span>
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
  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Parcelle>(parcelles, {
    code: (r) => r.code_parcelle,
    producteur: (r) => producteursMap.get(r.producteur_id)?.code_producteur ?? "",
    surface: (r) => (r.surface_ha ? Number(r.surface_ha) : null),
    date: (r) => (r.date_creation ? new Date(r.date_creation) : null),
    eudr: (r) => r.status_eudr ?? "",
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

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
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {tp.title}
          </h1>
          <div className="mt-3 flex gap-3">
            <Link
              href="/parcelles/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {tp.newBtn}
            </Link>
            {exportButton}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mt-3"
        >
          ← {tp.back}
        </button>
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
              <SortableHeader label={tp.colCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tp.colProducer} sortKey="producteur" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tp.colSurface} sortKey="surface" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tp.colDate} sortKey="date" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tp.colEudr} sortKey="eudr" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(parc => {
              const producteur = producteursMap.get(parc.producteur_id)
              return (
                <tr key={parc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${parc.id}`} className="font-mono text-sm font-bold text-[#2ac1a3] hover:underline">
                      {parc.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {producteur ? `${producteur.code_producteur} – ${producteur.nom}${producteur.prenom ? ` ${producteur.prenom}` : ""}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{parc.surface_ha || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parc.date_creation ? new Date(parc.date_creation).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <EudrBadge
                      status={parc.status_eudr}
                      notVerifiedLabel={tp.notVerified}
                      conformeLabel={tp.eudrConforme}
                      risqueLabel={tp.eudrRisque}
                      nonConformeLabel={tp.eudrNonConforme}
                    />
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

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <p className="text-gray-400 text-sm">{tp.count(parcelles.length).toUpperCase()}</p>
    </div>
  )
}
