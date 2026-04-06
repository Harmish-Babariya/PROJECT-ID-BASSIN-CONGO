"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { supabase, calculateArea, parseGeometry } from "../../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

// Compte pilote pour la démo
const PILOT_ACCOUNT = {
  companyName: "Trader Corporation",
  plan: "Enterprise",
  renewalDate: "15/11/2026",
};

const translations = {
  fr: {
    dashboardTag: "TABLEAU DE BORD",
    logout: "Déconnexion",
    accountLabel: "Mon compte",
    renewal: "renouvellement",
    parcelsOverview: "Aperçu des parcelles",
    loading: "Chargement des données...",
    totalParcels: "TOTAL PARCELLES",
    totalSurface: "SURFACE TOTALE",
    avgSurface: "SURFACE MOYENNE",
    maxSurface: "PLUS GRANDE",
    noData: "Aucune donnée disponible",
    myParcels: "Mes parcelles suivies",
    loadingShort: "Chargement...",
    noParcels: "Aucune parcelle trouvée",
    moreParcels: "autres parcelles",
    viewAll: "Voir toutes les parcelles →",
    search: "Rechercher",
    analytics: "Analytics",
    generateDds: "Générer DDS",
    lastLogin: "Dernière connexion : Aujourd'hui à",
    parcelDetail: "DÉTAILS PARCELLE",
    close: "Fermer",
    eudrCompliant: "Conforme EUDR",
    parcelId: "ID Parcelle",
    surface: "Surface",
    surfaceM2: "Surface (m²)",
    status: "Statut",
    statusValue: "Tracée et conforme",
    product: "Produit",
    productValue: "Cacao / Café",
    viewOnMap: "Voir sur carte",
    compliant: "Conforme",
  },
  en: {
    dashboardTag: "DASHBOARD",
    logout: "Logout",
    accountLabel: "My account",
    renewal: "renewal",
    parcelsOverview: "Plots overview",
    loading: "Loading data...",
    totalParcels: "TOTAL PLOTS",
    totalSurface: "TOTAL AREA",
    avgSurface: "AVERAGE AREA",
    maxSurface: "LARGEST",
    noData: "No data available",
    myParcels: "My tracked plots",
    loadingShort: "Loading...",
    noParcels: "No plots found",
    moreParcels: "more plots",
    viewAll: "View all plots →",
    search: "Search",
    analytics: "Analytics",
    generateDds: "Generate DDS",
    lastLogin: "Last login: Today at",
    parcelDetail: "PLOT DETAILS",
    close: "Close",
    eudrCompliant: "EUDR Compliant",
    parcelId: "Plot ID",
    surface: "Area",
    surfaceM2: "Area (m²)",
    status: "Status",
    statusValue: "Traced and compliant",
    product: "Product",
    productValue: "Cocoa / Coffee",
    viewOnMap: "View on map",
    compliant: "Compliant",
  },
};

interface ParcelleData {
  id: number;
  filename: string;
  area: number;
}

interface Stats {
  totalParcelles: number;
  totalSurface: number;
  avgSurface: number;
  maxSurface: number;
}

