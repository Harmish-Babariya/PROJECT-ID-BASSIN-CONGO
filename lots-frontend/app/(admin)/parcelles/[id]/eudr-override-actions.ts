"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { EUDR_STATUS } from "@/lib/eudr"
import { runEudrVerification } from "@/app/api/verify-eudr/route"

const ALLOWED_STATUSES = [
  EUDR_STATUS.CONFORME,
  EUDR_STATUS.NON_CONFORME,
  EUDR_STATUS.GEOMETRIE_INVALIDE,
  EUDR_STATUS.EN_ATTENTE,
] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

/**
 * Manually pin a parcel's EUDR status. Future runs of /api/verify-eudr will
 * skip this parcel until clearEudrOverride() is called, so the admin's
 * decision survives subsequent Hansen data refreshes.
 */
export async function setEudrOverride(
  parcelleId: number | string,
  status: string,
  reason: string,
) {
  const me = await getCurrentUser()
  if (!me) return { error: "UNAUTHORIZED" }
  if (me.role !== "admin") return { error: "FORBIDDEN" }

  if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    return { error: "INVALID_STATUS" }
  }
  const trimmedReason = reason.trim()
  if (!trimmedReason) return { error: "REASON_REQUIRED" }

  const now = new Date().toISOString()

  // Justification field gets a clear admin-marker so anyone reading the DB
  // can see this row was manually corrected. We do NOT touch eudr_conforme /
  // eudr_risque so legacy queries keep working.
  const adminMarker = `[ADMIN OVERRIDE] ${trimmedReason}`

  const { error } = await supabaseAdmin
    .from("parcelles")
    .update({
      status_eudr: status,
      eudr_statut: status,
      eudr_admin_override: true,
      eudr_admin_override_by: me.id,
      eudr_admin_override_at: now,
      eudr_admin_override_reason: trimmedReason,
      eudr_justification: adminMarker,
      justification_eudr: adminMarker,
      eudr_date_verification: now,
    })
    .eq("id", parcelleId)

  if (error) return { error: error.message }

  await insertAuditLog(me.id, "eudr_override_set", "parcelles", String(parcelleId), {
    status,
    reason: trimmedReason,
  })

  revalidatePath(`/parcelles/${parcelleId}`)
  revalidatePath("/parcelles")
  revalidatePath("/dashboard")
  return { ok: true }
}

/**
 * Remove the override. The next save (or a manual call to /api/verify-eudr)
 * will run the satellite analysis again and overwrite status_eudr.
 */
export async function clearEudrOverride(parcelleId: number | string) {
  const me = await getCurrentUser()
  if (!me) return { error: "UNAUTHORIZED" }
  if (me.role !== "admin") return { error: "FORBIDDEN" }

  const { error } = await supabaseAdmin
    .from("parcelles")
    .update({
      eudr_admin_override: false,
      eudr_admin_override_by: null,
      eudr_admin_override_at: null,
      eudr_admin_override_reason: null,
    })
    .eq("id", parcelleId)

  if (error) return { error: error.message }

  await insertAuditLog(me.id, "eudr_override_clear", "parcelles", String(parcelleId), {})

  // Re-run the satellite analysis so the admin-pinned status/justification is
  // replaced by the real Hansen + WDPA result. Without this the parcel would
  // keep showing the "[ADMIN OVERRIDE] ..." justification and pinned status
  // even though the override has been removed.
  try {
    await runEudrVerification(parcelleId)
  } catch (e: any) {
    // Verification failure shouldn't block the clear itself; the parcel will
    // simply keep its last status until the next /api/verify-eudr run.
    console.warn("re-verify after override clear failed:", e?.message)
  }

  revalidatePath(`/parcelles/${parcelleId}`)
  revalidatePath("/parcelles")
  revalidatePath("/dashboard")
  return { ok: true }
}
