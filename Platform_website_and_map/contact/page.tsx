"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { useLanguage } from "../contexts/LanguageContext";

const translations = {
  fr: {
    heroTag: "PARTENARIATS INSTITUTIONNELS",
    heroTitle: "Contact",
    heroBody:
      "ID BASSIN DU CONGO travaille avec des coopératives, institutions, ONG et partenaires européens engagés dans la structuration et la durabilité des filières café et cacao. Contactez-nous pour explorer les opportunités de collaboration.",
    labelName: "Nom complet *",
    placeholderName: "Votre nom",
    labelOrg: "Organisation *",
    placeholderOrg: "Nom de votre organisation",
    labelEmail: "Email *",
    labelPhone: "Téléphone",
    labelSubject: "Sujet de la demande *",
    subjectPartenariat: "Partenariat institutionnel",
    subjectCoop: "Adhésion coopérative",
    subjectTech: "Information technique sur la plateforme",
    subjectEudr: "Conformité EUDR & ESG",
    subjectAutre: "Autre demande",
    labelMessage: "Message *",
    placeholderMessage: "Décrivez votre demande ou votre projet de collaboration...",
    successMsg:
      "Votre message a été envoyé avec succès. Nous vous recontacterons rapidement.",
    btnSubmitting: "Envoi en cours...",
    btnSend: "Envoyer le message",
    privacy:
      "Les informations collectées sont utilisées uniquement pour traiter votre demande et ne sont pas partagées avec des tiers.",
    otherTitle: "Autres moyens de nous joindre",
    coop1Title: "Pour les coopératives",
    coop1Body:
      "Vous êtes une coopérative agricole du bassin du Congo et souhaitez rejoindre le réseau ID BASSIN DU CONGO ? Contactez-nous pour une présentation détaillée de la plateforme et des modalités d'intégration.",
    inst1Title: "Pour les partenaires institutionnels",
    inst1Body:
      "Institutions, ONG, bailleurs de fonds, importateurs européens : explorez comment ID BASSIN DU CONGO peut sécuriser votre conformité EUDR et renforcer vos engagements ESG.",
    footerApproach: "Notre Approche",
    footerPlatform: "Plateforme",
    footerContact: "Contact",
  },
  en: {
    heroTag: "INSTITUTIONAL PARTNERSHIPS",
    heroTitle: "Contact",
    heroBody:
      "ID BASSIN DU CONGO works with cooperatives, institutions, NGOs and European partners committed to structuring and the sustainability of coffee and cocoa supply chains. Contact us to explore collaboration opportunities.",
    labelName: "Full name *",
    placeholderName: "Your name",
    labelOrg: "Organisation *",
    placeholderOrg: "Your organisation name",
    labelEmail: "Email *",
    labelPhone: "Phone",
    labelSubject: "Subject of request *",
    subjectPartenariat: "Institutional partnership",
    subjectCoop: "Cooperative membership",
    subjectTech: "Technical information about the platform",
    subjectEudr: "EUDR & ESG compliance",
    subjectAutre: "Other request",
    labelMessage: "Message *",
    placeholderMessage: "Describe your request or collaboration project...",
    successMsg:
      "Your message has been sent successfully. We will get back to you shortly.",
    btnSubmitting: "Sending...",
    btnSend: "Send message",
    privacy:
      "The information collected is used solely to process your request and is not shared with third parties.",
    otherTitle: "Other ways to reach us",
    coop1Title: "For cooperatives",
    coop1Body:
      "Are you an agricultural cooperative in the Congo Basin and wish to join the ID BASSIN DU CONGO network? Contact us for a detailed presentation of the platform and integration procedures.",
    inst1Title: "For institutional partners",
    inst1Body:
      "Institutions, NGOs, donors, European importers: explore how ID BASSIN DU CONGO can secure your EUDR compliance and strengthen your ESG commitments.",
    footerApproach: "Our Approach",
    footerPlatform: "Platform",
    footerContact: "Contact",
  },
};

export default function ContactPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    subject: "partenariat",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Ici vous pouvez intégrer l'envoi via Supabase ou un service email
    // Pour l'instant, simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus("success");
    setFormData({
      name: "",
      organization: "",
      email: "",
      phone: "",
      subject: "partenariat",
      message: "",
    });

    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

        {/* Formulaire de contact */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label
                  htmlFor="name"
                  className="block font-sans text-sm font-medium text-ink-black mb-2"
                >
                  {t.labelName}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors"
                  placeholder={t.placeholderName}
                />
              </div>

              {/* Organisation */}
              <div>
                <label
                  htmlFor="organization"
                  className="block font-sans text-sm font-medium text-ink-black mb-2"
                >
                  {t.labelOrg}
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors"
                  placeholder={t.placeholderOrg}
                />
              </div>

              {/* Email & Téléphone */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-sans text-sm font-medium text-ink-black mb-2"
                  >
                    {t.labelEmail}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block font-sans text-sm font-medium text-ink-black mb-2"
                  >
                    {t.labelPhone}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors"
                    placeholder="+XXX XXX XXX XXX"
                  />
                </div>
              </div>

              {/* Sujet */}
              <div>
                <label
                  htmlFor="subject"
                  className="block font-sans text-sm font-medium text-ink-black mb-2"
                >
                  {t.labelSubject}
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors"
                >
                  <option value="partenariat">{t.subjectPartenariat}</option>
                  <option value="cooperation">{t.subjectCoop}</option>
                  <option value="technique">{t.subjectTech}</option>
                  <option value="eudr">{t.subjectEudr}</option>
                  <option value="autre">{t.subjectAutre}</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block font-sans text-sm font-medium text-ink-black mb-2"
                >
                  {t.labelMessage}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-tech-gray/30 bg-off-white text-ink-black font-sans focus:outline-none focus:border-congo-cyan transition-colors resize-none"
                  placeholder={t.placeholderMessage}
                />
              </div>

              {/* Message de succès */}
              {status === "success" && (
                <div className="p-4 bg-congo-cyan/10 border-l-4 border-congo-cyan">
                  <p className="text-congo-cyan font-sans text-sm">
                    {t.successMsg}
                  </p>
                </div>
              )}

              {/* Bouton */}
              <div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full px-8 py-4 bg-congo-cyan text-white font-sans font-medium text-sm tracking-wide hover:bg-congo-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? t.btnSubmitting : t.btnSend}
                </button>
              </div>

              <p className="text-tech-gray text-xs text-center">
                {t.privacy}
              </p>
            </form>
          </div>
        </section>

        {/* Informations complémentaires */}
        <section className="py-20 bg-light-gray">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-sans text-2xl font-semibold text-ink-black mb-8 text-center">
              {t.otherTitle}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 border-l-4 border-congo-cyan">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.coop1Title}
                </h3>
                <p className="text-tech-gray text-sm leading-relaxed">
                  {t.coop1Body}
                </p>
              </div>

              <div className="bg-white p-6 border-l-4 border-ochre">
                <h3 className="font-sans text-lg font-semibold text-ink-black mb-3">
                  {t.inst1Title}
                </h3>
                <p className="text-tech-gray text-sm leading-relaxed">
                  {t.inst1Body}
                </p>
              </div>
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
