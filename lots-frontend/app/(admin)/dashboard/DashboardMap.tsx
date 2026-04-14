"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { createClient } from "@supabase/supabase-js"
import { Maximize2 } from "lucide-react"
import ExpandedMapModal from "./ExpandedMapModal"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface ParcelFeature {
  type: "Feature"
  geometry: { type: string; coordinates: number[][][] }
  properties: {
    id: number | string
    filename: string
    area: number
    [key: string]: unknown
  }
}

interface Stats {
  total: number
  totalSurface: number
  avgSurface: number
  maxSurface: number
}

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

function calculateArea(coordinates: number[][][]): number {
  const R = 6371000
  let area = 0
  const coords = coordinates[0]
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const lat1 = (p1[1] * Math.PI) / 180
    const lat2 = (p2[1] * Math.PI) / 180
    const dLon = ((p2[0] - p1[0]) * Math.PI) / 180
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs((area * R * R) / 2)
}

function parseGeometry(geom: unknown) {
  if (typeof geom === "object" && geom !== null) {
    const g = geom as { type?: string; coordinates?: unknown }
    if (g.type && g.coordinates) return geom
  }
  if (typeof geom === "string") {
    try {
      const parsed = JSON.parse(geom)
      if (parsed.type && parsed.coordinates) return parsed
    } catch {}
  }
  return null
}

function addLayersToMap(map: mapboxgl.Map) {
  map.addLayer({
    id: "parcelles-fill",
    type: "fill",
    source: "parcelles",
    paint: { "fill-color": "#2AC1A3", "fill-opacity": 0.25 },
  })
  map.addLayer({
    id: "parcelles-outline",
    type: "line",
    source: "parcelles",
    paint: { "line-color": "#2AC1A3", "line-width": 2 },
  })
}

export default function DashboardMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geojsonRef = useRef<{ type: string; features: ParcelFeature[] } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeStyle, setActiveStyle] = useState("satellite")
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satellite,
      center: [14.57, 1.66],
      zoom: 11,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-right")
    mapRef.current = map

    map.on("load", async () => {
      try {
        const { data, error: dbError } = await supabase
          .from("parcelles_geojson")
          .select("*")

        if (dbError) throw dbError
        if (!data || data.length === 0) {
          setError("Aucune parcelle trouvee dans la base de donnees.")
          setLoading(false)
          return
        }

        const features: ParcelFeature[] = data
          .map((row, index) => {
            const geometry = parseGeometry(row.geometry) as ParcelFeature["geometry"] | null
            if (!geometry) return null
            const area = calculateArea(geometry.coordinates)
            return {
              type: "Feature" as const,
              geometry,
              properties: {
                id: row.id ?? index + 1,
                filename: row.filename ?? row.name ?? row.nom ?? `Parcelle ${row.id ?? index + 1}`,
                area,
                ...row,
              },
            }
          })
          .filter((f): f is ParcelFeature => f !== null)

        const geojson = { type: "FeatureCollection", features }
        geojsonRef.current = geojson

        const surfaces = features.map(f => f.properties.area / 10000)
        const totalSurface = surfaces.reduce((a, b) => a + b, 0)
        setStats({
          total: features.length,
          totalSurface,
          avgSurface: totalSurface / features.length,
          maxSurface: Math.max(...surfaces),
        })

        map.addSource("parcelles", {
          type: "geojson",
          data: geojson as unknown as GeoJSON.FeatureCollection,
        })
        addLayersToMap(map)

        const bounds = new mapboxgl.LngLatBounds()
        features.forEach(f =>
          f.geometry.coordinates[0].forEach(c => bounds.extend(c as [number, number]))
        )
        map.fitBounds(bounds, { padding: 30, duration: 1500 })

        map.on("mouseenter", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "parcelles-fill", () => {
          map.getCanvas().style.cursor = ""
        })
        map.on("click", "parcelles-fill", e => {
          const props = e.features![0].properties!
          new mapboxgl.Popup({ offset: 15 })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background:linear-gradient(135deg,#2AC1A3,#1E8876);padding:14px 18px">
                <div style="font-size:14px;font-weight:700;color:white">Parcelle ${props.id}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px">${props.filename}</div>
              </div>
              <div style="padding:12px 18px">
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:12px">
                  <span style="color:#64748b;font-weight:500">ID</span>
                  <span style="color:#0f172a;font-weight:600">${props.id}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:12px">
                  <span style="color:#64748b;font-weight:500">Surface</span>
                  <span style="color:#0f172a;font-weight:600">${(props.area / 10000).toFixed(4)} ha</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px">
                  <span style="color:#64748b;font-weight:500">Aire</span>
                  <span style="color:#0f172a;font-weight:600">${Number(props.area).toFixed(2)} m&sup2;</span>
                </div>
              </div>
            `)
            .addTo(map)
        })

        setLoading(false)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur de chargement")
        setLoading(false)
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const changeStyle = useCallback((styleKey: string) => {
    const map = mapRef.current
    const data = geojsonRef.current
    if (!map) return
    map.setStyle(MAP_STYLES[styleKey])
    map.once("style.load", () => {
      if (data) {
        map.addSource("parcelles", {
          type: "geojson",
          data: data as unknown as GeoJSON.FeatureCollection,
        })
        addLayersToMap(map)
      }
    })
    setActiveStyle(styleKey)
  }, [])

  return (
    <>
    <div
      className="bg-[#1E2A35] rounded-xl overflow-hidden relative border border-[#E8E8E3] cursor-pointer group"
      onClick={() => setExpanded(true)}
      role="button"
      aria-label="Agrandir la carte"
    >
      <div ref={mapContainer} className="h-[240px] w-full pointer-events-none" />

      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-md bg-black/50 backdrop-blur-sm text-white hover:bg-[#2AC1A3] transition flex items-center justify-center"
        aria-label="Agrandir"
        title="Agrandir la carte"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="absolute inset-0 bg-[#2AC1A3]/0 group-hover:bg-[#2AC1A3]/5 transition pointer-events-none" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1E2A35]/80 backdrop-blur-sm z-20">
          <div className="w-8 h-8 border-4 border-white/20 border-t-[#2AC1A3] rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1E2A35]/90 z-20">
          <p className="text-[11px] text-white/70 font-medium px-4 text-center">{error}</p>
        </div>
      )}

      <div
        className="absolute top-3 left-3 z-10 flex gap-1.5 bg-black/40 backdrop-blur-sm rounded-md p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {STYLE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeStyle(key)}
            className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.1em] transition ${
              activeStyle === key
                ? "bg-[#2AC1A3] text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-5 px-5 py-3 bg-[#1E2A35] border-t border-white/5">
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          {stats?.total ?? 0} PARCELLES
        </span>
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          {stats ? stats.totalSurface.toFixed(2) : "0"} HA
        </span>
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          MOY. {stats ? stats.avgSurface.toFixed(2) : "0"} HA
        </span>
        <span className="ml-auto text-[9px] text-white/30 tracking-[0.15em] uppercase">MAPBOX</span>
      </div>
    </div>
    {expanded && <ExpandedMapModal onClose={() => setExpanded(false)} />}
    </>
  )
}
