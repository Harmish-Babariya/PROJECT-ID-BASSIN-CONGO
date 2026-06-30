import { NextRequest, NextResponse } from "next/server"
import { parseStringPromise } from "xml2js"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { EUDR_STATUS } from "@/lib/eudr"
import { fixSelfIntersection } from "@/lib/geo"

const EUDR_SCRIPT_VERSION = "1.0.0"
const BUCKET = "parcelles-gpx"

// Canonical (French) clean-up correction strings persisted to
// parcelles.nettoyage_corrections. Stored language-neutral and re-rendered in
// the active locale at display time (see lib/i18n/cleanup.ts).
const CLEANUP_SELF_INTERSECTION_FR = "Réparation de l'auto-intersection"
const CLEANUP_CLOSURE_FR = "Fermeture conservatrice du polygone"

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
    cleanupSelfIntersection: "Réparation de l'auto-intersection",
    cleanupClosure: "Fermeture conservatrice du polygone",
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
    cleanupSelfIntersection: "Self-intersection repair",
    cleanupClosure: "Conservative polygon closure",
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
    // Duplicate-upload detection (same polygon uploaded twice, even under a
    // different filename) is done further below via a centroid+area match
    // against existing parcelles — no DB migration required. The result is
    // returned as a non-blocking `duplicateWarning` for the client to surface.

    // If the walk-around trace crosses itself (common GPS wobble near the start/end
    // overlap), repair it by un-twisting the loop instead of rejecting. This keeps
    // every surveyed point, so the parcel's real area and shape are preserved. Only
    // a hopelessly tangled trace that cannot be made simple is rejected.
    const fix = fixSelfIntersection(coords)
    if (!fix.ok) {
      return NextResponse.json({ success: false, error: m.selfIntersect }, { status: 400 })
    }
    coords = fix.coords

    // Track the clean-up corrections applied to the raw GPX trace so the parcel
    // detail page can display them dynamically (Analyse et correction du polygone).
    // Always store the canonical French string regardless of the upload locale,
    // so rows stay language-consistent in the DB; the detail page re-renders them
    // in the active locale via translateCleanupCorrection().
    const cleanupCorrections: string[] = []
    if (fix.changed) cleanupCorrections.push(CLEANUP_SELF_INTERSECTION_FR)

    // Preserve the surveyor's actual trace. The shoelace area below works for
    // any simple polygon, concave or convex, so we do NOT replace coords with a
    // convex hull — that would discard the parcel's real shape.
    const surface_ha = calculatePolygonArea(coords)

    if (surface_ha < 0.0001) {
      return NextResponse.json({ success: false, error: m.zeroArea }, { status: 400 })
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

    // Content-based duplicate detection: a parcel uploaded twice (even under a
    // different filename) produces the same boundary, hence the same centroid
    // and surface. We flag an existing parcelle whose centroid is within ~55 m
    // (≈0.0005°) AND whose area is within 5% of this one. This is a non-blocking
    // warning returned to the client; it does not prevent creation.
    let duplicateWarning: { code_parcelle: string | null; id: number } | null = null
    {
      const dLat = 0.0005
      const dLon = 0.0005
      const { data: nearby } = await supabaseAdmin
        .from("parcelles")
        .select("id, code_parcelle, surface_ha, latitude, longitude")
        .gte("latitude", latitude - dLat)
        .lte("latitude", latitude + dLat)
        .gte("longitude", longitude - dLon)
        .lte("longitude", longitude + dLon)
      for (const p of nearby ?? []) {
        const existingArea = p.surface_ha != null ? Number(p.surface_ha) : NaN
        if (!Number.isFinite(existingArea) || existingArea <= 0) continue
        const areaDiff = Math.abs(existingArea - surface_ha) / existingArea
        if (areaDiff <= 0.05) {
          duplicateWarning = { code_parcelle: p.code_parcelle ?? null, id: p.id }
          break
        }
      }
    }

    const geojson = {
      type: "Polygon",
      coordinates: [coords.map(c => [c.lon, c.lat])],
    }
    const ring = geojson.coordinates[0]
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([...ring[0]])
      cleanupCorrections.push(CLEANUP_CLOSURE_FR)
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
      duplicateWarning,
      nettoyage_corrections: cleanupCorrections,
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

