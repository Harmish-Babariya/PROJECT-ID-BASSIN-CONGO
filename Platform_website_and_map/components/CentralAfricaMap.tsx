"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Configuration Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export default function CentralAfricaMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialisation de la carte centrée sur le Bassin du Congo
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12", // Style Google Earth-like
      center: [23.6566, -1.3], // Centré sur le bassin du Congo
      zoom: 4.5,
      pitch: 45, // Vue 3D pour effet professionnel
      bearing: 0,
      attributionControl: false,
    });

    // Ajout des contrôles de navigation
    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    // Ajout d'une légère animation au chargement
    map.current.on("load", () => {
      if (!map.current) return;

      // Animation douce de rotation
      map.current.easeTo({
        bearing: 10,
        duration: 3000,
        easing: (t) => t,
      });

      // Couche de surbrillance pour le bassin du Congo (optionnel)
      // Vous pouvez ajouter ici une couche GeoJSON si vous avez les données
    });

    // Nettoyage
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Overlay subtil avec le nom de la région */}
      <div className="absolute bottom-4 left-4 bg-ink-black/80 text-off-white px-4 py-2 font-mono text-sm backdrop-blur-sm">
        ID BASSIN CONGO
      </div>
    </div>
  );
}
