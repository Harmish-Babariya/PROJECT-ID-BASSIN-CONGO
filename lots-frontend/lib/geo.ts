export type LatLon = { lat: number; lon: number }

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
