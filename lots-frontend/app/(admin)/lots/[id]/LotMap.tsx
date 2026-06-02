"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Maximize2, X, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { normalizeEudrStatus, EUDR_STATUS } from "@/lib/eudr"

const MAP_STYLES: Record<string, string> = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
  terrain: "mapbox://styles/mapbox/outdoors-v12",
}

const STYLE_OPTIONS = [
  { key: "satellite", label: "SAT" },
  { key: "streets", label: "PLAN" },
  { key: "terrain", label: "TERRAIN" },
]

type ParcelPoint = {
  code: string
  lat: number
  lon: number
  status_eudr: string | null
  geojson?: unknown
}

function addPolygonLayersForLot(map: mapboxgl.Map, sourceId: string, color: string) {
  map.addLayer({
    id: `${sourceId}-fill`,
    type: "fill",
    source: sourceId,
    paint: { "fill-color": color, "fill-opacity": 0.25 },
  })
  map.addLayer({
    id: `${sourceId}-outline`,
    type: "line",
    source: sourceId,
    paint: { "line-color": color, "line-width": 2 },
  })
}

type StatusKey = "compliant" | "non_compliant" | "alert" | "pending_review"

function statusKey(status: string | null): StatusKey {
  const norm = normalizeEudrStatus(status)
  if (norm === EUDR_STATUS.CONFORME) return "compliant"
  if (norm === EUDR_STATUS.NON_CONFORME) return "non_compliant"
  if (norm === EUDR_STATUS.RISQUE) return "alert"
  return "pending_review"
}

const STATUS_COLOR: Record<StatusKey, string> = {
  compliant: "#2AC1A3",
  non_compliant: "#DC2626",
  alert: "#EAB308",
  pending_review: "#F59E0B",
}

type PolygonGeo = { type: "Polygon"; coordinates: number[][][] }

function parseGeojson(geo: unknown): PolygonGeo | null {
  if (!geo) return null
  let value: unknown = geo
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  const g = value as { type?: string; coordinates?: unknown }
  if (g?.type === "Polygon" && Array.isArray(g.coordinates)) {
    return g as PolygonGeo
  }
  return null
}

function polygonCentroid(poly: PolygonGeo): [number, number] | null {
  const ring = poly.coordinates?.[0]
  if (!ring || ring.length === 0) return null
  let sx = 0
  let sy = 0
  ring.forEach(([x, y]) => {
    sx += x
    sy += y
  })
  return [sx / ring.length, sy / ring.length]
}

function getBoundsForPoint(p: ParcelPoint): mapboxgl.LngLatBounds | null {
  const bounds = new mapboxgl.LngLatBounds()
  const polygon = parseGeojson(p.geojson)
  if (polygon) {
    polygon.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
    return bounds
  }
  if (Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
    bounds.extend([p.lon, p.lat])
    return bounds
  }
  return null
}

