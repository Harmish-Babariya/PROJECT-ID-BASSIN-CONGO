import ProducteursContent from "./ProducteursContent"
import { getProducteurs } from "@/lib/services/producteurs"
import { getZones } from "@/lib/services/common"

export default async function ProducteursPage({
  searchParams,
}: {
  searchParams: Promise<{
    recherche?: string
    zone_id?: string
    sexe?: string
    statut?: string
    avec_parcelles?: string
  }>
}) {
  const params = await searchParams
  const producteursAvecParcelles = await getProducteurs(params)

  return (
    <ProducteursContent
      producteurs={producteursAvecParcelles}
      exportButton={null}
    />
  )
}
