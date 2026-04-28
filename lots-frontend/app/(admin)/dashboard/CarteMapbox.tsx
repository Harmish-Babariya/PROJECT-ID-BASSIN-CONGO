"use client"
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useLanguage } from "@/contexts/LanguageContext"

interface Parcelle {
  id: number
  code_parcelle: string
  latitude: number
  longitude: number
  status_eudr: string
  surface_ha: number
  geojson?: any
  producteurs?: {
    code_producteur: string
    nom: string
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'CONFORME': return '#2ac1a3'
    case 'NON CONFORME': return '#ef4444'
    case 'RISQUE NON NEGLIGEABLE': return '#eab308'
    default: return '#6b7280'
  }
}

export default function CarteMapbox({ parcelles }: { parcelles: Parcelle[] }) {
  const { t } = useLanguage()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    // Default center: Congo Basin
    const defaultCenter: [number, number] = [15.8277, -4.0383]

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: defaultCenter,
      zoom: 6
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      if (!map.current) return

      const bounds = new mapboxgl.LngLatBounds()
      let hasBounds = false

      parcelles.forEach((parcelle) => {
        const color = getStatusColor(parcelle.status_eudr)

        // If parcelle has GeoJSON polygon data, render it
        if (parcelle.geojson && parcelle.geojson.type) {
          const sourceId = `parcelle-${parcelle.id}`
          try {
            map.current!.addSource(sourceId, {
              type: 'geojson',
              data: parcelle.geojson
            })

            // Fill layer
            map.current!.addLayer({
              id: `${sourceId}-fill`,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': color,
                'fill-opacity': 0.3
              }
            })

            // Outline layer
            map.current!.addLayer({
              id: `${sourceId}-outline`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': 2
              }
            })

            // Popup on click
            map.current!.on('click', `${sourceId}-fill`, (e) => {
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(buildPopupHtml(parcelle, color, t.common.notVerified))
                .addTo(map.current!)
            })

            // Extend bounds with geojson coordinates
            const coords = extractCoordinates(parcelle.geojson)
            coords.forEach(([lng, lat]) => {
              bounds.extend([lng, lat])
              hasBounds = true
            })
          } catch {
            // Fallback to marker if geojson parsing fails
            addMarker(parcelle, color, bounds)
            hasBounds = true
          }
        } else if (parcelle.latitude && parcelle.longitude) {
          // Render as point marker
          addMarker(parcelle, color, bounds)
          hasBounds = true
        }
      })

      // Auto-fit bounds
      if (hasBounds && !bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: 60,
          maxZoom: 15
        })
      }
    })

    function addMarker(parcelle: Parcelle, color: string, bounds: mapboxgl.LngLatBounds) {
      const el = document.createElement('div')
      el.style.backgroundColor = color
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(buildPopupHtml(parcelle, color, t.common.notVerified))

      new mapboxgl.Marker(el)
        .setLngLat([parcelle.longitude, parcelle.latitude])
        .setPopup(popup)
        .addTo(map.current!)

      bounds.extend([parcelle.longitude, parcelle.latitude])
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [parcelles])

  if (parcelles.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden flex items-center justify-center" style={{ height: '600px' }}>
        <p className="text-gray-400">{t.common.noParcelsGeolocated}</p>
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden"
      style={{ height: '600px', width: '100%' }}
    />
  )
}

function buildPopupHtml(parcelle: Parcelle, color: string, notVerifiedLabel: string): string {
  return `
    <div style="padding: 8px; min-width: 200px;">
      <p style="font-weight: bold; margin-bottom: 4px;">${parcelle.code_parcelle}</p>
      <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
        ${parcelle.producteurs?.code_producteur || ''} - ${parcelle.producteurs?.nom || ''}
      </p>
      <p style="font-size: 12px; margin-bottom: 4px;">Surface: ${parcelle.surface_ha || '-'} ha</p>
      <span style="
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: ${color}20;
        color: ${color};
        display: inline-block;
        margin-top: 8px;
      ">
        ${parcelle.status_eudr || notVerifiedLabel}
      </span>
    </div>
  `
}

function extractCoordinates(geojson: any): [number, number][] {
  if (!geojson) return []
  if (geojson.type === 'Polygon') {
    return geojson.coordinates[0] || []
  }
  if (geojson.type === 'Feature' && geojson.geometry) {
    return extractCoordinates(geojson.geometry)
  }
  if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
    return geojson.features.flatMap((f: any) => extractCoordinates(f))
  }
  return []
}
