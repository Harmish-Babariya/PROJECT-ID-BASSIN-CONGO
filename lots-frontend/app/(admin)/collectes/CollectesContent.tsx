"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"

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
  const { t, locale } = useLanguage()
  const c = t.collectes
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(collectes, 10)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {c.title}
          </h1>
          <div className="mt-3">
            <Link
              href="/collectes/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {c.newBtn}
            </Link>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="font-courier text-[10px] text-gray-400 tracking-[0.15em] uppercase hover:text-[#2AC1A3] transition mt-1"
        >
          ← Retour
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colDate}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colProducer}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colParcel}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colWeight} (KG)</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colQuality}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colStatus}</th>
              <th className="px-6 py-3 text-left text-[9.5px] font-courier font-semibold text-gray-400 tracking-[0.18em] uppercase">{c.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {collectes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-[13px] text-gray-400">
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

                    {/* Date */}
                    <td className="px-6 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">
                      {dateCollecte.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}
                    </td>

                    {/* Producteur */}
                    <td className="px-6 py-3.5 text-[13px] text-gray-800">
                      {col.producteurs
                        ? `${col.producteurs.nom} ${col.producteurs.prenom}`
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
                          {col.qualite}
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
                      <div className="flex gap-3 font-courier text-[10px] font-semibold tracking-widest uppercase">
                        <Link href={`/collectes/${col.id}`} className="text-[#2AC1A3] hover:underline">
                          {c.actionView}
                        </Link>
                        <Link href={`/collectes/${col.id}/edit`} className="text-gray-400 hover:text-gray-600">
                          {c.actionEdit}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
