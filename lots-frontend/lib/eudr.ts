// Canonical EUDR statuses. Source of truth: client MVP spec lists exactly
// three (compliant / alert / pending_review). Legacy "NON CONFORME" rows
// produced by the python batch script are folded into RISQUE since both
// represent a deforestation alert that requires manual review.

export const EUDR_STATUS = {
  CONFORME: "CONFORME",
  RISQUE: "RISQUE NON NÉGLIGEABLE",
  EN_ATTENTE: "EN ATTENTE",
} as const

export type EudrStatus =
  | typeof EUDR_STATUS.CONFORME
  | typeof EUDR_STATUS.RISQUE
  | typeof EUDR_STATUS.EN_ATTENTE
  | null

// Legacy/variant strings get folded into a canonical value. Returns null for
// rows with no status set (rendered as "Non vérifié" in the UI).
export function normalizeEudrStatus(raw: string | null | undefined): EudrStatus {
  if (!raw) return null
  const v = raw.trim().toUpperCase()
  if (v === "CONFORME" || v === "COMPLIANT") return EUDR_STATUS.CONFORME
  if (
    v === "RISQUE NON NÉGLIGEABLE" ||
    v === "RISQUE NON NEGLIGEABLE" ||
    v === "ALERT" ||
    v === "NON CONFORME" ||
    v === "NON-CONFORME"
  )
    return EUDR_STATUS.RISQUE
  if (
    v === "EN ATTENTE" ||
    v === "PENDING_REVIEW" ||
    v === "PENDING REVIEW" ||
    v === "PENDING"
  )
    return EUDR_STATUS.EN_ATTENTE
  if (v === "NON VÉRIFIÉ" || v === "NON VERIFIE" || v === "NON VERIFIÉ") return null
  return null
}

// Map the short codes used by the GPX analysis APIs (compliant / alert /
// pending_review) to canonical FR statuses for storage and display.
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
  const s = normalizeEudrStatus(raw)
  return s === EUDR_STATUS.CONFORME || s === EUDR_STATUS.RISQUE
}

export function isConforme(raw: string | null | undefined): boolean {
  return normalizeEudrStatus(raw) === EUDR_STATUS.CONFORME
}
