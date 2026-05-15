/**
 * EUDR Verification API — Node.js port of python_scripts/eudr_verification.py
 *
 * Uses the `geotiff` npm package (pure JS, HTTP range requests) to read Hansen
 * GeoTIFF tiles the same way Python's rasterio does — only fetching the pixels
 * that overlap the parcel polygon, not the entire ~1 GB tile.
 *
 * EUDR decision tree (mirrors Python exactly):
 *   deforestation_after_2020 > 5%  → NON CONFORME  (risque: Non négligeable)
 *   else forest_cover_2000  < 5%   → CONFORME      (risque: Négligeable)
 *   else                           → CONFORME      (risque: Négligeable)
 *   + protected area overlay may upgrade CONFORME → RISQUE NON NÉGLIGEABLE
 */

import { NextRequest, NextResponse } from "next/server"
import { parseStringPromise } from "xml2js"
import { fromUrl } from "geotiff"
import { EUDR_STATUS } from "@/lib/eudr"
import { supabaseAdmin } from "@/lib/supabase-server"

// ─── Constants ────────────────────────────────────────────────────────────────

const HANSEN_BASE_URL =
  "https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11"

const GFW_API_URL = "https://data-api.globalforestwatch.org"

const FOREST_THRESHOLD = 10   // treecover2000 % to count as forest (matches Python)
const DEFORESTATION_ALERT = 5 // deforestation % above which parcel is non-compliant

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coord { lat: number; lon: number }

interface DeforestationResult {
  conforme: boolean | null
  risque: "Négligeable" | "Non négligeable" | "Indéterminé"
  statut: string
  justification: string
  sources: string
  tree_cover_2000_percent: number
  avg_tree_cover_2000: number
  deforestation_after_2020_percent: number
  forest_pixels_2000: number
  deforestation_pixels: number
  total_pixels: number
}

// ─── POST handler ─────────────────────────────────────────────────────────────

/**
 * Run the full Hansen + WDPA verification pipeline for one parcel and persist
 * the result. Exported so server actions can call it directly without a
 * self-HTTP round-trip (which would require knowing the app's own origin).
 */
