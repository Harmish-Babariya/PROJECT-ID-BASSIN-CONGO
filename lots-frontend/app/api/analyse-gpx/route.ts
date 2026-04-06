import { NextRequest, NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const { gpx_url, annee_plantation } = await request.json()

    // 1. Télécharger le fichier GPX
    const gpxResponse = await fetch(gpx_url)
    const gpxText = await gpxResponse.text()

    // 2. Parser XML
    const gpxData = await parseStringPromise(gpxText)

    // 3. Extraire coordonnées (track ou waypoints)
    let coords: { lat: number; lon: number }[] = []

    // Essayer d'extraire depuis <trk> (track)
    if (gpxData.gpx?.trk?.[0]?.trkseg?.[0]?.trkpt) {
      coords = gpxData.gpx.trk[0].trkseg[0].trkpt.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon)
      }))
    }
    // Sinon depuis <wpt> (waypoints)
    else if (gpxData.gpx?.wpt) {
      coords = gpxData.gpx.wpt.map((pt: any) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon)
      }))
    }

    if (coords.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Aucune coordonnée trouvée dans le GPX" 
      })
    }

    // 4. Calculer centroïde
    const latitude = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length
    const longitude = coords.reduce((sum, c) => sum + c.lon, 0) / coords.length

    // 5. Calculer surface approximative (formule Shoelace)
    const surface_ha = calculatePolygonArea(coords)

    // 6. Vérification EUDR simplifiée
    let eudr_status = "NON VÉRIFIÉ"
    let justification = "Vérification automatique en attente"

    if (annee_plantation) {
      if (annee_plantation < 2020) {
        eudr_status = "CONFORME"
        justification = "Plantation antérieure à 2020 (avant cutoff EUDR)"
      } else {
        eudr_status = "RISQUE NON NÉGLIGEABLE"
        justification = "Plantation après 2020 - vérification Hansen requise"
      }
    }

    return NextResponse.json({
      success: true,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      surface_ha: surface_ha.toFixed(2),
      nb_points: coords.length,
      eudr_status,
      justification,
      gpx_url
    })

  } catch (error: any) {
    console.error("Erreur analyse GPX:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Fonction calcul surface polygone (Shoelace formula)
function calculatePolygonArea(coords: { lat: number; lon: number }[]): number {
  if (coords.length < 3) return 0

  let area = 0
  const n = coords.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coords[i].lon * coords[j].lat
    area -= coords[j].lon * coords[i].lat
  }

  area = Math.abs(area) / 2

  // Conversion degrés² → hectares (approximatif à l'équateur)
  const hectares = area * 111.32 * 111.32 * Math.cos(coords[0].lat * Math.PI / 180)
  
  return hectares
}