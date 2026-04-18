"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { createClient } from "@supabase/supabase-js"
import { X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

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
  { key: "satellite", label: "Satellite" },
  { key: "streets", label: "Plan" },
  { key: "terrain", label: "Terrain" },
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
    paint: { "line-color": "#2AC1A3", "line-width": 3 },
  })
}

export default function ExpandedMapModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geojsonRef = useRef<{ type: string; features: ParcelFeature[] } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allFeatures, setAllFeatures] = useState<ParcelFeature[]>([])
  const [filteredFeatures, setFilteredFeatures] = useState<ParcelFeature[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeStyle, setActiveStyle] = useState("satellite")
  const [activeId, setActiveId] = useState<number | string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satellite,
      center: [14.57, 1.66],
      zoom: 12,
    })

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right")
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-right")
    map.addControl(new mapboxgl.FullscreenControl(), "bottom-right")
    mapRef.current = map

    // Ensure the map sizes correctly once the modal has laid out
    const resizeTimers = [
      requestAnimationFrame(() => map.resize()),
      window.setTimeout(() => map.resize(), 150),
      window.setTimeout(() => map.resize(), 400),
    ]
    const ro = new ResizeObserver(() => map.resize())
    if (mapContainer.current) ro.observe(mapContainer.current)

    map.on("load", async () => {
      try {
        const { data, error: dbError } = await supabase
          .from("parcelles_geojson")
          .select("*")

        if (dbError) throw dbError
        if (!data || data.length === 0) {
          setError(t.errors.noParcelsFound)
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
        setAllFeatures(features)
        setFilteredFeatures(features)

        map.addSource("parcelles", {
          type: "geojson",
          data: geojson as unknown as GeoJSON.FeatureCollection,
        })
        addLayersToMap(map)

        const bounds = new mapboxgl.LngLatBounds()
        features.forEach(f =>
          f.geometry.coordinates[0].forEach(c => bounds.extend(c as [number, number]))
        )
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 360, right: 80 },
          duration: 1500,
        })

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
              <div style="background:linear-gradient(135deg,#2AC1A3,#1E8876);padding:16px 20px">
                <div style="font-size:16px;font-weight:700;color:white">Parcelle ${props.id}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px">${props.filename}</div>
              </div>
              <div style="padding:16px 20px">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span style="color:#64748b;font-weight:500">ID</span>
                  <span style="color:#0f172a;font-weight:600">${props.id}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span style="color:#64748b;font-weight:500">Surface</span>
                  <span style="color:#0f172a;font-weight:600">${(props.area / 10000).toFixed(4)} ha</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px">
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
      cancelAnimationFrame(resizeTimers[0])
      window.clearTimeout(resizeTimers[1])
      window.clearTimeout(resizeTimers[2])
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [t.errors.noParcelsFound])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredFeatures(
      allFeatures.filter(
        f =>
          f.properties.filename.toLowerCase().includes(q) ||
          String(f.properties.id).includes(q)
      )
    )
  }, [search, allFeatures])

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

  const zoomToParcel = useCallback((feature: ParcelFeature) => {
    const map = mapRef.current
    if (!map) return
    const bounds = new mapboxgl.LngLatBounds()
    feature.geometry.coordinates[0].forEach(c => bounds.extend(c as [number, number]))
    map.fitBounds(bounds, { padding: 100, duration: 1000 })
    setActiveId(feature.properties.id)
  }, [])

  const exportData = useCallback(() => {
    const data = geojsonRef.current
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `parcelles_${new Date().toISOString().split("T")[0]}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-slate-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: "min(1600px, calc(100vw - 32px))", height: "calc(100vh - 32px)" }}
      >
        <div ref={mapContainer} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2AC1A3] rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-slate-600 font-medium">Chargement des parcelles...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm">
              <p className="text-sm text-slate-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        <header className="absolute top-0 left-0 right-0 h-[64px] bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2AC1A3] to-[#1E8876] rounded-lg flex items-center justify-center text-xl">
              🌍
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">ID Bassin Congo</h1>
              <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                Gestion des Parcelles Cadastrales
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Exporter
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 transition flex items-center justify-center"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <aside className="absolute top-[80px] left-4 w-[340px] bg-white rounded-2xl shadow-xl z-20 max-h-[calc(100%-100px)] overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Tableau de bord</h2>
            <p className="text-xs text-slate-500 mt-0.5">Statistiques en temps reel</p>
          </div>

          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une parcelle..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition"
              />
            </div>
          </div>

          {stats && (
            <div className="p-4 grid gap-2.5">
              {[
                { label: "Total Parcelles", value: stats.total.toLocaleString("fr-FR"), unit: "" },
                { label: "Surface Totale", value: stats.totalSurface.toFixed(2), unit: "ha" },
                { label: "Surface Moyenne", value: stats.avgSurface.toFixed(2), unit: "ha" },
                { label: "Plus Grande Parcelle", value: stats.maxSurface.toFixed(2), unit: "ha" },
              ].map(({ label, value, unit }) => (
                <div
                  key={label}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200"
                >
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {label}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{value}</span>
                    {unit && (
                      <span className="text-xs font-medium text-slate-500">{unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200">
            {filteredFeatures.length === 0 && !loading && (
              <p className="text-sm text-slate-500 text-center py-6">Aucun resultat</p>
            )}
            {filteredFeatures.map(feature => (
              <div
                key={feature.properties.id}
                onClick={() => zoomToParcel(feature)}
                className={`px-4 py-3 border-b border-slate-100 cursor-pointer transition hover:bg-slate-50 ${
                  activeId === feature.properties.id
                    ? "bg-[#E8F8F4] border-l-[3px] border-l-[#2AC1A3]"
                    : ""
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 mb-1 truncate">
                  {feature.properties.filename}
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500">
                  <span>ID: {feature.properties.id}</span>
                  <span>{(feature.properties.area / 10000).toFixed(2)} ha</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="absolute top-[80px] right-4 z-20 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            Style de Carte
          </div>
          <div className="p-2 flex flex-col gap-1.5 w-[180px]">
            {STYLE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changeStyle(key)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                  activeStyle === key
                    ? "bg-[#2AC1A3] text-white font-semibold shadow-sm"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-[#2AC1A3] hover:text-[#2AC1A3]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-4 bg-white px-4 py-3 rounded-xl shadow-lg z-20">
          <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-2">
            Legende
          </div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-600">
            <div className="w-5 h-[3px] bg-[#2AC1A3] rounded-full" />
            <span>Contour de parcelle</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-5 h-3 rounded bg-[#2AC1A3]/20 border border-[#2AC1A3]/40" />
            <span>Surface cadastrale</span>
          </div>
        </div>
      </div>
    </div>
  )
}
