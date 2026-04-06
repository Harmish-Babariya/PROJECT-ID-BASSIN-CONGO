"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";
import { useLanguage } from "../contexts/LanguageContext";

const translations = {
  fr: {
    heroTag: "CONFORMITÉ & REPORTING",
    heroTitle: "EUDR & ESG",
    heroBody:
      "ID BASSIN DU CONGO garantit la conformité au règlement européen sur la déforestation (EUDR) et intègre les critères ESG (Environnement, Social, Gouvernance) pour accompagner vos partenariats institutionnels et vos engagements de durabilité.",
    eudrTitle: "Conformité EUDR",
    eudrBoxTitle: "Qu'est-ce que l'EUDR ?",
    eudrBoxBody:
      "Le règlement européen sur les produits « zéro déforestation » (EUDR) impose aux opérateurs important du café et du cacao dans l'Union européenne de démontrer que leurs produits ne proviennent pas de zones déforestées après le 31 décembre 2020.",
    eudrHowTitle: "Comment ID BASSIN DU CONGO garantit la conformité EUDR",
    e1Title: "Origine des lots démontrée",
    e1Body:
      "Chaque lot de café ou de cacao est tracé jusqu'à sa parcelle d'origine. Les coordonnées GPS précises permettent de situer chaque production sur une carte et de croiser ces données avec les références forestières.",
    e1li1: "• Géolocalisation GPS de chaque parcelle",
    e1li2: "• Coordonnées exactes enregistrées et vérifiables",
    e1li3: "• Identifiant unique par lot et par parcelle",
    e1li4: "• Chaîne de traçabilité complète et auditée",
    e2Title: "Preuve de non-déforestation",
    e2Body:
      "La plateforme intègre les données de couverture forestière et permet de superposer les parcelles avec les cartes de déforestation. Les rapports EUDR sont générés automatiquement avec les preuves documentaires requises.",
    e2li1: "• Superposition avec données satellite",
    e2li2: "• Analyse temporelle de la couverture forestière",
    e2li3: "• Attestation de non-déforestation depuis 2020",
    e2li4: "• Rapports conformes aux exigences de la Commission européenne",
    e3Title: "Conservation des données et auditabilité",
    e3Body:
      "Toutes les données de traçabilité sont conservées de manière sécurisée et immuable pendant au moins 5 ans, conformément aux exigences EUDR. Les auditeurs et autorités compétentes peuvent accéder aux données selon les habilitations définies.",
    e3li1: "• Conservation sécurisée sur 5+ ans",
    e3li2: "• Historique immuable et horodaté",
    e3li3: "• Accès contrôlé pour audits",
    e3li4: "• Export de rapports certifiés",
    esgTitle: "Intégration ESG",
    esgIntro:
      "Au-delà de la conformité réglementaire, ID BASSIN DU CONGO intègre les critères ESG (Environnement, Social, Gouvernance) pour répondre aux attentes des investisseurs, bailleurs de fonds et partenaires institutionnels.",
    envTag: "E · ENVIRONNEMENT",
    envTitle: "Protection forestière",
    envli1:
      "Cartographie précise des parcelles dans le bassin du Congo, 2ᵉ poumon forestier de la planète",
    envli2: "Démonstration de non-déforestation conforme EUDR",
    envli3: "Suivi de l'impact environnemental des pratiques agricoles",
    envli4: "Valorisation des pratiques agroforestières et durables",
    socTag: "S · SOCIAL",
    socTitle: "Inclusion & reconnaissance",
    socli1:
      "Identification formelle de chaque producteur, y compris les petits exploitants",
    socli2: "Structuration des coopératives comme pilotes opérationnels",
    socli3:
      "Traçabilité de la contribution de chaque acteur de la chaîne",
    socli4: "Transparence sur les conditions de travail et rémunérations",
    govTag: "G · GOUVERNANCE",
    govTitle: "Transparence & auditabilité",
    govli1: "Données collectées à la source, sécurisées et historisées",
    govli2: "Gouvernance claire des accès et des droits sur les données",
    govli3: "Rapports institutionnels automatisés et certifiables",
    govli4: "Conformité aux standards internationaux (EUDR, ISO, GRI)",
    repTitle: "Reporting institutionnel",
    rep1Title: "Rapports EUDR automatisés",
    rep1Body:
      "Génération automatique des déclarations de diligence raisonnée (Due Diligence Statements) conformes au règlement EUDR, avec toutes les pièces justificatives requises.",
    rep2Title: "Indicateurs ESG personnalisables",
    rep2Body:
      "Tableaux de bord personnalisables pour suivre les indicateurs ESG pertinents pour vos partenaires : émissions carbone, nombre de producteurs inclus, surfaces protégées, traçabilité des paiements, etc.",
    rep3Title: "Export multi-formats",
    rep3Body:
      "Rapports exportables en PDF, Excel, CSV pour intégration dans vos outils de reporting corporate, vos rapports annuels ou vos obligations déclaratives.",
    rep4Title: "API pour intégrations tierces",
    rep4Body:
      "API documentée permettant l'intégration des données de traçabilité et de conformité avec vos systèmes existants (ERP, plateformes ESG, outils de reporting extra-financier).",
    ctaTitle:
      "Vous souhaitez comprendre comment ID BASSIN DU CONGO peut sécuriser votre conformité EUDR & ESG ?",
    ctaCta: "Nous contacter",
    footerApproach: "Notre Approche",
    footerPlatform: "Plateforme",
    footerContact: "Contact",
  },
  en: {
    heroTag: "COMPLIANCE & REPORTING",
    heroTitle: "EUDR & ESG",
    heroBody:
      "ID BASSIN DU CONGO guarantees compliance with the European deforestation regulation (EUDR) and integrates ESG criteria (Environment, Social, Governance) to support your institutional partnerships and sustainability commitments.",
    eudrTitle: "EUDR Compliance",
    eudrBoxTitle: "What is the EUDR?",
    eudrBoxBody:
      "The European regulation on \"zero deforestation\" products (EUDR) requires operators importing coffee and cocoa into the European Union to demonstrate that their products do not come from deforested areas after 31 December 2020.",
    eudrHowTitle: "How ID BASSIN DU CONGO guarantees EUDR compliance",
    e1Title: "Demonstrated batch origin",
    e1Body:
      "Each batch of coffee or cocoa is traced back to its original plot. Precise GPS coordinates allow each production to be located on a map and cross-referenced with forest references.",
    e1li1: "• GPS geolocation of each plot",
    e1li2: "• Exact coordinates recorded and verifiable",
    e1li3: "• Unique identifier per batch and per plot",
    e1li4: "• Complete and audited traceability chain",
    e2Title: "Proof of non-deforestation",
    e2Body:
      "The platform integrates forest cover data and allows plots to be overlaid with deforestation maps. EUDR reports are generated automatically with the required documentary evidence.",
    e2li1: "• Overlay with satellite data",
    e2li2: "• Temporal analysis of forest cover",
    e2li3: "• Non-deforestation attestation since 2020",
    e2li4: "• Reports compliant with European Commission requirements",
    e3Title: "Data retention and auditability",
    e3Body:
      "All traceability data is stored securely and immutably for at least 5 years, in compliance with EUDR requirements. Auditors and competent authorities can access the data according to defined authorisations.",
    e3li1: "• Secure storage for 5+ years",
    e3li2: "• Immutable and timestamped history",
    e3li3: "• Controlled access for audits",
    e3li4: "• Certified report export",
    esgTitle: "ESG Integration",
    esgIntro:
      "Beyond regulatory compliance, ID BASSIN DU CONGO integrates ESG criteria (Environment, Social, Governance) to meet the expectations of investors, donors and institutional partners.",
    envTag: "E · ENVIRONMENT",
    envTitle: "Forest protection",
    envli1:
      "Precise plot mapping in the Congo Basin, the world's 2nd largest forest lung",
    envli2: "EUDR-compliant proof of non-deforestation",
    envli3: "Monitoring of the environmental impact of agricultural practices",
    envli4: "Valorisation of agroforestry and sustainable practices",
    socTag: "S · SOCIAL",
    socTitle: "Inclusion & recognition",
    socli1:
      "Formal identification of each producer, including small-scale farmers",
    socli2: "Structuring of cooperatives as operational pilots",
    socli3: "Traceability of each stakeholder's contribution in the chain",
    socli4: "Transparency on working conditions and remuneration",
    govTag: "G · GOVERNANCE",
    govTitle: "Transparency & auditability",
    govli1: "Data collected at source, secured and historised",
    govli2: "Clear governance of data access and rights",
    govli3: "Automated and certifiable institutional reports",
    govli4: "Compliance with international standards (EUDR, ISO, GRI)",
    repTitle: "Institutional reporting",
    rep1Title: "Automated EUDR reports",
    rep1Body:
      "Automatic generation of Due Diligence Statements compliant with the EUDR regulation, with all required supporting documents.",
    rep2Title: "Customisable ESG indicators",
    rep2Body:
      "Customisable dashboards to track ESG indicators relevant to your partners: carbon emissions, number of producers included, protected areas, payment traceability, etc.",
    rep3Title: "Multi-format export",
    rep3Body:
      "Reports exportable in PDF, Excel, CSV for integration into your corporate reporting tools, annual reports or declaratory obligations.",
    rep4Title: "API for third-party integrations",
    rep4Body:
      "Documented API enabling integration of traceability and compliance data with your existing systems (ERP, ESG platforms, extra-financial reporting tools).",
    ctaTitle:
      "Would you like to understand how ID BASSIN DU CONGO can secure your EUDR & ESG compliance?",
    ctaCta: "Contact us",
    footerApproach: "Our Approach",
    footerPlatform: "Platform",
    footerContact: "Contact",
  },
};

