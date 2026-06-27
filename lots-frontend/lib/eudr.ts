// Canonical EUDR risk model — EXACTLY the 4 categories the client specified.
// We cannot legally conclude "compliance", only assess a RISK LEVEL, so the
// stored values are risk-text (FR), not compliance text:
//
//   Risque négligeable        → "negligible"     → bucket "compliant"
//   Risque non négligeable    → "non_negligible" → bucket "alert"
//   Analyse impossible        → "indeterminate"  → bucket "pending_review"
//   Géométrie invalide        → "indeterminate"  → bucket "pending_review"
//
// The two old internal causes of non-negligible risk (deforestation vs
// protected-area) are MERGED into the single "Risque non négligeable" — the
// client wants ONE non-negligible category, shown once.
//
// `RISQUE` is kept as a DEPRECATED ALIAS equal to NON_CONFORME so older call
// sites still compile; new code should use NON_CONFORME.
export const EUDR_STATUS = {
  CONFORME: "Risque négligeable",
  NON_CONFORME: "Risque non négligeable",
  /** @deprecated identical to NON_CONFORME — kept for back-compat only. */
  RISQUE: "Risque non négligeable",
  EN_ATTENTE: "Analyse impossible",
  GEOMETRIE_INVALIDE: "Géométrie invalide",
} as const

export type EudrStatus =
  | typeof EUDR_STATUS.CONFORME
  | typeof EUDR_STATUS.NON_CONFORME
  | typeof EUDR_STATUS.EN_ATTENTE
  | typeof EUDR_STATUS.GEOMETRIE_INVALIDE
  | null

// The 3 buckets the UI actually renders. Multiple DB statuses collapse to the
// same bucket — see eudrBucket() below.
export type EudrBucket = "compliant" | "alert" | "pending_review"

// Normalize whatever string is in the DB to one of the canonical risk values.
// Accepts BOTH the new risk strings and every legacy value ever written
// (CONFORME / COMPLIANT / NON CONFORME / RISQUE NON NÉGLIGEABLE / EN ATTENTE /
// PENDING …) so any un-migrated row still renders correctly.
// Returns null only when nothing was stored at all.
export function normalizeEudrStatus(raw: string | null | undefined): EudrStatus {
  if (!raw) return null
  const v = raw.trim().toUpperCase()
  // Negligible risk (was CONFORME / COMPLIANT)
  if (
    v === "RISQUE NÉGLIGEABLE" || v === "RISQUE NEGLIGEABLE" ||
    v === "NEGLIGIBLE RISK" || v === "NEGLIGIBLE" ||
    v === "CONFORME" || v === "COMPLIANT"
  ) return EUDR_STATUS.CONFORME
  // Non-negligible risk (deforestation ∪ protected-area — single category now).
  if (
    v === "RISQUE NON NÉGLIGEABLE" || v === "RISQUE NON NEGLIGEABLE" ||
    v === "RISQUE NON NÉGLIGEABLE (ZONE PROTÉGÉE)" ||
    v === "NON-NEGLIGIBLE RISK" || v === "NON_NEGLIGIBLE" || v === "NON-NEGLIGIBLE" ||
    v === "NON CONFORME" || v === "NON-CONFORME" || v === "ALERT"
  ) return EUDR_STATUS.NON_CONFORME
  // Non-compliant geometry (invalid polygon).
  if (
    v === "GÉOMÉTRIE INVALIDE" || v === "GEOMETRIE INVALIDE" ||
    v === "NON-COMPLIANT GEOMETRY" || v === "INVALID GEOMETRY"
  ) return EUDR_STATUS.GEOMETRIE_INVALIDE
  // Could not assess (was EN ATTENTE / indeterminate)
  if (
    v === "ANALYSE IMPOSSIBLE" || v === "COULD NOT ASSESS" || v === "INDETERMINATE" ||
    v === "EN ATTENTE" ||
    v === "PENDING_REVIEW" || v === "PENDING REVIEW" || v === "PENDING" ||
    v === "INDÉTERMINÉ" || v === "INDETERMINE"
  ) return EUDR_STATUS.EN_ATTENTE
  if (v === "NON VÉRIFIÉ" || v === "NON VERIFIE" || v === "NON VERIFIÉ") return null
  return null
}

// Map any DB status (or null) to one of the 3 display buckets.
// Null is treated as pending_review per the MVP spec.
export function eudrBucket(raw: string | null | undefined): EudrBucket {
  const s = normalizeEudrStatus(raw)
  if (s === EUDR_STATUS.CONFORME) return "compliant"
  if (s === EUDR_STATUS.NON_CONFORME) return "alert"
  // EN_ATTENTE, GEOMETRIE_INVALIDE and null all fall through to pending_review.
  return "pending_review"
}

// Map the short codes used by the GPX analysis APIs to canonical FR statuses
// for storage. "alert" defaults to RISQUE NON NÉGLIGEABLE; if a route needs to
// specifically write NON CONFORME (deforestation), it should reference the
// constant directly instead of going through this helper.
export function mapApiCodeToStatus(code: string | null | undefined): EudrStatus {
  if (!code) return null
  switch (code.toLowerCase()) {
    case "compliant":
      return EUDR_STATUS.CONFORME
    case "alert":
      return EUDR_STATUS.NON_CONFORME
    case "pending_review":
      return EUDR_STATUS.EN_ATTENTE
    default:
      return normalizeEudrStatus(code)
  }
}

export function isVerified(raw: string | null | undefined): boolean {
  const b = eudrBucket(raw)
  return b === "compliant" || b === "alert"
}

export function isConforme(raw: string | null | undefined): boolean {
  return eudrBucket(raw) === "compliant"
}