export async function runEudrVerification(parcelle_id: number | string) {
  // 1. Fetch parcel from Supabase
  const { data: parcelle, error: fetchError } = await supabaseAdmin
    .from("parcelles")
    .select("id, code_parcelle, latitude, longitude, gpx_file_url, annee_plantation, eudr_admin_override")
    .eq("id", parcelle_id)
    .single()

  if (fetchError || !parcelle) {
    return { success: false as const, error: `Parcelle ${parcelle_id} non trouvée` }
  }

  if (parcelle.eudr_admin_override) {
    return {
      success: true as const,
      parcelle_id,
      code_parcelle: parcelle.code_parcelle,
      skipped: true,
      reason: "admin_override",
    }
  }

  // 2. Parse GPX → polygon
  const polygon = parcelle.gpx_file_url
    ? await getGpxPolygon(parcelle.gpx_file_url)
    : null

  // 3. Protected area check (WDPA via GFW)
  let dans_zone_protegee: boolean | null = null
  let zone_protegee_nom: string | null = null
  let zone_protegee_type: string | null = null

  if (polygon && polygon.length >= 3) {
    ;[dans_zone_protegee, zone_protegee_nom, zone_protegee_type] =
      await checkProtectedAreaPolygon(polygon)
  }

  // 4. Hansen deforestation analysis
  let lat = parcelle.latitude ? parseFloat(parcelle.latitude) : null
  let lon = parcelle.longitude ? parseFloat(parcelle.longitude) : null

  // Derive lat/lon from the polygon centroid when the DB row doesn't carry
  // them — older parcels created before the centroid was persisted will still
  // have a usable GPX. This is the same fallback Python uses.
  if ((lat === null || lon === null) && polygon && polygon.length > 0) {
    lat = polygon.reduce((s, c) => s + c.lat, 0) / polygon.length
    lon = polygon.reduce((s, c) => s + c.lon, 0) / polygon.length
  }

  let analysis: DeforestationResult

  if (polygon && polygon.length >= 3 && lat !== null && lon !== null) {
    analysis = await analyzeDeforestationPolygon(polygon, lat, lon)
  } else {
    // Be explicit about which input is missing so we can debug.
    const reasons: string[] = []
    if (!parcelle.gpx_file_url) reasons.push("aucun fichier GPX lié à la parcelle")
    else if (!polygon || polygon.length === 0) reasons.push("fichier GPX introuvable ou illisible")
    else if (polygon.length < 3) reasons.push(`GPX ne contient que ${polygon.length} point(s), 3 minimum requis`)
    if (lat === null || lon === null) reasons.push("coordonnées GPS manquantes sur la parcelle")
    analysis = makeIndeterminate(
      `Vérification impossible : ${reasons.join(" ; ") || "données incomplètes"}.`
    )
  }

  // 5. Overlay protected-area result — mirrors Python verify_parcelle_eudr()
  let final_statut = analysis.statut
  let final_justification = analysis.justification
  let final_sources = analysis.sources

  if (dans_zone_protegee && final_statut === "CONFORME") {
    final_statut = "RISQUE NON NÉGLIGEABLE"
    final_justification +=
      ` La parcelle est située partiellement ou totalement dans la zone protégée` +
      ` '${zone_protegee_nom}' (${zone_protegee_type}) selon la base WDPA.` +
      ` Une vérification de la conformité aux lois du pays de production est requise` +
      ` conformément au règlement (UE) 2023/1115.`
    final_sources += ", WDPA 2024"
  } else if (dans_zone_protegee === false) {
    final_justification +=
      " L'analyse par intersection géométrique confirme que la parcelle n'est pas" +
      " située dans une zone protégée selon la base WDPA."
    final_sources += ", WDPA 2024"
  }

  if (final_statut === "CONFORME") {
    final_justification +=
      " Aucun élément ne permet d'identifier un risque non négligeable" +
      " au sens du règlement (UE) 2023/1115."
  }

  const eudr_date_verification = new Date().toISOString()

  await supabaseAdmin
    .from("parcelles")
    .update({
      eudr_conforme: analysis.conforme,
      eudr_risque: analysis.risque,
      eudr_statut: final_statut,
      status_eudr: final_statut,
      eudr_justification: final_justification,
      justification_eudr: final_justification,
      eudr_sources: final_sources,
      eudr_date_verification,
      dans_zone_protegee: dans_zone_protegee ?? false,
      zone_protegee_nom,
      zone_protegee_type,
    })
    .eq("id", parcelle_id)

  return {
    success: true as const,
    parcelle_id,
    code_parcelle: parcelle.code_parcelle,
    eudr_statut: final_statut,
    eudr_risque: analysis.risque,
    eudr_conforme: analysis.conforme,
    eudr_justification: final_justification,
    eudr_sources: final_sources,
    eudr_date_verification,
    dans_zone_protegee,
    zone_protegee_nom,
    zone_protegee_type,
    stats: {
      total_pixels: analysis.total_pixels,
      forest_pixels_2000: analysis.forest_pixels_2000,
      deforestation_pixels: analysis.deforestation_pixels,
      tree_cover_2000_percent: analysis.tree_cover_2000_percent,
      avg_tree_cover_2000: analysis.avg_tree_cover_2000,
      deforestation_after_2020_percent: analysis.deforestation_after_2020_percent,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parcelle_id } = body

    if (!parcelle_id) {
      return NextResponse.json(
        { success: false, error: "parcelle_id est requis" },
        { status: 400 }
      )
    }

    const result = await runEudrVerification(parcelle_id)
    if (!("success" in result) || !result.success) {
      return NextResponse.json(result, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("verify-eudr error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    )
  }
}

// ─── GPX parsing ──────────────────────────────────────────────────────────────

async function getGpxPolygon(gpxFileUrl: string): Promise<Coord[]> {
  try {
    let gpxText: string

    if (gpxFileUrl.startsWith("http://") || gpxFileUrl.startsWith("https://")) {
      const res = await fetch(gpxFileUrl, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      gpxText = await res.text()
    } else {
      const { data, error } = await supabaseAdmin.storage
        .from("parcelles-gpx")
        .download(gpxFileUrl)
      if (error || !data) throw new Error(error?.message ?? "Download failed")
      gpxText = await data.text()
    }

    const gpxData = await parseStringPromise(gpxText)
    const coords: Coord[] = []

    if (gpxData?.gpx?.trk) {
      for (const trk of gpxData.gpx.trk) {
        for (const seg of trk?.trkseg ?? []) {
          for (const pt of seg?.trkpt ?? []) {
            const lat = parseFloat(pt.$?.lat)
            const lon = parseFloat(pt.$?.lon)
            if (!isNaN(lat) && !isNaN(lon)) coords.push({ lat, lon })
          }
        }
      }
    }

    if (coords.length === 0 && gpxData?.gpx?.wpt) {
      for (const pt of gpxData.gpx.wpt) {
        const lat = parseFloat(pt.$?.lat)
        const lon = parseFloat(pt.$?.lon)
        if (!isNaN(lat) && !isNaN(lon)) coords.push({ lat, lon })
      }
    }

    if (coords.length === 0 && gpxData?.gpx?.rte?.[0]?.rtept) {
      for (const pt of gpxData.gpx.rte[0].rtept) {
        const lat = parseFloat(pt.$?.lat)
        const lon = parseFloat(pt.$?.lon)
        if (!isNaN(lat) && !isNaN(lon)) coords.push({ lat, lon })
      }
    }

    return coords
  } catch (e: any) {
    console.warn("getGpxPolygon error:", e.message)
    return []
  }
}

// ─── Protected area check (GFW / WDPA) ───────────────────────────────────────

async function checkProtectedAreaPolygon(
  polygon: Coord[]
): Promise<[boolean | null, string | null, string | null]> {
  try {
    const lats = polygon.map((c) => c.lat)
    const lons = polygon.map((c) => c.lon)
    const minLon = Math.min(...lons)
    const minLat = Math.min(...lats)
    const maxLon = Math.max(...lons)
    const maxLat = Math.max(...lats)

    // Same SQL as Python check_protected_area_polygon()
    const sql =
      `SELECT name, desig_eng, iucn_cat, wdpa_pid FROM data ` +
      `WHERE ST_Intersects(geometry, ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326)) ` +
      `LIMIT 5`

    const res = await fetch(
      `${GFW_API_URL}/dataset/wdpa_protected_areas/latest/query/json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
        signal: AbortSignal.timeout(20_000),
      }
    )

    if (!res.ok) return [null, null, null]

    const json = await res.json()
    if (json?.data?.length > 0) {
      const pa = json.data[0]
      return [true, pa.name ?? "Inconnu", pa.desig_eng ?? pa.iucn_cat ?? "Zone protégée"]
    }

    return [false, null, null]
  } catch (e: any) {
    console.warn("checkProtectedArea error:", e.message)
    return [null, null, null]
  }
}

// ─── Hansen tile helpers ──────────────────────────────────────────────────────

/**
 * Same logic as Python lat_lon_to_tile().
 * Hansen names tiles by their NORTH edge for lat, WEST edge for lon.
 */
function latLonToTile(lat: number, lon: number): { latTile: string; lonTile: string } {
  let latTile: string
  if (lat >= 0) {
    const latUpper = (Math.floor(lat / 10) + 1) * 10
    latTile = `${String(latUpper).padStart(2, "0")}N`
  } else {
    const latLower = Math.floor(lat / 10) * 10
    latTile = `${String(Math.abs(latLower)).padStart(2, "0")}S`
  }

  const lonFloor = Math.floor(lon / 10) * 10
  const lonTile =
    lon >= 0
      ? `${String(Math.abs(lonFloor)).padStart(3, "0")}E`
      : `${String(Math.abs(lonFloor)).padStart(3, "0")}W`

  return { latTile, lonTile }
}

function hansenTileUrl(lat: number, lon: number, dataType: "treecover2000" | "lossyear"): string {
  const { latTile, lonTile } = latLonToTile(lat, lon)
  return `${HANSEN_BASE_URL}/Hansen_GFC-2023-v1.11_${dataType}_${latTile}_${lonTile}.tif`
}

// ─── Core deforestation analysis ─────────────────────────────────────────────

function makeIndeterminate(message: string): DeforestationResult {
  return {
    conforme: null,
    risque: "Indéterminé",
    statut: EUDR_STATUS.EN_ATTENTE,
    justification: message,
    sources: "Hansen Global Forest Change 2023 (v1.11)",
    tree_cover_2000_percent: 0,
    avg_tree_cover_2000: 0,
    deforestation_after_2020_percent: 0,
    forest_pixels_2000: 0,
    deforestation_pixels: 0,
    total_pixels: 0,
  }
}

/**
 * Exact port of Python analyze_deforestation_polygon().
 *
 * Uses geotiff.fromUrl() with HTTP range requests so only the pixels
 * overlapping the parcel bounding box are fetched — same behaviour as
 * rasterio.open() + rasterio.mask.mask().
 */
async function analyzeDeforestationPolygon(
  polygon: Coord[],
  centerLat: number,
  centerLon: number
): Promise<DeforestationResult> {

  const lons = polygon.map((c) => c.lon)
  const lats = polygon.map((c) => c.lat)
  const bbox: [number, number, number, number] = [
    Math.min(...lons),
    Math.min(...lats),
    Math.max(...lons),
    Math.max(...lats),
  ]

  const tcUrl = hansenTileUrl(centerLat, centerLon, "treecover2000")
  const lyUrl = hansenTileUrl(centerLat, centerLon, "lossyear")

  let tcPixels: number[]
  let lyPixels: number[]
  let rasterWidth: number
  let rasterHeight: number
  let rasterBbox: [number, number, number, number]

  try {
    // Open treecover tile — geotiff uses HTTP Range requests, never loads full file
    const tcTiff = await fromUrl(tcUrl)
    const tcImage = await tcTiff.getImage()

    // Convert geographic bbox → pixel window [left, top, right, bottom]
    // getOrigin() returns [west, north], getResolution() returns [xRes, yRes]
    const [originX, originY] = tcImage.getOrigin()           // top-left corner
    const [xRes, yRes] = tcImage.getResolution(tcImage)      // degrees per pixel

    const left   = Math.floor((bbox[0] - originX) / xRes)
    const top    = Math.floor((originY - bbox[3]) / Math.abs(yRes))
    const right  = Math.ceil((bbox[2] - originX) / xRes)
    const bottom = Math.ceil((originY - bbox[1]) / Math.abs(yRes))

    // Clamp to raster extent
    const imgW = tcImage.getWidth()
    const imgH = tcImage.getHeight()
    const wLeft   = Math.max(0, left)
    const wTop    = Math.max(0, top)
    const wRight  = Math.min(imgW, right)
    const wBottom = Math.min(imgH, bottom)

    const window: [number, number, number, number] = [wLeft, wTop, wRight, wBottom]

    // Recompute actual geographic extent of the clamped window
    rasterWidth  = wRight - wLeft
    rasterHeight = wBottom - wTop
    rasterBbox = [
      originX + wLeft  * xRes,
      originY - wBottom * Math.abs(yRes),
      originX + wRight * xRes,
      originY - wTop   * Math.abs(yRes),
    ]

    if (rasterWidth <= 0 || rasterHeight <= 0) {
      return makeIndeterminate("Polygon hors limites du raster Hansen.")
    }

    // Read only the windowed pixels — mirrors rasterio.mask.mask()
    const tcRaster = await tcImage.readRasters({ window })
    tcPixels = Array.from(tcRaster[0] as any)

    const lyTiff = await fromUrl(lyUrl)
    const lyImage = await lyTiff.getImage()
    const lyRaster = await lyImage.readRasters({ window })
    lyPixels = Array.from(lyRaster[0] as any)

  } catch (e: any) {
    console.warn("Hansen tile read error:", e.message)
    return makeIndeterminate("Données Hansen non disponibles pour cette localisation.")
  }

  if (tcPixels.length === 0) {
    return makeIndeterminate("Aucun pixel valide dans le polygone (parcelle hors couverture Hansen).")
  }

  // Build per-pixel lon/lat centroids so we can apply point-in-polygon mask
  // (mirrors Python geometry_mask with invert=True)
  const [west, south, east, north] = rasterBbox
  const lonStep = (east - west) / rasterWidth
  const latStep = (north - south) / rasterHeight

  // ── Statistics — exact port of Python numpy logic ────────────────────────

  let validPixels = 0
  let forestPixels2000 = 0
  let sumTreecover = 0
  let nonZeroCount = 0
  let deforestationPixels = 0

  for (let row = 0; row < rasterHeight; row++) {
    const pixLat = north - (row + 0.5) * latStep
    for (let col = 0; col < rasterWidth; col++) {
      const pixLon = west + (col + 0.5) * lonStep

      // geometry_mask invert=True → True inside polygon
      if (!pointInPolygon(pixLat, pixLon, polygon)) continue

      const idx = row * rasterWidth + col
      const tc = tcPixels[idx] ?? 0
      const ly = lyPixels[idx] ?? 0

      validPixels++

      // treecover_masked[treecover_masked >= FOREST_THRESHOLD]
      if (tc >= FOREST_THRESHOLD) forestPixels2000++

      // avg_tree_cover_2000: mean of non-zero pixels inside polygon
      if (tc > 0) { sumTreecover += tc; nonZeroCount++ }

      // loss_after_2020 = lossyear >= 21  AND  treecover >= FOREST_THRESHOLD
      if (ly >= 21 && tc >= FOREST_THRESHOLD) deforestationPixels++
    }
  }

  if (validPixels === 0) {
    return makeIndeterminate("Aucun pixel valide dans le polygone (parcelle hors couverture Hansen).")
  }

  // Mirrors Python formulas exactly
  const forestPercent2000 = (forestPixels2000 / validPixels) * 100
  const avgTreeCover2000 = nonZeroCount > 0 ? sumTreecover / nonZeroCount : 0
  const deforestationPercent =
    forestPixels2000 > 0 ? (deforestationPixels / forestPixels2000) * 100 : 0

  // ── EUDR decision tree — identical to Python ─────────────────────────────

  const sources = "Hansen Global Forest Change 2023 (v1.11)"
  const parts: string[] = []
  let conforme: boolean
  let risque: "Négligeable" | "Non négligeable"
  let statut: string

  if (deforestationPercent > DEFORESTATION_ALERT) {
    // 1. BLOCAGE IMMÉDIAT — même logique Python ligne 342
    conforme = false
    risque = "Non négligeable"
    statut = "NON CONFORME"
    parts.push(
      `Déforestation de ${deforestationPercent.toFixed(1)}% détectée après le 31 décembre 2020.`
    )
    parts.push("La parcelle ne respecte pas le règlement (UE) 2023/1115.")
  } else {
    conforme = true
    risque = "Négligeable"
    statut = "CONFORME"

    if (forestPercent2000 < 5) {
      // Pas de forêt en 2000 = déjà agricole — Python ligne 354
      parts.push(
        `Parcelle déjà en usage agricole en 2000 (${forestPercent2000.toFixed(1)}% de couverture forestière).`
      )
      parts.push(
        "Aucune déforestation ni conversion forestière postérieure au 31 décembre 2020 n'a été détectée."
      )
    } else {
      // Forêt stable — Python ligne 362
      parts.push(
        "Aucune déforestation ni conversion forestière postérieure au 31 décembre 2020 n'a été détectée sur la parcelle."
      )
      parts.push(`Couverture forestière stable depuis 2000 (${forestPercent2000.toFixed(1)}%).`)
    }
    parts.push(
      `Analyse réalisée à la résolution native des données Hansen (30m, ${validPixels} pixels analysés).`
    )
  }

  return {
    conforme,
    risque,
    statut,
    justification: parts.join(" "),
    sources,
    tree_cover_2000_percent: Math.round(forestPercent2000 * 100) / 100,
    avg_tree_cover_2000: Math.round(avgTreeCover2000 * 100) / 100,
    deforestation_after_2020_percent: Math.round(deforestationPercent * 100) / 100,
    forest_pixels_2000: forestPixels2000,
    deforestation_pixels: deforestationPixels,
    total_pixels: validPixels,
  }
}

// ─── Point-in-polygon (ray casting) ──────────────────────────────────────────

function pointInPolygon(lat: number, lon: number, polygon: Coord[]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lon, yi = polygon[i].lat
    const xj = polygon[j].lon, yj = polygon[j].lat
    const cross = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (cross) inside = !inside
  }
  return inside
}
