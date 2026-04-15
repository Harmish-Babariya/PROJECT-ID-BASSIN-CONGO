"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

type Parcelle = {
  id: number
  code_parcelle: string
  producteur_id: number
  surface_ha: string | null
  date_creation: string | null
  status_eudr: string | null
}

type Producteur = { id: number; code_producteur: string; nom: string }

export default function ParcellesContent({
  parcelles,
  producteursMap,
  exportButton,
}: {
  parcelles: Parcelle[]
  producteursMap: Map<number, Producteur>
  exportButton: React.ReactNode
}) {
  const { t } = useLanguage()
  const p = t.parcelles

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{p.breadcrumb}</p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
          <div className="flex gap-3">
            {exportButton}
            <Link
              href="/parcelles/nouveau"
              className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#24a88e] transition"
            >
              {p.newBtn}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colCode}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colProducer}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colSurface}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colDate}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colEudr}</th>
            </tr>
          </thead>
          <tbody>
            {parcelles.map((parc) => {
              const producteur = producteursMap.get(parc.producteur_id)
              return (
                <tr key={parc.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/parcelles/${parc.id}`} className="font-mono text-sm text-[#2ac1a3] font-medium hover:underline">
                      {parc.code_parcelle}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {producteur ? `${producteur.code_producteur} - ${producteur.nom}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{parc.surface_ha || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parc.date_creation ? new Date(parc.date_creation).toLocaleDateString("fr-FR") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      parc.status_eudr === "CONFORME" ? "bg-[#2ac1a3]/10 text-[#2ac1a3]" :
                      parc.status_eudr === "RISQUE NON NEGLIGEABLE" ? "bg-yellow-100 text-yellow-700" :
                      parc.status_eudr === "NON CONFORME" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {parc.status_eudr || p.notVerified}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-sm">{p.count(parcelles.length)}</p>
    </div>
  )
}