export default function DashboardPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [parcelles, setParcelles] = useState<ParcelleData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParcelle, setSelectedParcelle] = useState<ParcelleData | null>(null);

  useEffect(() => {
    loadParcellesData();
  }, []);

  const loadParcellesData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parcelles_geojson")
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const parcellesWithArea = data.map((row, index) => {
          const geometry = parseGeometry(row.geometry);
          const area = geometry ? calculateArea(geometry.coordinates) : 0;
          return {
            id: row.id || index + 1,
            filename: row.filename || row.name || `Parcelle ${row.id || index + 1}`,
            area: area / 10000,
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
        });
      }
    } catch (err) {
      console.error("Erreur chargement parcelles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/connexion";
  };

  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen bg-light-gray">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Dashboard */}
          <div className="bg-ink-black text-off-white p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="meta-text text-congo-cyan mb-2">
                  {t.dashboardTag}
                </div>
                <h1 className="text-2xl font-bold font-sans">
                  {PILOT_ACCOUNT.companyName}
                </h1>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                {t.logout}
              </button>
            </div>
          </div>

          {/* Info Compte */}
          <div className="bg-white border border-tech-gray/20 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-congo-cyan text-xl">●</span>
              <span className="font-sans font-semibold text-ink-black">
                {t.accountLabel}
              </span>
            </div>
            <div className="data-text text-tech-gray">
              {PILOT_ACCOUNT.plan}{" "}
              <span className="text-tech-gray/60">
                ({t.renewal} {PILOT_ACCOUNT.renewalDate})
              </span>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white border border-tech-gray/20 p-6 mb-6">
            <div className="font-sans font-semibold text-ink-black mb-4">
              {t.parcelsOverview}
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-tech-gray">{t.loading}</div>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-light-gray p-4">
                  <div className="meta-text text-tech-gray mb-1">
                    {t.totalParcels}
                  </div>
                  <div className="text-2xl font-bold text-congo-cyan font-mono">
                    {stats.totalParcelles}
                  </div>
                </div>
                <div className="bg-light-gray p-4">
                  <div className="meta-text text-tech-gray mb-1">
                    {t.totalSurface}
                  </div>
                  <div className="text-2xl font-bold text-congo-cyan font-mono">
                    {stats.totalSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
                <div className="bg-light-gray p-4">
                  <div className="meta-text text-tech-gray mb-1">
                    {t.avgSurface}
                  </div>
                  <div className="text-2xl font-bold text-congo-cyan font-mono">
                    {stats.avgSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
                <div className="bg-light-gray p-4">
                  <div className="meta-text text-tech-gray mb-1">
                    {t.maxSurface}
                  </div>
                  <div className="text-2xl font-bold text-congo-cyan font-mono">
                    {stats.maxSurface.toFixed(2)}
                    <span className="text-sm text-tech-gray ml-1">ha</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-tech-gray">{t.noData}</div>
            )}
          </div>

          {/* Liste des parcelles */}
          <div className="bg-white border border-tech-gray/20 p-6 mb-6">
            <div className="font-sans font-semibold text-ink-black mb-4">
              {t.myParcels}{" "}
              <span className="text-congo-cyan">({parcelles.length})</span>
            </div>
            {loading ? (
              <div className="text-tech-gray">{t.loadingShort}</div>
            ) : parcelles.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {parcelles.slice(0, 15).map((parcelle) => (
                  <div
                    key={parcelle.id}
                    onClick={() => setSelectedParcelle(parcelle)}
                    className="flex items-center gap-3 data-text py-3 px-3 border border-tech-gray/10 hover:bg-light-gray cursor-pointer transition-colors"
                  >
                    <span className="text-lg">🇨🇬</span>
                    <span className="text-ink-black font-medium">
                      {parcelle.filename}
                    </span>
                    <span className="text-tech-gray/60">ID: {parcelle.id}</span>
                    <span className="text-tech-gray">·</span>
                    <span className="text-ochre-terre">
                      {parcelle.area.toFixed(4)} ha
                    </span>
                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs">
                      {t.compliant}
                    </span>
                    <svg className="w-4 h-4 text-tech-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
                {parcelles.length > 15 && (
                  <div className="text-tech-gray text-sm pt-2">
                    + {parcelles.length - 15} {t.moreParcels}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-tech-gray">{t.noParcels}</div>
            )}
            <div className="mt-4 text-right">
              <Link
                href="/dashboard/recherche"
                className="text-congo-cyan text-sm hover:underline"
              >
                {t.viewAll}
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/recherche"
              className="flex items-center justify-center gap-3 bg-ink-black text-off-white px-6 py-4 font-sans font-medium hover:bg-tech-gray transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{t.search}</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center justify-center gap-3 bg-congo-cyan text-white px-6 py-4 font-sans font-medium hover:bg-congo-cyan/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{t.analytics}</span>
            </Link>
            <Link
              href="/dashboard/dds"
              className="flex items-center justify-center gap-3 bg-ochre-terre text-white px-6 py-4 font-sans font-medium hover:bg-ochre-terre/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t.generateDds}</span>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="meta-text text-tech-gray/60">
              {t.lastLogin}{" "}
              {new Date().toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </main>

      {/* Modal détails parcelle */}
      {selectedParcelle && (
        <div className="fixed inset-0 bg-ink-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="bg-ink-black text-off-white p-4 flex justify-between items-center">
              <div>
                <div className="meta-text text-congo-cyan mb-1">{t.parcelDetail}</div>
                <h3 className="font-sans font-semibold">{selectedParcelle.filename}</h3>
              </div>
              <button
                onClick={() => setSelectedParcelle(null)}
                className="px-3 py-1 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                {t.close}
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🇨🇬</span>
                <div>
                  <div className="font-semibold text-ink-black text-lg">{selectedParcelle.filename}</div>
                  <div className="text-tech-gray text-sm">Congo-Brazzaville</div>
                </div>
                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm font-medium">
                  {t.eudrCompliant}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-tech-gray/20">
                  <span className="text-tech-gray">{t.parcelId}</span>
                  <span className="font-mono text-congo-cyan font-bold">{selectedParcelle.id}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-tech-gray/20">
                  <span className="text-tech-gray">{t.surface}</span>
                  <span className="font-mono text-ochre-terre font-bold">{selectedParcelle.area.toFixed(4)} ha</span>
                </div>
                <div className="flex justify-between py-3 border-b border-tech-gray/20">
                  <span className="text-tech-gray">{t.surfaceM2}</span>
                  <span className="font-mono text-ink-black font-bold">{(selectedParcelle.area * 10000).toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between py-3 border-b border-tech-gray/20">
                  <span className="text-tech-gray">{t.status}</span>
                  <span className="text-green-600 font-medium">{t.statusValue}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-tech-gray">{t.product}</span>
                  <span className="text-ochre-terre font-medium">{t.productValue}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href="/dashboard/recherche"
                  onClick={() => setSelectedParcelle(null)}
                  className="flex-1 px-4 py-3 bg-congo-cyan text-white text-center font-medium hover:bg-congo-cyan/90 transition-colors"
                >
                  {t.viewOnMap}
                </Link>
                <Link
                  href="/dashboard/dds"
                  onClick={() => setSelectedParcelle(null)}
                  className="flex-1 px-4 py-3 bg-ochre-terre text-white text-center font-medium hover:bg-ochre-terre/90 transition-colors"
                >
                  {t.generateDds}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
