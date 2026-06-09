import { NextRequest, NextResponse } from "next/server"
import { parseStringPromise } from "xml2js"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { EUDR_STATUS } from "@/lib/eudr"

const EUDR_SCRIPT_VERSION = "1.0.0"
const BUCKET = "parcelles-gpx"

type Locale = "fr" | "en"

const messages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    gpxOnly: "Seuls les fichiers .gpx sont acceptés",
    fileTooLarge: "Le fichier dépasse 10 Mo",
    invalidXml: "Le fichier GPX n'est pas un XML valide",
    invalidGpxData: "Le fichier ne contient pas de données GPX valides",
    noCoords: "Aucune coordonnée trouvée dans le fichier GPX",
    notEnoughPoints: "Le fichier GPX doit contenir au moins 3 points",
    zeroArea: "Le polygone a une surface nulle ou quasi-nulle",
    selfIntersect: "Le polygone présente des auto-intersections. Veuillez corriger le tracé GPX.",
    uploadError: (msg: string) => `Erreur upload : ${msg}`,
    internalError: "Erreur interne",
    pendingReview: "Vérification automatique en attente",
    pendingFutureYear: (year: number) =>
      `Année de plantation ${year} invalide (future). Vérification manuelle requise.`,
    compliant: (year: number) =>
      `Plantation créée en ${year}, antérieure au cutoff EUDR (31 déc 2020). Conforme.`,
    alert: (year: number) =>
      `Plantation créée en ${year}, postérieure au cutoff EUDR (31 déc 2020). Vérification satellite requise.`,
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    gpxOnly: "Only .gpx files are accepted",
    fileTooLarge: "File exceeds 10 MB",
    invalidXml: "The GPX file is not valid XML",
    invalidGpxData: "The file does not contain valid GPX data",
    noCoords: "No coordinates found in the GPX file",
    notEnoughPoints: "The GPX file must contain at least 3 points",
    zeroArea: "The polygon has zero or near-zero area",
    selfIntersect: "The polygon is self-intersecting. Please correct the GPX trace.",
    uploadError: (msg: string) => `Upload error: ${msg}`,
    internalError: "Internal error",
    pendingReview: "Automatic verification pending",
    pendingFutureYear: (year: number) =>
      `Plantation year ${year} is invalid (future). Manual verification required.`,
    compliant: (year: number) =>
      `Plantation established in ${year}, prior to the EUDR cutoff (31 Dec 2020). Compliant.`,
    alert: (year: number) =>
      `Plantation established in ${year}, after the EUDR cutoff (31 Dec 2020). Satellite verification required.`,
  },
} as const

function pickLocale(request: NextRequest): Locale {
  const q = request.nextUrl.searchParams.get("locale")
  return q === "en" ? "en" : "fr"
}

