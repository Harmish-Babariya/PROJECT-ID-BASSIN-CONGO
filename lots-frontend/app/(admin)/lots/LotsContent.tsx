"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

type Lot = {
  id: number
  code_lot: string
  produit: string | null
  poids_total_kg: string
  statut: string | null
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{l.breadcrumb}</p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{l.title}</h1>
          <Link
            href="/lots/nouveau"
            className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
          >
            {l.newBtn}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colCode}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colProduct}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colCollectes}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colWeight}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colStatus}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{l.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
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
                  <div className="flex gap-3 text-sm">
                    <Link href={`/lots/${lot.id}`} className="text-[#2ac1a3] hover:underline">{l.actionView}</Link>
                    <Link href={`/lots/${lot.id}/edit`} className="text-gray-500 hover:underline">{l.actionEdit}</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