export default function EudrEsgPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      <Navigation />

      <main className="pt-16 min-h-screen bg-off-white">
        {/* Hero */}
        <section className="bg-ink-black text-off-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="font-mono text-ochre text-sm tracking-wider mb-4">
              {t.heroTag}
            </div>
            <h1 className="font-sans text-5xl font-bold mb-6">{t.heroTitle}</h1>
            <p className="text-light-gray text-xl leading-relaxed">
              {t.heroBody}
            </p>
          </div>
        </section>

        {/* Conformité EUDR */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.eudrTitle}
            </h2>

            <div className="mb-12 p-6 bg-light-gray border-l-4 border-ochre">
              <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                {t.eudrBoxTitle}
              </h3>
              <p className="text-tech-gray leading-relaxed">
                {t.eudrBoxBody}
              </p>
            </div>

            <h3 className="font-sans text-2xl font-semibold text-ink-black mb-8">
              {t.eudrHowTitle}
            </h3>

            <div className="space-y-6">
              {/* Origine des lots */}
              <div className="border-l-4 border-congo-cyan pl-6">
                <h4 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.e1Title}
                </h4>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.e1Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.e1li1}</li>
                  <li>{t.e1li2}</li>
                  <li>{t.e1li3}</li>
                  <li>{t.e1li4}</li>
                </ul>
              </div>

              {/* Non-déforestation */}
              <div className="border-l-4 border-congo-cyan pl-6">
                <h4 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.e2Title}
                </h4>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.e2Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.e2li1}</li>
                  <li>{t.e2li2}</li>
                  <li>{t.e2li3}</li>
                  <li>{t.e2li4}</li>
                </ul>
              </div>

              {/* Conservation des données */}
              <div className="border-l-4 border-congo-cyan pl-6">
                <h4 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.e3Title}
                </h4>
                <p className="text-tech-gray leading-relaxed mb-4">
                  {t.e3Body}
                </p>
                <ul className="space-y-2 text-tech-gray text-sm">
                  <li>{t.e3li1}</li>
                  <li>{t.e3li2}</li>
                  <li>{t.e3li3}</li>
                  <li>{t.e3li4}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Intégration ESG */}
        <section className="py-20 bg-light-gray">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.esgTitle}
            </h2>

            <p className="text-tech-gray leading-relaxed mb-12">
              {t.esgIntro}
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Environnement */}
              <div className="bg-white p-8 border-t-4 border-congo-cyan">
                <div className="font-mono text-congo-cyan text-sm mb-4">
                  {t.envTag}
                </div>
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-4">
                  {t.envTitle}
                </h3>
                <ul className="space-y-3 text-tech-gray text-sm leading-relaxed">
                  <li>{t.envli1}</li>
                  <li>{t.envli2}</li>
                  <li>{t.envli3}</li>
                  <li>{t.envli4}</li>
                </ul>
              </div>

              {/* Social */}
              <div className="bg-white p-8 border-t-4 border-ochre">
                <div className="font-mono text-ochre text-sm mb-4">
                  {t.socTag}
                </div>
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-4">
                  {t.socTitle}
                </h3>
                <ul className="space-y-3 text-tech-gray text-sm leading-relaxed">
                  <li>{t.socli1}</li>
                  <li>{t.socli2}</li>
                  <li>{t.socli3}</li>
                  <li>{t.socli4}</li>
                </ul>
              </div>

              {/* Gouvernance */}
              <div className="bg-white p-8 border-t-4 border-tech-gray">
                <div className="font-mono text-tech-gray text-sm mb-4">
                  {t.govTag}
                </div>
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-4">
                  {t.govTitle}
                </h3>
                <ul className="space-y-3 text-tech-gray text-sm leading-relaxed">
                  <li>{t.govli1}</li>
                  <li>{t.govli2}</li>
                  <li>{t.govli3}</li>
                  <li>{t.govli4}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Reporting institutionnel */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.repTitle}
            </h2>

            <div className="space-y-8">
              <div className="border border-tech-gray/20 p-6">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.rep1Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.rep1Body}
                </p>
              </div>

              <div className="border border-tech-gray/20 p-6">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.rep2Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.rep2Body}
                </p>
              </div>

              <div className="border border-tech-gray/20 p-6">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.rep3Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.rep3Body}
                </p>
              </div>

              <div className="border border-tech-gray/20 p-6">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.rep4Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.rep4Body}
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
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-congo-cyan text-white font-sans font-medium text-sm tracking-wide hover:bg-congo-cyan/90 transition-colors"
            >
              {t.ctaCta}
            </Link>
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
