"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Image from "next/image"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { X, Menu, Layers } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { normalizeEudrStatus, EUDR_STATUS } from "@/lib/eudr"

type StatusKey = "compliant" | "non_compliant" | "alert" | "pending_review"
function statusBucketKey(status: string | null | undefined): StatusKey {
  const norm = normalizeEudrStatus(status)
  if (norm === EUDR_STATUS.CONFORME) return "compliant"
  if (norm === EUDR_STATUS.NON_CONFORME) return "non_compliant"
  if (norm === EUDR_STATUS.RISQUE) return "alert"
  return "pending_review"
}

export type MapParcelle = {
  id: number
  code_parcelle: string | null
  surface_ha: string | number | null
  status_eudr: string | null
  latitude: number | string | null
  longitude: number | string | null
  geojson: unknown
  producteurs?: { nom: string; prenom?: string | null; pays?: { nom: string } | null; zone_nom?: string | null; village?: string | null } | null
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

interface ParcelListItem {
  id: number | string
  filename: string
  code_parcelle: string | null
  status_eudr: string | null
  area: number
  surface_ha: string | number | null
  feature: ParcelFeature | null
  producer_name: string | null
  country_name: string | null
  zone_nom: string | null
  village: string | null
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

const STATUS_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "case",
  ["==", ["get", "status_bucket"], "compliant"], "#2AC1A3",
  ["==", ["get", "status_bucket"], "non_compliant"], "#DC2626",
  ["==", ["get", "status_bucket"], "alert"], "#EAB308",
  ["==", ["get", "status_bucket"], "pending_review"], "#F59E0B",
  "#94A3B8",
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
    paint: { "line-color": STATUS_COLOR_EXPR, "line-width": 3 },
  })
  map.addLayer({
    id: "parcelles-points",
    type: "circle",
    source: "parcelles",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 7,
      "circle-color": STATUS_COLOR_EXPR,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  })
}

function buildItems(parcelles: MapParcelle[]): ParcelListItem[] {
  return parcelles.map((row, index): ParcelListItem => {
    const id = row.id ?? index + 1
    const filename = row.code_parcelle ?? `Parcelle ${id}`
    let geometry = parseGeometry(row.geojson)
    if (!geometry) {
      const lat = row.latitude !== null && row.latitude !== "" ? Number(row.latitude) : NaN
      const lon = row.longitude !== null && row.longitude !== "" ? Number(row.longitude) : NaN
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        geometry = { type: "Point", coordinates: [lon, lat] }
      }
    }
    const area = geometry?.type === "Polygon" ? calculateArea(geometry.coordinates) : 0
    const feature: ParcelFeature | null = geometry
      ? {
          type: "Feature" as const,
          geometry,
          properties: {
            id,
            filename,
            code_parcelle: row.code_parcelle ?? null,
            surface_ha: row.surface_ha ?? null,
            status_bucket: statusBucketKey(row.status_eudr),
            area,
          },
        }
      : null
    const prod = row.producteurs
    const producer_name = prod ? [prod.nom, prod.prenom].filter(Boolean).join(" ") : null
    const country_name = prod?.pays?.nom ?? null
    const zone_nom = prod?.zone_nom ?? null
    const village = prod?.village ?? null
    return {
      id,
      filename,
      code_parcelle: row.code_parcelle ?? null,
      status_eudr: row.status_eudr ?? null,
      area,
      surface_ha: row.surface_ha ?? null,
      feature,
      producer_name,
      country_name,
      zone_nom,
      village,
    }
  })
}

