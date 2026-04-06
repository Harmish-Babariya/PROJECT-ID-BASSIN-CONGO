"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";
import { useLanguage } from "../contexts/LanguageContext";

const translations = {
  fr: {
    heroTag: "TECHNOLOGIE",
    heroTitle: "Plateforme",
    heroBody:
      "ID BASSIN DU CONGO est un outil technologique de pointe, développé pour répondre aux exigences de structuration, de traçabilité et de gouvernance des filières café et cacao dans le bassin du Congo.",
    featuresTitle: "Fonctionnalités clés",
    f1Tag: "01 · IDENTIFICATION",
    f1Title: "Identification des producteurs",
    f1Body:
      "Chaque producteur est enregistré avec ses informations complètes : identité, localisation, parcelles exploitées, affiliation coopérative. Un identifiant unique garantit la traçabilité de bout en bout.",
    f1li1: "• Fiche producteur complète",
    f1li2: "• Identifiant unique et permanent",
    f1li3: "• Historique des activités",
    f1li4: "• Documents de certification",
    f2Tag: "02 · CARTOGRAPHIE",
    f2Title: "Cartographie parcellaire",
    f2Body:
      "Chaque parcelle est géolocalisée avec précision via des coordonnées GPS. La cartographie intègre les données environnementales et permet de démontrer la conformité EUDR.",
    f2li1: "• Géolocalisation GPS précise",
    f2li2: "• Visualisation cartographique interactive",
    f2li3: "• Superposition données forestières",
    f2li4: "• Export shapefile / GeoJSON",
    f3Tag: "03 · TRAÇABILITÉ",
    f3Title: "Traçabilité lot par lot",
    f3Body:
      "Chaque lot de café ou de cacao est tracé depuis la parcelle d'origine jusqu'à l'exportation. Toutes les étapes de transformation sont documentées et auditables.",
    f3li1: "• Suivi de la récolte à l'export",
    f3li2: "• Poids, qualité, dates enregistrées",
    f3li3: "• QR codes de traçabilité",
    f3li4: "• Chaîne de custody complète",
    f4Tag: "04 · CONSOLIDATION",
    f4Title: "Consolidation coopérative",
    f4Body:
      "Les coopératives disposent d'outils dédiés pour agréger les données de leurs membres, gérer les stocks, éditer des rapports et piloter leur activité.",
    f4li1: "• Tableaux de bord coopérative",
    f4li2: "• Gestion des membres",
    f4li3: "• Statistiques de production",
    f4li4: "• Reporting automatisé",
    f5Tag: "05 · SÉCURITÉ",
    f5Title: "Données sécurisées et historisées",
    f5Body:
      "Toutes les données sont chiffrées, sauvegardées et historisées. Les accès sont contrôlés selon des profils d'utilisateurs définis avec précision.",
    f5li1: "• Chiffrement end-to-end",
    f5li2: "• Sauvegardes automatiques",
    f5li3: "• Historique complet et immuable",
    f5li4: "• Gestion des droits d'accès",
    f6Tag: "06 · REPORTING",
    f6Title: "Reporting institutionnel",
    f6Body:
      "Génération automatique de rapports conformes aux standards internationaux (EUDR, ESG) et adaptés aux besoins des partenaires institutionnels.",
    f6li1: "• Rapports EUDR automatisés",
    f6li2: "• Indicateurs ESG personnalisables",
    f6li3: "• Export multi-formats (PDF, Excel, CSV)",
    f6li4: "• API pour intégrations tierces",
    networkTitle: "Un réseau étendu de coopératives et partenaires",
    stat1Label: "Coopératives partenaires",
    stat2Label: "Producteurs enregistrés",
    stat3Label: "Parcelles géolocalisées",
    networkBody:
      "Ces chiffres reflètent un déploiement progressif et maîtrisé. Chaque coopérative, chaque producteur, chaque parcelle est intégré avec rigueur et accompagnement.",
    archTitle: "Architecture technique",
    arch1Title: "Infrastructure cloud",
    arch1Body:
      "Hébergement sécurisé sur infrastructure cloud de niveau entreprise, avec haute disponibilité et conformité RGPD.",
    arch2Title: "Base de données PostGIS",
    arch2Body:
      "PostgreSQL avec extension PostGIS pour la gestion native des données géospatiales et cartographiques.",
    arch3Title: "API RESTful",
    arch3Body:
      "API documentée permettant l'intégration avec les systèmes existants (ERP, plateformes de reporting, outils métiers).",
    arch4Title: "Interfaces web & mobile",
    arch4Body:
      "Application web responsive et application mobile (Android/iOS) pour la saisie terrain, accessibles même en mode déconnecté.",
    ctaTitle: "Vous souhaitez en savoir plus sur la plateforme ?",
    ctaContact: "Nous contacter",
    ctaAccess: "Accéder à la plateforme",
    footerApproach: "Notre Approche",
    footerPlatform: "Plateforme",
    footerContact: "Contact",
  },
  en: {
    heroTag: "TECHNOLOGY",
    heroTitle: "Platform",
    heroBody:
      "ID BASSIN DU CONGO is a cutting-edge technological tool, developed to meet the structuring, traceability and governance requirements of coffee and cocoa supply chains in the Congo Basin.",
    featuresTitle: "Key features",
    f1Tag: "01 · IDENTIFICATION",
    f1Title: "Producer identification",
    f1Body:
      "Each producer is registered with their complete information: identity, location, exploited plots, cooperative affiliation. A unique identifier guarantees end-to-end traceability.",
    f1li1: "• Complete producer profile",
    f1li2: "• Unique and permanent identifier",
    f1li3: "• Activity history",
    f1li4: "• Certification documents",
    f2Tag: "02 · MAPPING",
    f2Title: "Plot mapping",
    f2Body:
      "Each plot is precisely geolocated via GPS coordinates. The mapping integrates environmental data and allows demonstration of EUDR compliance.",
    f2li1: "• Precise GPS geolocation",
    f2li2: "• Interactive map visualization",
    f2li3: "• Forest data overlay",
    f2li4: "• Shapefile / GeoJSON export",
    f3Tag: "03 · TRACEABILITY",
    f3Title: "Batch-by-batch traceability",
    f3Body:
      "Each batch of coffee or cocoa is traced from the original plot to export. All processing steps are documented and auditable.",
    f3li1: "• Tracking from harvest to export",
    f3li2: "• Weight, quality, dates recorded",
    f3li3: "• Traceability QR codes",
    f3li4: "• Complete chain of custody",
    f4Tag: "04 · CONSOLIDATION",
    f4Title: "Cooperative consolidation",
    f4Body:
      "Cooperatives have dedicated tools to aggregate their members' data, manage stock, produce reports and manage their activity.",
    f4li1: "• Cooperative dashboards",
    f4li2: "• Member management",
    f4li3: "• Production statistics",
    f4li4: "• Automated reporting",
    f5Tag: "05 · SECURITY",
    f5Title: "Secured and historised data",
    f5Body:
      "All data is encrypted, backed up and historised. Access is controlled according to precisely defined user profiles.",
    f5li1: "• End-to-end encryption",
    f5li2: "• Automatic backups",
    f5li3: "• Complete and immutable history",
    f5li4: "• Access rights management",
    f6Tag: "06 · REPORTING",
    f6Title: "Institutional reporting",
    f6Body:
      "Automatic generation of reports compliant with international standards (EUDR, ESG) and tailored to the needs of institutional partners.",
    f6li1: "• Automated EUDR reports",
    f6li2: "• Customisable ESG indicators",
    f6li3: "• Multi-format export (PDF, Excel, CSV)",
    f6li4: "• API for third-party integrations",
    networkTitle: "An extended network of cooperatives and partners",
    stat1Label: "Partner cooperatives",
    stat2Label: "Registered producers",
    stat3Label: "Geolocated plots",
    networkBody:
      "These figures reflect a progressive and controlled deployment. Each cooperative, each producer, each plot is integrated with rigour and support.",
    archTitle: "Technical architecture",
    arch1Title: "Cloud infrastructure",
    arch1Body:
      "Secure hosting on enterprise-grade cloud infrastructure, with high availability and GDPR compliance.",
    arch2Title: "PostGIS database",
    arch2Body:
      "PostgreSQL with PostGIS extension for native management of geospatial and cartographic data.",
    arch3Title: "RESTful API",
    arch3Body:
      "Documented API enabling integration with existing systems (ERP, reporting platforms, business tools).",
    arch4Title: "Web & mobile interfaces",
    arch4Body:
      "Responsive web application and mobile application (Android/iOS) for field data entry, accessible even in offline mode.",
    ctaTitle: "Would you like to know more about the platform?",
    ctaContact: "Contact us",
    ctaAccess: "Access the platform",
    footerApproach: "Our Approach",
    footerPlatform: "Platform",
    footerContact: "Contact",
  },
};