export async function POST(request: NextRequest) {
  const locale = pickLocale(request)
  const m = messages[locale]
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: m.unauthorized }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const annee_plantation = formData.get("annee_plantation") as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: m.noFile }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json({ success: false, error: m.gpxOnly }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: m.fileTooLarge }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse and validate GPX BEFORE uploading to storage
    const gpxText = buffer.toString("utf-8")

    let gpxData: any
    try {
      gpxData = await parseStringPromise(gpxText)
    } catch {
      return NextResponse.json({ success: false, error: m.invalidXml }, { status: 400 })
    }

    if (!gpxData?.gpx) {
      return NextResponse.json({ success: false, error: m.invalidGpxData }, { status: 400 })
    }

    // Extract coordinates
    let coords: { lat: number; lon: number }[] = []

    if (gpxData.gpx?.trk) {
      for (const trk of gpxData.gpx.trk) {
        if (trk?.trkseg) {
          for (const seg of trk.trkseg) {
            if (seg?.trkpt) {
              coords.push(...seg.trkpt.map((pt: any) => ({
                lat: parseFloat(pt.$.lat),
                lon: parseFloat(pt.$.lon),
              })))
            }
          }
        }
      }
    }

    if (coords.length === 0 && gpxData.gpx?.wpt) {
      coords = gpxData.gpx.wpt.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon),
      }))
    }

    if (coords.length === 0 && gpxData.gpx?.rte?.[0]?.rtept) {
      coords = gpxData.gpx.rte[0].rtept.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon),
      }))
    }

    coords = coords.filter(c => !isNaN(c.lat) && !isNaN(c.lon))

    // Drop the trailing point if it duplicates the first — GPX often closes
    // the ring explicitly, but GeoJSON closure is added below.
    if (
      coords.length >= 2 &&
      coords[0].lat === coords[coords.length - 1].lat &&
      coords[0].lon === coords[coords.length - 1].lon
    ) {
      coords = coords.slice(0, -1)
    }

    // Drop consecutive duplicate points which can create false self-intersection
    // hits and spurious zero-length segments.
    coords = coords.filter((c, i, arr) => i === 0 || c.lat !== arr[i - 1].lat || c.lon !== arr[i - 1].lon)

    if (coords.length === 0) {
      return NextResponse.json({ success: false, error: m.noCoords }, { status: 400 })
    }

    if (coords.length < 3) {
      return NextResponse.json({ success: false, error: m.notEnoughPoints }, { status: 400 })
    }

    // NOTE: Per milestone spec the required GPX polygon validation is:
    //   - .gpx extension + max size (checked above)
    //   - well-formed XML with coordinates present (checked above)
    //   - reject zero-area / self-intersecting polygons (checked below)
    // Duplicate-upload detection (same polygon uploaded twice) is intentionally
    // NOT done here: a reliable equality check needs a persisted gpx hash
    // column, which requires a DB migration. Deferred by product decision.

    // Preserve the surveyor's actual trace. The shoelace area below works for
    // any simple polygon, concave or convex, so we do NOT replace coords with a
    // convex hull — that would discard the parcel's real shape.
    const surface_ha = calculatePolygonArea(coords)

    if (surface_ha < 0.0001) {
      return NextResponse.json({ success: false, error: m.zeroArea }, { status: 400 })
    }

    if (hasSelfIntersection(coords)) {
      return NextResponse.json({ success: false, error: m.selfIntersect }, { status: 400 })
    }

    // Upload to Supabase Storage only after validation passes
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: "application/gpx+xml",
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: m.uploadError(uploadError.message) },
        { status: 500 }
      )
    }

    // Store the storage path (not a public URL) — bucket is private.
    // verify-eudr downloads via supabaseAdmin.storage.download(path) using the
    // service-role key, so no public access is ever needed.
    const storagePath = fileName

    const latitude = coords.reduce((s, c) => s + c.lat, 0) / coords.length
    const longitude = coords.reduce((s, c) => s + c.lon, 0) / coords.length

    const geojson = {
      type: "Polygon",
      coordinates: [coords.map(c => [c.lon, c.lat])],
    }
    const ring = geojson.coordinates[0]
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([...ring[0]])
    }

    // Per EUDR rules, plantation year alone is not a valid compliance signal.
    // Status stays EN_ATTENTE until the Hansen + WDPA satellite analysis runs
    // (see /api/verify-eudr) and overwrites this row with the real result.
    const eudr_status: string = EUDR_STATUS.EN_ATTENTE
    const justification: string = m.pendingReview
    const verification_timestamp = new Date().toISOString()
    void annee_plantation

    return NextResponse.json({
      success: true,
      gpx_file_url: storagePath,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      surface_ha: surface_ha.toFixed(4),
      nb_points: coords.length,
      eudr_status,
      justification,
      verification_timestamp,
      script_version: EUDR_SCRIPT_VERSION,
      geojson,
    })
  } catch (error: any) {
    console.error("Erreur upload-gpx:", error)
    return NextResponse.json({ success: false, error: error.message || m.internalError }, { status: 500 })
  }
}

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
  const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length
  return area * 111320 * 111320 * Math.cos(avgLat * Math.PI / 180) / 10000
}

function hasSelfIntersection(coords: { lat: number; lon: number }[]): boolean {
  const n = coords.length
  if (n < 4) return false
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue
      if (segmentsIntersect(coords[i], coords[i + 1], coords[j], coords[j + 1])) {
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
  const ccw = (p1: typeof a, p2: typeof a, p3: typeof a) =>
    (p3.lat - p1.lat) * (p2.lon - p1.lon) > (p2.lat - p1.lat) * (p3.lon - p1.lon)
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
}

