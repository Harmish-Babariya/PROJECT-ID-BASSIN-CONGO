import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"
import { getParcelleById } from "@/lib/services/parcelles"
import { getProducteurById } from "@/lib/services/producteurs"
import { buildFeatureCollection } from "@/lib/geo"

// GET /api/parcelles/[id]/geojson
// Returns a TRACES-ready GeoJSON FeatureCollection with a single feature for
// this parcelle (Polygon when available, otherwise a Point), as a download.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  const { id } = await context.params
  const parcelle = await getParcelleById(id)
  if (!parcelle) return apiError("NOT_FOUND", 404)

  const producteur = parcelle.producteur_id
    ? await getProducteurById(String(parcelle.producteur_id))
    : null

  const fc = buildFeatureCollection([{ parcelle, producteur }])

  const filename = `${parcelle.code_parcelle ?? `parcelle-${id}`}.geojson`
  return new NextResponse(JSON.stringify(fc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/geo+json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
