// Locale-aware re-rendering of EUDR justifications.
//
// The backend always writes justifications to the DB in French (so DB rows
// stay consistent regardless of which user triggered the verification). This
// helper parses known sentence shapes and re-renders each one in the active
// locale. Unknown text is returned unchanged so we never accidentally hide a
// message.
//
// IMPORTANT: keep the regexes in sync with the sentence templates produced by
// `app/api/verify-eudr/route.ts`. Whenever you add a new sentence on the
// backend, add both a regex matcher here AND a translation key in
// `translations.ts` under `parcelles.eudr*`.

import { getTranslations, Locale } from "./translations"

type JustifTr = ReturnType<typeof getTranslations>["parcelles"]

function tSentence(sentence: string, tp: JustifTr): string {
  const t = sentence.trim()
  if (!t) return ""

  // ─── Pending / impossibility messages ───────────────────────────────────

  if (
    /^V[ée]rification automatique en attente\.?$/i.test(t) ||
    /^Automatic verification pending\.?$/i.test(t)
  ) return tp.eudrJustifPending

  // Newer composite "Vérification impossible : ..." sentence with one or
  // more reasons separated by " ; ".
  const impossibleMatch =
    t.match(/^V[ée]rification impossible\s*:\s*(.+?)\.?$/i) ||
    t.match(/^Verification impossible\s*:\s*(.+?)\.?$/i)
  if (impossibleMatch) {
    const reasons = impossibleMatch[1].split(/\s*;\s*/).map((r) => translateReason(r, tp))
    return tp.eudrJustifImpossible(reasons)
  }

  // ─── Legacy plantation-year sentences (older rows) ──────────────────────

  let m =
    t.match(/Ann[ée]e de plantation (\d{4}) invalide \(future\)/i) ||
    t.match(/Plantation year (\d{4}) is invalid \(future\)/i)
  if (m) return tp.eudrJustifFutureYear(parseInt(m[1], 10))

  m = t.match(/Plantation cr[ée]{2}e en (\d{4}), ant[ée]rieure au cutoff EUDR/i) ||
      t.match(/Plantation established in (\d{4}), prior to the EUDR cutoff/i)
  if (m) return tp.eudrJustifCompliant(parseInt(m[1], 10))

  m = t.match(/Plantation cr[ée]{2}e en (\d{4}), post[ée]rieure au cutoff EUDR/i) ||
      t.match(/Plantation established in (\d{4}), after the EUDR cutoff/i)
  if (m) return tp.eudrJustifAlert(parseInt(m[1], 10))

  // ─── Hansen sentences ───────────────────────────────────────────────────

  // Agricultural already in 2000
  m = t.match(/Parcelle d[ée]j[àa] en usage agricole en 2000 \(([\d.]+)% de couverture forest/i) ||
      t.match(/Parcel already in agricultural use in 2000 \(([\d.]+)% forest cover/i)
  if (m) return tp.eudrHansenAgricultural(parseFloat(m[1]))

  // Stable forest
  m = t.match(/Couverture foresti[èe]re stable depuis 2000 \(([\d.]+)%\)/i) ||
      t.match(/Forest cover stable since 2000 \(([\d.]+)%\)/i)
  if (m) return tp.eudrHansenStableForest(parseFloat(m[1]))

  // No-deforestation standalone — merged into stable/agricultural above
  if (
    /Aucune d[ée]forestation ni conversion foresti[èe]re post[ée]rieure au 31 d[ée]cembre 2020/i.test(t) ||
    /No deforestation or forest conversion has been detected on the parcel after 31 December 2020/i.test(t)
  ) return ""

  // Pixel resolution note
  m = t.match(/Analyse r[ée]alis[ée]e [àa] la r[ée]solution native des donn[ée]es Hansen \(30m, (\d+) pixels/i) ||
      t.match(/Analysis performed at the native resolution of Hansen data \(30m, (\d+) pixels/i)
  if (m) return tp.eudrHansenPixels(parseInt(m[1], 10))

  // Deforestation detected
  m = t.match(/D[ée]forestation de ([\d.]+)% d[ée]tect[ée]e apr[èe]s le 31 d[ée]cembre 2020/i) ||
      t.match(/Deforestation of ([\d.]+)% detected after 31 December 2020/i)
  if (m) return tp.eudrHansenDeforestation(parseFloat(m[1]))

  if (
    /La parcelle ne respecte pas le r[èe]glement \(UE\) 2023\/1115/i.test(t) ||
    /The parcel does not comply with Regulation \(EU\) 2023\/1115/i.test(t)
  ) return "" // merged into deforestation sentence above

  // ─── WDPA sentences ─────────────────────────────────────────────────────

  m = t.match(/zone prot[ée]g[ée]e ['"]([^'"]+)['"] \(([^)]+)\) selon la base WDPA/i) ||
      t.match(/protected area ['"]([^'"]+)['"] \(([^)]+)\) according to the WDPA database/i)
  if (m) return tp.eudrHansenProtectedArea(m[1], m[2])

  if (
    /n'est pas situ[ée]e dans une zone prot[ée]g[ée]e selon la base WDPA/i.test(t) ||
    /not located inside any WDPA protected area/i.test(t)
  ) return tp.eudrHansenNotProtected

  // ─── Hansen tile unavailability ─────────────────────────────────────────

  if (
    /Donn[ée]es Hansen non disponibles/i.test(t) ||
    /Hansen data not available/i.test(t) ||
    /Hansen data unavailable/i.test(t)
  ) return tp.eudrHansenUnavailable

  if (
    /Polygon hors limites du raster Hansen/i.test(t) ||
    /Polygon outside Hansen raster bounds/i.test(t)
  ) return tp.eudrHansenOutOfBounds

  if (
    /Aucun pixel valide dans le polygone/i.test(t) ||
    /No valid pixel in the polygon/i.test(t)
  ) return tp.eudrHansenNoValidPixels

  // ─── Regulatory conclusion ──────────────────────────────────────────────

  if (
    /Aucun [ée]l[ée]ment ne permet d'identifier un risque non n[ée]gligeable/i.test(t) ||
    /No element allows the identification of a non-negligible risk/i.test(t)
  ) return tp.eudrHansenNoRisk

  // Unknown sentence — return as-is so we never hide content.
  return sentence.trim()
}

function translateReason(reason: string, tp: JustifTr): string {
  const r = reason.trim()
  if (!r) return ""

  if (/aucun fichier GPX/i.test(r) || /no GPX file linked/i.test(r)) {
    return tp.eudrReasonNoGpx
  }
  if (/fichier GPX introuvable/i.test(r) || /GPX file not found/i.test(r) || /unreadable/i.test(r)) {
    return tp.eudrReasonGpxUnreadable
  }
  const m =
    r.match(/GPX ne contient que (\d+) point\(s\)/i) ||
    r.match(/GPX only contains (\d+) point/i)
  if (m) return tp.eudrReasonNotEnoughPoints(parseInt(m[1], 10))
  if (/coordonn[ée]es GPS manquantes/i.test(r) || /missing GPS coordinates/i.test(r)) {
    return tp.eudrReasonNoGps
  }
  if (/donn[ée]es incompl[èe]tes/i.test(r) || /incomplete data/i.test(r)) {
    return tp.eudrReasonIncomplete
  }
  return r
}

export function translateJustification(raw: string | null | undefined, locale: Locale): string {
  if (!raw) return ""
  const tp = getTranslations(locale).parcelles
  const parts = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => tSentence(s, tp))
    .filter(Boolean)
  return parts.join(" ").trim() || raw
}
