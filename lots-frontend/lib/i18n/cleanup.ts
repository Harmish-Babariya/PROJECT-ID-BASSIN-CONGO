// Locale-aware re-rendering of GPX clean-up corrections.
//
// New uploads store the canonical French string in
// parcelles.nettoyage_corrections (see app/api/upload-gpx/route.ts). Older rows
// may hold either the French OR the English variant, depending on the upload
// locale at the time. This helper recognizes both languages for each known
// correction and re-renders it in the active locale, so the "Analyse et
// correction du polygone" box is always language-consistent.

import { getTranslations, Locale } from "./translations"

export function translateCleanupCorrection(raw: string, locale: Locale): string {
  const t = raw.trim()
  if (!t) return ""
  const tp = getTranslations(locale).parcelles

  // Self-intersection repair
  if (
    /R[ée]paration de l'?auto-intersection/i.test(t) ||
    /Self-intersection repair/i.test(t)
  ) return tp.cleanupSelfIntersection

  // Conservative polygon closure
  if (
    /Fermeture conservatrice du polygone/i.test(t) ||
    /Conservative polygon closure/i.test(t)
  ) return tp.cleanupClosure

  // Unknown correction — show as-is so we never hide content.
  return t
}