export default function PlateformePage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <Navigation />

      <main className="pt-16 min-h-screen bg-off-white">
        {/* Hero */}
        <section className="bg-ink-black text-off-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="font-mono text-congo-cyan text-sm tracking-wider mb-4">
              {t.heroTag}
            </div>
            <h1 className="font-sans text-5xl font-bold mb-6">{t.heroTitle}</h1>
            <p className="text-light-gray text-xl leading-relaxed">
              {t.heroBody}
            </p>
          </div>
        </section>

        {/* Fonctionnalités clés */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12 text-center">
              {t.featuresTitle}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Identification producteurs */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f1Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f1Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f1Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f1li1}</li>
                  <li>{t.f1li2}</li>
                  <li>{t.f1li3}</li>
                  <li>{t.f1li4}</li>
                </ul>
              </div>

              {/* Cartographie parcellaire */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f2Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f2Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f2Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f2li1}</li>
                  <li>{t.f2li2}</li>
                  <li>{t.f2li3}</li>
                  <li>{t.f2li4}</li>
                </ul>
              </div>

              {/* Traçabilité lot par lot */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f3Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f3Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f3Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f3li1}</li>
                  <li>{t.f3li2}</li>
                  <li>{t.f3li3}</li>
                  <li>{t.f3li4}</li>
                </ul>
              </div>

              {/* Consolidation coopérative */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f4Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f4Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f4Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f4li1}</li>
                  <li>{t.f4li2}</li>
                  <li>{t.f4li3}</li>
                  <li>{t.f4li4}</li>
                </ul>
              </div>

              {/* Données sécurisées */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f5Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f5Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f5Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f5li1}</li>
                  <li>{t.f5li2}</li>
                  <li>{t.f5li3}</li>
                  <li>{t.f5li4}</li>
                </ul>
              </div>

              {/* Reporting institutionnel */}
              <div className="border border-tech-gray/20 p-8">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.f6Tag}
                </div>
                <h3 className="font-sans text-2xl font-semibold text-ink-black mb-4">
                  {t.f6Title}
                </h3>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.f6Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.f6li1}</li>
                  <li>{t.f6li2}</li>
                  <li>{t.f6li3}</li>
                  <li>{t.f6li4}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Réseau étendu */}
        <section className="py-20 bg-light-gray">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12 text-center">
              {t.networkTitle}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="bg-white p-8">
                <div className="font-mono text-4xl font-bold text-congo-cyan mb-4">
                  50+
                </div>
                <div className="font-sans text-tech-gray">
                  {t.stat1Label}
                </div>
              </div>

              <div className="bg-white p-8">
                <div className="font-mono text-4xl font-bold text-congo-cyan mb-4">
                  15 000+
                </div>
                <div className="font-sans text-tech-gray">
                  {t.stat2Label}
                </div>
              </div>

              <div className="bg-white p-8">
                <div className="font-mono text-4xl font-bold text-congo-cyan mb-4">
                  25 000+
                </div>
                <div className="font-sans text-tech-gray">
                  {t.stat3Label}
                </div>
              </div>
            </div>

            <p className="text-center text-tech-gray mt-12 max-w-3xl mx-auto leading-relaxed">
              {t.networkBody}
            </p>
          </div>
        </section>

        {/* Architecture technique */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.archTitle}
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-tech-gray pl-6">
                <h3 className="font-mono text-sm text-tech-gray mb-2">
                  {t.arch1Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.arch1Body}
                </p>
              </div>

              <div className="border-l-4 border-tech-gray pl-6">
                <h3 className="font-mono text-sm text-tech-gray mb-2">
                  {t.arch2Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.arch2Body}
                </p>
              </div>

              <div className="border-l-4 border-tech-gray pl-6">
                <h3 className="font-mono text-sm text-tech-gray mb-2">
                  {t.arch3Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.arch3Body}
                </p>
              </div>

              <div className="border-l-4 border-tech-gray pl-6">
                <h3 className="font-mono text-sm text-tech-gray mb-2">
                  {t.arch4Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.arch4Body}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-ink-black text-off-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-sans text-2xl font-semibold mb-6">
              {t.ctaTitle}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-congo-cyan text-white font-sans font-medium text-sm tracking-wide hover:bg-congo-cyan/90 transition-colors"
              >
                {t.ctaContact}
              </Link>
              <Link
                href="/connexion"
                className="px-8 py-3 border border-off-white/30 text-off-white font-sans font-medium text-sm tracking-wide hover:bg-off-white/10 transition-colors"
              >
                {t.ctaAccess}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-ink-black py-12 text-off-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="font-mono text-congo-cyan text-lg font-bold">
                ID BASSIN DU CONGO
              </div>

              <div className="flex gap-8 text-sm text-light-gray">
                <Link
                  href="/approche"
                  className="hover:text-congo-cyan transition-colors"
                >
                  {t.footerApproach}
                </Link>
                <Link
                  href="/plateforme"
                  className="hover:text-congo-cyan transition-colors"
                >
                  {t.footerPlatform}
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-congo-cyan transition-colors"
                >
                  {t.footerContact}
                </Link>
              </div>

              <div className="text-sm text-tech-gray font-mono">
                © {new Date().getFullYear()} · Bassin du Congo
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
