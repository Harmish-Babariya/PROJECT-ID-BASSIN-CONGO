"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";
import { useLanguage } from "../contexts/LanguageContext";

const translations = {
  fr: {
    heroTag: "VALEUR & DIFFÉRENCIATION",
    heroTitle: "Notre Approche",
    heroBody:
      "ID BASSIN DU CONGO n'est pas une plateforme de traçabilité générique. C'est une infrastructure pensée pour et avec les acteurs du bassin du Congo, centrée sur les coopératives et les producteurs.",
    valueTitle: "Notre valeur",
    v1Title: "Approche territoriale réelle, pas théorique",
    v1Body:
      "Nous ne déployons pas un modèle unique importé. ID BASSIN DU CONGO s'ancre dans les réalités multi-pays du bassin du Congo, avec ses spécificités géographiques, institutionnelles et sociales. Chaque territoire est compris, documenté et respecté.",
    v2Title: "Données collectées à la source, via les coopératives",
    v2Body:
      "La donnée est saisie au plus près du terrain, par les coopératives qui connaissent leurs producteurs, leurs parcelles et leurs pratiques. Pas de données synthétiques, pas de reconstitution a posteriori. La fiabilité commence à la source.",
    v3Title: "Reconnaissance formelle du producteur et de la parcelle",
    v3Body:
      "Chaque producteur est identifié. Chaque parcelle est géolocalisée. Chaque contribution est tracée. Cette reconnaissance n'est pas symbolique : elle conditionne la valorisation économique, la conformité réglementaire et l'inclusion dans les programmes de développement.",
    v4Title: "Gouvernance des données pensée pour les acteurs locaux",
    v4Body:
      "Les données ne sont pas extraites pour servir uniquement des intérêts externes. Elles sont structurées, sécurisées et mises à disposition selon une gouvernance claire, équitable et contrôlable par les acteurs légitimes : coopératives, producteurs, institutions locales.",
    v5Title: "Vision long terme, non opportuniste",
    v5Body:
      "ID BASSIN DU CONGO ne répond pas à une contrainte réglementaire ponctuelle. C'est une infrastructure de long terme pour structurer les filières, protéger les écosystèmes et valoriser le travail des producteurs sur la durée.",
    diffTitle: "Notre différenciation",
    notTitle: "Ce que nous ne sommes pas",
    not1: "Une plateforme générique importée, inadaptée aux réalités du bassin du Congo",
    not2: "Un outil uniquement orienté compliance, sans vision de structuration",
    not3: "Une solution centrée uniquement sur l'exportateur, ignorant les producteurs",
    not4: "Une initiative opportuniste suivant les tendances réglementaires",
    isTitle: "Ce que nous sommes",
    is1Tag: "✓ Coopératives pilotes",
    is1Body:
      "Les coopératives sont au centre du dispositif. Elles pilotent la collecte, structurent l'information et garantissent la qualité des données.",
    is2Tag: "✓ Inclusion des petits producteurs",
    is2Body:
      "Nous ne laissons personne de côté. Les petits producteurs sont identifiés, documentés et intégrés dans la chaîne de valeur, avec les mêmes garanties que les grands acteurs.",
    is3Tag: "✓ Articulation environnement, social et gouvernance",
    is3Body:
      "ID BASSIN DU CONGO ne se limite pas à la conformité environnementale. Nous intégrons les dimensions sociales (reconnaissance, rémunération) et de gouvernance (transparence, auditabilité).",
    is4Tag: "✓ Adaptation multi-pays",
    is4Body:
      "Le bassin du Congo couvre six pays. Nous comprenons et intégrons les spécificités légales, institutionnelles et opérationnelles de chaque territoire.",
    is5Tag: "✓ Donnée comme actif stratégique",
    is5Body:
      "La donnée n'est pas une formalité administrative. C'est un actif stratégique pour les coopératives, les producteurs et les institutions. Elle est traitée avec rigueur, sécurité et gouvernance.",
    ctaTitle: "Découvrez comment la plateforme concrétise cette approche",
    ctaCta: "Explorer la plateforme →",
    footerApproach: "Notre Approche",
    footerPlatform: "Plateforme",
    footerContact: "Contact",
  },
  en: {
    heroTag: "VALUE & DIFFERENTIATION",
    heroTitle: "Our Approach",
    heroBody:
      "ID BASSIN DU CONGO is not a generic traceability platform. It is an infrastructure designed for and with the stakeholders of the Congo Basin, centred on cooperatives and producers.",
    valueTitle: "Our value",
    v1Title: "Real territorial approach, not theoretical",
    v1Body:
      "We do not deploy a single imported model. ID BASSIN DU CONGO is rooted in the multi-country realities of the Congo Basin, with its geographical, institutional and social specificities. Each territory is understood, documented and respected.",
    v2Title: "Data collected at source, via cooperatives",
    v2Body:
      "Data is entered as close to the field as possible, by cooperatives that know their producers, their plots and their practices. No synthetic data, no after-the-fact reconstruction. Reliability starts at the source.",
    v3Title: "Formal recognition of the producer and the plot",
    v3Body:
      "Each producer is identified. Each plot is geolocated. Each contribution is traced. This recognition is not symbolic: it conditions economic valorisation, regulatory compliance and inclusion in development programmes.",
    v4Title: "Data governance designed for local stakeholders",
    v4Body:
      "Data is not extracted to serve only external interests. It is structured, secured and made available according to clear, equitable governance controllable by legitimate stakeholders: cooperatives, producers, local institutions.",
    v5Title: "Long-term vision, not opportunistic",
    v5Body:
      "ID BASSIN DU CONGO does not respond to a one-off regulatory constraint. It is a long-term infrastructure to structure supply chains, protect ecosystems and valorise the work of producers over time.",
    diffTitle: "Our differentiation",
    notTitle: "What we are not",
    not1: "A generic imported platform, unsuited to the realities of the Congo Basin",
    not2: "A tool solely oriented towards compliance, without a structuring vision",
    not3: "A solution centred solely on the exporter, ignoring producers",
    not4: "An opportunistic initiative following regulatory trends",
    isTitle: "What we are",
    is1Tag: "✓ Cooperative pilots",
    is1Body:
      "Cooperatives are at the centre of the system. They drive the collection, structure the information and guarantee data quality.",
    is2Tag: "✓ Inclusion of small producers",
    is2Body:
      "We leave no one behind. Small producers are identified, documented and integrated into the value chain, with the same guarantees as larger actors.",
    is3Tag: "✓ Articulation of environment, social and governance",
    is3Body:
      "ID BASSIN DU CONGO is not limited to environmental compliance. We integrate social dimensions (recognition, remuneration) and governance (transparency, auditability).",
    is4Tag: "✓ Multi-country adaptation",
    is4Body:
      "The Congo Basin covers six countries. We understand and integrate the legal, institutional and operational specificities of each territory.",
    is5Tag: "✓ Data as a strategic asset",
    is5Body:
      "Data is not an administrative formality. It is a strategic asset for cooperatives, producers and institutions. It is handled with rigour, security and governance.",
    ctaTitle: "Discover how the platform puts this approach into practice",
    ctaCta: "Explore the platform →",
    footerApproach: "Our Approach",
    footerPlatform: "Platform",
    footerContact: "Contact",
  },
};

