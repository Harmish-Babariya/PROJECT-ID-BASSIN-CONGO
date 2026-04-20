import { notFound } from "next/navigation"
import ModifierProducteurClient from "./ModifierProducteurClient"
import { getProducteurSimple } from "@/lib/services/producteurs"
import { getPays, getZones } from "@/lib/services/common"

export default async function ModifierProducteur({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [producteur, pays, zones] = await Promise.all([
    getProducteurSimple(id),
    getPays(),
    getZones(),
  ])
  if (!producteur) notFound()

  return <ModifierProducteurClient producteur={producteur} pays={pays} zones={zones} />
}
