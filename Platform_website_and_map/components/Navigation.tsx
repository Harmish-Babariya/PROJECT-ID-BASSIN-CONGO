"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";

const NAV_ITEMS_FR = [
  { label: "ACCUEIL", href: "/", isPrimary: false },
  { label: "APPROCHE", href: "/approche", isPrimary: false },
  { label: "PLATEFORME", href: "/plateforme", isPrimary: false },
  { label: "EUDR & ESG", href: "/eudr-esg", isPrimary: false },
  { label: "CONTACT", href: "/contact", isPrimary: false },
  { label: "CONNEXION", href: "/connexion", isPrimary: true },
] as const;

const NAV_ITEMS_EN = [
  { label: "HOME", href: "/", isPrimary: false },
  { label: "APPROACH", href: "/approche", isPrimary: false },
  { label: "PLATFORM", href: "/plateforme", isPrimary: false },
  { label: "EUDR & ESG", href: "/eudr-esg", isPrimary: false },
  { label: "CONTACT", href: "/contact", isPrimary: false },
  { label: "LOGIN", href: "/connexion", isPrimary: true },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const NAV_ITEMS = lang === "fr" ? NAV_ITEMS_FR : NAV_ITEMS_EN;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b"
      style={{
        background: "rgba(254, 252, 247, 0.95)",
        borderColor: "var(--gray-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand - Courier Prime */}
          <Link href="/" className="flex items-center gap-3">
            <div className="data-text text-congo-cyan text-lg font-bold tracking-tight">
              ID BASSIN DU CONGO
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const isPrimary = item.isPrimary;

              if (isPrimary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="ml-4 px-6 py-2 bg-congo-cyan text-ink-black meta-text font-semibold hover:bg-cyan-strong transition-colors border border-congo-cyan"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 meta-text transition-colors relative ${
                    isActive ? "text-congo-cyan" : "text-tech-gray hover:text-congo-cyan"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-congo-cyan" />
                  )}
                </Link>
              );
            })}

            {/* Language Switcher — desktop */}
            <div className="ml-4 flex items-center gap-1 meta-text text-tech-gray">
              <button
                onClick={() => setLang("fr")}
                className="text-base leading-none transition-opacity"
                style={{ opacity: lang === "fr" ? 1 : 0.4 }}
                aria-label="Français"
              >
                🇫🇷
              </button>
              <span className="text-tech-gray/50 select-none">|</span>
              <button
                onClick={() => setLang("en")}
                className="text-base leading-none transition-opacity"
                style={{ opacity: lang === "en" ? 1 : 0.4 }}
                aria-label="English"
              >
                🇬🇧
              </button>
            </div>
          </div>

          {/* Mobile right: language switcher + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Language Switcher — mobile */}
            <div className="flex items-center gap-1 meta-text text-tech-gray">
              <button
                onClick={() => setLang("fr")}
                className="text-base leading-none transition-opacity"
                style={{ opacity: lang === "fr" ? 1 : 0.4 }}
                aria-label="Français"
              >
                🇫🇷
              </button>
              <span className="text-tech-gray/50 select-none">|</span>
              <button
                onClick={() => setLang("en")}
                className="text-base leading-none transition-opacity"
                style={{ opacity: lang === "en" ? 1 : 0.4 }}
                aria-label="English"
              >
                🇬🇧
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="p-2 text-tech-gray hover:text-congo-cyan transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
