import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { apiError } from "@/lib/api-errors"

const VALID_STATUTS = ["En préparation", "Prêt", "Exporté"] as const
type Statut = typeof VALID_STATUTS[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  const { id } = await params
  const ddsId = parseInt(id, 10)
  if (isNaN(ddsId)) return apiError("INVALID_BODY", 400, { message: "Invalid DDS id" })

  let body: { statut?: string; reference_dds?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const { statut, reference_dds } = body

  // Validate statut if provided
  const normalizedStatut: Statut | undefined =
    statut && VALID_STATUTS.includes(statut as Statut)
      ? (statut as Statut)
      : statut
        ? undefined
        : undefined

  if (statut && !normalizedStatut) {
    return apiError("INVALID_BODY", 400, { message: "Invalid statut value" })
  }

  // Check DDS exists
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("dds")
    .select("id, lot_id, reference_dds, statut")
    .eq("id", ddsId)
    .single()

  if (fetchError || !existing) {
    return apiError("NOT_FOUND", 404, { message: "DDS not found" })
  }

  const updates: Record<string, unknown> = {}
  if (statut) updates.statut = statut
  if (reference_dds?.trim()) updates.reference_dds = reference_dds.trim()

  if (Object.keys(updates).length === 0) {
    return apiError("INVALID_BODY", 400, { message: "No fields to update" })
  }

  const { data: dds, error: updateError } = await supabaseAdmin
    .from("dds")
    .update(updates)
    .eq("id", ddsId)
    .select()
    .single()

  if (updateError) {
    console.error("[dds] update failed:", updateError.message)
    return apiError("UPDATE_FAILED", 500, { detail: updateError.message })
  }

  await insertAuditLog(me.id, "UPDATE", "dds", String(ddsId), {
    dds_id: ddsId,
    changes: updates,
  })

  return NextResponse.json({ dds })
}
