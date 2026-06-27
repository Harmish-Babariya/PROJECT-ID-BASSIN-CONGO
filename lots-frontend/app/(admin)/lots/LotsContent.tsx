"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Filter, Search } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ConfirmModal from "@/components/ConfirmModal"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"
import * as XLSX from "xlsx"

type Lot = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string
  statut: string | null
}

function StatutBadge({ statut }: { statut: string | null }) {
  const { t } = useLanguage()
  let cls = "bg-gray-100 text-gray-500"
  let label: string = statut || "—"
  if (statut === "Exporté") {
    cls = "bg-[#d7efe5] text-[#2f7a5c]"
    label = t.lots.statutExporte
  } else if (statut === "Prêt") {
    cls = "bg-[#e8e4f6] text-[#3b2a7a]"
    label = t.lots.statutPret
  } else if (statut === "En préparation") {
    cls = "bg-[#faecc2] text-[#6b3a12]"
    label = t.lots.statutEnPreparation
  } else if (statut === "En constitution") {
    cls = "bg-[#faecc2] text-[#6b3a12]"
    label = t.lots.statutEnConstitution
  }
  return (
    <span className={`inline-block min-w-[140px] text-center px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${cls}`}>
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
  const { t, locale } = useLanguage()
  const l = t.lots
  const co = t.common
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    await fetch(`/api/lots/${deleteId}/delete`, { method: "POST" })
    setDeleteId(null)
    router.refresh()
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    for (const id of selectedIds) {
      await fetch(`/api/lots/${id}/delete`, { method: "POST" })
    }
    setSelectedIds(new Set())
    setBulkConfirm(false)
    router.refresh()
  }
  const [showFilters, setShowFilters] = useState(false)
  const [produit, setProduit] = useState("")
  const [statut, setStatut] = useState("")
  const [avecCollectes, setAvecCollectes] = useState("")
  const [poidsMin, setPoidsMin] = useState("")
  const [poidsMax, setPoidsMax] = useState("")

  const produitOptions = useMemo(() => {
    const set = new Set<string>()
    lots.forEach((lot) => {
      if (lot.produit) set.add(lot.produit)
    })
    return Array.from(set).sort()
  }, [lots])

  const statutOptions = useMemo(() => {
    const set = new Set<string>()
    lots.forEach((lot) => {
      if (lot.statut) set.add(lot.statut)
    })
    return Array.from(set).sort()
  }, [lots])

  const statutLabel = (s: string) => {
    if (s === "En préparation") return l.statutEnPreparation
    if (s === "En constitution") return l.statutEnConstitution
    if (s === "Prêt") return l.statutPret
    if (s === "Exporté") return l.statutExporte
    return s
  }

  const hasActiveFilters = useMemo(
    () => Boolean(produit || statut || avecCollectes || poidsMin || poidsMax),
    [produit, statut, avecCollectes, poidsMin, poidsMax]
  )

  function resetFilters() {
    setProduit("")
    setStatut("")
    setAvecCollectes("")
    setPoidsMin("")
    setPoidsMax("")
  }

  const filtered = useMemo(() => {
    // Token-based search: every whitespace-separated token must appear somewhere
    // in the row's searchable text (handles partial matches and stray spaces).
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
    const min = poidsMin ? parseFloat(poidsMin) : null
    const max = poidsMax ? parseFloat(poidsMax) : null
    return lots.filter((lot) => {
      if (tokens.length > 0) {
        const haystack = [
          lot.code_lot,
          lot.produit ?? "",
          lot.statut ?? "",
        ].join(" ").toLowerCase()
        if (!tokens.every((tok) => haystack.includes(tok))) return false
      }
      if (produit && lot.produit !== produit) return false
      if (statut && lot.statut !== statut) return false
      const count = collectesParLot[lot.id] || 0
      if (avecCollectes === "oui" && count === 0) return false
      if (avecCollectes === "non" && count > 0) return false
      const poids = parseFloat(lot.poids_total_kg) || 0
      if (min !== null && !Number.isNaN(min) && poids < min) return false
      if (max !== null && !Number.isNaN(max) && poids > max) return false
      return true
    })
  }, [lots, search, produit, statut, avecCollectes, poidsMin, poidsMax, collectesParLot])

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Lot>(filtered, {
    code: (r) => r.code_lot,
    produit: (r) => r.produit ?? "",
    collectes: (r) => collectesParLot[r.id] ?? 0,
    poids: (r) => parseFloat(r.poids_total_kg) || 0,
    statut: (r) => r.statut ?? "",
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  function handleExportExcel() {
    const isEn = locale === "en"
    const headers = isEn
      ? ["Lot Code", "Product", "Collections", "Total Weight (kg)", "Status"]
      : ["Code lot", "Produit", "Collectes", "Poids total (kg)", "Statut"]
    const rows = sorted.map((lot) => [
      lot.code_lot,
      lot.produit ?? "",
      collectesParLot[lot.id] ?? 0,
      parseFloat(lot.poids_total_kg) || 0,
      lot.statut ?? "",
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lots")
    XLSX.writeFile(wb, `lots_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {l.title}
          </h1>
          <div className="mt-3 flex gap-3 flex-wrap">
            <Link
              href="/lots/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {l.newBtn}
            </Link>
            <button
              type="button"
              onClick={handleExportExcel}
              className="font-courier inline-block border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition"
            >
              {l.exportExcelBtn}
            </button>
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

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={l.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 shrink-0" />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-[12px] font-medium transition shrink-0 ${
            showFilters || hasActiveFilters
              ? "bg-[#2AC1A3]/10 text-[#2AC1A3]"
              : "text-gray-400 hover:text-[#1A1A1A]"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{l.chooseFilter}</span>
          <span className="sm:hidden">Filtres</span>
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <select
            value={produit}
            onChange={(e) => setProduit(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{l.filterAllProducts}</option>
            {produitOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{l.filterAllStatuts}</option>
            {statutOptions.map((s) => (
              <option key={s} value={s}>{statutLabel(s)}</option>
            ))}
          </select>
          <select
            value={avecCollectes}
            onChange={(e) => setAvecCollectes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{l.filterAnyCollectes}</option>
            <option value="oui">{l.filterWithCollectes}</option>
            <option value="non">{l.filterWithoutCollectes}</option>
          </select>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={l.filterMinWeight}
            value={poidsMin}
            onChange={(e) => setPoidsMin(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A] placeholder:text-gray-400"
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={l.filterMaxWeight}
            value={poidsMax}
            onChange={(e) => setPoidsMax(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A] placeholder:text-gray-400"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="col-span-full text-[11px] text-[#2AC1A3] hover:underline text-left"
            >
              {l.resetFilters}
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <span className="text-[12px] font-semibold text-[#1A1A1A]">{co.bulkSelected(selectedIds.size)}</span>
          <button
            type="button"
            onClick={() => setBulkConfirm(true)}
            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg uppercase tracking-wide transition"
          >
            {co.bulkDelete}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wide transition"
          >
            {co.bulkClear}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 w-10">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && paged.every((row) => selectedIds.has(row.id))}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      paged.forEach((row) => (checked ? next.add(row.id) : next.delete(row.id)))
                      return next
                    })
                  }}
                />
              </th>
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
                <td className="px-6 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lot.id)}
                    onChange={() => toggleSelected(lot.id)}
                  />
                </td>
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
                    <Link href={`/lots/${lot.id}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wide transition">
                      {l.actionView}
                    </Link>
                    <Link href={`/lots/${lot.id}/edit`} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">
                      {l.actionEdit}
                    </Link>
                    <a
                      href={`/api/lots/${lot.id}/geojson`}
                      download
                      className="text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb] uppercase tracking-wide transition"
                    >
                      {l.actionGeojson}
                    </a>
                    <button onClick={() => setDeleteId(lot.id)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">
                      {t.referentiel.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  {l.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmModal
        open={deleteId !== null}
        title={t.referentiel.deleteTitle}
        message={locale === "fr" ? "Supprimer ce lot ? Cette action est irréversible." : "Delete this lot? This action cannot be undone."}
        confirmLabel={t.referentiel.delete}
        cancelLabel={t.referentiel.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        open={bulkConfirm}
        title={co.bulkConfirmTitle}
        message={co.bulkConfirmMessage(selectedIds.size)}
        confirmLabel={co.bulkDelete}
        cancelLabel={t.referentiel.cancel}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </div>
  )
}
