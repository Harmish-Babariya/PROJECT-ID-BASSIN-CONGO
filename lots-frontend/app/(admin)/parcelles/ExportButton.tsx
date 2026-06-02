"use client"
import * as XLSX from 'xlsx'
import { useLanguage } from "@/contexts/LanguageContext"

export default function ExportButton({ data }: { data: any[] }) {
  const { t } = useLanguage()

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcelles")
    XLSX.writeFile(workbook, `parcelles_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="font-courier inline-block border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition"
    >
      {t.parcelles.exportExcelBtn}
    </button>
  )
}