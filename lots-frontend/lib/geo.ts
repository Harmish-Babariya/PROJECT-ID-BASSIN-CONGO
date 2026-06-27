export type LatLon = { lat: number; lon: number }

// --- EUDR / TRACES GeoJSON export -----------------------------------------

// Minimal shapes for the data the export needs. Kept loose because the rows
// come straight from Supabase (snake_case columns, possibly null).
export type ExportParcelle = {
  code_parcelle?: string | null
  surface_ha?: string | number | null
  latitude?: string | number | null
  longitude?: string | number | null
  geojson?: unknown // stored as a GeoJSON Polygon object or a JSON string
}

export type ExportProducteur = {
  nom?: string | null
  prenom?: string | null
  cooperative?: string | null
  village?: string | null
  pays?: { nom?: string | null } | null
  zones?: { nom?: string | null } | null
} | null

// ISO-3166 alpha-2 codes for the countries this platform operates in. The DB
// stores the country name, so map the common ones; fall back to the raw name.
const COUNTRY_ISO: Record<string, string> = {
  "république du congo": "CG",
  "republique du congo": "CG",
  "congo": "CG",
  "république démocratique du congo": "CD",
  "republique democratique du congo": "CD",
  "rdc": "CD",
  "cameroun": "CM",
  "cameroon": "CM",
}

function isoCountry(name: string | null | undefined): string {
  if (!name) return ""
  return COUNTRY_ISO[name.trim().toLowerCase()] ?? name
}

// Parse the `geojson` column into a usable Polygon geometry, tolerating both
// object and stringified storage. Returns null when there's no usable polygon.
function parsePolygon(raw: unknown): { type: "Polygon"; coordinates: number[][][] } | null {
  let g = raw
  if (typeof g === "string") {
    try {
      g = JSON.parse(g)
    } catch {
      return null
    }
  }
  if (
    g &&
    typeof g === "object" &&
    (g as { type?: string }).type === "Polygon" &&
    Array.isArray((g as { coordinates?: unknown }).coordinates)
  ) {
    return g as { type: "Polygon"; coordinates: number[][][] }
  }
  return null
}

// Build a single GeoJSON Feature for a parcelle. Prefers the stored Polygon;
// falls back to a Point built from lat/lon. Returns null if neither is usable.
// Property names follow the EUDR / TRACES convention requested by the client
// (ProducerName, ProducerCountry, ProductionPlace, Area).
export function buildParcelleFeature(
  parcelle: ExportParcelle,
  producteur: ExportProducteur
): Record<string, unknown> | null {
  const polygon = parsePolygon(parcelle.geojson)
  let geometry: Record<string, unknown> | null = null

  if (polygon) {
    geometry = polygon
  } else {
    const lat = parcelle.latitude != null ? Number(parcelle.latitude) : NaN
    const lon = parcelle.longitude != null ? Number(parcelle.longitude) : NaN
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      geometry = { type: "Point", coordinates: [lon, lat] }
    }
  }
  if (!geometry) return null

  const producerName = producteur
    ? [producteur.nom, producteur.prenom].filter(Boolean).join(" ").trim() || null
    : null
  const productionPlace = producteur
    ? [producteur.village, producteur.zones?.nom].filter(Boolean).join(", ") || null
    : null

  return {
    type: "Feature",
    properties: {
      ParcelId: parcelle.code_parcelle ?? null,
      ProducerName: producerName,
      ProducerCountry: isoCountry(producteur?.pays?.nom),
      ProductionPlace: productionPlace,
      Cooperative: producteur?.cooperative ?? null,
      Area: parcelle.surface_ha != null ? Number(parcelle.surface_ha) : null,
    },
    geometry,
  }
}

// Build a TRACES-ready FeatureCollection from a list of (parcelle, producteur)
// pairs. Parcelles with no usable geometry are skipped.
export function buildFeatureCollection(
  rows: Array<{ parcelle: ExportParcelle; producteur: ExportProducteur }>
): { type: "FeatureCollection"; features: Record<string, unknown>[] } {
  const features = rows
    .map(({ parcelle, producteur }) => buildParcelleFeature(parcelle, producteur))
    .filter((f): f is Record<string, unknown> => f !== null)
  return { type: "FeatureCollection", features }
}

// Orientation test: true when p1->p2->p3 turns counter-clockwise.
function ccw(p1: LatLon, p2: LatLon, p3: LatLon): boolean {
  return (p3.lat - p1.lat) * (p2.lon - p1.lon) > (p2.lat - p1.lat) * (p3.lon - p1.lon)
}

// Do open segments a-b and c-d cross? (Endpoints touching is not counted as a
// crossing by this proper-intersection test.)
function segmentsIntersect(a: LatLon, b: LatLon, c: LatLon, d: LatLon): boolean {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
}

// Find the first pair of non-adjacent edges (i->i+1, j->j+1) of the open ring
// that cross. Returns [i, j] or null if the ring is already simple. The closing
// edge (last->first) is intentionally not tested, matching the upload validators.
function firstCrossing(coords: LatLon[]): [number, number] | null {
  const n = coords.length
  if (n < 4) return null
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue // adjacent to the closing edge
      if (segmentsIntersect(coords[i], coords[i + 1], coords[j], coords[j + 1])) {
        return [i, j]
      }
    }
  }
  return null
}

// True when the open ring has at least one self-crossing.
export function hasSelfIntersection(coords: LatLon[]): boolean {
  return firstCrossing(coords) !== null
}

// Reverse the sub-path strictly between the two crossing edges. When edges
// (i,i+1) and (j,j+1) cross, reversing coords[i+1 .. j] swaps the tangled
// order so the path no longer loops back over itself — the standard "2-opt"
// de-loop move. Crucially this keeps every vertex, so the polygon's area is
// preserved (unlike a boolean self-union, which discards the smaller lobe).
function untwist(coords: LatLon[], i: number, j: number): LatLon[] {
  const head = coords.slice(0, i + 1)
  const middle = coords.slice(i + 1, j + 1).reverse()
  const tail = coords.slice(j + 1)
  return head.concat(middle, tail)
}

export type FixResult =
  | { ok: true; coords: LatLon[]; changed: boolean }
  | { ok: false }

// Repair a self-intersecting polygon ring by iteratively un-twisting crossings.
//
// Walk-around GPS traces (a surveyor circling a parcel) often cross themselves
// once or twice where the start and end paths overlap, or from GPS wobble. Each
// crossing is removed by reversing the tangled sub-path; we loop until the ring
// is simple. Every original point is retained, so the parcel's true area and
// shape survive the repair.
//
// Returns { ok: false } only if the ring can't be made simple within a safety
// bound (extremely tangled input), so the caller can still reject it.
export function fixSelfIntersection(coords: LatLon[]): FixResult {
  if (coords.length < 3) return { ok: false }

  let current = coords.slice()
  let changed = false
  // Each untwist removes at least one crossing; n^2 is a generous safety cap.
  const maxIters = current.length * current.length
  let iters = 0

  while (iters < maxIters) {
    const crossing = firstCrossing(current)
    if (!crossing) {
      return { ok: true, coords: current, changed }
    }
    current = untwist(current, crossing[0], crossing[1])
    changed = true
    iters++
  }

  // Still self-intersecting after the cap — give up so the caller can reject.
  return { ok: false }
}
