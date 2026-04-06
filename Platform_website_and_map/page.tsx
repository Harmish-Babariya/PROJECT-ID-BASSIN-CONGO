"use client";

import Link from "next/link";
import Navigation from "./components/Navigation";
import CentralAfricaMap from "./components/CentralAfricaMap";
import EchofieldPattern, {
  EchofieldMini,
} from "./components/EchofieldPattern";
import { useLanguage } from "./contexts/LanguageContext";

const translations = {
  fr: {
    metaTag: "PLATEFORME TECHNOLOGIQUE · DONNÉES TERRITORIALES",
    heroTitle: "ID BASSIN DU CONGO",
    heroSubtitle: "TRAÇABILITÉ · CAFÉ ET CACAO",
    heroBody:
      "ID BASSIN DU CONGO est la plateforme de référence pour la structuration, la traçabilité et la gouvernance des filières café et cacao dans le bassin du Congo, deuxième poumon forestier de la planète.",
    statCountries: "PAYS",
    statLung: "POUMON MONDIAL",
    statTraceable: "TRAÇABLE",
    ctaPlatform: "Découvrir la plateforme",
    ctaApproach: "Notre approche",
    liveData: "DONNÉES EN TEMPS RÉEL · SYSTÈME ACTIF",
    videoMeta: "PRÉSENTATION · TERRAIN",
    videoTitle: "SUR LE TERRAIN",
    videoSubtitle:
      "Découvrez le travail quotidien de nos équipes et partenaires dans le bassin du Congo",
    videoBrowserMsg: "Votre navigateur ne supporte pas la lecture de vidéos.",
    zonesLabel: "ZONES D'INTERVENTION",
    filiereLabel: "FILIÈRES COUVERTES",
    dataLabel: "DONNÉES ACTUALISÉES",
    fundamentalsTitle: "LES FONDAMENTAUX",
    fundamentalsSubtitle:
      "Trois piliers pour une traçabilité fiable, inclusive et durable",
    pillar1Tag: "01 · COOPÉRATIVES",
    pillar1Title: "PILOTES OPÉRATIONNELS",
    pillar1Body:
      "Les coopératives agricoles structurent les données, accompagnent les producteurs et garantissent la fiabilité des informations à la source.",
    pillar2Tag: "02 · PRODUCTEURS",
    pillar2Title: "RECONNAISSANCE FORMELLE",
    pillar2Body:
      "Chaque producteur et parcelle sont identifiés, géolocalisés et documentés. Leur contribution est tracée et valorisée dans la chaîne de valeur.",
    pillar3Tag: "03 · GOUVERNANCE",
    pillar3Title: "DONNÉES SÉCURISÉES",
    pillar3Body:
      "Collecte à la source, historisation immuable et mise à disposition contrôlée. Une gouvernance pensée pour les acteurs locaux.",
    metric1: "COOPÉRATIVES PARTENAIRES",
    metric2: "PRODUCTEURS ENREGISTRÉS",
    metric3: "PARCELLES GÉOLOCALISÉES",
    metric4: "TRAÇABILITÉ PARCELLAIRE",
    quickAccessTitle: "ACCÈS RAPIDES",
    card1Tag: "TECHNOLOGIE · FONCTIONNALITÉS",
    card1Title: "PLATEFORME",
    card1Body:
      "Cartographie parcellaire, traçabilité lot par lot, consolidation coopérative et reporting institutionnel.",
    card1Cta: "Explorer →",
    card2Tag: "CONFORMITÉ · REPORTING",
    card2Title: "EUDR & ESG",
    card2Body:
      "Conformité EUDR (non-déforestation) et intégration ESG pour vos partenariats institutionnels.",
    card2Cta: "En savoir plus →",
    footerApproach: "APPROCHE",
    footerPlatform: "PLATEFORME",
    footerContact: "CONTACT",
  },
  en: {
    metaTag: "TECHNOLOGY PLATFORM · TERRITORIAL DATA",
    heroTitle: "ID BASSIN DU CONGO",
    heroSubtitle: "TRACEABILITY · COFFEE & COCOA",
    heroBody:
      "ID BASSIN DU CONGO is the reference platform for structuring, traceability and governance of coffee and cocoa supply chains in the Congo Basin, the world's second largest forest lung.",
    statCountries: "COUNTRIES",
    statLung: "WORLD LUNG",
    statTraceable: "TRACEABLE",
    ctaPlatform: "Discover the platform",
    ctaApproach: "Our approach",
    liveData: "REAL-TIME DATA · SYSTEM ACTIVE",
    videoMeta: "PRESENTATION · FIELD",
    videoTitle: "IN THE FIELD",
    videoSubtitle:
      "Discover the daily work of our teams and partners in the Congo Basin",
    videoBrowserMsg: "Your browser does not support video playback.",
    zonesLabel: "INTERVENTION ZONES",
    filiereLabel: "COVERED SUPPLY CHAINS",
    dataLabel: "UPDATED DATA",
    fundamentalsTitle: "THE FUNDAMENTALS",
    fundamentalsSubtitle:
      "Three pillars for reliable, inclusive and sustainable traceability",
    pillar1Tag: "01 · COOPERATIVES",
    pillar1Title: "OPERATIONAL PILOTS",
    pillar1Body:
      "Agricultural cooperatives structure the data, support producers and guarantee the reliability of information at the source.",
    pillar2Tag: "02 · PRODUCERS",
    pillar2Title: "FORMAL RECOGNITION",
    pillar2Body:
      "Each producer and plot is identified, geolocated and documented. Their contribution is traced and valued in the supply chain.",
    pillar3Tag: "03 · GOVERNANCE",
    pillar3Title: "SECURED DATA",
    pillar3Body:
      "Source collection, immutable historisation and controlled access. Governance designed for local stakeholders.",
    metric1: "PARTNER COOPERATIVES",
    metric2: "REGISTERED PRODUCERS",
    metric3: "GEOLOCATED PLOTS",
    metric4: "PLOT-LEVEL TRACEABILITY",
    quickAccessTitle: "QUICK ACCESS",
    card1Tag: "TECHNOLOGY · FEATURES",
    card1Title: "PLATFORM",
    card1Body:
      "Plot mapping, batch-by-batch traceability, cooperative consolidation and institutional reporting.",
    card1Cta: "Explore →",
    card2Tag: "COMPLIANCE · REPORTING",
    card2Title: "EUDR & ESG",
    card2Body:
      "EUDR compliance (non-deforestation) and ESG integration for your institutional partnerships.",
    card2Cta: "Learn more →",
    footerApproach: "APPROACH",
    footerPlatform: "PLATFORM",
    footerContact: "CONTACT",
  },
};

