"use client"
import { useLanguage } from "@/contexts/LanguageContext"
import type { Locale } from "@/lib/i18n/translations"

type Variant = "auth" | "sidebar"

export default function LanguageSwitcher({ variant = "auth" }: { variant?: Variant }) {
  const { locale, setLocale } = useLanguage()

  const langs: { code: Locale; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
  ]

  if (variant === "auth") {
    return (
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-1 py-1 shadow-sm">
        {langs.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
              locale === code
                ? "bg-[#2ac1a3] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  // sidebar variant
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold tracking-wider transition-all duration-200 ${
            locale === code
              ? "bg-[#2ac1a3] text-white shadow-sm"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
