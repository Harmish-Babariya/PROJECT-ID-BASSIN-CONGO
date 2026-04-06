"use client"
import * as XLSX from 'xlsx'

export default function ExportButton({ data }: { data: any[] }) {
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcelles")
    XLSX.writeFile(workbook, `parcelles_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
    >
      📥 Exporter Excel
    </button>
  )
}