export default function HomePage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <Navigation />

      <main className="pt-16 min-h-screen bg-off-white">
        {/* Hero Section avec carte + motif empreinte digitale */}
        <section className="relative h-[90vh] bg-ink-black overflow-hidden">
          {/* Carte Mapbox */}
          <div className="absolute inset-0">
            <CentralAfricaMap />
          </div>

          {/* Empreinte Echofield (overlay léger) */}
          <div className="absolute inset-0">
            <EchofieldPattern opacity={0.12} position="center-right" size={700} />
          </div>

          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-black/95 via-ink-black/75 to-transparent" />

          {/* Contenu Hero */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-3xl">
              {/* Meta - Courier Prime */}
              <div className="meta-text text-congo-cyan mb-6 tracking-widest">
                {t.metaTag}
              </div>

              {/* H1 - Archivo Narrow Bold Uppercase */}
              <h1 className="text-off-white mb-8">
                {t.heroTitle}
                <br />
                <span className="text-congo-cyan">{t.heroSubtitle}</span>
              </h1>

              {/* Body text - Archivo Narrow Regular */}
              <p className="text-light-gray text-lg leading-relaxed mb-10 max-w-2xl mx-0">
                {t.heroBody}
              </p>

              {/* Data - Courier Prime */}
              <div className="flex items-center gap-6 mb-10">
                <div className="data-text text-congo-cyan border-l-2 border-congo-cyan pl-4">
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-xs uppercase tracking-wider opacity-70">
                    {t.statCountries}
                  </div>
                </div>
                <div className="data-text text-congo-cyan border-l-2 border-congo-cyan pl-4">
                  <div className="text-2xl font-bold">2ᵉ</div>
                  <div className="text-xs uppercase tracking-wider opacity-70">
                    {t.statLung}
                  </div>
                </div>
                <div className="data-text text-congo-cyan border-l-2 border-congo-cyan pl-4">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs uppercase tracking-wider opacity-70">
                    {t.statTraceable}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/plateforme"
                  className="px-8 py-4 bg-congo-cyan text-ink-black font-sans font-semibold text-sm uppercase tracking-wide hover:bg-cyan-strong transition-colors text-center border border-congo-cyan"
                >
                  {t.ctaPlatform}
                </Link>
                <Link
                  href="/approche"
                  className="px-8 py-4 border-2 border-off-white/40 text-off-white font-sans font-medium text-sm uppercase tracking-wide hover:bg-off-white/10 transition-colors text-center"
                >
                  {t.ctaApproach}
                </Link>
              </div>
            </div>
          </div>

          {/* Indicateur de données en bas */}
          <div className="absolute bottom-8 left-0 right-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 meta-text text-light-gray/60">
                <div className="w-2 h-2 rounded-full bg-congo-cyan animate-pulse" />
                <span>{t.liveData}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Séparateur Echofield */}
        <EchofieldMini />

        {/* Section Vidéo Présentation */}
        <section className="py-20 bg-white relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Intro vidéo */}
            <div className="text-center mb-12">
              <div className="meta-text text-congo-cyan mb-3">
                {t.videoMeta}
              </div>
              <h2 className="text-ink-black mb-4">{t.videoTitle}</h2>
              <p className="text-tech-gray max-w-2xl mx-auto">
                {t.videoSubtitle}
              </p>
            </div>

            {/* Conteneur vidéo */}
            <div className="relative">
              {/* Bordure décorative */}
              <div
                className="absolute -inset-1 opacity-20"
                style={{
                  background:
                    "linear-gradient(45deg, var(--congo-cyan), var(--ochre-terre))",
                }}
              />

              {/* Vidéo */}
              <div className="relative bg-ink-black">
                <video
                  controls
                  className="w-full h-auto"
                  poster="/videos/hero-poster.jpg"
                  preload="metadata"
                >
                  <source src="/videos/hero.mp4" type="video/mp4" />
                  {t.videoBrowserMsg}
                </video>
              </div>

              {/* Petit motif Echofield en coin */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-10 pointer-events-none">
                <svg viewBox="0 0 64 64" fill="none">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-congo-cyan"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-congo-cyan"
                  />
                </svg>
              </div>
            </div>

            {/* Métadonnées sous la vidéo */}
            <div className="mt-8 flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="data-text text-congo-cyan text-lg font-bold">
                  RDC · CAMEROUN · GABON
                </div>
                <div className="meta-text text-tech-gray mt-1">{t.zonesLabel}</div>
              </div>
              <div className="w-px bg-gray-border" />
              <div>
                <div className="data-text text-ochre-terre text-lg font-bold">
                  CAFÉ & CACAO
                </div>
                <div className="meta-text text-tech-gray mt-1">{t.filiereLabel}</div>
              </div>
              <div className="w-px bg-gray-border" />
              <div>
                <div className="data-text text-congo-cyan text-lg font-bold">
                  2024
                </div>
                <div className="meta-text text-tech-gray mt-1">{t.dataLabel}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Séparateur */}
        <EchofieldMini />

        {/* Section Proposition de valeur */}
        <section className="py-20 bg-white relative">
          {/* Empreinte Echofield discrète */}
          <EchofieldPattern opacity={0.05} position="top-right" size={500} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* H2 */}
            <h2 className="text-ink-black mb-4">{t.fundamentalsTitle}</h2>
            <p className="text-center text-tech-gray max-w-2xl mx-auto mb-16">
              {t.fundamentalsSubtitle}
            </p>

            <div className="grid md:grid-cols-3 gap-12">
              {/* Pilier 1 */}
              <div className="relative">
                <div
                  className="absolute -left-4 top-0 bottom-0 w-1 bg-congo-cyan"
                  style={{ background: "var(--cyan-soft)" }}
                />
                <div className="border-l-2 border-congo-cyan pl-6">
                  <div className="meta-text text-congo-cyan mb-3">{t.pillar1Tag}</div>
                  <h3 className="text-ink-black mb-4 text-left">
                    {t.pillar1Title}
                  </h3>
                  <p className="text-tech-gray leading-relaxed">
                    {t.pillar1Body}
                  </p>
                </div>
              </div>

              {/* Pilier 2 */}
              <div className="relative">
                <div
                  className="absolute -left-4 top-0 bottom-0 w-1"
                  style={{ background: "var(--ochre-soft)" }}
                />
                <div className="border-l-2 border-ochre-terre pl-6">
                  <div className="meta-text text-ochre-terre mb-3">
                    {t.pillar2Tag}
                  </div>
                  <h3 className="text-ink-black mb-4 text-left">
                    {t.pillar2Title}
                  </h3>
                  <p className="text-tech-gray leading-relaxed">
                    {t.pillar2Body}
                  </p>
                </div>
              </div>

              {/* Pilier 3 */}
              <div className="relative">
                <div
                  className="absolute -left-4 top-0 bottom-0 w-1"
                  style={{ background: "var(--gray-soft)" }}
                />
                <div className="border-l-2 border-tech-gray pl-6">
                  <div className="meta-text text-tech-gray mb-3">
                    {t.pillar3Tag}
                  </div>
                  <h3 className="text-ink-black mb-4 text-left">
                    {t.pillar3Title}
                  </h3>
                  <p className="text-tech-gray leading-relaxed">
                    {t.pillar3Body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Métriques clés */}
        <section
          className="py-20 relative"
          style={{ background: "var(--gray-soft)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="bg-white p-8 border border-gray-border relative overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-congo-cyan"
                    />
                  </svg>
                </div>
                <div className="data-text text-congo-cyan text-5xl font-bold mb-2">
                  50+
                </div>
                <div className="meta-text text-tech-gray">
                  {t.metric1}
                </div>
              </div>

              <div className="bg-white p-8 border border-gray-border relative overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-congo-cyan"
                    />
                  </svg>
                </div>
                <div className="data-text text-congo-cyan text-5xl font-bold mb-2">
                  15K+
                </div>
                <div className="meta-text text-tech-gray">
                  {t.metric2}
                </div>
              </div>

              <div className="bg-white p-8 border border-gray-border relative overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-congo-cyan"
                    />
                  </svg>
                </div>
                <div className="data-text text-congo-cyan text-5xl font-bold mb-2">
                  25K+
                </div>
                <div className="meta-text text-tech-gray">
                  {t.metric3}
                </div>
              </div>

              <div className="bg-white p-8 border border-gray-border relative overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-congo-cyan"
                    />
                  </svg>
                </div>
                <div className="data-text text-ochre-terre text-5xl font-bold mb-2">
                  100%
                </div>
                <div className="meta-text text-tech-gray">
                  {t.metric4}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Accès rapides */}
        <section className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-ink-black mb-16">{t.quickAccessTitle}</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Plateforme */}
              <Link
                href="/plateforme"
                className="group border-2 border-gray-border p-10 hover:border-congo-cyan transition-all relative overflow-hidden bg-white"
              >
                <div className="absolute top-4 right-4 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-congo-cyan"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="4"
                      fill="currentColor"
                      className="text-congo-cyan"
                    />
                  </svg>
                </div>

                <div className="meta-text text-congo-cyan mb-4">
                  {t.card1Tag}
                </div>
                <h3 className="text-ink-black mb-4 text-left group-hover:text-congo-cyan transition-colors">
                  {t.card1Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-6">
                  {t.card1Body}
                </p>
                <div className="data-text text-congo-cyan">
                  {t.card1Cta}
                </div>
              </Link>

              {/* EUDR & ESG */}
              <Link
                href="/eudr-esg"
                className="group border-2 border-gray-border p-10 hover:border-ochre-terre transition-all relative overflow-hidden bg-white"
              >
                <div className="absolute top-4 right-4 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-ochre-terre"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-ochre-terre"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="4"
                      fill="currentColor"
                      className="text-ochre-terre"
                    />
                  </svg>
                </div>

                <div className="meta-text text-ochre-terre mb-4">
                  {t.card2Tag}
                </div>
                <h3 className="text-ink-black mb-4 text-left group-hover:text-ochre-terre transition-colors">
                  {t.card2Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-6">
                  {t.card2Body}
                </p>
                <div className="data-text text-ochre-terre">
                  {t.card2Cta}
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-ink-black py-12 text-off-white border-t border-tech-gray/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="data-text text-congo-cyan text-xl font-bold">
                ID BASSIN DU CONGO
              </div>

              <div className="flex gap-8 text-sm">
                <Link
                  href="/approche"
                  className="meta-text text-light-gray hover:text-congo-cyan transition-colors"
                >
                  {t.footerApproach}
                </Link>
                <Link
                  href="/plateforme"
                  className="meta-text text-light-gray hover:text-congo-cyan transition-colors"
                >
                  {t.footerPlatform}
                </Link>
                <Link
                  href="/contact"
                  className="meta-text text-light-gray hover:text-congo-cyan transition-colors"
                >
                  {t.footerContact}
                </Link>
              </div>

              <div className="meta-text text-tech-gray">
                © {new Date().getFullYear()} · BASSIN DU CONGO
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
