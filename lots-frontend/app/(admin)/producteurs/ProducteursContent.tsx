"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

type Producteur = {
  id: number
  code_producteur: string
  nom: string
  prenom: string
  village: string | null
  nombre_parcelles: number
  zones: { nom: string } | null
}

type Zone = { id: number; nom: string }

export default function ProducteursContent({
  producteurs,
  exportButton,
}: {
  producteurs: Producteur[]
  exportButton: React.ReactNode
}) {
  const { t } = useLanguage()
  const p = t.producteurs

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{p.breadcrumb}</p>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
          <div className="flex gap-3">
            {exportButton}
            <Link
              href="/producteurs/nouveau"
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
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colName}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colZone}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colVillage}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colParcelles}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{p.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {producteurs.map((prod) => (
              <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link href={`/producteurs/${prod.id}`} className="font-mono text-sm text-[#2ac1a3] font-medium hover:underline">
                    {prod.code_producteur}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{prod.nom} {prod.prenom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{prod.zones?.nom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{prod.village}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    prod.nombre_parcelles > 0 ? "bg-[#2ac1a3]/10 text-[#2ac1a3]" : "bg-gray-100 text-gray-400"
                  }`}>
                    {prod.nombre_parcelles}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/producteurs/${prod.id}`} className="text-[#2ac1a3] hover:underline">{p.actionView}</Link>
                    <Link href={`/producteurs/${prod.id}/edit`} className="text-gray-500 hover:underline">{p.actionEdit}</Link>
                    <Link href={`/parcelles/nouveau?producteur_id=${prod.id}`} className="text-gray-500 hover:underline">{p.actionParcel}</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-sm">{p.count(producteurs.length)}</p>
    </div>
  )
}