export default function LotMap({
  points,
  height = 320,
  emptyLabel,
  legendConformeLabel,
  legendNonConformeLabel,
  legendRisqueLabel,
  legendEnAttenteLabel,
  legendNotVerifiedLabel,
}: {
  points: ParcelPoint[]
  height?: number
  emptyLabel: string
  legendConformeLabel: (count: number) => string
  legendNonConformeLabel: (count: number) => string
  legendRisqueLabel: (count: number) => string
  legendEnAttenteLabel: (count: number) => string
  legendNotVerifiedLabel: (count: number) => string
}) {
  const { t } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeStyle, setActiveStyle] = useState("satellite")
  const [showParcelList, setShowParcelList] = useState(false)

  const resolved = points
    .map((p) => {
      const polygon = parseGeojson(p.geojson)
      const centroid = polygon ? polygonCentroid(polygon) : null
      const lon = centroid ? centroid[0] : p.lon
      const lat = centroid ? centroid[1] : p.lat
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      return { ...p, lat, lon }
    })
    .filter(Boolean) as ParcelPoint[]

  function flyToParcel(p: ParcelPoint) {
    const map = mapRef.current
    if (!map) return
    const bounds = getBoundsForPoint(p)
    if (!bounds || bounds.isEmpty()) return
    const polygon = parseGeojson(p.geojson)
    if (polygon) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 900 })
    } else {
      map.flyTo({ center: [p.lon, p.lat], zoom: 15, duration: 900 })
    }
    setShowParcelList(false)
  }

  // Re-creating markers/polygons is needed both on first load and after a
  // style change (setStyle clears all custom markers/layers).
  function addMarkers(map: mapboxgl.Map, fit: boolean) {
    markersRef.current.forEach((mk) => mk.remove())
    markersRef.current = []

    // Remove any previously added polygon layers/sources
    points.forEach((_, idx) => {
      const sid = `lot-parcelle-${idx}`
      if (map.getLayer(`${sid}-fill`)) map.removeLayer(`${sid}-fill`)
      if (map.getLayer(`${sid}-outline`)) map.removeLayer(`${sid}-outline`)
      if (map.getSource(sid)) map.removeSource(sid)
    })

    const bounds = new mapboxgl.LngLatBounds()

    points.forEach((p, idx) => {
      const color = STATUS_COLOR[statusKey(p.status_eudr)]
      const polygon = parseGeojson(p.geojson)

      if (polygon) {
        const sid = `lot-parcelle-${idx}`
        map.addSource(sid, {
          type: "geojson",
          data: { type: "Feature", geometry: polygon, properties: {} } as GeoJSON.Feature,
        })
        addPolygonLayersForLot(map, sid, color)
        polygon.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
      } else {
        const lat = p.lat
        const lon = p.lon
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
        const el = document.createElement("div")
        el.style.width = "14px"
        el.style.height = "14px"
        el.style.borderRadius = "50%"
        el.style.border = "2px solid #fff"
        el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.3)"
        el.style.background = color
        el.title = p.code
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(map)
        markersRef.current.push(marker)
        bounds.extend([lon, lat])
      }
    })

    if (!fit || bounds.isEmpty()) return
    map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 0 })
  }

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || resolved.length === 0) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satellite,
      center: [resolved[0].lon, resolved[0].lat],
      zoom: 4,
      attributionControl: false,
    })

    mapRef.current = map

    map.on("load", () => {
      // Build bounds from real polygon coordinates drawn on the map
      const bounds = new mapboxgl.LngLatBounds()
      points.forEach((p) => {
        const polygon = parseGeojson(p.geojson)
        if (polygon) {
          polygon.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
        } else if (Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
          bounds.extend([p.lon, p.lat])
        }
      })

      addMarkers(map, false)

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 0 })
      }
    })

    const ro = new ResizeObserver(() => map.resize())
    if (mapContainer.current) ro.observe(mapContainer.current)

    return () => {
      ro.disconnect()
      markersRef.current.forEach((mk) => mk.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeStyle(key: string) {
    const map = mapRef.current
    if (!map || key === activeStyle) return
    map.setStyle(MAP_STYLES[key])
    map.once("style.load", () => addMarkers(map, false))
    setActiveStyle(key)
  }

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [expanded])

  const conformeCount = resolved.filter((p) => statusKey(p.status_eudr) === "compliant").length
  const nonConformeCount = resolved.filter((p) => statusKey(p.status_eudr) === "non_compliant").length
  const risqueCount = resolved.filter((p) => statusKey(p.status_eudr) === "alert").length
  const enAttenteCount = resolved.filter((p) => statusKey(p.status_eudr) === "pending_review").length
  const notVerifiedCount = 0

  if (resolved.length === 0) {
    return (
      <div
        className="bg-[#141b23] rounded-lg overflow-hidden flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <>
      {expanded && <div className="fixed inset-0 z-90 bg-black/70 backdrop-blur-sm" onClick={() => setExpanded(false)} />}
      <div
        ref={wrapperRef}
        className={
          expanded
            ? "fixed inset-4 z-100 bg-[#141b23] rounded-xl overflow-hidden shadow-2xl"
            : "bg-[#141b23] rounded-lg overflow-hidden relative"
        }
        style={expanded ? undefined : { height }}
      >
        <div ref={mapContainer} className="w-full h-full" />

        {/* Top row: style switcher (left) + expand (right) */}
        <div className="absolute top-3 left-3 z-10 flex gap-1.5 bg-black/40 backdrop-blur-sm rounded-md p-1">
          {STYLE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => changeStyle(key)}
              className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-widest transition ${
                activeStyle === key
                  ? "bg-[#2AC1A3] text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View Plot button — second row on mobile, same row on sm+ */}
        <div className="absolute top-14 left-3 sm:top-3 sm:left-auto sm:right-14 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowParcelList((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold tracking-widest transition"
            >
              <MapPin className="w-3 h-3" />
              {t.common.viewPlot}
            </button>

            {showParcelList && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-[#1a2330]/95 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-[9px] font-bold tracking-widest text-white/50 uppercase">{t.common.selectParcel}</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {points.map((p, idx) => {
                    const hasPolygon = !!parseGeojson(p.geojson)
                    const hasCoords = Number.isFinite(p.lat) && Number.isFinite(p.lon)
                    const canZoom = hasPolygon || hasCoords
                    const color = STATUS_COLOR[statusKey(p.status_eudr)]
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!canZoom}
                        onClick={() => flyToParcel(p)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-[11px] font-mono text-white/80 truncate">{p.code}</span>
                        {hasPolygon && (
                          <span className="ml-auto text-[8px] text-white/30 flex-shrink-0">POLY</span>
                        )}
                        {!hasPolygon && hasCoords && (
                          <span className="ml-auto text-[8px] text-white/30 flex-shrink-0">PT</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? t.common.reduce : t.common.expand}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-md bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition"
        >
          {expanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Close parcel list on outside click */}
        {showParcelList && (
          <div className="fixed inset-0 z-[9]" onClick={() => setShowParcelList(false)} />
        )}

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono tracking-widest text-white/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1A3]" />
            {legendConformeLabel(conformeCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            {legendNonConformeLabel(nonConformeCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            {legendRisqueLabel(risqueCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {legendEnAttenteLabel(enAttenteCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
            {legendNotVerifiedLabel(notVerifiedCount)}
          </span>
        </div>
      </div>
    </>
  )
}
