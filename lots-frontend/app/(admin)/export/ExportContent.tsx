"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

type Lot = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string
  statut: string | null
  date_creation?: string | null
}

type DdsRow = {
  ddsId: number | null
  refDds: string
  lotCode: string
  lotId: number
  produit: string
  poidsKg: number
  dateGeneration: string
  statut: "en_preparation" | "pret" | "exporte"
  generePar: string
}

function exportCsv(rows: DdsRow[]) {
  const sep = ";"
  const headers = ["Référence DDS", "Lot lié", "Produit", "Poids (kg)", "Date génération", "Statut", "Généré par"]
  const lines = [
    headers.join(sep),
    ...rows.map((r) =>
      [
        r.refDds,
        r.lotCode,
        r.produit,
        r.poidsKg.toFixed(2),
        r.dateGeneration,
        r.statut,
        r.generePar,
      ].join(sep)
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `dds-export-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function makeDdsRef(lotId: number, index: number): string {
  const year = 2025
  const seq = String(index + 1).padStart(4, "0")
  return `DDS-${year}-${seq}`
}

function lotStatutToDds(statut: string | null): DdsRow["statut"] {
  if (!statut) return "en_preparation"
  const s = statut.toLowerCase()
  if (s === "exporté" || s === "exporte" || s === "exported") return "exporte"
  if (s === "prêt" || s === "pret" || s === "ready") return "pret"
  return "en_preparation"
}

type DdsDbRecord = {
  id: number
  reference_dds: string
  statut: string
  created_at: string
  genere_par_nom: string | null
}

export default function ExportContent({
  lots,
  collectesParLot,
  currentUserName,
  ddsByLot = {},
}: {
  lots: Lot[]
  collectesParLot: Record<number, number>
  currentUserName: string
  ddsByLot?: Record<number, DdsDbRecord>
}) {
  const { t, locale } = useLanguage()
  const e = t.export
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")

  const ddsRows: DdsRow[] = useMemo(() => {
    return lots.map((lot, i) => {
      const real = ddsByLot[lot.id]
      const dateLocale = locale === "en" ? "en-GB" : "fr-FR"
      const dateGeneration = real
        ? new Date(real.created_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
        : lot.date_creation
          ? new Date(lot.date_creation).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
          : "-"
      return {
        ddsId: real ? real.id : null,
        refDds: real ? real.reference_dds : makeDdsRef(lot.id, i),
        lotCode: lot.code_lot,
        lotId: lot.id,
        produit: lot.produit ?? "-",
        poidsKg: parseFloat(lot.poids_total_kg) || 0,
        dateGeneration,
        statut: real ? lotStatutToDds(real.statut) : lotStatutToDds(lot.statut),
        generePar: real?.genere_par_nom ?? currentUserName,
      }
    })
  }, [lots, locale, currentUserName, ddsByLot])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ddsRows.filter((row) => {
      const matchSearch =
        !q ||
        row.refDds.toLowerCase().includes(q) ||
        row.lotCode.toLowerCase().includes(q) ||
        row.produit.toLowerCase().includes(q)
      const matchStatut = filterStatut === "all" || row.statut === filterStatut
      return matchSearch && matchStatut
    })
  }, [ddsRows, search, filterStatut])

  const stats = useMemo(() => {
    const generated = ddsRows.length
    const submitted = ddsRows.filter((r) => r.statut === "exporte").length
    const pending = ddsRows.filter((r) => r.statut === "pret").length
    const totalExportKg = ddsRows
      .filter((r) => r.statut === "exporte")
      .reduce((sum, r) => sum + r.poidsKg, 0)
    return { generated, submitted, pending, totalExportKg }
  }, [ddsRows])

  function statutLabel(s: DdsRow["statut"]): string {
    if (s === "pret") return e.statutPret
    if (s === "exporte") return e.statutExporte
    return e.statutEnPreparation
  }

  function statutColors(s: DdsRow["statut"]): string {
    if (s === "exporte") return "bg-[#d7efe5] text-[#2f7a5c]"
    if (s === "pret") return "bg-[#e8e4f6] text-[#3b2a7a]"
    return "bg-[#faecc2] text-[#6b3a12]"
  }

  const formatWeight = (kg: number): string => {
    if (kg >= 1000) {
      return (
        Math.round(kg)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kg"
      )
    }
    return kg.toFixed(2) + " kg"
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + title + action buttons */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
            {e.breadcrumb}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{e.title}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => exportCsv(ddsRows)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition tracking-wide"
          >
            {e.btnExport}
          </button>
          <Link
            href="/export/generate"
            className="px-4 py-2 bg-[#2ac1a3] text-white rounded-lg text-sm font-semibold hover:bg-[#1fa88d] transition tracking-wide whitespace-nowrap"
          >
            {e.btnGenerateDds}
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.statGenerated}
          </p>
          <p className="text-3xl font-bold text-gray-900">{stats.generated}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.statSubmitted}
          </p>
          <p className="text-3xl font-bold text-gray-900">{stats.submitted}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.statPending}
          </p>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
            {e.statTotalExport}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(stats.totalExportKg)}
          </p>
        </div>
      </div>

      {/* Warning banner — shown only when there are pending DDS */}
      {stats.pending > 0 && (
        <div className="flex items-center justify-between gap-4 bg-[#fdf6ec] border border-[#e8c97a] rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#b8860b]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-[#7a5c00] tracking-wide uppercase mb-0.5">
                {e.bannerTitle(stats.pending)}
              </p>
              <p className="text-sm text-[#7a5c00]">{e.bannerDesc}</p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatut("pret")}
            className="shrink-0 px-4 py-2 border border-[#b8860b] text-[#7a5c00] text-xs font-semibold rounded-lg hover:bg-[#b8860b]/10 transition whitespace-nowrap"
          >
            {e.bannerBtn}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colRefDds}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colLotLie}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colProduit}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colPoids}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colDateGen}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colStatut}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colGenPar}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                  {e.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.refDds}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={row.ddsId ? `/export/${row.ddsId}` : `/lots/${row.lotId}`}
                      className="text-[#2ac1a3] hover:underline font-mono font-medium text-sm"
                    >
                      {row.refDds}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {row.lotCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.produit}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {row.poidsKg.toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {row.dateGeneration}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${statutColors(row.statut)}`}
                    >
                      {statutLabel(row.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {row.generePar}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 items-center text-xs font-semibold text-gray-400 tracking-wide">
                      <Link
                        href={row.ddsId ? `/export/${row.ddsId}` : `/lots/${row.lotId}`}
                        className="hover:text-[#2ac1a3] transition"
                      >
                        {e.actionView}
                      </Link>
                      <Link
                        href={`/lots/${row.lotId}/edit`}
                        className="hover:text-[#2ac1a3] transition"
                      >
                        {e.actionEdit}
                      </Link>
                      <a
                        href={`/api/generate-dss/${row.lotId}?lang=${locale}`}
                        download
                        className="hover:text-[#2ac1a3] transition"
                      >
                        {e.actionDownload}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">{e.empty}</p>
            <Link
              href="/lots/nouveau"
              className="text-[#2ac1a3] hover:underline text-sm font-semibold"
            >
              {e.createLot}
            </Link>
          </div>
        )}
      </div>

      {/* Footer summary */}
      {ddsRows.length > 0 && (
        <p className="text-xs text-gray-400 text-center tracking-wide">
          {e.summaryTotal(ddsRows.length)}&nbsp;&middot;&nbsp;
          {e.summarySubmitted(stats.submitted)}&nbsp;&middot;&nbsp;
          {e.summaryPending(stats.pending)}
        </p>
      )}
    </div>
  )
}
