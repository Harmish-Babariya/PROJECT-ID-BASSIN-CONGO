import { notFound } from "next/navigation"
import ParcelleForm from "./ParcelleForm"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteursAll } from "@/lib/services/producteurs"
import { getZones } from "@/lib/services/common"

export default async function EditParcelle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [parcelle, producteurs, zones] = await Promise.all([
    getParcelleById(id),
    getProducteursAll(),
    getZones(),
  ])

  if (!parcelle) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier la parcelle</h1>
      <ParcelleForm parcelle={parcelle} producteurs={producteurs} zones={zones} />
    </div>
  )
}
