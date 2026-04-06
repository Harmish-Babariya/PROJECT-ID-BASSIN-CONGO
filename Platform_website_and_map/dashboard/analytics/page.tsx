"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { supabase, calculateArea, parseGeometry } from "../../../lib/supabase";

interface Stats {
  totalParcelles: number;
  totalSurface: number;
  avgSurface: number;
  maxSurface: number;
  minSurface: number;
}

interface Parcelle {
  id: number;
  filename: string;
  area: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
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
          };
        });

        setParcelles(parcellesWithArea);

        const surfaces = parcellesWithArea.map((p) => p.area);
        const totalSurface = surfaces.reduce((a, b) => a + b, 0);

        setStats({
          totalParcelles: parcellesWithArea.length,
          totalSurface: totalSurface,
          avgSurface: totalSurface / parcellesWithArea.length,
          maxSurface: Math.max(...surfaces),
          minSurface: Math.min(...surfaces),
        });
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Calculer la distribution par taille
  const getDistribution = () => {
    if (parcelles.length === 0) return [];

    const ranges = [
      { label: "< 0.5 ha", min: 0, max: 0.5, count: 0 },
      { label: "0.5 - 1 ha", min: 0.5, max: 1, count: 0 },
      { label: "1 - 2 ha", min: 1, max: 2, count: 0 },
      { label: "2 - 5 ha", min: 2, max: 5, count: 0 },
      { label: "> 5 ha", min: 5, max: Infinity, count: 0 },
    ];

    parcelles.forEach((p) => {
      for (const range of ranges) {
        if (p.area >= range.min && p.area < range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  };

  // Top 5 parcelles par surface
  const topParcelles = [...parcelles]
    .sort((a, b) => b.area - a.area)
    .slice(0, 5);

  const distribution = getDistribution();
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-ink-black text-off-white p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="meta-text text-congo-cyan mb-2">ANALYTICS</div>
                <h1 className="text-2xl font-bold font-sans">
                  Tableau analytique
                </h1>
              </div>
              <Link
                href="/connexion"
                className="px-4 py-2 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                ← Tableau de bord
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-tech-gray/20 p-12 text-center">
              <div className="text-tech-gray">Chargement des données...</div>
            </div>
          ) : error ? (
            <div className="bg-white border border-tech-gray/20 p-12 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white border border-tech-gray/20 p-6">
                  <div className="meta-text text-tech-gray mb-2">
                    PARCELLES TOTALES
                  </div>
                  <div className="text-3xl font-bold text-congo-cyan font-mono">
                    {stats.totalParcelles}
                  </div>
                </div>
                <div className="bg-white border border-tech-gray/20 p-6">
                  <div className="meta-text text-tech-gray mb-2">
                    SURFACE TOTALE
                  </div>
                  <div className="text-3xl font-bold text-congo-cyan font-mono">
                    {stats.totalSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
                <div className="bg-white border border-tech-gray/20 p-6">
                  <div className="meta-text text-tech-gray mb-2">
                    SURFACE MOYENNE
                  </div>
                  <div className="text-3xl font-bold text-congo-cyan font-mono">
                    {stats.avgSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
                <div className="bg-white border border-tech-gray/20 p-6">
                  <div className="meta-text text-tech-gray mb-2">
                    PLUS GRANDE
                  </div>
                  <div className="text-3xl font-bold text-congo-cyan font-mono">
                    {stats.maxSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
                <div className="bg-white border border-tech-gray/20 p-6">
                  <div className="meta-text text-tech-gray mb-2">
                    PLUS PETITE
                  </div>
                  <div className="text-3xl font-bold text-congo-cyan font-mono">
                    {stats.minSurface.toFixed(4)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Distribution par taille */}
                <div className="bg-white border border-tech-gray/20 p-6">
                  <h3 className="font-sans font-semibold text-ink-black mb-6">
                    Distribution par taille
                  </h3>
                  <div className="space-y-4">
                    {distribution.map((range, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-tech-gray">{range.label}</span>
                          <span className="data-text text-ink-black">
                            {range.count} parcelle(s)
                          </span>
                        </div>
                        <div className="h-3 bg-light-gray">
                          <div
                            className="h-full bg-congo-cyan transition-all"
                            style={{
                              width: `${(range.count / maxCount) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 parcelles */}
                <div className="bg-white border border-tech-gray/20 p-6">
                  <h3 className="font-sans font-semibold text-ink-black mb-6">
                    Top 5 - Plus grandes parcelles
                  </h3>
                  <div className="space-y-4">
                    {topParcelles.map((parcelle, i) => (
                      <div
                        key={parcelle.id}
                        className="flex items-center gap-4 p-3 bg-light-gray"
                      >
                        <div className="w-8 h-8 bg-congo-cyan text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-ink-black text-sm">
                            {parcelle.filename}
                          </div>
                          <div className="text-xs text-tech-gray">
                            ID: {parcelle.id}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-ochre-terre font-mono">
                            {parcelle.area.toFixed(4)} ha
                          </div>
                          <div className="text-xs text-tech-gray">
                            {(parcelle.area * 10000).toFixed(2)} m²
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Résumé visuel */}
              <div className="bg-white border border-tech-gray/20 p-6 mb-6">
                <h3 className="font-sans font-semibold text-ink-black mb-6">
                  Répartition de la surface totale
                </h3>
                <div className="flex items-center justify-center h-32">
                  <div className="relative w-full max-w-2xl">
                    {/* Barre de progression */}
                    <div className="h-8 bg-light-gray flex overflow-hidden">
                      {distribution.map((range, i) => {
                        const percentage = (range.count / stats.totalParcelles) * 100;
                        const colors = [
                          "bg-congo-cyan",
                          "bg-congo-cyan/80",
                          "bg-ochre-terre",
                          "bg-ochre-terre/80",
                          "bg-ink-black",
                        ];
                        return (
                          <div
                            key={i}
                            className={`${colors[i]} h-full transition-all`}
                            style={{ width: `${percentage}%` }}
                            title={`${range.label}: ${range.count} parcelle(s)`}
                          ></div>
                        );
                      })}
                    </div>
                    {/* Légende */}
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {distribution.map((range, i) => {
                        const colors = [
                          "bg-congo-cyan",
                          "bg-congo-cyan/80",
                          "bg-ochre-terre",
                          "bg-ochre-terre/80",
                          "bg-ink-black",
                        ];
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className={`w-3 h-3 ${colors[i]}`}></div>
                            <span className="text-tech-gray">
                              {range.label} ({range.count})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="bg-white border border-tech-gray/20 p-12 text-center">
              <div className="text-tech-gray">Aucune donnée disponible</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
