"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { supabase, calculateArea, parseGeometry } from "../../../lib/supabase";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface Parcelle {
  id: number;
  filename: string;
  area: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  } | null;
}

// Drapeaux des pays du Bassin du Congo
const FLAGS: Record<string, string> = {
  CG: "🇨🇬", // Congo-Brazzaville
  CD: "🇨🇩", // RD Congo
  CM: "🇨🇲", // Cameroun
  GA: "🇬🇦", // Gabon
  GQ: "🇬🇶", // Guinée Équatoriale
  CF: "🇨🇫", // Centrafrique
};

export default function RecherchePage() {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [filteredParcelles, setFilteredParcelles] = useState<Parcelle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "area" | "id">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedParcelle, setSelectedParcelle] = useState<Parcelle | null>(null);
  const [showMap, setShowMap] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    loadParcelles();
  }, []);

  useEffect(() => {
    filterAndSortParcelles();
  }, [parcelles, searchTerm, sortBy, sortOrder]);

  // Initialiser la carte quand on sélectionne une parcelle
  useEffect(() => {
    if (showMap && selectedParcelle?.geometry && mapContainer.current) {
      if (map.current) {
        map.current.remove();
      }

      const coords = selectedParcelle.geometry.coordinates[0];
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((coord) => bounds.extend(coord as [number, number]));
      const center = bounds.getCenter();

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [center.lng, center.lat],
        zoom: 15,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        if (!map.current) return;

        map.current.addSource("parcelle", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: selectedParcelle.geometry!,
            properties: {},
          },
        });

        map.current.addLayer({
          id: "parcelle-fill",
          type: "fill",
          source: "parcelle",
          paint: {
            "fill-color": "#2AC1A3",
            "fill-opacity": 0.3,
          },
        });

        map.current.addLayer({
          id: "parcelle-outline",
          type: "line",
          source: "parcelle",
          paint: {
            "line-color": "#2AC1A3",
            "line-width": 3,
          },
        });

        map.current.fitBounds(bounds, { padding: 50 });
      });
    }

    return () => {
      if (map.current && !showMap) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap, selectedParcelle]);

  const loadParcelles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("parcelles_geojson")
        .select("*");

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        const parcellesWithArea = data.map((row, index) => {
          const geometry = parseGeometry(row.geometry);
          const area = geometry ? calculateArea(geometry.coordinates) / 10000 : 0;
          return {
            id: row.id || index + 1,
            filename: row.filename || row.name || `Parcelle ${row.id || index + 1}`,
            area: area,
            geometry: geometry,
          };
        });
        setParcelles(parcellesWithArea);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortParcelles = () => {
    let filtered = parcelles.filter((p) =>
      p.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.id).includes(searchTerm)
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.filename.localeCompare(b.filename);
          break;
        case "area":
          comparison = a.area - b.area;
          break;
        case "id":
          comparison = a.id - b.id;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredParcelles(filtered);
  };

  const handleViewOnMap = (parcelle: Parcelle) => {
    setSelectedParcelle(parcelle);
    setShowMap(true);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedParcelle(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  const totalSurface = filteredParcelles.reduce((sum, p) => sum + p.area, 0);

  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-ink-black text-off-white p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="meta-text text-congo-cyan mb-2">
                  RECHERCHE PARCELLES
                </div>
                <h1 className="text-2xl font-bold font-sans">
                  Base de données traçabilité
                </h1>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                ← Tableau de bord
              </Link>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-tech-gray/20 p-4">
              <div className="meta-text text-tech-gray mb-1">PARCELLES TROUVÉES</div>
              <div className="text-2xl font-bold text-congo-cyan font-mono">
                {filteredParcelles.length}
              </div>
            </div>
            <div className="bg-white border border-tech-gray/20 p-4">
              <div className="meta-text text-tech-gray mb-1">SURFACE TOTALE</div>
              <div className="text-2xl font-bold text-congo-cyan font-mono">
                {totalSurface.toFixed(2)} <span className="text-sm text-tech-gray">ha</span>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white border border-tech-gray/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block meta-text text-tech-gray mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom ou ID de parcelle..."
                  className="w-full px-4 py-2 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                />
              </div>
              <div>
                <label className="block meta-text text-tech-gray mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "area" | "id")}
                  className="w-full px-4 py-2 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                >
                  <option value="id">ID</option>
                  <option value="name">Nom</option>
                  <option value="area">Surface</option>
                </select>
              </div>
              <div>
                <label className="block meta-text text-tech-gray mb-2">
                  Ordre
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="w-full px-4 py-2 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                >
                  <option value="asc">Croissant</option>
                  <option value="desc">Décroissant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="bg-white border border-tech-gray/20">
            <div className="p-4 border-b border-tech-gray/20">
              <span className="data-text text-tech-gray">
                {filteredParcelles.length} parcelle(s) trouvée(s)
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="text-tech-gray">Chargement des parcelles...</div>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="text-red-600">{error}</div>
              </div>
            ) : filteredParcelles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-tech-gray">Aucune parcelle trouvée</div>
              </div>
            ) : (
              <div className="divide-y divide-tech-gray/10">
                {filteredParcelles.map((parcelle) => (
                  <div
                    key={parcelle.id}
                    className="p-6 hover:bg-light-gray/50 transition-colors cursor-pointer"
                    onClick={() => handleViewOnMap(parcelle)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        {/* Drapeau */}
                        <div className="text-2xl">{FLAGS.CG}</div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-sans font-semibold text-ink-black text-lg">
                              {parcelle.filename}
                            </h3>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium">
                              Tracée
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-tech-gray mb-3">
                            <span className="data-text">
                              <strong className="text-congo-cyan">ID:</strong> {parcelle.id}
                            </span>
                            <span className="data-text">
                              <strong className="text-ochre-terre">Surface:</strong>{" "}
                              {parcelle.area.toFixed(4)} ha
                            </span>
                            <span className="data-text">
                              {(parcelle.area * 10000).toFixed(2)} m²
                            </span>
                          </div>

                          {parcelle.geometry && (
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-congo-cyan/10 text-congo-cyan text-xs">
                                {parcelle.geometry.type}
                              </span>
                              <span className="px-2 py-1 bg-ochre-terre/10 text-ochre-terre text-xs">
                                {parcelle.geometry.coordinates[0]?.length || 0} points GPS
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOnMap(parcelle);
                        }}
                        className="px-4 py-2 bg-congo-cyan text-white text-sm hover:bg-congo-cyan/90 transition-colors"
                      >
                        Voir sur carte
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Carte */}
      {showMap && selectedParcelle && (
        <div className="fixed inset-0 bg-ink-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Header modal */}
            <div className="bg-ink-black text-off-white p-4 flex justify-between items-center">
              <div>
                <div className="meta-text text-congo-cyan mb-1">VISUALISATION PARCELLE</div>
                <h3 className="font-sans font-semibold">{selectedParcelle.filename}</h3>
              </div>
              <button
                onClick={closeMap}
                className="px-4 py-2 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                Fermer
              </button>
            </div>

            {/* Infos parcelle */}
            <div className="bg-light-gray p-4 border-b border-tech-gray/20">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="meta-text text-tech-gray">ID</span>
                  <div className="font-mono text-congo-cyan font-bold">{selectedParcelle.id}</div>
                </div>
                <div>
                  <span className="meta-text text-tech-gray">SURFACE</span>
                  <div className="font-mono text-ochre-terre font-bold">
                    {selectedParcelle.area.toFixed(4)} ha
                  </div>
                </div>
                <div>
                  <span className="meta-text text-tech-gray">SURFACE M²</span>
                  <div className="font-mono text-ink-black font-bold">
                    {(selectedParcelle.area * 10000).toFixed(2)} m²
                  </div>
                </div>
                <div>
                  <span className="meta-text text-tech-gray">POINTS GPS</span>
                  <div className="font-mono text-ink-black font-bold">
                    {selectedParcelle.geometry?.coordinates[0]?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Carte */}
            <div ref={mapContainer} className="h-[500px] w-full" />
          </div>
        </div>
      )}
    </>
  );
}
