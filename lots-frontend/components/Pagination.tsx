"use client"

import { useMemo } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

type PaginationProps = {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const { t } = useLanguage()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  const pages = useMemo(() => buildPageRange(current, totalPages), [current, totalPages])

  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl mt-2">
      <div className="text-[11px] font-medium text-gray-500 tracking-wide">
        {from}–{to} / {total}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label={t.common.pagePrev}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="px-2 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[30px] px-2.5 py-1.5 text-xs font-semibold rounded-md transition ${
                p === current
                  ? "bg-[#2ac1a3] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= totalPages}
          className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label={t.common.pageNext}
        >
          ›
        </button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span className="uppercase tracking-wide font-medium">{t.common.perPage}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-[#2ac1a3]"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total, current, current - 1, current + 1])
  const pages: (number | "…")[] = []
  const sorted = Array.from(set).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) pages.push("…")
    pages.push(p)
    prev = p
  }
  return pages
}
