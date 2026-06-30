"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import ConfirmModal from "@/components/ConfirmModal"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"
import * as XLSX from "xlsx"

type Collecte = {
  id: number
  date_collecte: string
  poids_net_kg: string | null
  qualite: string | null
  produit: string | null
  producteurs: { id: number; code_producteur: string; nom: string; prenom: string } | null
  parcelles: { id: number; code_parcelle: string } | null
}

type LotAssigne = { id: number; code_lot: string } | undefined

export default function CollectesContent({
  collectes,
  collecteLotsMap,
}: {
  collectes: Collecte[]
  collecteLotsMap: Map<number, LotAssigne>
}) {
  const { t, locale } = useLanguage()
  const c = t.collectes
  const co = t.common
  const tr = t.referentiel
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    await fetch(`/api/collectes/${deleteId}/delete`, { method: "POST" })
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
      await fetch(`/api/collectes/${id}/delete`, { method: "POST" })
    }
    setSelectedIds(new Set())
    setBulkConfirm(false)
    router.refresh()
  }

  const filtered = useMemo(() => {
    // Token-based search: every whitespace-separated token must appear somewhere
    // in the row's searchable text. Handles partial matches, full names typed in
    // any order ("Jean Dupont" / "Dupont Jean"), and stray/trailing spaces.
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return collectes
    return collectes.filter((col) => {
      const producteurStr = col.producteurs
        ? `${col.producteurs.code_producteur} ${col.producteurs.nom} ${col.producteurs.prenom ?? ""}`
        : ""
      const haystack = [
        producteurStr,
        col.parcelles?.code_parcelle ?? "",
        col.qualite ?? "",
        col.produit ?? "",
      ].join(" ").toLowerCase()
      return tokens.every((tok) => haystack.includes(tok))
    })
  }, [collectes, search])

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Collecte>(filtered, {
    date: (r) => (r.date_collecte ? new Date(r.date_collecte) : null),
    producteur: (r) => (r.producteurs ? r.producteurs.code_producteur : ""),
    parcelle: (r) => r.parcelles?.code_parcelle ?? "",
    poids: (r) => (r.poids_net_kg ? parseFloat(r.poids_net_kg) : null),
    qualite: (r) => r.qualite ?? "",
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  function handleExportExcel() {
    const isEn = locale === "en"
    const headers = isEn
      ? ["Date", "Producer", "Parcel", "Net Weight (kg)", "Quality", "Product"]
      : ["Date", "Producteur", "Parcelle", "Poids net (kg)", "Qualité", "Produit"]
    const rows = sorted.map((col) => [
      col.date_collecte,
      col.producteurs ? `${col.producteurs.code_producteur} ${col.producteurs.nom}` : "",
      col.parcelles?.code_parcelle ?? "",
      col.poids_net_kg ? parseFloat(col.poids_net_kg) : "",
      col.qualite ?? "",
      col.produit ?? "",
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, isEn ? "Collections" : "Collectes")
    XLSX.writeFile(wb, `collectes_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {c.title}
          </h1>
          <div className="mt-3 flex gap-3 flex-wrap">
            <Link
              href="/collectes/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {c.newBtn}
            </Link>
            <button
              type="button"
              onClick={handleExportExcel}
              className="font-courier inline-block border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition"
            >
              {c.exportExcelBtn}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mt-3"
        >
          ← {c.back}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]"
        />
      </div>

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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3">
                <label className="flex items-center gap-2 cursor-pointer">
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
                  <span className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.18em] uppercase whitespace-nowrap">{co.selectAll}</span>
                </label>
              </th>
              <SortableHeader label={c.colDate} sortKey="date" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={c.colProducer} sortKey="producteur" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={c.colParcel} sortKey="parcelle" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={`${c.colWeight} (KG)`} sortKey="poids" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={c.colQuality} sortKey="qualite" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colStatus}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-[13px] text-gray-400">
                  {c.empty}
                </td>
              </tr>
            ) : (
              paged.map((col) => {
                const dateCollecte = new Date(col.date_collecte)
                if (isNaN(dateCollecte.getTime())) return null
                const lotAssigne = collecteLotsMap.get(col.id)
                return (
                  <tr key={col.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40 transition">

                    {/* Select */}
                    <td className="px-6 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(col.id)}
                        onChange={() => toggleSelected(col.id)}
                      />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">
                      {dateCollecte.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}
                    </td>

                    {/* Producteur */}
                    <td className="px-6 py-3.5 text-[13px] text-gray-800 uppercase">
                      {col.producteurs
                        ? `${col.producteurs.code_producteur} – ${col.producteurs.nom}${col.producteurs.prenom ? ` ${col.producteurs.prenom}` : ""}`
                        : <span className="text-gray-400">—</span>
                      }
                    </td>

                    {/* Parcelle */}
                    <td className="px-6 py-3.5">
                      {col.parcelles ? (
                        <Link
                          href={`/parcelles/${col.parcelles.id}`}
                          className="font-courier text-[#2AC1A3] text-[12.5px] font-medium hover:underline"
                        >
                          {col.parcelles.code_parcelle}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-[13px]">—</span>
                      )}
                    </td>

                    {/* Poids net */}
                    <td className="px-6 py-3.5 text-[13px] text-gray-800">
                      {col.poids_net_kg ? parseFloat(col.poids_net_kg).toFixed(2) : "—"}
                    </td>

                    {/* Qualité */}
                    <td className="px-6 py-3.5">
                      {col.qualite ? (
                        <span className={`font-courier px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border ${
                          col.qualite === "Standard" || col.qualite === "Grade 1"
                            ? "bg-[#2AC1A3]/10 text-[#2AC1A3] border-[#2AC1A3]/30"
                            : col.qualite === "Grade 2"
                            ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                            : "bg-transparent text-gray-400 border-gray-300"
                        }`}>
                          {c.optionLabels[col.qualite] ?? col.qualite}
                        </span>
                      ) : (
                        <span className="font-courier px-3 py-1 rounded-full text-[10px] font-semibold bg-transparent text-gray-400 border border-gray-300 tracking-widest uppercase">
                          {c.unclassified}
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-3.5">
                      {lotAssigne ? (
                        <Link
                          href={`/lots/${lotAssigne.id}`}
                          className="font-courier text-[11px] font-semibold text-[#2AC1A3] hover:underline tracking-wide"
                        >
                          → {lotAssigne.code_lot}
                        </Link>
                      ) : (
                        <span className="font-courier px-3 py-1 rounded-full text-[10px] font-semibold bg-[#2AC1A3]/10 text-[#2AC1A3] border border-[#2AC1A3]/30 tracking-widest uppercase">
                          {c.available}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-4">
                        <Link href={`/collectes/${col.id}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wide transition">
                          {c.actionView}
                        </Link>
                        <Link href={`/collectes/${col.id}/edit`} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">
                          {c.actionEdit}
                        </Link>
                        <button onClick={() => setDeleteId(col.id)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">
                          {t.referentiel.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
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
        message={locale === "fr" ? "Supprimer cette collecte ? Cette action est irréversible." : "Delete this collection? This action cannot be undone."}
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
