"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { supabase, calculateArea, parseGeometry } from "../../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

// Compte pilote pour la démo
const PILOT_ACCOUNT = {
  email: "test@gmail.com",
  password: "test",
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
    moreParcels: "+ {n} autres parcelles",
    noParcels: "Aucune parcelle trouvée",
    viewAll: "Voir toutes les parcelles →",
    search: "Rechercher",
    analytics: "Analytics",
    generateDds: "Générer DDS",
    lastLogin: "Dernière connexion : Aujourd'hui à",
    loginTitle: "Connexion Plateforme",
    loginSubtitle: "Accès réservé aux coopératives et partenaires autorisés",
    emailLabel: "Adresse email",
    emailPlaceholder: "Entrez votre adresse email",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Entrez votre mot de passe",
    loginError: "Email ou mot de passe incorrect",
    loginBtn: "Se connecter",
    backHome: "Retourner à la page d'accueil",
    noAccount: "Vous n'avez pas encore de compte ?",
    createAccount: "Créer un compte ici",
    securityLine: "Plateforme sécurisée · Données chiffrées · Accès contrôlés",
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
    moreParcels: "+ {n} more plots",
    noParcels: "No plots found",
    viewAll: "View all plots →",
    search: "Search",
    analytics: "Analytics",
    generateDds: "Generate DDS",
    lastLogin: "Last login: Today at",
    loginTitle: "Platform Login",
    loginSubtitle: "Access restricted to authorised cooperatives and partners",
    emailLabel: "Email address",
    emailPlaceholder: "Enter your email address",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginError: "Incorrect email or password",
    loginBtn: "Log in",
    backHome: "Return to homepage",
    noAccount: "Don't have an account yet?",
    createAccount: "Create an account here",
    securityLine: "Secure platform · Encrypted data · Controlled access",
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

export default function ConnexionPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [parcelles, setParcelles] = useState<ParcelleData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les données Supabase après connexion
  useEffect(() => {
    if (isLoggedIn) {
      loadParcellesData();
    }
  }, [isLoggedIn]);

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
            area: area / 10000, // Convertir en hectares
          };
        });

        setParcelles(parcellesWithArea);

        // Calculer les stats
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      email.toLowerCase() === PILOT_ACCOUNT.email.toLowerCase() &&
      password === PILOT_ACCOUNT.password
    ) {
      // Rediriger vers le dashboard
      window.location.href = "/dashboard";
    } else {
      setError(t.loginError);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setParcelles([]);
    setStats(null);
  };

  // Dashboard Client
  if (isLoggedIn) {
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parcelles.slice(0, 10).map((parcelle) => (
                    <div
                      key={parcelle.id}
                      className="flex items-center gap-3 data-text py-2 border-b border-tech-gray/10"
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
                    </div>
                  ))}
                  {parcelles.length > 10 && (
                    <div className="text-tech-gray text-sm pt-2">
                      + {parcelles.length - 10} {lang === "fr" ? "autres parcelles" : "more plots"}
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
      </>
    );
  }

  // Page de connexion
  return (
    <>
      <Navigation />

      <main className="pt-16 min-h-screen bg-off-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border border-tech-gray/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="font-mono text-congo-cyan text-2xl font-bold mb-4">
                ID BASSIN DU CONGO
              </div>
              <h1 className="font-sans text-2xl font-semibold text-ink-black mb-2">
                {t.loginTitle}
              </h1>
              <p className="text-tech-gray text-sm">
                {t.loginSubtitle}
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block meta-text text-tech-gray mb-2"
                >
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray text-ink-black placeholder-tech-gray/50 focus:outline-none focus:border-congo-cyan transition-colors"
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  htmlFor="password"
                  className="block meta-text text-tech-gray mb-2"
                >
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray text-ink-black placeholder-tech-gray/50 focus:outline-none focus:border-congo-cyan transition-colors pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tech-gray hover:text-congo-cyan transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Bouton connexion */}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-congo-cyan text-white font-sans font-medium text-sm tracking-wide hover:bg-congo-cyan/90 transition-colors"
              >
                {t.loginBtn}
              </button>
            </form>

            {/* Liens */}
            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-tech-gray/30 text-tech-gray font-sans font-medium text-sm text-center hover:bg-light-gray transition-colors"
              >
                {t.backHome}
              </Link>
            </div>

            {/* Créer un compte */}
            <div className="mt-8 pt-6 border-t border-tech-gray/20 text-center">
              <p className="text-tech-gray text-sm">
                {t.noAccount}{" "}
                <Link
                  href="/contact"
                  className="text-congo-cyan font-medium hover:underline"
                >
                  {t.createAccount}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer info */}
          <p className="text-center text-tech-gray text-xs mt-8">
            {t.securityLine}
          </p>
        </div>
      </main>
    </>
  );
}
