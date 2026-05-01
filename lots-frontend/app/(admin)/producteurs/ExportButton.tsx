"use client"
import * as XLSX from "xlsx"
import { useLanguage } from "@/contexts/LanguageContext"

type ExportRow = {
  code_producteur: string
  nom: string
  prenom: string
  village: string | null
  nombre_parcelles: number
  zones: { nom: string } | null
}

export default function ExportButton({
  data,
  className,
}: {
  data: ExportRow[]
  className?: string
}) {
  const { t } = useLanguage()
  const p = t.producteurs

  const handleExport = () => {
    const rows = data.map((r) => ({
      [p.colCode]: r.code_producteur ?? "",
      [p.colName]: [r.nom, r.prenom].filter(Boolean).join(" ").trim(),
      [p.colZone]: r.zones?.nom ?? "",
      [p.colVillage]: r.village ?? "",
      [p.colParcelles]: r.nombre_parcelles ?? 0,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, p.title.slice(0, 31))
    const date = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `producteurs_${date}.xlsx`)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={data.length === 0}
      className={
        className ??
        "font-courier inline-block bg-white border border-gray-200 text-[#1A1A1A] px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      }
    >
      {p.export}
    </button>
  )
}
