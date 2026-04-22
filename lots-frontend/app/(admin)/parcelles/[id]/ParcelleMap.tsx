"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

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

function addPolygonLayers(map: mapboxgl.Map) {
  map.addLayer({
    id: "parcelle-fill",
    type: "fill",
    source: "parcelle",
    paint: { "fill-color": "#2AC1A3", "fill-opacity": 0.25 },
  })
  map.addLayer({
    id: "parcelle-outline",
    type: "line",
    source: "parcelle",
    paint: { "line-color": "#2AC1A3", "line-width": 2 },
  })
}

export default function ParcelleMap({
  geojson,
  latitude,
  longitude,
  height = 240,
  emptyLabel = "Coordonnées GPS non disponibles",
}: {
  geojson: unknown
  latitude: number | string | null
  longitude: number | string | null
  height?: number
  emptyLabel?: string
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [activeStyle, setActiveStyle] = useState("satellite")

  const polygon = parseGeojson(geojson)
  const lat = latitude !== null && latitude !== "" ? Number(latitude) : NaN
  const lon = longitude !== null && longitude !== "" ? Number(longitude) : NaN
  const hasPoint = !polygon && Number.isFinite(lat) && Number.isFinite(lon)
  const hasAny = polygon || hasPoint

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !hasAny) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    const initialCenter: [number, number] = polygon
      ? polygon.coordinates[0][0] as [number, number]
      : [lon, lat]

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satellite,
      center: initialCenter,
      zoom: 14,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-right")
    mapRef.current = map

    map.on("load", () => {
      if (polygon) {
        map.addSource("parcelle", {
          type: "geojson",
          data: { type: "Feature", geometry: polygon, properties: {} } as GeoJSON.Feature,
        })
        addPolygonLayers(map)
        const bounds = new mapboxgl.LngLatBounds()
        polygon.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
        map.fitBounds(bounds, { padding: 30, duration: 800, maxZoom: 17 })
      } else if (hasPoint) {
        markerRef.current = new mapboxgl.Marker({ color: "#2AC1A3" })
          .setLngLat([lon, lat])
          .addTo(map)
        map.setCenter([lon, lat])
        map.setZoom(15)
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeStyle(key: string) {
    const map = mapRef.current
    if (!map) return
    map.setStyle(MAP_STYLES[key])
    map.once("style.load", () => {
      if (polygon) {
        map.addSource("parcelle", {
          type: "geojson",
          data: { type: "Feature", geometry: polygon, properties: {} } as GeoJSON.Feature,
        })
        addPolygonLayers(map)
      } else if (hasPoint && !markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: "#2AC1A3" })
          .setLngLat([lon, lat])
          .addTo(map)
      }
    })
    setActiveStyle(key)
  }

  if (!hasAny) {
    return (
      <div
        className="bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div
      className="bg-[#1E2A35] rounded-lg overflow-hidden relative border border-gray-200"
      style={{ height }}
    >
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-3 left-3 z-10 flex gap-1.5 bg-black/40 backdrop-blur-sm rounded-md p-1">
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
    </div>
  )
}
