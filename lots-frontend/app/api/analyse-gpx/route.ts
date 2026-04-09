import { NextRequest, NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const EUDR_SCRIPT_VERSION = "1.0.0"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gpx_url, annee_plantation } = body

    if (!gpx_url) {
      return NextResponse.json({ success: false, error: "URL GPX manquante" }, { status: 400 })
    }

    // 1. Download GPX file
    const gpxResponse = await fetch(gpx_url)
    if (!gpxResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Impossible de telecharger le fichier GPX"
      }, { status: 400 })
    }

    const gpxText = await gpxResponse.text()

    // 2. Validate well-formed XML
    let gpxData: any
    try {
      gpxData = await parseStringPromise(gpxText)
    } catch {
      return NextResponse.json({
        success: false,
        error: "Le fichier GPX n'est pas un XML valide"
      }, { status: 400 })
    }

    if (!gpxData?.gpx) {
      return NextResponse.json({
        success: false,
        error: "Le fichier ne contient pas de donnees GPX valides"
      }, { status: 400 })
    }

    // 3. Extract coordinates (track or waypoints)
    let coords: { lat: number; lon: number }[] = []

    // Try track segments first
    if (gpxData.gpx?.trk) {
      for (const trk of gpxData.gpx.trk) {
        if (trk?.trkseg) {
          for (const seg of trk.trkseg) {
            if (seg?.trkpt) {
              coords.push(...seg.trkpt.map((pt: any) => ({
                lat: parseFloat(pt.$.lat),
                lon: parseFloat(pt.$.lon)
              })))
            }
          }
        }
      }
    }

    // Fallback to waypoints
    if (coords.length === 0 && gpxData.gpx?.wpt) {
      coords = gpxData.gpx.wpt.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon)
      }))
    }

    // Fallback to route points
    if (coords.length === 0 && gpxData.gpx?.rte?.[0]?.rtept) {
      coords = gpxData.gpx.rte[0].rtept.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon)
      }))
    }

    // Filter out NaN coordinates
    coords = coords.filter(c => !isNaN(c.lat) && !isNaN(c.lon))

    if (coords.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Aucune coordonnee trouvee dans le fichier GPX"
      }, { status: 400 })
    }

    if (coords.length < 3) {
      return NextResponse.json({
        success: false,
        error: "Le fichier GPX doit contenir au moins 3 points pour former un polygone"
      }, { status: 400 })
    }

    // 4. Calculate polygon area
    const surface_ha = calculatePolygonArea(coords)

    // Reject zero-area polygons
    if (surface_ha < 0.0001) {
      return NextResponse.json({
        success: false,
        error: "Le polygone a une surface nulle ou quasi-nulle"
      }, { status: 400 })
    }

    // 5. Check for self-intersections (simplified check)
    if (hasSelfIntersection(coords)) {
      return NextResponse.json({
        success: false,
        error: "Le polygone presente des auto-intersections. Veuillez corriger le trace GPX."
      }, { status: 400 })
    }

    // 6. Calculate centroid
    const latitude = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length
    const longitude = coords.reduce((sum, c) => sum + c.lon, 0) / coords.length

    // 7. Build GeoJSON polygon
    const geojson = {
      type: "Polygon",
      coordinates: [coords.map(c => [c.lon, c.lat])]
    }
    // Close the ring if not already closed
    const ring = geojson.coordinates[0]
    if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
      ring.push([...ring[0]])
    }

    // 8. EUDR verification
    let eudr_status = "pending_review"
    let justification = "Verification automatique en attente"
    const verification_timestamp = new Date().toISOString()

    if (annee_plantation) {
      const year = parseInt(annee_plantation)
      if (!isNaN(year)) {
        if (year < 2020) {
          eudr_status = "compliant"
          justification = `Plantation creee en ${year}, anterieure au cutoff EUDR (31 dec 2020). Conforme.`
        } else {
          eudr_status = "alert"
          justification = `Plantation creee en ${year}, posterieure au cutoff EUDR. Verification satellite requise.`
        }
      }
    }

    return NextResponse.json({
      success: true,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      surface_ha: surface_ha.toFixed(4),
      nb_points: coords.length,
      eudr_status,
      justification,
      verification_timestamp,
      script_version: EUDR_SCRIPT_VERSION,
      geojson,
      gpx_url
    })

  } catch (error: any) {
    console.error("Erreur analyse GPX:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur interne lors de l'analyse"
    }, { status: 500 })
  }
}

// Shoelace formula for polygon area
function calculatePolygonArea(coords: { lat: number; lon: number }[]): number {
  if (coords.length < 3) return 0

  let area = 0
  const n = coords.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coords[i].lon * coords[j].lat
    area -= coords[j].lon * coords[i].lat
  }

  area = Math.abs(area) / 2

  // Convert degrees^2 to hectares (approximation near equator, adjusted by latitude)
  const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length
  const hectares = area * 111320 * 111320 * Math.cos(avgLat * Math.PI / 180) / 10000

  return hectares
}

// Simplified self-intersection check using line segment crossing
function hasSelfIntersection(coords: { lat: number; lon: number }[]): boolean {
  const n = coords.length
  if (n < 4) return false

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue // Skip adjacent closing segments
      if (segmentsIntersect(
        coords[i], coords[i + 1],
        coords[j], coords[j + 1]
      )) {
        return true
      }
    }
  }
  return false
}

function segmentsIntersect(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  c: { lat: number; lon: number },
  d: { lat: number; lon: number }
): boolean {
  const ccw = (p1: typeof a, p2: typeof a, p3: typeof a) => {
    return (p3.lat - p1.lat) * (p2.lon - p1.lon) > (p2.lat - p1.lat) * (p3.lon - p1.lon)
  }
  return (
    ccw(a, c, d) !== ccw(b, c, d) &&
    ccw(a, b, c) !== ccw(a, b, d)
  )
}
