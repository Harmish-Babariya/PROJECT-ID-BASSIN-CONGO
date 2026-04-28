"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

function StatutBadge({ statut }: { statut: string | null }) {
  const { t } = useLanguage()
  const s = (statut || "").toLowerCase()
  let cls = "bg-gray-100 text-gray-500"
  if (s.includes("exporté") || s.includes("exporte")) {
    cls = "bg-[#d7efe5] text-[#2f7a5c]"
  } else if (s.includes("prêt") || s.includes("pret")) {
    cls = "bg-[#e8e4f6] text-[#3b2a7a]"
  } else if (s.includes("constitution") || s.includes("préparation") || s.includes("preparation")) {
    cls = "bg-[#faecc2] text-[#6b3a12]"
  }
  let label: string = statut || "—"
  if (statut === "En préparation") label = t.lots.statutEnPreparation
  else if (statut === "Prêt") label = t.lots.statutPret
  else if (statut === "Exporté") label = t.lots.statutExporte
  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${cls}`}>
      {label}
    </span>
  )
}

export default function LotsContent({
  lots,
  collectesParLot,
}: {
  lots: Lot[]
  collectesParLot: Record<number, number>
}) {
  const { t } = useLanguage()
  const l = t.lots
  const tr = t.referentiel
  const router = useRouter()
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
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {l.title}
          </h1>
          <div className="mt-3">
            <Link
              href="/lots/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {l.newBtn}
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mt-3"
        >
          ← {l.back}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <SortableHeader label={l.colCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={l.colProduct} sortKey="produit" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={l.colCollectes} sortKey="collectes" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={l.colWeight} sortKey="poids" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={l.colStatus} sortKey="statut" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map((lot) => (
              <tr key={lot.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link href={`/lots/${lot.id}`} className="font-mono text-sm font-bold text-[#2ac1a3] hover:underline">
                    {lot.code_lot}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">{lot.produit || "—"}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center min-w-7 h-6 px-2 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                    {collectesParLot[lot.id] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {parseFloat(lot.poids_total_kg).toFixed(2)} kg
                </td>
                <td className="px-6 py-4">
                  <StatutBadge statut={lot.statut} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Link href={`/lots/${lot.id}`} className="text-xs font-semibold text-gray-500 hover:text-[#2ac1a3] uppercase tracking-wide transition">
                      {l.actionView}
                    </Link>
                    <Link href={`/lots/${lot.id}/edit`} className="text-xs font-semibold text-gray-500 hover:text-[#2ac1a3] uppercase tracking-wide transition">
                      {l.actionEdit}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  —
                </td>
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
    </div>
  )
}
