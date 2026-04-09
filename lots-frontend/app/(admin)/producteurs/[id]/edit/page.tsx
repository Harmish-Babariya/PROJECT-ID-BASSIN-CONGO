import { notFound } from "next/navigation"
import ProducteurForm from "./ProducteurForm"
import { getProducteurSimple } from "@/lib/services/producteurs"
import { getZones, getPays } from "@/lib/services/common"

export default async function EditProducteur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [producteur, zones, pays] = await Promise.all([
    getProducteurSimple(id),
    getZones(),
    getPays(),
  ])

  if (!producteur) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier le producteur</h1>
      <ProducteurForm producteur={producteur} zones={zones} pays={pays} />
    </div>
  )
}
