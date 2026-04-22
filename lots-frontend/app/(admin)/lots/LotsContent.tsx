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

function StatutBadge({ statut }: { statut: string | null }) {
  const s = (statut || "").toLowerCase()
  let cls = "bg-gray-100 text-gray-500"
  if (s.includes("exporté") || s.includes("exporte")) {
    cls = "bg-[#d7efe5] text-[#2f7a5c]"
  } else if (s.includes("prêt") || s.includes("pret")) {
    cls = "bg-[#e8e4f6] text-[#3b2a7a]"
  } else if (s.includes("constitution") || s.includes("préparation") || s.includes("preparation")) {
    cls = "bg-[#faecc2] text-[#6b3a12]"
  }
  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${cls}`}>
      {statut || "—"}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{l.title.toUpperCase()}</h1>
        </div>
        <Link href="/dashboard" className="text-xs font-semibold text-gray-400 hover:text-gray-600 tracking-widest uppercase">
          {l.back}
        </Link>
      </div>

      <div>
        <Link
          href="/lots/nouveau"
          className="inline-block bg-[#2ac1a3] text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#24a88e] transition"
        >
          {l.newBtn}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colCode}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colProduct}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colCollectes}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colWeight}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colStatus}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">{l.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lots.map((lot) => (
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
            {lots.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