export default function ApprochePage() {
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
            <h1 className="font-sans text-5xl font-bold mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-light-gray text-xl leading-relaxed">
              {t.heroBody}
            </p>
          </div>
        </section>

        {/* Notre Valeur */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.valueTitle}
            </h2>

            <div className="space-y-8">
              <div className="border-l-4 border-congo-cyan pl-6">
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.v1Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.v1Body}
                </p>
              </div>

              <div className="border-l-4 border-congo-cyan pl-6">
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.v2Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.v2Body}
                </p>
              </div>

              <div className="border-l-4 border-congo-cyan pl-6">
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.v3Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.v3Body}
                </p>
              </div>

              <div className="border-l-4 border-congo-cyan pl-6">
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.v4Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.v4Body}
                </p>
              </div>

              <div className="border-l-4 border-congo-cyan pl-6">
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-3">
                  {t.v5Title}
                </h3>
                <p className="text-tech-gray leading-relaxed">
                  {t.v5Body}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notre Différenciation */}
        <section className="py-20 bg-light-gray">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-3xl font-semibold text-ink-black mb-12">
              {t.diffTitle}
            </h2>

            <div className="space-y-12">
              {/* Ce que nous ne sommes pas */}
              <div>
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-6">
                  {t.notTitle}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 border-l-2 border-tech-gray">
                    <div className="font-mono text-tech-gray text-sm mb-2">
                      ✗
                    </div>
                    <p className="text-tech-gray">
                      {t.not1}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-2 border-tech-gray">
                    <div className="font-mono text-tech-gray text-sm mb-2">
                      ✗
                    </div>
                    <p className="text-tech-gray">
                      {t.not2}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-2 border-tech-gray">
                    <div className="font-mono text-tech-gray text-sm mb-2">
                      ✗
                    </div>
                    <p className="text-tech-gray">
                      {t.not3}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-2 border-tech-gray">
                    <div className="font-mono text-tech-gray text-sm mb-2">
                      ✗
                    </div>
                    <p className="text-tech-gray">
                      {t.not4}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ce que nous sommes */}
              <div>
                <h3 className="font-sans text-xl font-semibold text-ink-black mb-6">
                  {t.isTitle}
                </h3>
                <div className="space-y-4">
                  <div className="bg-white p-6 border-l-4 border-congo-cyan">
                    <div className="font-mono text-congo-cyan text-sm mb-2">
                      {t.is1Tag}
                    </div>
                    <p className="text-tech-gray">
                      {t.is1Body}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-4 border-congo-cyan">
                    <div className="font-mono text-congo-cyan text-sm mb-2">
                      {t.is2Tag}
                    </div>
                    <p className="text-tech-gray">
                      {t.is2Body}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-4 border-congo-cyan">
                    <div className="font-mono text-congo-cyan text-sm mb-2">
                      {t.is3Tag}
                    </div>
                    <p className="text-tech-gray">
                      {t.is3Body}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-4 border-congo-cyan">
                    <div className="font-mono text-congo-cyan text-sm mb-2">
                      {t.is4Tag}
                    </div>
                    <p className="text-tech-gray">
                      {t.is4Body}
                    </p>
                  </div>

                  <div className="bg-white p-6 border-l-4 border-congo-cyan">
                    <div className="font-mono text-congo-cyan text-sm mb-2">
                      {t.is5Tag}
                    </div>
                    <p className="text-tech-gray">
                      {t.is5Body}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-sans text-2xl font-semibold text-ink-black mb-6">
              {t.ctaTitle}
            </h2>
            <Link
              href="/plateforme"
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
