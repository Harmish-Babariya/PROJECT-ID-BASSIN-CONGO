"use client"
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Parcelle {
  id: number
  code_parcelle: string
  latitude: number
  longitude: number
  status_eudr: string
  surface_ha: number
  producteurs?: {
    code_producteur: string
    nom: string
  }
}

export default function CarteMapbox({ parcelles }: { parcelles: Parcelle[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) return

    // Calculer le centre
    const centerLat = parcelles.length > 0 
      ? parcelles.reduce((sum, p) => sum + p.latitude, 0) / parcelles.length 
      : -4.0383
    const centerLng = parcelles.length > 0 
      ? parcelles.reduce((sum, p) => sum + p.longitude, 0) / parcelles.length 
      : 15.8277

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [centerLng, centerLat],
      zoom: parcelles.length > 0 ? 10 : 6
    })

    // Ajouter les marqueurs
    parcelles.forEach((parcelle) => {
      const color = 
        parcelle.status_eudr === 'CONFORME' ? '#2ac1a3' :
        parcelle.status_eudr === 'NON CONFORME' ? '#ef4444' :
        parcelle.status_eudr === 'RISQUE NON NÉGLIGEABLE' ? '#eab308' :
        '#6b7280'

      const el = document.createElement('div')
      el.style.backgroundColor = color
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <p style="font-weight: bold; margin-bottom: 4px;">${parcelle.code_parcelle}</p>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
            ${parcelle.producteurs?.code_producteur} - ${parcelle.producteurs?.nom}
          </p>
          <p style="font-size: 12px; margin-bottom: 4px;">Surface: ${parcelle.surface_ha} ha</p>
          <span style="
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            background-color: ${color}20;
            color: ${color};
            display: inline-block;
            margin-top: 8px;
          ">
            ${parcelle.status_eudr || 'Non vérifié'}
          </span>
        </div>
      `)

      new mapboxgl.Marker(el)
        .setLngLat([parcelle.longitude, parcelle.latitude])
        .setPopup(popup)
        .addTo(map.current!)
    })

    return () => {
      map.current?.remove()
    }
  }, [parcelles])

  return (
    <div 
      ref={mapContainer} 
      className="bg-[#1e272e] rounded-lg shadow overflow-hidden" 
      style={{ height: '600px', width: '100%' }} 
    />
  )
}