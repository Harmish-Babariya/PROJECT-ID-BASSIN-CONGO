"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Maximize2 } from "lucide-react"
import ExpandedMapModal from "./ExpandedMapModal"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"

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
          status_eudr: normalizeEudrStatus(row.status_eudr) ?? "",
          area,
        },
      }
    })
    .filter((f): f is ParcelFeature => f !== null)
}

const STATUS_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "case",
  ["==", ["get", "status_eudr"], EUDR_STATUS.CONFORME],
  "#2AC1A3",
  ["==", ["get", "status_eudr"], EUDR_STATUS.RISQUE],
  "#EAB308",
  ["==", ["get", "status_eudr"], EUDR_STATUS.NON_CONFORME],
  "#EF4444",
  "#C4943A",
]

function addLayersToMap(map: mapboxgl.Map) {
  map.addLayer({
    id: "parcelles-fill",
    type: "fill",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": STATUS_COLOR_EXPR, "fill-opacity": 0.25 },
  })
  map.addLayer({
    id: "parcelles-outline",
    type: "line",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "line-color": STATUS_COLOR_EXPR, "line-width": 2 },
  })
  map.addLayer({
    id: "parcelles-points",
    type: "circle",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 6,
      "circle-color": STATUS_COLOR_EXPR,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  })
}

export default function DashboardMap({ parcelles }: { parcelles: MapParcelle[] }) {
  const { t } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geojsonRef = useRef<{ type: string; features: ParcelFeature[] } | null>(null)
  const fittedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStyle, setActiveStyle] = useState("satellite")
  const [expanded, setExpanded] = useState(false)

  const features = useMemo(() => buildFeatures(parcelles), [parcelles])

  const { conformeCount, nonConformeCount } = useMemo(() => {
    let c = 0
    let nc = 0
    for (const p of parcelles) {
      const norm = normalizeEudrStatus(p.status_eudr)
      if (norm === EUDR_STATUS.CONFORME) c++
      else if (norm === EUDR_STATUS.RISQUE || norm === EUDR_STATUS.NON_CONFORME) nc++
    }
    return { conformeCount: c, nonConformeCount: nc }
  }, [parcelles])

  // Mount the map exactly once. Subsequent updates patch the source data
  // without remounting, so changing the period filter doesn't make the map jump.
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
      const initialFeatures = geojsonRef.current?.features ?? []
      const geojson = { type: "FeatureCollection", features: initialFeatures }

      map.addSource("parcelles", {
        type: "geojson",
        data: geojson as unknown as GeoJSON.FeatureCollection,
      })
      addLayersToMap(map)

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
      fittedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync source data + stats whenever features change. This runs on initial
  // load AND on subsequent prop changes — but it only updates the existing
  // source, so the map view does NOT jump or refit.
  useEffect(() => {
    const map = mapRef.current

    const geojson = { type: "FeatureCollection", features }
    geojsonRef.current = geojson

    if (features.length === 0) {
      setError(t.errors.noParcelsFound)
    } else {
      setError(null)
    }

    if (!map) return

    const apply = () => {
      const src = map.getSource("parcelles") as mapboxgl.GeoJSONSource | undefined
      if (src) {
        src.setData(geojson as unknown as GeoJSON.FeatureCollection)
      }
      // Fit bounds only once, on the first non-empty payload
      if (!fittedRef.current && features.length > 0) {
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
          fittedRef.current = true
        }
      }
    }

    if (map.isStyleLoaded() && map.getSource("parcelles")) {
      apply()
    } else {
      map.once("load", apply)
    }
  }, [features, t.errors.noParcelsFound])

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

      <div className="flex items-center gap-6 px-5 py-3 bg-[#1E2A35] border-t border-white/5">
        <span className="flex items-center gap-2 text-[10px] text-white/50 tracking-[0.1em] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
          {t.dashboard.mapLegendConforme(conformeCount)}
        </span>
        <span className="flex items-center gap-2 text-[10px] text-white/50 tracking-[0.1em] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#C4943A]" />
          {t.dashboard.mapLegendNonConforme(nonConformeCount)}
        </span>
      </div>
    </div>
    {expanded && <ExpandedMapModal parcelles={parcelles} onClose={() => setExpanded(false)} />}
    </>
  )
}
