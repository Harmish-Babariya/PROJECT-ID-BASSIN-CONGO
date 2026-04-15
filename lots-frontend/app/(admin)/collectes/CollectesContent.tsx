"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

type Collecte = {
  id: number
  date_collecte: string
  poids_net_kg: string | null
  qualite: string | null
  produit: string | null
  producteurs: { id: number; nom: string; prenom: string } | null
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
  const { t } = useLanguage()
  const c = t.collectes

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{c.breadcrumb}</p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{c.title}</h1>
          <Link
            href="/collectes/nouveau"
            className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
          >
            {c.newBtn}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colDate}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colProducer}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colParcel}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colWeight}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colQuality}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colStatus}</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{c.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {collectes.map((col) => {
              const dateCollecte = new Date(col.date_collecte)
              if (isNaN(dateCollecte.getTime())) return null
              const lotAssigne = collecteLotsMap.get(col.id)
              return (
                <tr key={col.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {dateCollecte.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {col.producteurs ? (
                      <Link href={`/producteurs/${col.producteurs.id}`} className="text-[#2ac1a3] hover:underline">
                        {col.producteurs.nom} {col.producteurs.prenom}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {col.parcelles ? (
                      <Link href={`/parcelles/${col.parcelles.id}`} className="text-[#2ac1a3] hover:underline font-mono text-xs">
                        {col.parcelles.code_parcelle}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                    {col.poids_net_kg ? parseFloat(col.poids_net_kg).toFixed(2) + " kg" : "-"}
                  </td>
                  <td className="px-5 py-4">
                    {col.qualite ? (
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        col.qualite === "Grade 1" ? "bg-green-100 text-green-700" :
                        col.qualite === "Grade 2" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {col.qualite}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-4">
                    {lotAssigne ? (
                      <Link
                        href={`/lots/${lotAssigne.id}`}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      >
                        {lotAssigne.code_lot}
                      </Link>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                        {c.available}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3 text-sm">
                      <Link href={`/collectes/${col.id}`} className="text-[#2ac1a3] hover:underline">{c.actionView}</Link>
                      <Link href={`/collectes/${col.id}/edit`} className="text-gray-500 hover:underline">{c.actionEdit}</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
