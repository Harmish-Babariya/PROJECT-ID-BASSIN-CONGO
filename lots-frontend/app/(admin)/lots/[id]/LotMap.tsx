"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Maximize2, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type ParcelPoint = {
  code: string
  lat: number
  lon: number
  conforme: boolean
  geojson?: unknown
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

export default function LotMap({
  points,
  height = 320,
  emptyLabel,
  legendConformeLabel,
  legendNonConformeLabel,
}: {
  points: ParcelPoint[]
  height?: number
  emptyLabel: string
  legendConformeLabel: (count: number) => string
  legendNonConformeLabel: (count: number) => string
}) {
  const { t } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [expanded, setExpanded] = useState(false)

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

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || resolved.length === 0) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [resolved[0].lon, resolved[0].lat],
      zoom: 6,
      attributionControl: false,
    })

    mapRef.current = map

    map.on("load", () => {
      const bounds = new mapboxgl.LngLatBounds()
      resolved.forEach((p) => {
        const el = document.createElement("div")
        el.style.width = "14px"
        el.style.height = "14px"
        el.style.borderRadius = "50%"
        el.style.border = "2px solid #fff"
        el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.3)"
        el.style.background = p.conforme ? "#2AC1A3" : "#F59E0B"
        el.title = p.code

        new mapboxgl.Marker({ element: el })
          .setLngLat([p.lon, p.lat])
          .addTo(map)

        bounds.extend([p.lon, p.lat])
      })

      if (resolved.length === 1) {
        map.setCenter([resolved[0].lon, resolved[0].lat])
        map.setZoom(13)
      } else {
        map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 14 })
      }
    })

    const ro = new ResizeObserver(() => map.resize())
    if (mapContainer.current) ro.observe(mapContainer.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const conformeCount = resolved.filter((p) => p.conforme).length
  const nonConformeCount = resolved.length - conformeCount

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

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? t.common.reduce : t.common.expand}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-md bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition"
        >
          {expanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] font-mono tracking-widest text-white/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1A3]" />
            {legendConformeLabel(conformeCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {legendNonConformeLabel(nonConformeCount)}
          </span>
        </div>
      </div>
    </>
  )
}
