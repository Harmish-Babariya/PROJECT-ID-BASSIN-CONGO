// Translate a stored pays/zone/village name using the active locale's
// `common.geoNames` dictionary. Lookup is case- and accent-insensitive so
// minor spelling/casing differences in stored values still resolve. Unknown
// values fall through unchanged so custom user-entered names keep their
// original spelling.

import { getTranslations, Locale } from "./translations"

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

let cachedDicts: Partial<Record<Locale, Map<string, string>>> = {}

function getDict(locale: Locale): Map<string, string> {
  const cached = cachedDicts[locale]
  if (cached) return cached
  const t = getTranslations(locale)
  const raw = (t.common as { geoNames?: Record<string, string> }).geoNames ?? {}
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(raw)) {
    map.set(normalize(k), v)
  }
  cachedDicts[locale] = map
  return map
}

export function translateGeoName(
  name: string | null | undefined,
  locale: Locale
): string {
  if (!name) return ""
  const dict = getDict(locale)
  return dict.get(normalize(name)) ?? name
}
