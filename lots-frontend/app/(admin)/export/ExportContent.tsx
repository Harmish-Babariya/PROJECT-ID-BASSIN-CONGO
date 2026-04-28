"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"

type Lot = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string
  statut: string | null
}

export default function ExportContent({
  lots,
  collectesParLot,
}: {
  lots: Lot[]
  collectesParLot: Record<number, number>
}) {
  const { t } = useLanguage()
  const e = t.export
  const tr = t.referentiel
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return lots
    return lots.filter((lot) =>
      lot.code_lot.toLowerCase().includes(q) ||
      (lot.produit ?? "").toLowerCase().includes(q) ||
      (lot.statut ?? "").toLowerCase().includes(q)
    )
  }, [lots, search])

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Lot>(filtered, {
    code: (r) => r.code_lot,
    produit: (r) => r.produit ?? "",
    collectes: (r) => collectesParLot[r.id] ?? 0,
    poids: (r) => parseFloat(r.poids_total_kg) || 0,
    statut: (r) => r.statut ?? "",
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{e.breadcrumb}</p>
        <h1 className="text-2xl font-bold text-gray-900">{e.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{e.subtitle}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
          className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <SortableHeader label={e.colCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={e.colProduct} sortKey="produit" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={e.colCollectes} sortKey="collectes" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={e.colWeight} sortKey="poids" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={e.colStatus} sortKey="statut" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{e.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((lot) => (
              <tr key={lot.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline font-mono font-medium text-sm">
                    {lot.code_lot}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{lot.produit}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-[#2ac1a3]/10 text-[#2ac1a3] rounded-full text-xs font-semibold">
                    {collectesParLot[lot.id] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {parseFloat(lot.poids_total_kg).toFixed(2)} kg
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    lot.statut === "Exporte" ? "bg-green-100 text-green-700" :
                    lot.statut === "Pret" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {lot.statut}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 items-center">
                    <a
                      href={`/api/generate-dss/${lot.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                      download
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </a>
                    <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline text-sm">
                      {e.actionView}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">{e.empty}</p>
          <Link href="/lots/nouveau" className="text-[#2ac1a3] hover:underline text-sm font-semibold">
            {e.createLot}
          </Link>
        </div>
      )}

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
