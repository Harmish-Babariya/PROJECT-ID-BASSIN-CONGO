"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Maximize2 } from "lucide-react"
import ExpandedMapModal from "./ExpandedMapModal"
import { useLanguage } from "@/contexts/LanguageContext"

export type MapParcelle = {
  id: number
  code_parcelle: string | null
  surface_ha: string | number | null
  status_eudr: string | null
  latitude: number | string | null
  longitude: number | string | null
  geojson: unknown
}

type ParcelGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "Point"; coordinates: [number, number] }

interface ParcelFeature {
  type: "Feature"
  geometry: ParcelGeometry
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

const STYLE_KEYS = ["satellite", "streets", "terrain"] as const

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

function parseGeometry(geom: unknown): ParcelGeometry | null {
  let value: unknown = geom
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== "object") return null
  const g = value as { type?: string; coordinates?: unknown }
  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    return { type: "Polygon", coordinates: g.coordinates as number[][][] }
  }
  if (g.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
    return { type: "Point", coordinates: [Number(g.coordinates[0]), Number(g.coordinates[1])] }
  }
  return null
}

function addLayersToMap(map: mapboxgl.Map) {
  map.addLayer({
    id: "parcelles-fill",
    type: "fill",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": "#2AC1A3", "fill-opacity": 0.25 },
  })
  map.addLayer({
    id: "parcelles-outline",
    type: "line",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "line-color": "#2AC1A3", "line-width": 2 },
  })
  map.addLayer({
    id: "parcelles-points",
    type: "circle",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 6,
      "circle-color": "#2AC1A3",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  })
}

function buildFeatures(parcelles: MapParcelle[]): ParcelFeature[] {
  return parcelles
    .map((row, index): ParcelFeature | null => {
      let geometry = parseGeometry(row.geojson)
      if (!geometry) {
        const lat = row.latitude !== null && row.latitude !== "" ? Number(row.latitude) : NaN
        const lon = row.longitude !== null && row.longitude !== "" ? Number(row.longitude) : NaN
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          geometry = { type: "Point", coordinates: [lon, lat] }
        }
      }
      if (!geometry) return null
      const area = geometry.type === "Polygon" ? calculateArea(geometry.coordinates) : 0
      return {
        type: "Feature" as const,
        geometry,
        properties: {
          id: row.id ?? index + 1,
          filename: row.code_parcelle ?? `Parcelle ${row.id ?? index + 1}`,
          code_parcelle: row.code_parcelle ?? null,
          surface_ha: row.surface_ha ?? null,
          status_eudr: row.status_eudr ?? null,
          area,
        },
      }
    })
    .filter((f): f is ParcelFeature => f !== null)
}

export default function DashboardMap({ parcelles }: { parcelles: MapParcelle[] }) {
  const { t } = useLanguage()
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

    map.on("load", () => {
      const features = buildFeatures(parcelles)

      if (features.length === 0) {
        setError(t.errors.noParcelsFound)
        setLoading(false)
        return
      }

      const geojson = { type: "FeatureCollection", features }
      geojsonRef.current = geojson

      const polygonSurfaces = features
        .filter((f) => f.geometry.type === "Polygon")
        .map((f) => f.properties.area / 10000)
      const totalSurface = polygonSurfaces.reduce((a, b) => a + b, 0)
      setStats({
        total: features.length,
        totalSurface,
        avgSurface: polygonSurfaces.length > 0 ? totalSurface / polygonSurfaces.length : 0,
        maxSurface: polygonSurfaces.length > 0 ? Math.max(...polygonSurfaces) : 0,
      })

      map.addSource("parcelles", {
        type: "geojson",
        data: geojson as unknown as GeoJSON.FeatureCollection,
      })
      addLayersToMap(map)

      const bounds = new mapboxgl.LngLatBounds()
      features.forEach((f) => {
        if (f.geometry.type === "Polygon") {
          f.geometry.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
        } else {
          bounds.extend(f.geometry.coordinates)
        }
      })
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 30, duration: 1500, maxZoom: 14 })
      }

      const interactiveLayers = ["parcelles-fill", "parcelles-points"]
      interactiveLayers.forEach((layerId) => {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = ""
        })
        map.on("click", layerId, (e) => {
          const props = e.features![0].properties!
          new mapboxgl.Popup({ offset: 15 })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background:linear-gradient(135deg,#2AC1A3,#1E8876);padding:14px 18px">
                <div style="font-size:14px;font-weight:700;color:white">${t.dashboard.parcelles} ${props.id}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px">${props.filename}</div>
              </div>
              <div style="padding:12px 18px">
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:12px">
                  <span style="color:#64748b;font-weight:500">${t.dashboard.mapPopupIdLabel}</span>
                  <span style="color:#0f172a;font-weight:600">${props.id}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px">
                  <span style="color:#64748b;font-weight:500">${t.dashboard.mapPopupSurfaceLabel}</span>
                  <span style="color:#0f172a;font-weight:600">${props.area ? (props.area / 10000).toFixed(4) + " ha" : "—"}</span>
                </div>
              </div>
            `)
            .addTo(map)
        })
      })

      setLoading(false)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [
    parcelles,
    t.errors.noParcelsFound,
    t.dashboard.parcelles,
    t.dashboard.mapPopupIdLabel,
    t.dashboard.mapPopupSurfaceLabel,
  ])

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
        {STYLE_KEYS.map((key) => {
          const label =
            key === "satellite" ? t.dashboard.mapStyleSatellite :
            key === "streets" ? t.dashboard.mapStyleStreets :
            t.dashboard.mapStyleTerrain
          return (
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
          )
        })}
      </div>

      <div className="flex items-center gap-5 px-5 py-3 bg-[#1E2A35] border-t border-white/5">
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          {stats?.total ?? 0} {t.dashboard.mapFooterParcelles}
        </span>
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          {stats ? stats.totalSurface.toFixed(2) : "0"} {t.dashboard.mapFooterHa}
        </span>
        <span className="text-[10px] text-white/50 tracking-[0.1em] font-medium">
          {t.dashboard.mapFooterAvg} {stats ? stats.avgSurface.toFixed(2) : "0"} {t.dashboard.mapFooterHa}
        </span>
        <span className="ml-auto text-[9px] text-white/30 tracking-[0.15em] uppercase">{t.dashboard.mapPoweredBy}</span>
      </div>
    </div>
    {expanded && <ExpandedMapModal parcelles={parcelles} onClose={() => setExpanded(false)} />}
    </>
  )
}