export default function ExpandedMapModal({
  parcelles,
  onClose,
}: {
  parcelles: MapParcelle[]
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const geojsonRef = useRef<{ type: string; features: ParcelFeature[] } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<ParcelListItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ParcelListItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeStyle, setActiveStyle] = useState("satellite")
  const [activeId, setActiveId] = useState<number | string | null>(null)
  const [search, setSearch] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [filterZone, setFilterZone] = useState("")
  const [filterVillage, setFilterVillage] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)

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

    map.on("load", () => {
      const items = buildItems(parcelles)
      const features = items
        .map((it) => it.feature)
        .filter((f): f is ParcelFeature => f !== null)

      setAllItems(items)
      setFilteredItems(items)

      if (items.length === 0) {
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
        total: items.length,
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
        const isMobile = typeof window !== "undefined" && window.innerWidth < 768
        map.fitBounds(bounds, {
          padding: isMobile
            ? { top: 80, bottom: 80, left: 20, right: 20 }
            : { top: 60, bottom: 60, left: 360, right: 80 },
          duration: 1500,
          maxZoom: 14,
        })
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
              <div style="background:linear-gradient(135deg,#2AC1A3,#1E8876);padding:16px 20px">
                <div style="font-size:16px;font-weight:700;color:white">${t.dashboard.parcelles} ${props.id}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px">${props.filename}</div>
              </div>
              <div style="padding:16px 20px">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span style="color:#64748b;font-weight:500">${t.dashboard.mapPopupIdLabel}</span>
                  <span style="color:#0f172a;font-weight:600">${props.id}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px">
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
      cancelAnimationFrame(resizeTimers[0])
      window.clearTimeout(resizeTimers[1])
      window.clearTimeout(resizeTimers[2])
      ro.disconnect()
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

  const countryOptions = useMemo(() => {
    const set = new Set<string>()
    allItems.forEach(it => { if (it.country_name) set.add(it.country_name) })
    return Array.from(set).sort()
  }, [allItems])

  const zoneOptions = useMemo(() => {
    const set = new Set<string>()
    allItems.forEach(it => {
      if (it.zone_nom && (!filterCountry || it.country_name === filterCountry)) set.add(it.zone_nom)
    })
    return Array.from(set).sort()
  }, [allItems, filterCountry])

  const villageOptions = useMemo(() => {
    const set = new Set<string>()
    allItems.forEach(it => {
      if (it.village &&
        (!filterCountry || it.country_name === filterCountry) &&
        (!filterZone || it.zone_nom === filterZone)
      ) set.add(it.village)
    })
    return Array.from(set).sort()
  }, [allItems, filterCountry, filterZone])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setFilteredItems(
      allItems.filter((it) => {
        if (filterCountry && it.country_name !== filterCountry) return false
        if (filterZone && it.zone_nom !== filterZone) return false
        if (filterVillage && it.village !== filterVillage) return false
        if (filterStatus && statusBucketKey(it.status_eudr) !== filterStatus) return false
        if (q) {
          const code = String(it.code_parcelle ?? "").toLowerCase()
          const filename = String(it.filename ?? "").toLowerCase()
          const id = String(it.id ?? "").toLowerCase()
          return code.includes(q) || filename.includes(q) || id.includes(q)
        }
        return true
      })
    )
  }, [search, filterCountry, filterZone, filterVillage, filterStatus, allItems])

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
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setStyleOpen(false)
    }
  }, [])

  const zoomToParcel = useCallback((item: ParcelListItem) => {
    setActiveId(item.id)
    const map = mapRef.current
    const feature = item.feature
    if (!map || !feature) return
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
    if (feature.geometry.type === "Polygon") {
      const bounds = new mapboxgl.LngLatBounds()
      feature.geometry.coordinates[0].forEach((c) => bounds.extend(c as [number, number]))
      map.fitBounds(bounds, { padding: 100, duration: 1000, maxZoom: 16 })
    } else {
      map.flyTo({ center: feature.geometry.coordinates, zoom: 15, duration: 1000 })
    }
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
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div
        className="relative bg-slate-50 sm:rounded-2xl shadow-2xl overflow-hidden w-full h-full sm:w-[min(1600px,calc(100vw-32px))] sm:h-[calc(100vh-32px)]"
      >
        <div ref={mapContainer} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2AC1A3] rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-slate-600 font-medium">{t.common.loadingParcels}</p>
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

        <header className="absolute top-0 left-0 right-0 h-[64px] bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg z-30 flex items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                setSidebarOpen((v) => !v)
                if (!sidebarOpen) setStyleOpen(false)
              }}
              className="md:hidden w-9 h-9 shrink-0 rounded-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 transition flex items-center justify-center"
              aria-label={t.dashboard.mapExpandedDashboardTitle}
            >
              <Menu className="w-4 h-4" />
            </button>
            <Image
              src="/logo.png"
              alt="ID Bassin Congo"
              width={220}
              height={70}
              priority
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                setStyleOpen((v) => !v)
                if (!styleOpen) setSidebarOpen(false)
              }}
              className="md:hidden w-9 h-9 rounded-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 transition flex items-center justify-center"
              aria-label={t.dashboard.mapExpandedStyleHeading}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={exportData}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              {t.common.export}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 transition flex items-center justify-center"
              aria-label={t.common.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop collapse toggle — only visible md+ */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          className={`hidden md:flex absolute top-[88px] z-30 w-6 h-12 items-center justify-center bg-white border border-slate-200 rounded-r-lg shadow-sm text-slate-500 hover:text-[#2AC1A3] hover:border-[#2AC1A3] transition ${
            sidebarCollapsed ? "left-4" : "left-[356px]"
          }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>

        <aside
          className={`absolute top-[72px] md:top-[80px] left-2 right-2 md:left-4 md:right-auto bottom-2 md:bottom-4 md:w-[340px] bg-white rounded-2xl shadow-xl z-20 flex-col overflow-hidden ${
            sidebarOpen ? "flex" : "hidden"
          } ${sidebarCollapsed ? "md:hidden" : "md:flex"}`}
        >
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{t.dashboard.mapExpandedDashboardTitle}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.dashboard.mapExpandedStatsSubtitle}</p>
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
                placeholder={t.dashboard.mapExpandedSearchPlaceholder}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <select
                value={filterCountry}
                onChange={e => { setFilterCountry(e.target.value); setFilterZone(""); setFilterVillage("") }}
                className="col-span-2 w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition bg-white"
              >
                <option value="">{locale === "fr" ? "Tous les pays" : "All countries"}</option>
                {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterZone}
                onChange={e => { setFilterZone(e.target.value); setFilterVillage("") }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition bg-white"
              >
                <option value="">{locale === "fr" ? "Toutes les zones" : "All zones"}</option>
                {zoneOptions.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <select
                value={filterVillage}
                onChange={e => setFilterVillage(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition bg-white"
              >
                <option value="">{locale === "fr" ? "Tous les villages" : "All villages"}</option>
                {villageOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="col-span-2 w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#2AC1A3] focus:ring-2 focus:ring-[#2AC1A3]/20 transition bg-white"
              >
                <option value="">{locale === "fr" ? "Tous les statuts EUDR" : "All EUDR statuses"}</option>
                <option value="compliant">{t.dashboard.mapStatusConforme}</option>
                <option value="non_compliant">{t.dashboard.mapStatusNonConforme}</option>
                <option value="alert">{t.dashboard.mapStatusRisque}</option>
                <option value="pending_review">{t.dashboard.mapStatusEnAttente}</option>
              </select>
            </div>

            {(filterCountry || filterZone || filterVillage || filterStatus) && (
              <button
                onClick={() => { setFilterCountry(""); setFilterZone(""); setFilterVillage(""); setFilterStatus("") }}
                className="mt-1.5 w-full text-[10px] font-semibold text-[#2AC1A3] hover:text-[#1E8876] transition text-center"
              >
                {locale === "fr" ? "Réinitialiser les filtres" : "Reset filters"}
              </button>
            )}
          </div>

          {stats && (
            <div className="px-3 py-2.5 grid grid-cols-2 gap-1.5 border-b border-slate-200">
              {[
                { label: t.dashboard.mapExpandedStatTotal, value: stats.total.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB"), unit: "" },
                { label: t.dashboard.mapExpandedStatSurfaceTotal, value: stats.totalSurface.toFixed(1), unit: "ha" },
                { label: t.dashboard.mapExpandedStatSurfaceAvg, value: stats.avgSurface.toFixed(1), unit: "ha" },
                { label: t.dashboard.mapExpandedStatSurfaceMax, value: stats.maxSurface.toFixed(1), unit: "ha" },
              ].map(({ label, value, unit }) => (
                <div
                  key={label}
                  className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
                >
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {label}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                    {unit && (
                      <span className="text-[10px] font-medium text-slate-500">{unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto parcels-scroll">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              {filteredItems.length} / {allItems.length}
            </div>
            {filteredItems.length === 0 && !loading && (
              <p className="text-sm text-slate-500 text-center py-6">{t.dashboard.mapExpandedNoResults}</p>
            )}
            {filteredItems.map(item => {
              const hasGeo = item.feature !== null
              const key = statusBucketKey(item.status_eudr)
              let dotColor = "#94A3B8"
              let pillBg = "bg-slate-100 text-slate-500"
              let pillLabel: string = t.dashboard.mapStatusEnAttente
              if (!hasGeo) {
                // keep gray defaults
              } else if (key === "compliant") {
                dotColor = "#2AC1A3"
                pillBg = "bg-[#E8F8F4] text-[#1E8876]"
                pillLabel = t.dashboard.mapStatusConforme
              } else if (key === "non_compliant") {
                dotColor = "#DC2626"
                pillBg = "bg-red-100 text-red-700"
                pillLabel = t.dashboard.mapStatusNonConforme
              } else if (key === "alert") {
                dotColor = "#EAB308"
                pillBg = "bg-yellow-100 text-yellow-800"
                pillLabel = t.dashboard.mapStatusRisque
              } else {
                dotColor = "#F59E0B"
                pillBg = "bg-amber-50 text-amber-700"
                pillLabel = t.dashboard.mapStatusEnAttente
              }
              const surfaceHa = item.feature
                ? item.area / 10000
                : Number(item.surface_ha) || 0
              return (
                <div
                  key={item.id}
                  onClick={() => zoomToParcel(item)}
                  className={`px-4 py-3 border-b border-slate-100 transition ${
                    hasGeo ? "cursor-pointer hover:bg-slate-50" : "cursor-default opacity-75"
                  } ${
                    activeId === item.id
                      ? "bg-[#E8F8F4] border-l-[3px] border-l-[#2AC1A3]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="text-xs font-semibold text-slate-900 truncate flex-1">
                      {item.filename}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${pillBg}`}>
                      {pillLabel}
                    </span>
                  </div>
                  {(item.producer_name || item.country_name) && (
                    <div className="flex items-center gap-1.5 pl-4 mb-1">
                      {item.country_name && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                          {item.country_name}
                        </span>
                      )}
                      {item.producer_name && (
                        <span className="text-[10px] text-slate-500 truncate">{item.producer_name}</span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 text-[11px] text-slate-500 pl-4">
                    <span>{surfaceHa.toFixed(2)} ha</span>
                    {!hasGeo && (
                      <span className="ml-auto text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {t.dashboard.mapNoGps}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <div
          className={`absolute top-[72px] md:top-[80px] right-2 md:right-4 z-20 bg-white rounded-xl shadow-lg overflow-hidden ${
            styleOpen ? "block" : "hidden"
          } md:block`}
        >
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            {t.dashboard.mapExpandedStyleHeading}
          </div>
          <div className="p-2 flex flex-col gap-1.5 w-[180px]">
            {STYLE_KEYS.map((key) => {
              const label =
                key === "satellite" ? t.dashboard.mapStyleSatellite :
                key === "streets" ? t.dashboard.mapStyleStreets :
                t.dashboard.mapStyleTerrain
              return (
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
              )
            })}
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-6 right-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-lg z-20 flex-wrap items-center gap-x-4 gap-y-1.5 max-w-[calc(100%-2rem)]">
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
            {t.dashboard.mapExpandedLegendTitle}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1A3] shadow" />
            <span>{t.dashboard.mapStatusConforme}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shadow" />
            <span>{t.dashboard.mapStatusNonConforme}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shadow" />
            <span>{t.dashboard.mapStatusRisque}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow" />
            <span>{t.dashboard.mapStatusEnAttente}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
