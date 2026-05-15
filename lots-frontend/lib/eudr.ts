// Canonical EUDR model.
//
// DB stores one of 4 distinct values (mirrors the Python script output):
//   CONFORME                  → display bucket "compliant"
//   NON CONFORME              → display bucket "alert"  (deforestation post-2020)
//   RISQUE NON NÉGLIGEABLE    → display bucket "alert"  (protected-area overlay)
//   EN ATTENTE                → display bucket "pending_review" (indeterminate)
//
// Rows with `status_eudr = null` (never verified) are also rendered as
// "pending_review" by the UI, but the DB row itself stays null until the
// satellite verification produces a real value.

export const EUDR_STATUS = {
  CONFORME: "CONFORME",
  NON_CONFORME: "NON CONFORME",
  RISQUE: "RISQUE NON NÉGLIGEABLE",
  EN_ATTENTE: "EN ATTENTE",
} as const

export type EudrStatus =
  | typeof EUDR_STATUS.CONFORME
  | typeof EUDR_STATUS.NON_CONFORME
  | typeof EUDR_STATUS.RISQUE
  | typeof EUDR_STATUS.EN_ATTENTE
  | null

// The 3 buckets the UI actually renders. Multiple DB statuses collapse to the
// same bucket — see eudrBucket() below.
export type EudrBucket = "compliant" | "alert" | "pending_review"

// Normalize whatever string is in the DB (legacy variants, case mismatches,
// English values written by older code) to one of the 4 canonical statuses.
// Returns null only when nothing was stored at all.
export function normalizeEudrStatus(raw: string | null | undefined): EudrStatus {
  if (!raw) return null
  const v = raw.trim().toUpperCase()
  if (v === "CONFORME" || v === "COMPLIANT") return EUDR_STATUS.CONFORME
  if (v === "NON CONFORME" || v === "NON-CONFORME") return EUDR_STATUS.NON_CONFORME
  if (
    v === "RISQUE NON NÉGLIGEABLE" ||
    v === "RISQUE NON NEGLIGEABLE" ||
    v === "ALERT"
  ) return EUDR_STATUS.RISQUE
  if (
    v === "EN ATTENTE" ||
    v === "PENDING_REVIEW" ||
    v === "PENDING REVIEW" ||
    v === "PENDING" ||
    v === "INDÉTERMINÉ" ||
    v === "INDETERMINE"
  ) return EUDR_STATUS.EN_ATTENTE
  if (v === "NON VÉRIFIÉ" || v === "NON VERIFIE" || v === "NON VERIFIÉ") return null
  return null
}

// Map any DB status (or null) to one of the 3 display buckets.
// Null is treated as pending_review per the MVP spec.
export function eudrBucket(raw: string | null | undefined): EudrBucket {
  const s = normalizeEudrStatus(raw)
  if (s === EUDR_STATUS.CONFORME) return "compliant"
  if (s === EUDR_STATUS.NON_CONFORME || s === EUDR_STATUS.RISQUE) return "alert"
  // EN_ATTENTE and null both fall through to pending_review.
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
      return EUDR_STATUS.RISQUE
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
