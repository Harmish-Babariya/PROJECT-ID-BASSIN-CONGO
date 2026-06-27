import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"
import { getLotParcellesForExport } from "@/lib/services/lots"
import { buildFeatureCollection } from "@/lib/geo"

// GET /api/lots/[id]/geojson
// Returns a TRACES-ready GeoJSON FeatureCollection with one feature per parcelle
// in the lot (Polygon when available, otherwise a Point), as a download.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  const { id } = await context.params
  const result = await getLotParcellesForExport(id)
  if (!result) return apiError("NOT_FOUND", 404)

  const fc = buildFeatureCollection(result.pairs)

  const filename = `${result.lot.code_lot ?? `lot-${id}`}.geojson`
  return new NextResponse(JSON.stringify(fc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/geo+json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
